document.addEventListener('DOMContentLoaded', async () => {

  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem("userRole") || "Student";
  const isAdmin = (userRole === "Admin" || userRole === "Faculty");
  const courseGrid = document.getElementById('courseGrid');
  const noResultsMessage = document.getElementById('noResultsMessage');
  
  let allCourses = [];
  let enrolledIds = [];

  // ===== 1. Initialize Supabase Data =====
  async function fetchData() {
    try {
      // Fetch All Courses
      const { data: courses, error: cErr } = await _supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (cErr) throw cErr;
      allCourses = courses || [];
      
      // Check User Enrollments
      if (userEmail) {
        const { data: enrolled, error: eErr } = await _supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_email', userEmail);
        
        if (!eErr && enrolled) {
          enrolledIds = enrolled.map(e => e.course_id);
        }
      }

      renderCourses(allCourses);
    } catch (err) {
      console.error("Data fetch error:", err);
      if (courseGrid) courseGrid.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;">Failed to load courses. Please refresh.</p>';
    }
  }

  function renderCourses(filtered) {
    if (!courseGrid) return;
    courseGrid.innerHTML = '';

    if (filtered.length === 0) {
      if (noResultsMessage) noResultsMessage.style.display = 'block';
      return;
    }

    if (noResultsMessage) noResultsMessage.style.display = 'none';

    filtered.forEach((course, index) => {
      const isEnrolled = enrolledIds.includes(course.id);
      const card = document.createElement('div');
      const delay = ((index % 4) + 1) * 100;
      card.className = `course-card premium-card reveal delay-${delay}`;
      
      const img = course.image_url || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=600&auto=format&fit=crop`;

      card.innerHTML = `
        <a href="course-detail.html?course=${course.id}" class="course-thumbnail" style="display: block; cursor: pointer;">
          <img src="${img}" alt="${course.course_name}">
          <span class="course-badge">${course.course_code}</span>
        </a>
        <div class="course-details">
          <span class="badge-nptel" style="margin-bottom: 0.5rem; background: rgba(255,153,51,0.1); color: var(--accent-color); border: 1px solid var(--accent-color);">${course.department}</span>
          <a href="course-detail.html?course=${course.id}" style="text-decoration: none; color: inherit;">
            <h4 style="margin-top: 0.4rem; font-size: 1.2rem; min-height: 2.8rem; cursor: pointer;">${course.course_name}</h4>
          </a>
          <p class="course-faculty" style="margin-bottom: 0.8rem; font-size: 0.9rem;">By ${course.faculty_name}</p>
          
          <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;">
            <span style="display: flex; align-items: center; gap: 4px;"><i data-feather="clock" style="width: 14px;"></i> ${course.duration || '12 Weeks'}</span>
            <span style="display: flex; align-items: center; gap: 4px;"><i data-feather="calendar" style="width: 14px;"></i> ${course.semester}</span>
          </div>

          <div class="card-actions" style="margin-top: auto;">
            ${isEnrolled ? `
              <div style="display: flex; gap: 0.5rem;">
                <a href="lesson.html?course=${course.id}" class="btn btn-primary" style="flex: 1; text-align: center; border-radius: var(--radius-sm);">Go to Course</a>
                <button class="btn btn-outline pay-exam-btn" data-course-id="${course.id}" style="border-color: var(--accent-color); color: var(--primary-color); border-radius: var(--radius-sm);">Exam Fee</button>
              </div>
            ` : `
              <div style="display: flex; gap: 0.5rem;">
                <a href="course-detail.html?course=${course.id}" class="btn btn-outline" style="flex: 1; text-align: center; border-radius: var(--radius-sm);">Details</a>
                <button class="btn btn-primary enroll-btn" data-id="${course.id}" data-name="${course.course_name}" data-code="${course.course_code}" style="flex: 1.5; border-radius: var(--radius-sm);">Enroll Now</button>
              </div>
            `}
            
            ${isAdmin ? `
              <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: flex-end;">
                <button class="btn btn-outline edit-course-btn" data-id="${course.id}" style="border-color: #3b82f6; color: #3b82f6; padding: 0.4rem; border-radius: var(--radius-sm);"><i data-feather="edit-2" style="width: 14px;"></i></button>
                <button class="btn btn-outline delete-course-btn" data-id="${course.id}" style="border-color: #ef4444; color: #ef4444; padding: 0.4rem; border-radius: var(--radius-sm);"><i data-feather="trash-2" style="width: 14px;"></i></button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      courseGrid.appendChild(card);
    });

    if (typeof feather !== 'undefined') feather.replace();
    attachEnrollEvents();
    if (isAdmin) attachAdminEvents();
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 3).toUpperCase();
  }

  // ===== 3. Enroll Functionality =====
  function attachEnrollEvents() {
    document.querySelectorAll('.enroll-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!userEmail) {
          showToast("Please login to enroll.", "#f59e0b", "log-in");
          return;
        }
        const courseId = btn.dataset.id;
        const courseName = btn.dataset.name;
        const courseCode = btn.dataset.code;

        btn.disabled = true;
        btn.textContent = "Enrolling...";

        try {
          const { error } = await _supabase
            .from('enrollments')
            .insert([
              { 
                user_email: userEmail, 
                course_id: courseId,
                course_name: courseName,
                course_code: courseCode,
                progress: 0
              }
            ]);

          if (error) throw error;
          
          showToast(`Successfully enrolled in ${courseName}!`, "#10b981", "check-circle");
          fetchData(); 
        } catch (error) {
          console.error("Enrollment error:", error);
          showToast("Enrollment failed.", "#ef4444", "alert-circle");
          btn.disabled = false;
          btn.textContent = "Enroll Now";
        }
      });
    });
  }

  // ===== Admin Events =====
  function attachAdminEvents() {
    document.querySelectorAll('.delete-course-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        if (confirm("Are you sure you want to delete this course? This action is permanent.")) {
          const { error } = await _supabase.from('courses').delete().eq('id', id);
          if (error) alert("Deletion failed: " + error.message);
          else fetchData();
        }
      });
    });
    
    document.querySelectorAll('.edit-course-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        const course = allCourses.find(c => c.id == id);
        if (course) {
          openAddCourseModal(course);
        }
      });
    });
  }

  // ===== 5. Add Course Modal =====
  function openAddCourseModal(editCourse = null) {
    const existing = document.getElementById('addCourseModal');
    if (existing) existing.remove();

    const modalHTML = `
      <div id="addCourseModal" class="modal-overlay" style="display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000;">
        <div class="modal-content" style="background: white; padding: 2.5rem; border-radius: 16px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2 style="font-family: var(--font-heading); color: var(--primary-color); margin: 0;">${editCourse ? 'Edit Course' : 'Add New Course'}</h2>
            <button onclick="document.getElementById('addCourseModal').remove()" style="background: none; border: none; cursor: pointer; color: #64748b;"><i data-feather="x"></i></button>
          </div>
          
          <form id="addCourseForm">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
              <div class="form-group">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Course Code</label>
                <input type="text" id="mCode" required value="${editCourse ? editCourse.course_code : ''}" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
              </div>
              <div class="form-group">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Course Name</label>
                <input type="text" id="mName" required value="${editCourse ? editCourse.course_name : ''}" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Thumbnail Image URL</label>
              <input type="url" id="mImage" value="${editCourse ? (editCourse.image_url || '') : ''}" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
              <div class="form-group">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Faculty Name</label>
                <input type="text" id="mFaculty" required value="${editCourse ? editCourse.faculty_name : ''}" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
              </div>
              <div class="form-group">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Department</label>
                <select id="mDept" required style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <option value="Computer Engineering" ${editCourse?.department === 'Computer Engineering' ? 'selected' : ''}>Computer Engineering</option>
                  <option value="Mechanical Engineering" ${editCourse?.department === 'Mechanical Engineering' ? 'selected' : ''}>Mechanical Engineering</option>
                  <option value="Civil Engineering" ${editCourse?.department === 'Civil Engineering' ? 'selected' : ''}>Civil Engineering</option>
                  <option value="Electronics Engineering" ${editCourse?.department === 'Electronics Engineering' ? 'selected' : ''}>Electronics Engineering</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
              <div class="form-group">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Semester</label>
                <select id="mSem" required style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
                  ${['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'].map(s => `<option value="${s}" ${editCourse?.semester === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Duration</label>
                <input type="text" id="mDuration" required value="${editCourse ? editCourse.duration : ''}" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Video Intro URL</label>
              <input type="url" id="mVideo" value="${editCourse ? (editCourse.video_url || '') : ''}" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
              <textarea id="mDesc" required rows="3" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px;">${editCourse ? editCourse.description : ''}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 1rem;">${editCourse ? 'Update Course' : 'Create Course'}</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (typeof feather !== 'undefined') feather.replace();

    document.getElementById('addCourseForm').addEventListener('submit', (e) => handleAddCourse(e, editCourse));
  }

  async function handleAddCourse(e, editCourse) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const data = {
      course_code: document.getElementById('mCode').value,
      course_name: document.getElementById('mName').value,
      department: document.getElementById('mDept').value,
      faculty_name: document.getElementById('mFaculty').value,
      semester: document.getElementById('mSem').value,
      duration: document.getElementById('mDuration').value,
      description: document.getElementById('mDesc').value,
      image_url: document.getElementById('mImage').value,
      video_url: document.getElementById('mVideo').value
    };

    try {
      let res;
      if (editCourse) {
        res = await _supabase.from('courses').update(data).eq('id', editCourse.id);
      } else {
        res = await _supabase.from('courses').insert([data]);
      }

      if (res.error) throw res.error;

      showToast(editCourse ? "Updated!" : "Created!", "#10b981", "check");
      document.getElementById('addCourseModal').remove();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      submitBtn.disabled = false;
    }
  }

  // ===== Search & Filter =====
  const sIn = document.getElementById('searchInput');
  const dF = document.getElementById('departmentFilter');
  const smF = document.getElementById('semesterFilter');

  function applyFilters() {
    const term = sIn ? sIn.value.toLowerCase() : '';
    const dept = dF ? dF.value : 'all';
    const sem = smF ? smF.value : 'all';

    const filtered = allCourses.filter(c => {
      const mT = c.course_name.toLowerCase().includes(term) || c.course_code.toLowerCase().includes(term);
      const mD = dept === 'all' || c.department.includes(dept) || dept === c.department;
      const mS = sem === 'all' || c.semester.includes(sem) || sem === c.semester;
      return mT && (dept === 'all' || mD) && (sem === 'all' || mS);
    });
    renderCourses(filtered);
  }

  if (sIn) sIn.addEventListener('input', applyFilters);
  if (dF) dF.addEventListener('change', applyFilters);
  if (smF) smF.addEventListener('change', applyFilters);

  // Initialize Add Button
  if (isAdmin) {
    const addBtn = document.createElement('button');
    addBtn.innerHTML = '<i data-feather="plus"></i> Add Course';
    addBtn.style.cssText = 'position:fixed; bottom:2rem; right:2rem; padding:1rem 1.5rem; border-radius:50px; background:var(--primary-color); color:white; border:none; box-shadow:0 10px 15px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-weight:600; z-index:100;';
    addBtn.onclick = () => openAddCourseModal();
    document.body.appendChild(addBtn);
    if (typeof feather !== 'undefined') feather.replace();
  }

  // ===== Toast Notification =====
  function showToast(message, color, icon) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); background:white; padding:1rem 2rem; border-radius:12px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); display:flex; align-items:center; gap:1rem; z-index:10000; border-left:5px solid ${color};`;
    toast.innerHTML = `<i data-feather="${icon}" style="color:${color}"></i> <span style="font-weight:500;">${message}</span>`;
    document.body.appendChild(toast);
    if (typeof feather !== 'undefined') feather.replace();
    setTimeout(() => toast.remove(), 3000);
  }

  fetchData();
});
