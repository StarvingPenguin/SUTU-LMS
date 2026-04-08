/**
 * SUTU LMS - Complete Grades System
 * Dual-mode: Admin/Faculty (grade entry) & Student (grade viewing)
 * All data from Supabase - no hardcoded dummy data
 */
document.addEventListener('DOMContentLoaded', async () => {
  // ───── User Context ─────
  const userEmail = localStorage.getItem('userEmail') || '';
  const userName  = localStorage.getItem('userName')  || '';
  const userRole  = localStorage.getItem('userRole')  || 'Student';
  const isAdmin   = (userRole === 'Admin' || userRole === 'Faculty');

  // ───── DOM References ─────
  const loader          = document.getElementById('gradesLoader');
  const adminView       = document.getElementById('adminView');
  const studentView     = document.getElementById('studentView');
  const pageHeader      = document.getElementById('gradesPageHeader');
  const toastEl         = document.getElementById('gradesToast');

  // Admin DOM
  const adminCourseSelect = document.getElementById('adminCourseSelect');
  const adminTableWrap    = document.getElementById('adminTableWrap');
  const adminGradesBody   = document.getElementById('adminGradesBody');
  const adminStudentCount = document.getElementById('adminStudentCount');
  const adminCourseLoader = document.getElementById('adminCourseLoader');
  const leaderboardWrap   = document.getElementById('leaderboardWrap');
  const leaderboardBody   = document.getElementById('leaderboardBody');

  // Student DOM
  const studentSemFilter   = document.getElementById('studentSemFilter');
  const studentTableWrap   = document.getElementById('studentTableWrap');
  const studentGradesBody  = document.getElementById('studentGradesBody');
  const studentSubjectCount= document.getElementById('studentSubjectCount');
  const studentEmptyState  = document.getElementById('studentEmptyState');
  const studentChartCard   = document.getElementById('studentChartCard');
  const studentRankSection = document.getElementById('studentRankingSection');
  const rankingCardsGrid   = document.getElementById('rankingCardsGrid');

  // Summary card elements
  const summAvg    = document.getElementById('summAvg');
  const summBest   = document.getElementById('summBest');
  const summPassed = document.getElementById('summPassed');
  const summSGPA   = document.getElementById('summSGPA');

  let marksChartInstance = null;
  let allStudentGrades   = [];

  // ───── Grade Calculation Logic ─────
  function calculateGrade(total) {
    if (total >= 90) return 'O';
    if (total >= 75) return 'A+';
    if (total >= 60) return 'A';
    if (total >= 50) return 'B';
    if (total >= 40) return 'C';
    return 'F';
  }

  function gradeToClass(grade) {
    switch (grade) {
      case 'O':  return 'grade-O';
      case 'A+': return 'grade-Ap';
      case 'A':  return 'grade-A';
      case 'B':  return 'grade-B';
      case 'C':  return 'grade-C';
      case 'F':  return 'grade-F';
      default:   return 'grade-B';
    }
  }

  function gradeToPoints(grade) {
    switch (grade) {
      case 'O':  return 10;
      case 'A+': return 9;
      case 'A':  return 8;
      case 'B':  return 7;
      case 'C':  return 6;
      case 'F':  return 0;
      default:   return 0;
    }
  }

  function gradeFull(grade) {
    switch (grade) {
      case 'O':  return 'Outstanding';
      case 'A+': return 'Excellent';
      case 'A':  return 'Very Good';
      case 'B':  return 'Good';
      case 'C':  return 'Average';
      case 'F':  return 'Fail';
      default:   return '';
    }
  }

  function rankMedal(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  // ───── Toast ─────
  function showToast(msg, type = 'success') {
    if (!toastEl) return;
    toastEl.className = 'grades-toast ' + type;
    toastEl.innerHTML = (type === 'success' ? '✅ ' : '❌ ') + msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3500);
  }

  // ───── Progress bar color ─────
  function progressColor(pct) {
    if (pct >= 90) return '#0d6b3d';
    if (pct >= 75) return '#1a9a52';
    if (pct >= 60) return '#4caf50';
    if (pct >= 50) return '#2196f3';
    if (pct >= 40) return '#f5a623';
    return '#ef4444';
  }

  // ───── Hide loader, show correct view ─────
  function initView() {
    if (loader) loader.style.display = 'none';

    if (isAdmin) {
      // Admin mode header badge
      if (pageHeader) {
        pageHeader.innerHTML = `
          <h1><i data-feather="award"></i> Academy Grades</h1>
          <span class="grades-mode-badge admin">⚙ Admin Mode</span>
        `;
      }
      if (adminView) adminView.style.display = 'block';
      loadAdminCourses();
    } else {
      // Student mode header badge
      if (pageHeader) {
        pageHeader.innerHTML = `
          <h1><i data-feather="award"></i> My Grades</h1>
          <span class="grades-mode-badge student">📊 Student View</span>
        `;
      }
      if (studentView) studentView.style.display = 'block';
      loadStudentGrades();
    }
    feather.replace();
  }

  // ═══════════════════════════════════════════
  //  ADMIN / FACULTY VIEW
  // ═══════════════════════════════════════════

  async function loadAdminCourses() {
    try {
      const { data: courses, error } = await _supabase
        .from('courses')
        .select('*');

      if (error) {
        console.error('Error fetching courses:', error);
        showToast('Failed to load courses', 'error');
        return;
      }

      if (!adminCourseSelect) return;
      adminCourseSelect.innerHTML = '<option value="">— Choose a course —</option>';
      (courses || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.course_name} (${c.course_code})`;
        opt.dataset.name     = c.course_name;
        opt.dataset.code     = c.course_code;
        opt.dataset.semester = c.semester || '';
        adminCourseSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // When admin selects a course
  if (adminCourseSelect) {
    adminCourseSelect.addEventListener('change', async () => {
      const courseId = adminCourseSelect.value;
      if (!courseId) {
        if (adminTableWrap) adminTableWrap.style.display = 'none';
        if (leaderboardWrap) leaderboardWrap.style.display = 'none';
        return;
      }
      await loadEnrolledStudents(courseId);
      await loadLeaderboard(courseId);
    });
  }

  async function loadEnrolledStudents(courseId) {
    if (adminCourseLoader) adminCourseLoader.style.display = 'flex';
    if (adminTableWrap) adminTableWrap.style.display = 'none';

    try {
      // Parse courseId as int to ensure strict matching inside Supabase
      const parsedCourseId = parseInt(courseId, 10);
      
      // Fetch enrollments for this course
      const { data: enrollments, error: enrollErr } = await _supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', parsedCourseId);

      if (enrollErr) {
        console.error('Error fetching enrollments:', enrollErr);
        showToast('Failed to load students', 'error');
        return;
      }

      // Fetch user names and roles from users table
      const { data: allUsers } = await _supabase
        .from('users')
        .select('email, full_name, role');
      const userNameMap = {};
      const userRoleMap = {};
      (allUsers || []).forEach(u => {
        userNameMap[u.email] = u.full_name || u.email.split('@')[0];
        userRoleMap[u.email] = u.role || 'Student'; // Default to student if not set
      });

      // Filter enrollments to strictly include only Students
      const filteredEnrollments = (enrollments || []).filter(enroll => {
        const email = enroll.user_email || '';
        return userRoleMap[email] === 'Student';
      });

      // Fetch existing grades for this course
      const { data: existingGrades, error: gradeErr } = await _supabase
        .from('grades')
        .select('*')
        .eq('course_id', courseId);

      if (gradeErr) console.error('Error fetching grades:', gradeErr);

      // Build a map of existing grades by student_email
      const gradeMap = {};
      (existingGrades || []).forEach(g => {
        gradeMap[g.student_email] = g;
      });

      const selectedOpt = adminCourseSelect.options[adminCourseSelect.selectedIndex];
      const courseName  = selectedOpt.dataset.name || '';
      const courseCode  = selectedOpt.dataset.code || '';
      const semester    = selectedOpt.dataset.semester || '';

      if (adminGradesBody) adminGradesBody.innerHTML = '';
      if (adminStudentCount) adminStudentCount.textContent = filteredEnrollments.length;

      if (!filteredEnrollments || filteredEnrollments.length === 0) {
        if (adminGradesBody) {
          adminGradesBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:3rem; color:#64748b;">No students enrolled in this course yet.</td></tr>`;
        }
      } else {
        filteredEnrollments.forEach(enroll => {
          const email = enroll.user_email || '';
          const name  = userNameMap[email] || email.split('@')[0];
          const existing = gradeMap[email];

          const aMarks = existing ? existing.assignment_marks : 0;
          const iMarks = existing ? existing.internal_marks   : 0;
          const qMarks = existing ? existing.external_marks   : 0;
          const total  = aMarks + iMarks + qMarks;
          const grade  = existing ? (existing.grade || calculateGrade(total)) : calculateGrade(total);

          const tr = document.createElement('tr');
          tr.dataset.email    = email;
          tr.dataset.name     = name;
          tr.dataset.courseId  = courseId;
          tr.dataset.courseName = courseName;
          tr.dataset.courseCode = courseCode;
          tr.dataset.semester   = semester;

          tr.innerHTML = `
            <td style="font-weight:600; color:#1a2a4a;">${escapeHtml(name)}</td>
            <td style="color:#475569; font-size:0.88rem;">${escapeHtml(email)}</td>
            <td>
              <input type="number" class="marks-input" data-type="assignment" min="0" max="5" value="${aMarks}" />
              <div class="marks-max">/ 5</div>
            </td>
            <td>
              <input type="number" class="marks-input" data-type="internal" min="0" max="40" value="${iMarks}" />
              <div class="marks-max">/ 40</div>
            </td>
            <td>
              <input type="number" class="marks-input" data-type="external" min="0" max="60" value="${qMarks}" />
              <div class="marks-max">/ 60</div>
            </td>
            <td><span class="auto-total">${total}</span></td>
            <td><span class="grade-badge ${gradeToClass(grade)}">${grade}</span></td>
            <td><button class="btn-save-grade" onclick="saveStudentGrade(this)">💾 Save</button></td>
          `;

          // Live recalculation on input change
          const inputs = tr.querySelectorAll('.marks-input');
          inputs.forEach(inp => {
            inp.addEventListener('input', () => recalcRow(tr));
          });

          if (adminGradesBody) adminGradesBody.appendChild(tr);
        });
      }

      if (adminTableWrap) adminTableWrap.style.display = 'block';
    } catch (err) {
      console.error(err);
      showToast('Error loading students', 'error');
    } finally {
      if (adminCourseLoader) adminCourseLoader.style.display = 'none';
      feather.replace();
    }
  }

  // Live recalculation of total & grade per row
  function recalcRow(tr) {
    const aInp = tr.querySelector('[data-type="assignment"]');
    const iInp = tr.querySelector('[data-type="internal"]');
    const qInp = tr.querySelector('[data-type="external"]');

    let a = parseInt(aInp.value) || 0;
    let i = parseInt(iInp.value) || 0;
    let q = parseInt(qInp.value) || 0;

    // Validate
    let hasError = false;
    [aInp, iInp, qInp].forEach(inp => inp.classList.remove('error'));

    if (a < 0 || a > 5) { aInp.classList.add('error'); hasError = true; }
    if (i < 0 || i > 40) { iInp.classList.add('error'); hasError = true; }
    if (q < 0 || q > 60) { qInp.classList.add('error'); hasError = true; }

    const total = Math.min(105, a + i + q);
    const grade = calculateGrade(total);

    const totalEl = tr.querySelector('.auto-total');
    const badgeEl = tr.querySelector('.grade-badge');
    if (totalEl) totalEl.textContent = total;
    if (badgeEl) {
      badgeEl.textContent = grade;
      badgeEl.className = 'grade-badge ' + gradeToClass(grade);
    }
  }

  // Save Grade (called from onclick)
  window.saveStudentGrade = async function(btn) {
    const tr = btn.closest('tr');
    const email      = tr.dataset.email;
    const name       = tr.dataset.name;
    const courseId   = parseInt(tr.dataset.courseId);
    const courseName = tr.dataset.courseName;
    const courseCode = tr.dataset.courseCode;
    const semester   = tr.dataset.semester;

    const aInp = tr.querySelector('[data-type="assignment"]');
    const iInp = tr.querySelector('[data-type="internal"]');
    const qInp = tr.querySelector('[data-type="external"]');

    const assignmentVal = parseInt(aInp.value) || 0;
    const internalVal   = parseInt(iInp.value) || 0;
    const quizVal       = parseInt(qInp.value) || 0;

    // Validate
    if (assignmentVal < 0 || assignmentVal > 5) {
      showToast('Assignment marks must be between 0 and 5', 'error');
      aInp.classList.add('error');
      return;
    }
    if (internalVal < 0 || internalVal > 40) {
      showToast('Internal marks must be between 0 and 40', 'error');
      iInp.classList.add('error');
      return;
    }
    if (quizVal < 0 || quizVal > 60) {
      showToast('External marks must be between 0 and 60', 'error');
      qInp.classList.add('error');
      return;
    }

    const totalVal = assignmentVal + internalVal + quizVal;
    const gradeVal = calculateGrade(totalVal);

    btn.classList.add('saving');
    btn.innerHTML = '⏳ Saving...';

    try {
      // Check if grade already exists (maybeSingle avoids 406 when no row found)
      const { data: existing } = await _supabase
        .from('grades')
        .select('id')
        .eq('student_email', email)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existing && existing.id) {
        // Update existing
        const { error: updateErr } = await _supabase
          .from('grades')
          .update({
            assignment_marks: assignmentVal,
            internal_marks: internalVal,
            external_marks: quizVal,
            total_marks: totalVal,
            grade: gradeVal,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateErr) throw updateErr;
      } else {
        // Insert new
        const { error: insertErr } = await _supabase
          .from('grades')
          .insert([{
            student_email: email,
            student_name: name,
            course_id: courseId,
            course_name: courseName,
            course_code: courseCode,
            assignment_marks: assignmentVal,
            internal_marks: internalVal,
            external_marks: quizVal,
            total_marks: totalVal,
            grade: gradeVal,
            semester: semester
          }]);

        if (insertErr) throw insertErr;
      }

      showToast(`Grades saved for ${name}!`, 'success');

      // Refresh leaderboard
      await loadLeaderboard(courseId);

    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save grades. Please try again.', 'error');
    } finally {
      btn.classList.remove('saving');
      btn.innerHTML = '💾 Save';
    }
  };

  // ───── Admin Leaderboard ─────
  async function loadLeaderboard(courseId) {
    try {
      const { data: allGrades, error } = await _supabase
        .from('grades')
        .select('*')
        .eq('course_id', courseId)
        .order('total_marks', { ascending: false });

      if (error) {
        console.error('Leaderboard error:', error);
        return;
      }

      if (!allGrades || allGrades.length === 0) {
        if (leaderboardWrap) leaderboardWrap.style.display = 'none';
        return;
      }

      if (leaderboardBody) leaderboardBody.innerHTML = '';

      allGrades.forEach((g, idx) => {
        const rank = idx + 1;
        const medal = rankMedal(rank);
        const pct = g.total_marks || 0;
        const grade = g.grade || calculateGrade(pct);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            ${medal 
              ? `<span class="rank-medal">${medal}</span>` 
              : `<span class="rank-number">${rank}</span>`
            }
          </td>
          <td style="font-weight:600; color:#1a2a4a;">${escapeHtml(g.student_name || g.student_email)}</td>
          <td><span class="auto-total">${pct}</span><span style="color:#94a3b8; font-size:0.82rem;"> / 100</span></td>
          <td><span class="grade-badge ${gradeToClass(grade)}">${grade}</span></td>
          <td>
            <div class="lb-progress-bar">
              <div class="lb-progress-fill" style="width:${pct}%; background:${progressColor(pct)};"></div>
            </div>
          </td>
        `;
        leaderboardBody.appendChild(tr);
      });

      if (leaderboardWrap) leaderboardWrap.style.display = 'block';
    } catch (err) {
      console.error(err);
    }
  }

  // ═══════════════════════════════════════════
  //  STUDENT VIEW
  // ═══════════════════════════════════════════

  async function loadStudentGrades() {
    try {
      const { data: myGrades, error } = await _supabase
        .from('grades')
        .select('*')
        .eq('student_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading student grades:', error);
        showToast('Failed to load your grades', 'error');
        return;
      }

      allStudentGrades = myGrades || [];

      if (allStudentGrades.length === 0) {
        showStudentEmpty();
      } else {
        renderStudentView(allStudentGrades);
      }

    } catch (err) {
      console.error(err);
    }
  }

  function showStudentEmpty() {
    if (studentTableWrap)  studentTableWrap.style.display = 'none';
    if (studentEmptyState) studentEmptyState.style.display = 'block';
    if (studentEmptyState) studentEmptyState.style.display = 'block';
    // Hide summary values
    if (summAvg) summAvg.textContent = '—';
    if (summBest) summBest.textContent = '—';
    if (summPassed) summPassed.textContent = '—';
    if (summSGPA) summSGPA.textContent = '—';
  }

  function renderStudentView(grades) {
    const semFilter = studentSemFilter ? studentSemFilter.value : '';
    const filtered = semFilter
      ? grades.filter(g => g.semester === semFilter)
      : grades;

    if (filtered.length === 0) {
      showStudentEmpty();
      return;
    }

    // Hide empty, show table
    if (studentEmptyState) studentEmptyState.style.display = 'none';
    if (studentTableWrap)  studentTableWrap.style.display = 'block';

    // Render table
    if (studentGradesBody) studentGradesBody.innerHTML = '';
    if (studentSubjectCount) studentSubjectCount.textContent = filtered.length;

    filtered.forEach(g => {
      const total = g.total_marks || 0;
      const grade = g.grade || calculateGrade(total);
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.title = 'Click to open specific course diagnostics';
      tr.addEventListener('click', () => openCourseInsightsModal(g));
      tr.innerHTML = `
        <td style="font-weight:600; color:var(--primary-color); text-decoration: underline;">${escapeHtml(g.course_name || '—')}</td>
        <td><span style="background:#f1f5f9; padding:0.25rem 0.6rem; border-radius:6px; font-weight:600; font-size:0.85rem; color:#475569;">${escapeHtml(g.course_code || '—')}</span></td>
        <td>${g.assignment_marks || 0}<span style="color:#94a3b8;"> / 5</span></td>
        <td>${g.internal_marks || 0}<span style="color:#94a3b8;"> / 40</span></td>
        <td>${g.external_marks || 0}<span style="color:#94a3b8;"> / 60</span></td>
        <td><span class="auto-total">${total}</span><span style="color:#94a3b8;"> / 100</span></td>
        <td><span class="grade-badge ${gradeToClass(grade)}" title="${gradeFull(grade)}">${grade}</span></td>
      `;
      studentGradesBody.appendChild(tr);
    });

    // Summary calculations
    updateStudentSummary(filtered);
  }

  function openCourseInsightsModal(courseGrade) {
    const modal = document.getElementById('courseInsightsModal');
    if (!modal) return;
    
    document.getElementById('insightsCourseName').textContent = courseGrade.course_name || 'Unknown Course';
    document.getElementById('insightsCourseCode').textContent = courseGrade.course_code || '---';
    
    // Explicitly render single specific course data subset overlaying previous mass array hooks
    const explicitSubset = [courseGrade];
    renderStudentChart(explicitSubset);
    loadStudentRankings(explicitSubset);
    
    modal.style.display = 'flex';
  }

  function updateStudentSummary(grades) {
    if (grades.length === 0) return;

    // Average
    const totalSum = grades.reduce((s, g) => s + (g.total_marks || 0), 0);
    const avg = (totalSum / grades.length).toFixed(1);
    if (summAvg) summAvg.textContent = avg + '%';

    // Best subject
    const best = grades.reduce((a, b) => (b.total_marks || 0) > (a.total_marks || 0) ? b : a, grades[0]);
    if (summBest) {
      const bestName = best.course_name || '—';
      summBest.textContent = bestName.length > 18 ? bestName.substring(0, 16) + '…' : bestName;
      summBest.title = bestName;
    }

    // Passed subjects
    const passed = grades.filter(g => g.grade !== 'F').length;
    if (summPassed) summPassed.textContent = `${passed} / ${grades.length}`;

    // SGPA
    const totalPoints = grades.reduce((s, g) => s + gradeToPoints(g.grade || calculateGrade(g.total_marks || 0)), 0);
    const sgpa = (totalPoints / grades.length).toFixed(2);
    if (summSGPA) summSGPA.textContent = sgpa;
  }

  function renderStudentChart(grades) {
    const canvas = document.getElementById('marksChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = grades.map(g => g.course_name || 'Unknown');
    const assignmentData = grades.map(g => g.assignment_marks || 0);
    const internalData   = grades.map(g => g.internal_marks || 0);
    const externalData   = grades.map(g => g.external_marks || 0);

    if (marksChartInstance) marksChartInstance.destroy();

    marksChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Assignment (30)',
            data: assignmentData,
            backgroundColor: '#1a2a4a',
            borderRadius: 4,
            barPercentage: 0.7
          },
          {
            label: 'Internal (20)',
            data: internalData,
            backgroundColor: '#f5a623',
            borderRadius: 4,
            barPercentage: 0.7
          },
          {
            label: 'External (60)',
            data: externalData,
            backgroundColor: '#4caf50',
            borderRadius: 4,
            barPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 35,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Inter', size: 12 },
              color: '#64748b'
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#475569',
              maxRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              pointStyle: 'rectRounded',
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: '#1a2a4a',
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: 'Poppins', size: 13 },
            bodyFont:  { family: 'Inter', size: 12 }
          }
        }
      }
    });
  }

  // ───── Student Rankings ─────
  async function loadStudentRankings(grades) {
    if (!rankingCardsGrid) return;
    rankingCardsGrid.innerHTML = '';

    // Get unique course IDs from student's grades
    const courseIds = [...new Set(grades.map(g => g.course_id))];

    for (const cId of courseIds) {
      const myGrade = grades.find(g => g.course_id === cId);
      if (!myGrade) continue;

      try {
        const { data: courseRanking, error } = await _supabase
          .from('grades')
          .select('student_email, total_marks')
          .eq('course_id', cId)
          .order('total_marks', { ascending: false });

        if (error) { console.error(error); continue; }
        if (!courseRanking || courseRanking.length === 0) continue;

        const totalStudents = courseRanking.length;
        const myRank = courseRanking.findIndex(r => r.student_email === userEmail) + 1;
        const medal  = rankMedal(myRank);
        const grade  = myGrade.grade || calculateGrade(myGrade.total_marks || 0);

        const card = document.createElement('div');
        card.className = 'ranking-card';
        card.innerHTML = `
          <div class="rc-course">${escapeHtml(myGrade.course_name || '—')}</div>
          <div class="rc-rank">
            ${medal ? `<span style="font-size:1.6rem;">${medal}</span>` : ''}
            #${myRank}
            <span style="font-size:0.85rem; font-weight:500; color:#64748b;"> out of ${totalStudents} student${totalStudents > 1 ? 's' : ''}</span>
          </div>
          <div class="rc-details">
            <span>Total: <strong style="color:#1a2a4a;">${myGrade.total_marks || 0}/100</strong></span>
            <span class="grade-badge ${gradeToClass(grade)}">${grade}</span>
          </div>
        `;
        rankingCardsGrid.appendChild(card);

      } catch (err) {
        console.error(err);
      }
    }
  }

  // Semester filter change
  if (studentSemFilter) {
    studentSemFilter.addEventListener('change', () => {
      if (allStudentGrades.length === 0) {
        showStudentEmpty();
      } else {
        renderStudentView(allStudentGrades);
      }
    });
  }

  // ───── Utility: HTML escape ─────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ───── Initialize ─────
  initView();
});
