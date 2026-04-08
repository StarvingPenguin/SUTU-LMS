document.addEventListener('DOMContentLoaded', () => {

  // --- Sidebar Navigation ---
  const navLinks = document.querySelectorAll('.admin-nav-link');
  const contentAreas = document.querySelectorAll('.admin-content-area');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(ln => ln.classList.remove('active'));
      link.classList.add('active');
      const targetId = link.getAttribute('data-target');
      contentAreas.forEach(area => area.classList.remove('active'));
      const targetArea = document.getElementById(targetId);
      if (targetArea) {
        targetArea.classList.add('active');
      }
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const targetParam = urlParams.get('target');
  if (targetParam) {
    const targetLink = document.querySelector(`.admin-nav-link[data-target="${targetParam}"]`);
    if (targetLink) {
      targetLink.click();
    }
  }

  // --- Helper: open/close modal ---
  function openModal(modal) {
    modal.style.display = 'flex';
    if (typeof feather !== 'undefined') feather.replace();
  }
  function closeModal(modal) {
    modal.style.display = 'none';
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  // --- Course Management via Supabase ---
  let globalAdminCourses = [];
  async function fetchAdminCourses() {
    const tbody = document.getElementById('admin-courses-tbody');
    if(!tbody) return;
    try {
      const { data, error } = await _supabase.from('courses').select('*').order('created_at', {ascending: false});
      if (error) throw error;
      globalAdminCourses = data || [];
      
      tbody.innerHTML = '';
      
      const ms = document.getElementById('mockTestCourseSelect');
      if(ms) {
        ms.innerHTML = '<option value="">-- Select a Course --</option>';
      }

      globalAdminCourses.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 600; color: var(--primary-color);">${c.course_code}</td>
          <td>${c.course_name}</td>
          <td>${c.department}</td>
          <td>${c.faculty_name}</td>
          <td style="font-family: monospace; font-size: 1.1rem; color: #475569;">0</td>
          <td><span class="admin-status-badge status-active">Public</span></td>
          <td>
            <button class="action-btn edit" data-dbid="${c.id}"><i data-feather="edit-2" style="width: 16px;"></i></button>
            <button class="action-btn delete" data-dbid="${c.id}"><i data-feather="trash-2" style="width: 16px;"></i></button>
          </td>
        `;
        tbody.appendChild(tr);

        if(ms) {
          ms.innerHTML += `<option value="${c.id}">${c.course_code} - ${c.course_name}</option>`;
        }
      });
      if (typeof feather !== 'undefined') feather.replace();
    } catch (err) {
      console.error(err);
    }
  }
  
  // Call it right away
  fetchAdminCourses();

  // --- Add Course Modal ---
  const addCourseModal = document.getElementById('addCourseModal');
  const openAddCourseModalBtn = document.getElementById('openAddCourseModal');
  const closeAddCourseModalBtn = document.getElementById('closeAddCourseModal');
  const addCourseForm = document.getElementById('addCourseForm');

  if (openAddCourseModalBtn) openAddCourseModalBtn.addEventListener('click', () => openModal(addCourseModal));
  if (closeAddCourseModalBtn) closeAddCourseModalBtn.addEventListener('click', () => closeModal(addCourseModal));

  if (addCourseForm) {
    addCourseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputs = addCourseForm.querySelectorAll('input, select, textarea');
      const code = inputs[0]?.value?.toUpperCase() || 'NEW01';
      const title = inputs[1]?.value || 'New Course';
      const dept = inputs[2]?.value || 'Computer Engineering';
      const instructor = inputs[3]?.value || 'instructor@sutu.edu';
      const desc = document.getElementById('addCourseDesc')?.value || inputs[4]?.value || 'Course Description';
      const fees = parseInt(document.getElementById('addCourseFees')?.value) || 0;

      const newCourse = {
        course_code: code,
        course_name: title,
        department: dept,
        faculty_name: instructor,
        semester: "Sem 1",
        duration: "14 Weeks",
        description: desc,
        exam_fees: fees
      };
      
      try {
        const { error } = await _supabase.from('courses').insert([newCourse]);
        if (error) throw error;
        alert('Course has been successfully registered and published internally globally.');
        closeModal(addCourseModal);
        addCourseForm.reset();
        fetchAdminCourses();
      } catch (err) {
        console.error('Error syncing course to global catalog', err);
        alert('Failed to insert: ' + err.message);
      }
    });
  }

  // --- Edit Course Modal ---
  const editCourseModal = document.getElementById('editCourseModal');
  const closeEditCourseBtn = document.getElementById('closeEditCourseModal');
  const editCourseForm = document.getElementById('editCourseForm');
  let currentEditCourseId = null;

  if (closeEditCourseBtn) closeEditCourseBtn.addEventListener('click', () => closeModal(editCourseModal));

  function openEditCourseModal(dbid) {
    currentEditCourseId = dbid;
    const course = globalAdminCourses.find(c => c.id == dbid);
    if (!course) return;

    document.getElementById('editCourseCode').value = course.course_code;
    document.getElementById('editCourseTitle').value = course.course_name;
    
    const deptSelect = document.getElementById('editCourseDept');
    for (let opt of deptSelect.options) {
      if (opt.text.includes(course.department.split(' ')[0])) {
        deptSelect.value = opt.value;
        break;
      }
    }
    document.getElementById('editCourseInstructor').value = course.faculty_name;
    document.getElementById('editCourseFees').value = course.exam_fees || 0;
    openModal(editCourseModal);
  }

  if (editCourseForm) {
    editCourseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentEditCourseId) return;
      
      const newCode = document.getElementById('editCourseCode').value.toUpperCase();
      const newTitle = document.getElementById('editCourseTitle').value;
      const fullDept = document.getElementById('editCourseDept').value;
      const newInstructor = document.getElementById('editCourseInstructor').value;
      const newFees = parseInt(document.getElementById('editCourseFees').value) || 0;

      const mappedDept = fullDept.includes('Computer') ? 'Computer Engineering' :
                fullDept.includes('Mechanical') ? 'Mechanical Engineering' :
                fullDept.includes('Civil') ? 'Civil Engineering' : 'Applied Mathematics';

      try {
        const { error } = await _supabase.from('courses').update({
          course_code: newCode,
          course_name: newTitle,
          department: mappedDept,
          faculty_name: newInstructor,
          exam_fees: newFees
        }).eq('id', currentEditCourseId);
        
        if (error) throw error;
        alert('Course details updated successfully.');
        closeModal(editCourseModal);
        currentEditCourseId = null;
        fetchAdminCourses();
      } catch (err) { 
        console.error('Error updating course map explicitly', err); 
        alert('Failed to update: ' + err.message);
      }
    });
  }

  // --- Delete Confirmation Modal ---
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteConfirmText = document.getElementById('deleteConfirmText');
  let pendingDeleteId = null;
  let pendingDeleteRow = null; 
  let pendingDeleteType = '';

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
      closeModal(deleteConfirmModal);
      pendingDeleteId = null;
      pendingDeleteRow = null;
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (pendingDeleteType === 'course' && pendingDeleteId) {
        try {
          const { error } = await _supabase.from('courses').delete().eq('id', pendingDeleteId);
          if (error) throw error;
          fetchAdminCourses();
        } catch (err) { console.error('Error syncing course delete', err); }
      } else if (pendingDeleteRow && pendingDeleteType === 'user') {
        // User deletion pendingDeleteRow.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        pendingDeleteRow.style.opacity = '0';
        pendingDeleteRow.style.transform = 'translateX(-20px)';
        setTimeout(() => {
          pendingDeleteRow.remove();
          pendingDeleteRow = null;
        }, 300);
      }
      closeModal(deleteConfirmModal);
    });
  }

  function openDeleteConfirm(row, type, id = null) {
    pendingDeleteRow = row;
    pendingDeleteType = type;
    pendingDeleteId = id;
    
    let name = 'this item';
    if (type === 'course') {
      const course = globalAdminCourses.find(c => c.id == id);
      if(course) name = course.course_code;
    } else {
      name = row.querySelector('td')?.textContent.trim() || 'this item';
    }
    
    if (deleteConfirmText) {
      deleteConfirmText.textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    }
    openModal(deleteConfirmModal);
  }

  // --- Event Delegation for Edit/Delete buttons in Course table ---
  const courseTableBody = document.getElementById('admin-courses-tbody');
  if (courseTableBody) {
    courseTableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.action-btn.edit');
      const deleteBtn = e.target.closest('.action-btn.delete');
      if (editBtn) {
        openEditCourseModal(editBtn.getAttribute('data-dbid'));
      } else if (deleteBtn) {
        openDeleteConfirm(null, 'course', deleteBtn.getAttribute('data-dbid'));
      }
    });
  }

  // --- Manage Mock Tests Environment ---
  let currentCourseTests = [];
  const mockTestSelect = document.getElementById('mockTestCourseSelect');
  const mockTestBuilder = document.getElementById('mockTestBuilder');
  const mockTestList = document.getElementById('mockTestQuestionsList');
  
  if (mockTestSelect) {
    mockTestSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        mockTestBuilder.style.display = 'block';
        loadMockTest(e.target.value);
      } else {
        mockTestBuilder.style.display = 'none';
      }
    });
  }

  function loadMockTest(courseId) {
    const tests = JSON.parse(localStorage.getItem('lms_mock_tests') || '{}');
    currentCourseTests = tests[courseId] || [];
    renderMockTestQuestions();
  }

  function renderMockTestQuestions() {
    if (!mockTestList) return;
    mockTestList.innerHTML = '';
    if (currentCourseTests.length === 0) {
      mockTestList.innerHTML = '<p style="color: #94a3b8; text-align: center;">No questions defined yet. Start adding them mapping !</p>';
    }
    currentCourseTests.forEach((q, idx) => {
      const div = document.createElement('div');
      div.style.cssText = 'padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; display: flex; justify-content: space-between; align-items: flex-start;';
      div.innerHTML = `
        <div>
          <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">Q${idx+1}: ${q.text}</h4>
          <ul style="list-style-position: inside; color: #475569; font-size: 0.9rem;">
            ${q.options.map((opt, i) => `<li style="${i == q.correctAnswer ? 'color: #10b981; font-weight: 600;' : ''}">${opt} ${i == q.correctAnswer ? 'âœ“' : ''}</li>`).join('')}
          </ul>
        </div>
        <button class="btn delete-question" data-idx="${idx}" style="color: #ef4444; background: none; border: none; padding: 0.5rem;"><i data-feather="trash-2" style="width: 18px;"></i></button>
      `;
      mockTestList.appendChild(div);
    });
    if (typeof feather !== 'undefined') feather.replace();

    document.querySelectorAll('.delete-question').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = e.currentTarget.dataset.idx;
        currentCourseTests.splice(i, 1);
        renderMockTestQuestions();
      });
    });
  }

  const saveMockTestBtn = document.getElementById('saveMockTestBtn');
  if (saveMockTestBtn) {
    saveMockTestBtn.addEventListener('click', () => {
      const cid = mockTestSelect.value;
      if(!cid) return;
      const tests = JSON.parse(localStorage.getItem('lms_mock_tests') || '{}');
      tests[cid] = currentCourseTests;
      localStorage.setItem('lms_mock_tests', JSON.stringify(tests));
      alert('Mock Test mapped and saved ');
    });
  }

  const addQuestionModal = document.getElementById('addQuestionModal');
  const openAddQuestionModal = document.getElementById('openAddQuestionModal');
  const closeAddQuestionModal = document.getElementById('closeAddQuestionModal');
  const addQuestionForm = document.getElementById('addQuestionForm');

  if (openAddQuestionModal) openAddQuestionModal.addEventListener('click', () => openModal(addQuestionModal));
  if (closeAddQuestionModal) closeAddQuestionModal.addEventListener('click', () => closeModal(addQuestionModal));

  if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = document.getElementById('qText').value;
      const options = [
        document.getElementById('qOpt0').value,
        document.getElementById('qOpt1').value,
        document.getElementById('qOpt2').value,
        document.getElementById('qOpt3').value
      ];
      const correct = parseInt(document.getElementById('qCorrect').value);
      
      currentCourseTests.push({ id: Date.now(), text, options, correctAnswer: correct });
      renderMockTestQuestions();
      closeModal(addQuestionModal);
      addQuestionForm.reset();
    });
  }

  // --- Users Static Mock ---
  const registerUserModal = document.getElementById('registerUserModal');
  const openRegisterUserBtn = document.getElementById('openRegisterUserModal');
  const closeRegisterUserBtn = document.getElementById('closeRegisterUserModal');
  const registerUserForm = document.getElementById('registerUserForm');

  if (openRegisterUserBtn) openRegisterUserBtn.addEventListener('click', () => openModal(registerUserModal));
  if (closeRegisterUserBtn) closeRegisterUserBtn.addEventListener('click', () => closeModal(registerUserModal));

  if (registerUserForm) {
    registerUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regUserName').value;
      const email = document.getElementById('regUserEmail').value;
      const role = document.getElementById('regUserRole').value;
      const dept = document.getElementById('regUserDept').value;

      const userTableBody = document.querySelector('#admin-users .admin-table tbody');
      if (userTableBody) {
        const tr = document.createElement('tr');
        const roleColor = role === 'Student' ? '#475569' : 'var(--primary-color)';
        tr.innerHTML = `
          <td style="font-weight: 500; color: var(--primary-color);">${name}</td>
          <td>${email}</td>
          <td style="font-weight: 600; color: ${roleColor};">${role}</td>
          <td>${dept}</td>
          <td><span class="admin-status-badge status-active">Active</span></td>
          <td>
            <button class="action-btn edit"><i data-feather="edit-2" style="width: 16px;"></i></button>
            <button class="action-btn delete"><i data-feather="trash-2" style="width: 16px;"></i></button>
          </td>
        `;
        userTableBody.appendChild(tr);
        if (typeof feather !== 'undefined') feather.replace();
      }

      alert('User has been successfully registered.');
      closeModal(registerUserModal);
      registerUserForm.reset();
    });
  }

  const editUserModal = document.getElementById('editUserModal');
  const closeEditUserBtn = document.getElementById('closeEditUserModal');
  const editUserForm = document.getElementById('editUserForm');
  let currentEditUserRow = null;

  if (closeEditUserBtn) closeEditUserBtn.addEventListener('click', () => closeModal(editUserModal));

  function openEditUserModal(row) {
    currentEditUserRow = row;
    const cells = row.querySelectorAll('td');
    document.getElementById('editUserName').value = cells[0].textContent.trim();
    document.getElementById('editUserEmail').value = cells[1].textContent.trim();
    document.getElementById('editUserRole').value = cells[2].textContent.trim();
    document.getElementById('editUserDept').value = cells[3].textContent.trim();
    openModal(editUserModal);
  }

  if (editUserForm) {
    editUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentEditUserRow) return;
      const cells = currentEditUserRow.querySelectorAll('td');
      cells[0].textContent = document.getElementById('editUserName').value;
      cells[1].textContent = document.getElementById('editUserEmail').value;
      cells[2].textContent = document.getElementById('editUserRole').value;
      cells[3].textContent = document.getElementById('editUserDept').value;
      alert('User details updated successfully.');
      closeModal(editUserModal);
      currentEditUserRow = null;
    });
  }

  const userTableBody = document.querySelector('#admin-users .admin-table tbody');
  if (userTableBody) {
    userTableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.action-btn.edit');
      const deleteBtn = e.target.closest('.action-btn.delete');
      if (editBtn) {
        openEditUserModal(editBtn.closest('tr'));
      } else if (deleteBtn) {
        openDeleteConfirm(deleteBtn.closest('tr'), 'user');
      }
    });
  }

  const userSearchInput = document.querySelector('#admin-users .reply-input');
  if (userSearchInput && userTableBody) {
    userSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = userTableBody.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // --- Global Site Configuration Engine ---
  const siteSettingsForm = document.getElementById('siteSettingsForm');
  
  if (siteSettingsForm) {
    // Load existing settings
    async function loadSiteSettings() {
      try {
        const { data, error } = await _supabase.from('site_settings').select('*').limit(1);
        if (!error && data && data.length > 0) {
          const config = data[0];
          if (document.getElementById('settingHeroTitle')) document.getElementById('settingHeroTitle').value = config.hero_title || '';
          if (document.getElementById('settingHeroSub')) document.getElementById('settingHeroSub').value = config.hero_subtitle || '';
          if (document.getElementById('settingNewsTicker') && config.news_ticker) {
            document.getElementById('settingNewsTicker').value = config.news_ticker.join('\n');
          }
          if (document.getElementById('settingContactEmail')) document.getElementById('settingContactEmail').value = config.contact_email || '';
        }
      } catch (err) {
        console.warn('Could not load site settings. Table might not exist yet:', err);
      }
    }
    
    loadSiteSettings();

    siteSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = siteSettingsForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Saving...';
      btn.disabled = true;

      const title = document.getElementById('settingHeroTitle').value;
      const subtitle = document.getElementById('settingHeroSub').value;
      const newsRaw = document.getElementById('settingNewsTicker').value;
      const newsArray = newsRaw.split('\n').filter(n => n.trim() !== '');
      const email = document.getElementById('settingContactEmail').value;

      const newConfig = {
        hero_title: title,
        hero_subtitle: subtitle,
        news_ticker: newsArray,
        contact_email: email,
        updated_at: new Date().toISOString()
      };

      try {
        // Check if row exists first const { data: existing, error: errCheck } = await _supabase.from('site_settings').select('id').limit(1);
        let opError = null;

        if (!errCheck && existing && existing.length > 0) {
          const { error } = await _supabase.from('site_settings').update(newConfig).eq('id', existing[0].id);
          opError = error;
        } else {
          const { error } = await _supabase.from('site_settings').insert([newConfig]);
          opError = error;
        }

        if (opError) throw opError;
        
        alert('Success! Global Site Configuration updated.');
      } catch (err) {
        console.error('Error saving site config:', err);
        alert('Failed to save settings. Please ensure the "site_settings" table exists in your Supabase database.');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }
  
  // --- Analytics Dashobard Injection ---
  fetchAdminDashboardStats();
  async function fetchAdminDashboardStats() {
    try {
      const { count: studentCount } = await _supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'Student');
      const { count: facultyCount } = await _supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['Faculty', 'Admin']);
      const { count: courseCount } = await _supabase.from('courses').select('*', { count: 'exact', head: true });
      const { count: enrollCount } = await _supabase.from('enrollments').select('*', { count: 'exact', head: true });
      
      const stEl = document.getElementById("masterStudentCount");
      const faEl = document.getElementById("masterFacultyCount");
      const coEl = document.getElementById("masterCourseCount");
      const enEl = document.getElementById("masterEnrollCount");
      
      if (stEl) stEl.textContent = studentCount || 0;
      if (faEl) faEl.textContent = facultyCount || 0;
      if (coEl) coEl.textContent = courseCount || 0;
      if (enEl) enEl.textContent = enrollCount || 0;
    } catch(err) {
      console.error("Error evaluating admin metrics bounds", err);
    }
  }

});

