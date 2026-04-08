document.addEventListener('DOMContentLoaded', async () => {
  // Current User and Course Context
  const userEmail = localStorage.getItem('userEmail');
  const urlParams = new URLSearchParams(window.location.search);
  const currentCourseId = parseInt(urlParams.get('course')); 
  
  // UI Elements
  const markCompleteBtn = document.getElementById('markCompleteBtn');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const listContainer = document.querySelector('.lesson-list-container');
  const videoEmbed = document.getElementById('lessonVideoEmbed');
  const mainTitle = document.getElementById('lessonMainTitle');
  const instructorText = document.getElementById('lessonInstructorText');
  const descBox = document.getElementById('lessonDescriptionBox');

  let completedLessons = [];
  let syllabusData = [];
  let activeUnit = 0;
  let activeTopic = 0;
  let masterCourseVideo = ''; // Fallback from courses table

  // ===== Load Syllabus (Prioritizes DB over LocalStorage) =====
  function loadSyllabus(dbSyllabus = null) {
    if (dbSyllabus) {
      syllabusData = dbSyllabus;
      return;
    }

    const key = `courseDetail_${currentCourseId}_syllabus`;
    const stored = localStorage.getItem(key);
    if (stored) {
      syllabusData = JSON.parse(stored);
    } else {
      // Minimal fallback: If no DB syllabus, show one topic with the master video
      syllabusData = [
        { title: 'Unit 1: Course Overview', topics: [{ title: 'Main Lesson', icon: 'play-circle', videoUrl: masterCourseVideo }] }
      ];
    }
  }

  function renderSidebar() {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    syllabusData.forEach((unit, uIdx) => {
      const group = document.createElement('div');
      group.className = 'module-group';
      
      const completedInUnit = unit.topics.filter((t, tIdx) => completedLessons.includes(`lesson_${uIdx}_${tIdx}`)).length;

      group.innerHTML = `
        <div class="module-header" style="display:flex; justify-content:space-between; padding:0.8rem 1rem; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-weight:600; font-size:0.85rem; color:#475569;">
          <span>${unit.title}</span>
          <span style="color:var(--accent-color);">${completedInUnit}/${unit.topics.length}</span>
        </div>
      `;

      unit.topics.forEach((topic, tIdx) => {
        const lessonId = `lesson_${uIdx}_${tIdx}`;
        const isItemActive = uIdx === activeUnit && tIdx === activeTopic;
        const isCompleted = completedLessons.includes(lessonId);

        const item = document.createElement('a');
        item.href = '#';
        item.className = `lesson-item ${isItemActive ? 'active' : ''}`;
        item.style.cssText = `display:flex; align-items:center; gap:0.8rem; padding:1rem; text-decoration:none; border-bottom:1px solid #f1f5f9; transition:all 0.2s; ${isItemActive ? 'background:#fff7ed; border-left:4px solid var(--accent-color);' : 'background:white;'}`;

        item.innerHTML = `
          <div class="lesson-status" style="width:20px; height:20px; border-radius:50%; border:2px solid ${isCompleted ? '#10b981' : '#cbd5e1'}; display:flex; align-items:center; justify-content:center; background:${isCompleted ? '#10b981' : 'transparent'};">
            ${isCompleted ? '<i data-feather="check" style="width:12px; color:white;"></i>' : ''}
          </div>
          <div class="lesson-details">
            <div class="lesson-title" style="font-weight:500; color:${isItemActive ? 'var(--primary-color)' : '#475569'}; font-size:0.9rem;">${topic.title}</div>
            <div class="lesson-duration" style="font-size:0.75rem; color:#94a3b8; display:flex; align-items:center; gap:0.3rem; margin-top:0.2rem;">
              <i data-feather="${topic.icon || 'play-circle'}" style="width:12px;"></i> Topic
            </div>
          </div>
        `;

        item.onclick = (e) => {
          e.preventDefault();
          switchTopic(uIdx, tIdx);
        };

        group.appendChild(item);
      });

      listContainer.appendChild(group);
    });
    
    if (typeof feather !== 'undefined') feather.replace();
  }

  function switchTopic(uIdx, tIdx) {
    if (!syllabusData[uIdx] || !syllabusData[uIdx].topics[tIdx]) return;
    
    activeUnit = uIdx;
    activeTopic = tIdx;
    
    const topic = syllabusData[uIdx].topics[tIdx];
    if (mainTitle) mainTitle.textContent = topic.title;
    
    if (videoEmbed) {
      // Use topic video or fallback to master course video
      const urlToUse = topic.videoUrl || masterCourseVideo;
      
      if (urlToUse) {
        let url = urlToUse;
        if (url.includes('youtube.com/watch?v=')) {
          url = `https://www.youtube.com/embed/` + url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
          url = `https://www.youtube.com/embed/` + url.split('youtu.be/')[1].split('?')[0];
        }
        videoEmbed.innerHTML = `<iframe width="100%" height="100%" src="${url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else {
        videoEmbed.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1e293b; color: #fff; flex-direction: column;">
            <i data-feather="video-off" style="width: 48px; height: 48px; margin-bottom: 1rem; color: #94a3b8;"></i>
            <h3 style="font-family: var(--font-heading); margin-bottom: 0.5rem;">Video Not Available</h3>
            <p style="font-size: 0.8rem; color: #94a3b8;">No video specific to this topic yet.</p>
          </div>`;
        if (typeof feather !== 'undefined') feather.replace();
      }
    }

    renderSidebar();
    updateUI();
    updateNavButtons();
  }

  async function fetchProgress() {
    if (!userEmail || !currentCourseId) return;

    try {
      // 1. Fetch Course Metadata
      const { data: courseData, error: cErr } = await _supabase
        .from('courses')
        .select('*')
        .eq('id', currentCourseId)
        .single();
      
      if (cErr) throw cErr;

      if (courseData) {
        masterCourseVideo = courseData.video_url || '';
        const navTitle = document.getElementById('lessonCourseTitle');
        if (navTitle) navTitle.textContent = courseData.course_name;
        if (instructorText) {
          instructorText.innerHTML = `Instructor: ${courseData.faculty_name} &bull; Duration: ${courseData.duration || 'N/A'}`;
        }

        if (courseData.syllabus) {
          try {
            const parsedSyllabus = typeof courseData.syllabus === 'string' ? JSON.parse(courseData.syllabus) : courseData.syllabus;
            loadSyllabus(parsedSyllabus);
          } catch (e) {
            loadSyllabus(); 
          }
        } else {
          loadSyllabus();
        }
      }

      // 2. Fetch User Progress
      const { data: progress, error: pErr } = await _supabase
        .from('course_progress')
        .select('lesson_id, completed')
        .eq('user_email', userEmail)
        .eq('course_id', currentCourseId);

      if (pErr) throw pErr;
      completedLessons = progress ? progress.filter(p => p.completed).map(p => p.lesson_id) : [];

      renderSidebar();
      switchTopic(0, 0); 
      updateUI();
    } catch (error) {
      console.error('Error loading lesson:', error);
      loadSyllabus();
      renderSidebar();
      switchTopic(0, 0);
    }
  }

  function updateUI() {
    const progressPercent = calculateProgress();
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${progressPercent}%`;

    const currentLessonId = `lesson_${activeUnit}_${activeTopic}`;
    if (markCompleteBtn) {
      if (completedLessons.includes(currentLessonId)) {
        markCompleteBtn.innerHTML = '<i data-feather="check-circle" style="width: 20px;"></i> Completed';
        markCompleteBtn.style.backgroundColor = '#059669';
      } else {
        markCompleteBtn.innerHTML = '<i data-feather="check-circle" style="width: 20px;"></i> Mark as Complete';
        markCompleteBtn.style.backgroundColor = '#10b981';
      }
      markCompleteBtn.disabled = false;
    }
    if (typeof feather !== 'undefined') feather.replace();
  }

  function calculateProgress() {
    let totalItems = 0;
    syllabusData.forEach(u => totalItems += u.topics.length);
    if (totalItems === 0) return 0;
    return Math.round((completedLessons.length / totalItems) * 100);
  }

  if (markCompleteBtn) {
    markCompleteBtn.addEventListener('click', async () => {
      const currentLessonId = `lesson_${activeUnit}_${activeTopic}`;
      if (completedLessons.includes(currentLessonId)) return;

      markCompleteBtn.disabled = true;
      markCompleteBtn.textContent = "Saving...";

      try {
        const cId = currentCourseId.toString(); 
        const { error } = await _supabase
          .from('course_progress')
          .upsert([{
            user_email: userEmail,
            course_id: cId,
            lesson_id: currentLessonId,
            completed: true
          }], { onConflict: 'user_email,course_id,lesson_id' });

        if (error) throw error;

        completedLessons.push(currentLessonId);
        const newPercent = calculateProgress();
        await _supabase.from('enrollments').update({ progress: newPercent }).eq('user_email', userEmail).eq('course_id', cId);

        updateUI();
        showToast("Progress saved!", "#10b981", "check-circle");
      } catch (error) {
        alert("Failed to save progress");
        markCompleteBtn.disabled = false;
        updateUI();
      }
    });
  }

  const prevBtn = document.getElementById('prevLessonBtn');
  const nextBtn = document.getElementById('nextLessonBtn');

  if (prevBtn) {
    prevBtn.onclick = () => {
      let u = activeUnit, t = activeTopic - 1;
      if (t < 0) { u--; if (u < 0) return; t = syllabusData[u].topics.length - 1; }
      switchTopic(u, t);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      let u = activeUnit, t = activeTopic + 1;
      if (t >= syllabusData[u].topics.length) { u++; if (u >= syllabusData.length) return; t = 0; }
      switchTopic(u, t);
    };
  }

  function updateNavButtons() {
    if (!prevBtn || !nextBtn) return;
    const isStart = activeUnit === 0 && activeTopic === 0;
    prevBtn.disabled = isStart;
    prevBtn.style.opacity = isStart ? '0.5' : '1';

    const isEnd = activeUnit === (syllabusData.length - 1) && activeTopic === (syllabusData[activeUnit].topics.length - 1);
    nextBtn.disabled = isEnd;
    nextBtn.style.opacity = isEnd ? '0.5' : '1';
  }

  function showToast(message, color, icon) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:2rem; right:2rem; background:white; padding:1rem 1.5rem; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.1); border-left:5px solid ${color}; display:flex; align-items:center; gap:0.8rem; z-index:10000; animation:slideIn 0.3s ease;`;
    toast.innerHTML = `<i data-feather="${icon}" style="color:${color}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    if (typeof feather !== 'undefined') feather.replace();
    setTimeout(() => toast.remove(), 3000);
  }

  fetchProgress();
});
