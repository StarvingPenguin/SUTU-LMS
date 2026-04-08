document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');

  // Form Inputs
  const fullName = document.getElementById('fullName');
  const enrollmentNo = document.getElementById('enrollmentNo');
  const email = document.getElementById('email');
  const department = document.getElementById('department');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  const errorSummary = document.getElementById('errorSummary');

  // Error message containers
  const nameError = document.getElementById('nameError');
  const enrollmentError = document.getElementById('enrollmentError');
  const emailError = document.getElementById('emailError');
  const departmentError = document.getElementById('departmentError');
  const roleError = document.getElementById('roleError');
  const passwordError = document.getElementById('passwordError');
  const confirmError = document.getElementById('confirmError');

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      let isValid = true;

      // 1. Reset visual error states
      document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
      errorSummary.style.display = 'none';
      const textInputs = [fullName, enrollmentNo, email, department, password, confirmPassword];
      textInputs.forEach(input => {
        if (input) input.style.borderColor = '#cbd5e1';
      });

      // 2. Validate Full Name
      if (fullName.value.trim() === '') {
        showError(fullName, nameError, 'Full Name is required.');
        isValid = false;
      }

      // 3. Validate ID (Enrollment Number for Students, Employee ID for others)
      const enrollVal = enrollmentNo.value.trim();
      const selectedRoleEl = document.querySelector('input[name="role"]:checked');
      const role = selectedRoleEl ? selectedRoleEl.value : 'Student';
      const idTerm = (role === 'Student') ? 'Enrollment Number' : 'Employee ID';

      if (enrollVal === '') {
        showError(enrollmentNo, enrollmentError, `${idTerm} is required.`);
        isValid = false;
      } else if (role === 'Student' && enrollVal.length !== 10) {
        showError(enrollmentNo, enrollmentError, 'Student Enrollment Number must be exactly 10 characters.');
        isValid = false;
      } else if (role !== 'Student' && enrollVal.length < 3) {
        showError(enrollmentNo, enrollmentError, 'Employee ID must be at least 3 characters.');
        isValid = false;
      }

      // 4. Validate Email Configuration
      const emailVal = email.value.trim();
      if (emailVal === '') {
        showError(email, emailError, 'Email Address is required.');
        isValid = false;
      } else if (!isValidEmail(emailVal)) {
        showError(email, emailError, 'Please provide a valid email structure.');
        isValid = false;
      }

      // 5. Validate Department Selection
      if (department.value === '') {
        showError(department, departmentError, 'Please select a valid department from the dropdown.');
        isValid = false;
      }

      // 6. Validate Role (Radio Buttons)
      const roles = document.getElementsByName('role');
      let roleSelected = false;
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].checked) {
          roleSelected = true;
          break;
        }
      }
      if (!roleSelected) {
        roleError.textContent = 'Please choose either Student or Faculty.';
        roleError.style.display = 'block';
        isValid = false;
      }

      // 7. Validate Passwords
      const passVal = password.value.trim();
      if (passVal === '') {
        showError(password, passwordError, 'A secure password is required.');
        isValid = false;
      } else if (passVal.length < 6) {
        showError(password, passwordError, 'Password should be at least 6 characters.');
        isValid = false;
      }

      // 8. Validate Consistence of Confirm Password
      const confirmVal = confirmPassword.value.trim();
      if (confirmVal === '') {
        showError(confirmPassword, confirmError, 'Please verify your password.');
        isValid = false;
      } else if (passVal !== confirmVal) {
        showError(confirmPassword, confirmError, 'The passwords do not match. Please re-type.');
        isValid = false;
      }

      // Conclude Submission Flow
      if (!isValid) {
        e.preventDefault(); // Stop if any errors
        errorSummary.style.display = 'block';
      } else {
        e.preventDefault();

        // Read and strictly evaluate Extended System Node properties cleanly mapping 

        const selectedRoleEl = document.querySelector('input[name="role"]:checked');
        const selectedRoleTag = selectedRoleEl ? selectedRoleEl.value : 'Student';
        const deptValue = document.getElementById('department').value || 'General';
        const enrollNum = document.getElementById('enrollmentNo').value.trim() || 'N/A';
        const passValRaw = password.value.trim();
        const emailValRaw = email.value.trim();
        const nameValRaw = fullName.value.trim();

        // Inserting into Supabase users table 
        _supabase.from('users').insert([{
          full_name: nameValRaw,
          email: emailValRaw,
          password: passValRaw,
          role: selectedRoleTag,
          department: deptValue,
          enrollment_number: enrollNum
        }]).then(({ error }) => {
          if (error) {
            errorSummary.textContent = "Registration failed: " + error.message;
            errorSummary.style.display = 'block';
            return;
          }
          // Persisting user context 
          localStorage.setItem("userName", nameValRaw);
          localStorage.setItem("userEmail", emailValRaw);
          localStorage.setItem("userRole", selectedRoleTag);
          localStorage.setItem("userDepartment", deptValue);
          localStorage.setItem("userEnrollment", enrollNum);

          window.location.href = 'login.html';
        });
      }
    });
  }

  // Helper: Standard UI display for Input level validation issue
  function showError(inputElement, errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    if (inputElement) {
      inputElement.style.borderColor = '#ef4444'; // Draw red highlight box
    }
  }

  // Helper: Basic robust structural Email pattern matcher
  function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }
});
