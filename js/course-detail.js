document.addEventListener('DOMContentLoaded', async () => {

  const userName = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "Student";
  
  // Robust admin check
  const isAdmin = (userRole.toLowerCase() === "admin" || 
           userRole.toLowerCase() === "faculty" || 
           userName.toLowerCase().includes("admin"));

  console.log("Current User Role:", userRole, "isAdmin:", isAdmin);
  
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('course'); 

  if (!courseId) {
    console.error("No course ID provided.");
    return;
  }

  // Storage Helpers
  const sK = (s) => `courseDetail_${courseId}_${s}`;
  function saveC(s, d) { localStorage.setItem(sK(s), JSON.stringify(d)); }
  function loadC(s) { try { return JSON.parse(localStorage.getItem(sK(s))); } catch(e){return null;} }

  // ===== 1. Fetch Course Data from Supabase =====
  async function fetchCourseDetails() {
    try {
      const { data: course, error } = await _supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      if (!course) throw new Error("Course not found");

      // Fetch Enrollment Count
      const { count: enrollCount } = await _supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // Fetch Assignments Count (assuming we have an assignments table)
      const { count: assnCount } = await _supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      renderCourseMeta(course, enrollCount || 0, assnCount || 0);
      checkEnrollment(course);
      initDynamicData(course);
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  }

  function renderCourseMeta(course, enrollCount, assnCount) {
    const hTitle = document.querySelector('.course-header-text h1');
    const hBadge = document.querySelector('.course-header-text .badge');
    const hDesc = document.querySelector('.course-header-text > p');
    const fName = document.querySelector('.faculty-card h3');
    const fRole = document.querySelector('.faculty-card p');
    const statItems = document.querySelectorAll('.stat-item');

    if (hTitle) hTitle.textContent = course.course_name;
    if (hBadge) hBadge.textContent = course.department;
    if (hDesc) hDesc.textContent = course.description || `Comprehensive module for ${course.course_name}.`;
    if (fName) fName.textContent = course.faculty_name;
    if (fRole) fRole.textContent = `Faculty, ${course.department}`;

    // Update Stat Items
    if (statItems[0]) statItems[0].innerHTML = `<i data-feather="users" style="width: 18px;"></i> ${enrollCount} Enrolled Students`;
    if (statItems[2]) statItems[2].innerHTML = `<i data-feather="file-text" style="width: 18px;"></i> ${assnCount} Assignments`;

    const fPhoto = document.querySelector('.faculty-photo');
    if (fPhoto) {
      const initials = course.faculty_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      fPhoto.style.background = '#1a2a4a';
      fPhoto.style.display = 'flex';
      fPhoto.style.alignItems = 'center';
      fPhoto.style.justifyContent = 'center';
      fPhoto.style.color = '#f5a623';
      fPhoto.style.fontSize = '2rem';
      fPhoto.style.fontWeight = '700';
      fPhoto.textContent = initials;
    }
    if (typeof feather !== 'undefined') feather.replace();
  }

  async function checkEnrollment(course) {
    const enrollBtn = document.getElementById('enrollNowBtn');
    if (!enrollBtn) return;
    
    let enrollment = null;

    if (!userEmail) {
      enrollBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        alert("Please login to enroll.");
        window.location.href = "login.html";
      });
      return;
    }

    // If Admin/Faculty, show "Go to Course" regardless of enrollment
    if (isAdmin) {
      enrollBtn.textContent = 'Go to Course Contents';
      enrollBtn.href = `lesson.html?course=${courseId}`;
      enrollBtn.style.backgroundColor = '#10b981';
      enrollBtn.style.color = '#fff';
      return;
    }

    try {
      const { data: enrollment } = await _supabase
        .from('enrollments')
        .select('*')
        .eq('user_email', userEmail)
        .eq('course_id', courseId)
        .maybeSingle();

      const actionContainer = document.getElementById('courseActionButtons');
      if (enrollment) {
        if (actionContainer) {
          actionContainer.innerHTML = `
            <a href="lesson.html?course=${courseId}" class="btn btn-primary" style="width: 100%; padding: 1rem; background: #10b981; border-color: #10b981; border-radius: var(--radius-md);">Go to Course</a>
            <button class="btn btn-outline pay-exam-btn" data-course-id="${courseId}" style="width: 100%; padding: 1rem; border-color: var(--accent-color); color: var(--primary-color); border-radius: var(--radius-md); font-weight: 600;">Register for Exam (₹1000)</button>
          `;
        }
      } else {
        enrollBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          if (!userEmail) {
            alert("Please login to enroll.");
            window.location.href = "login.html";
            return;
          }
          enrollBtn.disabled = true;
          enrollBtn.textContent = "Enrolling...";

          const { error: enrollError } = await _supabase
            .from('enrollments')
            .insert([{
              user_email: userEmail,
              course_id: courseId,
              course_name: course.course_name,
              course_code: course.course_code,
              progress: 0
            }]);

          if (enrollError) {
            alert("Enrollment failed.");
            enrollBtn.disabled = false;
            enrollBtn.textContent = "Enroll Now";
          } else {
            location.reload();
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  let overviewData, syllabusData;

  function initDynamicData(course) {
    overviewData = loadC('overview') || {
      description: course.description || `Welcome to ${course.course_name}.`,
      learningItems: ['Grasp fundamental core concepts.', 'Implement practical coding routines.', 'Analyze optimized execution paths.']
    };

    const storedSyllabus = loadC('syllabus');
    if (storedSyllabus) {
      syllabusData = storedSyllabus;
    } else {
      syllabusData = [
        { title: 'Unit 1: Introduction', topics: [{ title: 'Course Foundations', icon: 'play-circle', videoUrl: course.video_url || '' }] },
        { title: 'Unit 2: Frameworks', topics: [{ title: 'Preliminary Logic', icon: 'play-circle', videoUrl: '' }] }
      ];
      saveC('syllabus', syllabusData); // Ensure it's in localStorage for Lesson page
    }

    // Update real lesson count in stats
    const statItems = document.querySelectorAll('.stat-item');
    if (statItems && statItems[1]) {
      let totalLessons = 0;
      syllabusData.forEach(u => totalLessons += u.topics.length);
      statItems[1].innerHTML = `<i data-feather="video" style="width: 18px;"></i> ${totalLessons} Total Lessons`;
    }

    renderOverview();
    renderSyllabus();
    renderAssignments();
    renderDiscussions();
    if(typeof feather !== 'undefined') feather.replace();
  }

  // Tab Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.target);
      if(target) target.classList.add('active');
    });
  });

  function renderOverview() {
    const div = document.querySelector('#overview');
    if(!div) return;
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h2 style="font-family:var(--font-heading); color:var(--primary-color);">Course Overview</h2>
        ${isAdmin ? `<button id="ovE" class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;">✏️ Edit Overview</button>` : ''}
      </div>
      <div style="color:#475569; line-height:1.7;">
        ${overviewData.description.split('\n\n').map(p => `<p style="margin-bottom:1rem;">${p}</p>`).join('')}
        <h3 style="color:var(--primary-color); margin:1.5rem 0 1rem; font-family:var(--font-heading);">What you will learn:</h3>
        <ul>${overviewData.learningItems.map(li => `<li style="margin-bottom:0.5rem;"><i data-feather="check-square" style="width:16px; color:var(--accent-color); margin-right:0.5rem;"></i> ${li}</li>`).join('')}</ul>
      </div>
    `;
    if(isAdmin && document.getElementById('ovE')) document.getElementById('ovE').onclick = openOvE;
    if(typeof feather !== 'undefined') feather.replace();
  }

  async function renderAssignments() {
    const div = document.querySelector('#assignments');
    if(!div) return;

    try {
      const { data: assignments, error } = await _supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId);

      const tests = JSON.parse(localStorage.getItem('lms_mock_tests') || '{}');
      const hasMockTest = tests[courseId] && tests[courseId].length > 0;
      const mockTestHtml = hasMockTest ? `
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 12px; padding: 2rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; color: white;">
          <div>
            <h3 style="font-family: var(--font-heading); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.8rem;"><i data-feather="award" style="color: #f5a623;"></i> Official Mock Test Available</h3>
            <p style="color: #94a3b8; font-size: 0.95rem;">Test your conceptual knowledge before the final.</p>
          </div>
          <a href="mock-test.html?course=${courseId}" class="btn btn-primary" style="background: #10b981; border-color: #10b981; padding: 0.8rem 1.5rem;">Take Assessment</a>
        </div>
      ` : '';

      if ((assignments && assignments.length > 0) || hasMockTest) {
        div.innerHTML = mockTestHtml + `
          <h2 style="font-family:var(--font-heading); color:var(--primary-color); margin-bottom: 1.5rem;">Course Assignments</h2>
          <div style="display: grid; gap: 1rem;">
            ${(assignments || []).map(a => `
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div>
                  <h4 style="color: var(--primary-color); margin-bottom: 0.3rem;">${a.title}</h4>
                  <p style="font-size: 0.85rem; color: #64748b; margin: 0;"><i data-feather="calendar" style="width: 14px;"></i> Due: ${new Date(a.due_at || a.due || new Date()).toLocaleDateString()}</p>
                </div>
                <a href="assignment.html?course=${courseId}" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Submit Work</a>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        div.innerHTML = `
          <h2 style="font-family:var(--font-heading); color:var(--primary-color); margin-bottom: 1.5rem;">Course Assignments</h2>
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3rem 2rem; text-align: center;">
            <i data-feather="file-text" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;"></i>
            <h3 style="color: var(--primary-color); margin-bottom: 0.5rem; font-family: var(--font-heading);">No Assignments Posted</h3>
            <p style="color: #64748b;">Relax! There are no active assignments synchronized for this course yet.</p>
          </div>
        `;
      }
    } catch (e) { console.error(e); }
    if(typeof feather !== 'undefined') feather.replace();
  }

  async function renderDiscussions() {
    const div = document.querySelector('#discussions');
    if(!div) return;

    try {
      const { data: posts } = await _supabase
        .from('forum_posts')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (posts && posts.length > 0) {
        div.innerHTML = `
          <h2 style="font-family:var(--font-heading); color:var(--primary-color); margin-bottom: 1.5rem;">Course Discussions</h2>
          ${posts.map(p => `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem;">
              <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">${p.title}</h4>
              <p style="color: #475569; font-size: 0.95rem; margin-bottom: 1rem;">${p.content.substring(0, 150)}...</p>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.8rem;">
                <span style="font-size: 0.8rem; color: #94a3b8;">Posted by ${p.author_name} • ${new Date(p.created_at).toLocaleDateString()}</span>
                <a href="forum.html" style="color: var(--accent-color); font-size: 0.85rem; font-weight: 600; text-decoration: none;">View Discussion →</a>
              </div>
            </div>
          `).join('')}
        `;
      } else {
        div.innerHTML = `
          <h2 style="font-family:var(--font-heading); color:var(--primary-color); margin-bottom: 1.5rem;">Forums & Discussions</h2>
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3rem 2rem; text-align: center;">
            <i data-feather="message-circle" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;"></i>
            <h3 style="color: var(--primary-color); margin-bottom: 0.5rem; font-family: var(--font-heading);">Starting the Conversation?</h3>
            <p style="color: #64748b;">No discussions have been started for this course yet. Be the first to ask a question!</p>
            <a href="forum.html" class="btn btn-primary" style="margin-top: 1.5rem; display: inline-block;">Go to Forums</a>
          </div>
        `;
      }
    } catch (e) { console.error(e); }
    if(typeof feather !== 'undefined') feather.replace();
  }

  function renderSyllabus() {
    const div = document.querySelector('#syllabus');
    if(!div) return;
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h2 style="font-family:var(--font-heading); color:var(--primary-color);">Detailed Syllabus</h2>
        ${isAdmin ? `<button id="uA" class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;">➕ Add Unit</button>` : ''}
      </div>
    `;
    syllabusData.forEach((u, uIdx) => {
      html += `
        <div class="accordion-item ${uIdx === 0 ? 'active' : ''}">
          <div class="accordion-header">
            <span>${u.title}</span>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              ${isAdmin ? `<div style="display:flex; gap:0.3rem;">
                <button class="u-e" data-u="${uIdx}">✏️</button>
                <button class="t-a" data-u="${uIdx}">➕</button>
                <button class="u-d" data-u="${uIdx}">🗑️</button>
              </div>` : ''}
              <i data-feather="chevron-down"></i>
            </div>
          </div>
          <div class="accordion-content">
            <ul class="topic-list">
              ${u.topics.map((t, tIdx) => `
                <li style="display:flex; justify-content:space-between; align-items:center;">
                  <div class="t-p" data-u="${uIdx}" data-t="${tIdx}" style="cursor:pointer; flex:1; display:flex; align-items:center; gap:0.5rem;">
                    <i data-feather="${t.icon || 'play-circle'}"></i> <span>${t.title}</span>
                  </div>
                  ${isAdmin ? `<div>
                    <button class="t-e" data-u="${uIdx}" data-t="${tIdx}">✏️</button>
                    <button class="t-d" data-u="${uIdx}" data-t="${tIdx}">❌</button>
                  </div>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
    });
    div.innerHTML = html;
    if(typeof feather !== 'undefined') feather.replace();
  }

  document.addEventListener('click', (e) => {
    const h = e.target.closest('.accordion-header');
    if(h && !e.target.closest('button')) {
      const it = h.parentElement;
      const wasA = it.classList.contains('active');
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
      if(!wasA) it.classList.add('active');
      return;
    }

    const topic = e.target.closest('.t-p');
    if (topic) {
      const uIdx = topic.dataset.u;
      const tIdx = topic.dataset.t;
      const t = syllabusData[uIdx].topics[tIdx];
      if (t && t.videoUrl) {
        openVideoModal(t.title, t.videoUrl);
      } else {
        showToast("No video available for this topic.", "#f5a623", "video-off");
      }
      return;
    }
    if(!isAdmin) return;
    const btn = e.target.closest('button');
    if(!btn) return;
    if(btn.id === 'uA') {
      const t = prompt('Unit Name:');
      if(t) { syllabusData.push({title:t, topics:[]}); saveC('syllabus', syllabusData); renderSyllabus(); }
    } else if(btn.classList.contains('u-e')) {
      const u = syllabusData[btn.dataset.u];
      const t = prompt('Edit Unit:', u.title);
      if(t) { u.title = t; saveC('syllabus', syllabusData); renderSyllabus(); }
    } else if(btn.classList.contains('u-d')) {
      if(confirm('Delete Unit?')) { syllabusData.splice(btn.dataset.u, 1); saveC('syllabus', syllabusData); renderSyllabus(); }
    } else if(btn.classList.contains('t-a')) {
      openTE(btn.dataset.u, null);
    } else if(btn.classList.contains('t-e')) {
      openTE(btn.dataset.u, btn.dataset.t);
    } else if(btn.classList.contains('t-d')) {
      if(confirm('Delete Topic?')) { syllabusData[btn.dataset.u].topics.splice(btn.dataset.t, 1); saveC('syllabus', syllabusData); renderSyllabus(); }
    }
  });

  function openOvE() {
    createM('Edit Overview', `
      <textarea id="oD" rows="8" style="width:100%; margin-bottom:1rem; padding:0.5rem;">${overviewData.description}</textarea>
      <textarea id="oL" rows="6" style="width:100%; padding:0.5rem;">${overviewData.learningItems.join('\n')}</textarea>
    `, () => {
      overviewData.description = document.getElementById('oD').value;
      overviewData.learningItems = document.getElementById('oL').value.split('\n').filter(l => l.trim());
      saveC('overview', overviewData);
      renderOverview();
    });
  }

  function openTE(u, t) {
    const top = t !== null ? syllabusData[u].topics[t] : null;
    createM(t !== null ? 'Edit Topic' : 'Add Topic', `
      <input id="tT" type="text" placeholder="Title" value="${top ? top.title : ''}" style="width:100%; margin-bottom:1rem; padding:0.5rem;">
      <input id="tV" type="url" placeholder="Video URL" value="${top ? top.videoUrl : ''}" style="width:100%; margin-bottom:1rem; padding:0.5rem;">
      <select id="tI" style="width:100%; padding:0.5rem;"><option value="play-circle">Video</option><option value="file-text">Reading</option></select>
    `, () => {
      const nt = { title:document.getElementById('tT').value, videoUrl:document.getElementById('tV').value, icon:document.getElementById('tI').value };
      if(!nt.title) return false;
      if(t !== null) syllabusData[u].topics[t] = nt;
      else syllabusData[u].topics.push(nt);
      saveC('syllabus', syllabusData);
      renderSyllabus();
    });
  }

  function createM(title, body, onSave) {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:20000; display:flex; align-items:center; justify-content:center;';
    o.innerHTML = `
      <div style="background:white; padding:2rem; border-radius:16px; width:450px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <h3 style="font-family:var(--font-heading); margin:0; color:var(--primary-color);">${title}</h3>
          <button id="cX" style="background:none; border:none; cursor:pointer; color:#64748b;"><i data-feather="x"></i></button>
        </div>
        <div style="margin-bottom:2rem;">${body}</div>
        <div style="display:flex; justify-content:flex-end; gap:1rem;">
          <button id="mC" class="btn" style="padding:0.6rem 1.2rem; background:#f1f5f9; color:#475569; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Cancel</button>
          <button id="mS" class="btn btn-primary" style="padding:0.6rem 1.5rem;">Save Changes</button>
        </div>
      </div>`;
    document.body.appendChild(o);
    if (typeof feather !== 'undefined') feather.replace();
    document.getElementById('mC').onclick = () => o.remove();
    document.getElementById('cX').onclick = () => o.remove();
    document.getElementById('mS').onclick = () => { if(onSave() !== false) o.remove(); };
  }

  function openVideoModal(title, url) {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:30000; display:flex; align-items:center; justify-content:center; flex-direction:column; padding:2rem;';
    
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      // Safely extract the ID ignoring trailing & arguments
      embedUrl = `https://www.youtube.com/embed/` + url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      // Safely extract the ID ignoring trailing ? queries
      embedUrl = `https://www.youtube.com/embed/` + url.split('youtu.be/')[1].split('?')[0];
    }

    o.innerHTML = `
      <div style="display:flex; justify-content:space-between; width:100%; max-width:800px; margin-bottom:1rem; color:white;">
        <h2 style="font-family:var(--font-heading); margin:0;">${title}</h2>
        <button id="vC" style="background:none; border:none; cursor:pointer; color:white;"><i data-feather="x" style="width:32px; height:32px;"></i></button>
      </div>
      <div style="width:100%; max-width:800px; aspect-ratio:16/9; background:black; border-radius:12px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
        <iframe src="${embedUrl}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>
      </div>
    `;
    document.body.appendChild(o);
    if(typeof feather !== 'undefined') feather.replace();
    document.getElementById('vC').onclick = () => o.remove();
    o.onclick = (e) => { if (e.target === o) o.remove(); };
  }

  function showToast(message, color, icon) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); background:white; padding:1rem 2rem; border-radius:12px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); display:flex; align-items:center; gap:1rem; z-index:10000; border-left:5px solid ${color};`;
    toast.innerHTML = `<i data-feather="${icon}" style="color:${color}"></i> <span style="font-weight:500;">${message}</span>`;
    document.body.appendChild(toast);
    if (typeof feather !== 'undefined') feather.replace();
    setTimeout(() => toast.remove(), 3000);
  }

  fetchCourseDetails();
});
