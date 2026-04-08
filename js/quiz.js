document.addEventListener('DOMContentLoaded', () => {

  const quizEngineView = document.getElementById('quizEngineView');
  const resultsView = document.getElementById('resultsView');
  
  // Timer 
  const timerDisplay = document.getElementById('timerDisplay');
  let timeLeft = 30 * 60; // 30 minutes in seconds
  let timerInterval = null;

  // Quiz Navigation / Display
  const questionCounterText = document.getElementById('questionCounterText');
  const questionText = document.getElementById('questionText');
  const optionsList = document.getElementById('optionsList');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  // Sidebar Palette
  const paletteGrid = document.getElementById('paletteGrid');
  
  // Submission Modals
  const submitInitBtn = document.getElementById('submitInitBtn');
  const confirmModal = document.getElementById('confirmModal');
  const closeModalBtn = document.getElementById('cancelSubmitBtn');
  const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
  const unansweredCountDisplay = document.getElementById('unansweredCountDisplay');
  
  // Results
  const finalScoreVal = document.getElementById('finalScoreVal');
  const scoreMessage = document.getElementById('scoreMessage');
  const reviewContainer = document.getElementById('reviewContainer');

  // SUTU explicit Academic JSON Database mapping
  let questionsDb = [];
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('course');
  
  if (courseId) {
    const tests = JSON.parse(localStorage.getItem('lms_mock_tests') || '{}');
    if (tests[courseId] && tests[courseId].length > 0) {
      questionsDb = tests[courseId];
    } else {
      alert('No Mock Test mapping exists for this course.');
      window.location.href = 'dashboard.html';
    }
  } else {
    alert('Missing course mapping.');
    window.location.href = 'dashboard.html';
  }

  let currentQuestionIndex = 0;
  const userAnswers = new Array(questionsDb.length).fill(null);
  const visitStates = new Array(questionsDb.length).fill('unvisited'); // 'unvisited', 'skipped', 'answered'
  if (questionsDb.length > 0) visitStates[0] = 'skipped'; // First question structurally visited initially 

  // Logic initializing the Grid 
  function renderPalette() {
    paletteGrid.innerHTML = '';
    for (let i = 0; i < questionsDb.length; i++) {
      const btn = document.createElement('button');
      btn.className = `palette-btn ${i === currentQuestionIndex ? 'active-q' : ''}`;
      btn.textContent = i + 1;
      
      // Map explicitly colors tracing state 
      if (visitStates[i] === 'answered') {
        btn.classList.add('answered');
      } else if (visitStates[i] === 'skipped' && i !== currentQuestionIndex) {
        btn.classList.add('skipped');
      }

      btn.addEventListener('click', () => {
        goToQuestion(i);
      });

      paletteGrid.appendChild(btn);
    }
  }

  // Load active query into DOM
  function loadQuestion(index) {
    const q = questionsDb[index];
    questionCounterText.textContent = `Question ${index + 1} of ${questionsDb.length}`;
    questionText.textContent = `${index + 1}. ${q.text}`;

    optionsList.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const optBox = document.createElement('div');
      // Retain selected visual logic 
      const isSelected = userAnswers[index] === idx;
      optBox.className = `option-box ${isSelected ? 'selected' : ''}`;
      
      optBox.innerHTML = `
        <input type="radio" name="q_option" value="${idx}" ${isSelected ? 'checked' : ''}>
        <label style="flex: 1; cursor: inherit;">${opt}</label>
      `;

      optBox.addEventListener('click', () => {
        // Remove selected native from siblings
        Array.from(optionsList.children).forEach(child => child.classList.remove('selected'));
        optBox.classList.add('selected');
        optBox.querySelector('input').checked = true;
        
        // Track internally actively instantaneously 
        userAnswers[index] = idx;
        visitStates[index] = 'answered';
        renderPalette(); // Update grid visually synchronously
        });

      optionsList.appendChild(optBox);
    });

    // Toggle nav 
    prevBtn.disabled = index === 0;
    prevBtn.style.opacity = index === 0 ? '0.5' : '1';
    
    if (index === questionsDb.length - 1) {
      nextBtn.innerHTML = `Submit Assessment <i data-feather="check" style="width: 16px; margin-left: 0.5rem;"></i>`;
    } else {
      nextBtn.innerHTML = `Next <i data-feather="arrow-right" style="width: 16px; margin-left: 0.5rem;"></i>`;
    }
    
    feather.replace();
  }

  function goToQuestion(index) {
    // Log current natively if skipped structurally logic 
    if (visitStates[currentQuestionIndex] !== 'answered') {
      visitStates[currentQuestionIndex] = 'skipped';
    }

    currentQuestionIndex = index;
    
    if (visitStates[currentQuestionIndex] === 'unvisited') {
      visitStates[currentQuestionIndex] = 'skipped'; // Logs as visited 
    }

    loadQuestion(currentQuestionIndex);
    renderPalette();
  }

  // Hook navigational states 
  prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < questionsDb.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    } else {
      // Hit Submit 
      initSubmission();
    }
  });

  submitInitBtn.addEventListener('click', initSubmission);

  function initSubmission() {
    const unanswered = userAnswers.filter(ans => ans === null).length;
    unansweredCountDisplay.textContent = unanswered;
    confirmModal.style.display = 'flex';
  }

  closeModalBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
  });

  confirmSubmitBtn.addEventListener('click', finalizeQuiz);

  // Timer logic explicit native interval math cleanly structuring
  function updateTimer() {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finalizeQuiz(); // Auto submit
      return;
    }

    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    
    timerDisplay.innerHTML = `<i data-feather="clock" style="width: 18px;"></i> ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 300) { // Under 5 minutes left
      timerDisplay.classList.add('warning');
    }
    
    feather.replace();
    timeLeft--;
  }

  function finalizeQuiz() {
    clearInterval(timerInterval);
    confirmModal.style.display = 'none';
    quizEngineView.style.display = 'none';
    
    // Hide top bar functionally native
    document.querySelector('.quiz-top-bar').style.display = 'none';

    // Assess mapping calculations 
    let score = 0;
    reviewContainer.innerHTML = '';

    questionsDb.forEach((q, idx) => {
      const uAns = userAnswers[idx];
      const isCorrect = uAns === q.correctAnswer;
      
      if (isCorrect) score++;

      // Evaluate explicitly status parameters structurally Native Visual DOM 
      let statusClass = 'status-unanswered';
      let statusText = 'Not Attempted';
      if (uAns !== null) {
        if (isCorrect) {
          statusClass = 'status-correct';
          statusText = 'Correct (+1)';
        } else {
          statusClass = 'status-wrong';
          statusText = 'Incorrect (0)';
        }
      }

      const itemDiv = document.createElement('div');
      itemDiv.className = 'review-item';
      
      let optionsHtml = '';
      q.options.forEach((opt, optIdx) => {
        let optClass = '';
        let icon = '';
        
        if (optIdx === q.correctAnswer) {
          optClass = 'correct-ans';
          icon = '<i data-feather="check-circle" style="color:#10b981; width:18px;"></i> ';
        } else if (uAns === optIdx && !isCorrect) {
          optClass = 'wrong-ans';
          icon = '<i data-feather="x-circle" style="color:#ef4444; width:18px;"></i> ';
        } else {
          icon = '<i data-feather="circle" style="color:#cbd5e1; width:18px;"></i> ';
        }

        optionsHtml += `<div class="review-option ${optClass}">${icon} ${opt}</div>`;
      });

      itemDiv.innerHTML = `
        <div class="review-header">
          <span style="font-weight: 600; color: var(--primary-color);">Q${idx + 1}. ${q.text}</span>
          <span class="review-status ${statusClass}">${statusText}</span>
        </div>
        <div>${optionsHtml}</div>
      `;
      
      reviewContainer.appendChild(itemDiv);
    });

    // Morph Scorecard explicitly Native calculations 
    finalScoreVal.textContent = score;
    if (score >= 8) {
      scoreMessage.textContent = "Outstanding Performance! You've mastered Normalization.";
    } else if (score >= 5) {
      scoreMessage.textContent = "Good attempt. Review the incorrectly mapped dependencies to improve further natively.";
    } else {
      scoreMessage.textContent = "Fail threshold reached. You explicitly need to revisit the DB structural lecture modules.";
    }

    resultsView.style.display = 'block';
    
    // Save score to local storage for the student
    try {
      const courseId = new URLSearchParams(window.location.search).get('course') || 'DB304';
      const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
      quizResults.push({
        course: courseId,
        score: score,
        total: questionsDb.length,
        date: new Date().toISOString()
      });
      localStorage.setItem('quizResults', JSON.stringify(quizResults));
    } catch (e) { console.error('Error saving quiz result', e); }

    feather.replace();
  }

  // Init Execution Explicit System Logic 
  loadQuestion(0);
  renderPalette();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

});

