document.addEventListener('DOMContentLoaded', () => {

  const userName = localStorage.getItem("userName") || "Student";
  const userRole = localStorage.getItem("userRole") || "Student";
  const userEmail = localStorage.getItem("userEmail");
  // Strict role check — only Admin or Faculty from the database
  const isAdmin = (userRole === "Admin" || userRole === "Faculty");

  const listPanel = document.querySelector('.assignments-list-panel');
  const newBtn = document.getElementById('adminNewAssignmentBtn');
  const detailEmpty = document.getElementById('detailEmptyState');
  const detailContent = document.getElementById('detailContent');
  const submissionArea = document.getElementById('submissionArea');
  const submissionSuccess = document.getElementById('submissionSuccess');
  const alreadySubmitted = document.getElementById('alreadySubmittedView');
  
  const vTitle = document.getElementById('viewTitle');
  const vSubject = document.getElementById('viewSubject');
  const vDue = document.getElementById('viewDueDate');
  const vDesc = document.getElementById('viewDescription');

  const fileInput = document.getElementById('fileUpload');
  const nameDisplay = document.getElementById('fileNameDisplay');
  const subForm = document.getElementById('submissionForm');
  const timeSpan = document.getElementById('timestamp');

  let db = [];
  let activeId = null;

  const urlParams = new URLSearchParams(window.location.search);
  const filterCourseId = urlParams.get('course');

  // 1. Fetch assignments for logged-in user async function loadAssignments() {
    if (!userEmail) return;
    
    let query = _supabase
      .from('assignments')
      .select('*');
    
    if (filterCourseId) {
      query = query.eq('course_id', filterCourseId);
    }

    const { data: assignments, error } = await query.order('id', { ascending: false });

    if (error) {
      console.error("Error loading assignments:", error);
      return;
    }

    // Fetch CURRENT student's submissions to differentiate personal progress
    const { data: mySubmissions } = await _supabase
      .from('submissions')
      .select('assignment_id')
      .eq('student_email', userEmail);

    const submittedIds = (mySubmissions || []).map(s => s.assignment_id);

    db = assignments.map(a => ({
      ...a,
      isUserSubmitted: submittedIds.includes(parseInt(a.id)) || submittedIds.includes(a.id.toString())
    })) || [];

    renderList();
  }

  if (isAdmin && newBtn) newBtn.style.display = 'flex';

  function renderList() {
    if (!listPanel) return;
    listPanel.innerHTML = '';

    if (db.length === 0) {
      listPanel.innerHTML = '<div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.4);">No assignments yet. Check back later.</div>';
      return;
    }

    db.forEach(a => {
      const card = document.createElement('div');
      
      // Student View: Badge depends on THEIR submission
      // Admin View: Badge shows Master Status
      let currentStatus = a.status || 'Pending';
      if (!isAdmin) {
        currentStatus = a.isUserSubmitted ? 'Submitted' : 'Pending';
      }
      
      const statusClass = currentStatus.toLowerCase();

      card.className = `assignment-card ${statusClass} ${a.id === activeId ? 'active' : ''}`;
      card.dataset.id = a.id;
      
      card.innerHTML = `
        <div class="assignment-header">
          <div class="assignment-title">${a.title}</div>
          <span class="status-badge status-${statusClass}">${currentStatus}</span>
        </div>
        <div class="assignment-subject">${a.subject}</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="due-date ${statusClass === 'overdue' ? 'overdue-text' : ''}"><i data-feather="calendar" style="width:14px;"></i> ${a.due || a.due_date || 'No Date'}</span>
          ${isAdmin ? `<button class="del-a" data-id="${a.id}" style="background:none; border:none; cursor:pointer;" title="Delete">🗑️</button>` : ''}
        </div>
      `;
      listPanel.appendChild(card);
    });
    if (typeof feather !== 'undefined') feather.replace();
  }

  if (listPanel) {
    listPanel.addEventListener('click', async (e) => {
      const dc = e.target.closest('.del-a');
      if (dc) {
        if (confirm("Delete this assignment?")) {
          const idToDelete = dc.dataset.id;
          const { error } = await _supabase.from('assignments').delete().eq('id', idToDelete);
          if (error) { alert("Error deleting assignment"); return; }
          db = db.filter(x => x.id != idToDelete);
          renderList();
          detailContent.style.display = 'none'; 
          detailEmpty.style.display = 'flex';
        }
        return;
      }

      const card = e.target.closest('.assignment-card');
      if (!card) return;
      
      activeId = card.dataset.id;
      const a = db.find(x => x.id == activeId);
      if (!a) return;

      renderList(); 
      detailEmpty.style.display = 'none';
      detailContent.style.display = 'block';
      
      const isSubmitted = a.isUserSubmitted;
      submissionArea.style.display = !isSubmitted ? 'block' : 'none';
      alreadySubmitted.style.display = isSubmitted ? 'block' : 'none';
      submissionSuccess.style.display = 'none';
      
      vTitle.textContent = a.title;
      vSubject.innerHTML = `<i data-feather="book"></i> ${a.subject}`;
      vDue.innerHTML = `<i data-feather="calendar"></i> Due: ${a.due_at || a.due || a.due_date || 'N/A'}`;
      vDesc.textContent = a.desc || a.description || 'Instructions';
      if (typeof feather !== 'undefined') feather.replace();
    });
  }

  if (fileInput) {
    fileInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        nameDisplay.textContent = 'Selected: ' + e.target.files[0].name;
        nameDisplay.style.display = 'block';
      } else nameDisplay.style.display = 'none';
    }
  }

  if (subForm) {
    subForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!fileInput.files.length) { alert("Please attach a file."); return; }
      
      // 2. Track specific student's submission in 'submissions' table
      const { error: subError } = await _supabase
        .from('submissions')
        .upsert([{
          assignment_id: activeId,
          student_email: userEmail,
          submitted_at: new Date().toISOString(),
          file_name: fileInput.files[0].name
        }], { onConflict: 'assignment_id,student_email' });

      if (subError) {
        alert("Submission failed: " + subError.message);
        return;
      }

      submissionArea.style.display = 'none';
      submissionSuccess.style.display = 'block';
      timeSpan.textContent = new Date().toLocaleString();
      
      const a = db.find(x => x.id == activeId);
      if (a) {
        a.isUserSubmitted = true;
        renderList();
      }
    };
  }

  if (newBtn) {
    newBtn.onclick = async () => {
      const title = prompt("Assignment Title:");
      const sub = prompt("Subject:");
      const due = prompt("Due Date (ISO format or e.g., 2026-12-31):");
      const desc = prompt("Short Description:");
      const targetEmail = prompt("Assign to student email:", userEmail);
      
      if (title && sub && due) {
        const newAssn = { 
          title, 
          subject: sub, 
          due: due, 
          status: 'Pending', 
          description: desc || 'Instructions',
          user_email: targetEmail
        };
        
        try {
          const { data, error } = await _supabase.from('assignments').insert([newAssn]).select();
          if (error) { 
            alert("Error creating assignment: " + error.message); 
            console.error(error);
            return; 
          }
          if (data && data[0]) {
            db.unshift(data[0]);
            renderList();
          }
        } catch (err) {
          alert("Critical error creating assignment.");
          console.error(err);
        }
      }
    }
  }

  // Initial Load
  loadAssignments();
});
