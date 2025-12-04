// Basic login interactions and password toggle for the admin login page.

document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, root = document) => root.querySelector(sel);

  const passwordToggle = qs('.password-toggle');
  const passwordInput = qs('#password');

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      passwordToggle.classList.toggle('fa-eye');
      passwordToggle.classList.toggle('fa-eye-slash');
    });
  }

  const form = qs('#login-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = qs('#username').value.trim().toLowerCase();
      const password = qs('#password').value.trim();

      // Demo-only credentials check
      if (password === username && (username === 'admin' || username === 'user')) {
        // Redirect to admin dashboard view
        window.location.href = 'admin_dashboard.html';
      } else {
        alert('Invalid credentials. Try "admin" or "user" for both fields.');
      }
    });
  }
});



