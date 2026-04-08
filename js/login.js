document.addEventListener('DOMContentLoaded', () => {
  const loginForm    = document.getElementById('loginForm');
  const emailInput   = document.getElementById('email');
  const passwordInput  = document.getElementById('password');
  const emailError   = document.getElementById('emailError');
  const passwordError  = document.getElementById('passwordError');
  const errorSummary  = document.getElementById('errorSummary');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const loginTypeField = document.getElementById('loginType'); // 'student' | 'admin'

  // ── Toggle Password Visibility ──────────────────────────────────────────
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
    });
  }

  // Helper: show error
  function showError(input, errorEl, msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
    if (input)  { input.style.borderColor = '#ef4444'; }
  }

  // Helper: reset all error displays
  function resetErrors() {
    [emailError, passwordError].forEach(el => { if (el) el.style.display = 'none'; });
    if (errorSummary) errorSummary.style.display = 'none';
    [emailInput, passwordInput].forEach(el => { if (el) el.style.borderColor = '#cbd5e1'; });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ── Form Submit ─────────────────────────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      resetErrors();
      let isValid = true;

      const emailValue = emailInput.value.trim();
      const passValue = passwordInput.value.trim();
      const loginMode = loginTypeField ? loginTypeField.value : 'student'; // 'student' or 'admin'

      // Validate Email
      if (!emailValue) {
        showError(emailInput, emailError, 'Email is required.');
        isValid = false;
      } else if (!isValidEmail(emailValue)) {
        showError(emailInput, emailError, 'Please enter a valid email address.');
        isValid = false;
      }

      // Validate Password
      if (!passValue) {
        showError(passwordInput, passwordError, 'Password is required.');
        isValid = false;
      }

      if (!isValid) {
        if (errorSummary) {
          errorSummary.textContent = 'Please fix the errors below before continuing.';
          errorSummary.style.display = 'block';
        }
        return;
      }

      // ── Supabase Query ────────────────────────────────────────────
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Authenticating...'; }

      try {
        // Fetch ALL matching email+password records (role checked below)
        const { data: users, error } = await _supabase
          .from('users')
          .select('*')
          .eq('email', emailValue)
          .eq('password', passValue);

        if (error) throw error;

        const user = users && users[0];

        if (!user) {
          if (errorSummary) {
            errorSummary.textContent = 'Invalid email or password. Please try again.';
            errorSummary.style.display = 'block';
          }
          return;
        }

        const role = user.role || 'Student';

        // ── Role / Mode Enforcement ───────────────────────────────
        const isAdminRole  = (role === 'Admin' || role === 'Faculty');
        const isStudentRole = (role === 'Student');

        if (loginMode === 'admin' && !isAdminRole) {
          if (errorSummary) {
            errorSummary.textContent = '⛔ Access denied. This portal is for Admin/Faculty only. Please use the Student Login tab.';
            errorSummary.style.display = 'block';
          }
          return;
        }

        if (loginMode === 'student' && !isStudentRole) {
          if (errorSummary) {
            errorSummary.textContent = '⛔ Access denied. Please use the Admin Login tab for staff accounts.';
            errorSummary.style.display = 'block';
          }
          return;
        }

        // ── Persist Session ───────────────────────────────────────
        localStorage.setItem('isLoggedIn',   'true');
        localStorage.setItem('userName',    user.full_name || 'User');
        localStorage.setItem('userEmail',    user.email);
        localStorage.setItem('userRole',    role);
        localStorage.setItem('userDepartment', user.department || '');
        localStorage.setItem('userEnrollment', user.enrollment_number || user.enrollment_no || '');

        // ── Redirect by Role ──────────────────────────────────────
        if (isAdminRole) {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }

      } catch (err) {
        console.error('Login error:', err);
        if (errorSummary) {
          errorSummary.textContent = 'A network or server error occurred. Please try again.';
          errorSummary.style.display = 'block';
        }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
      }
    });
  }
});
