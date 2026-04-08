document.addEventListener('DOMContentLoaded', () => {

  // 1. Navbar Hamburger Toggle Engine conditionally injecting mobile parameters
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelector('.nav-links');
  
  if (navbar && navLinks) {
    // Construct native CSS-styled toggle 
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-nav-toggle';
    toggleBtn.innerHTML = '<i data-feather="menu" style="width:28px; height:28px;"></i>';
    
    // Insert immediately after the Logo 
    const logo = navbar.querySelector('.logo');
    if(logo) {
      navbar.insertBefore(toggleBtn, logo.nextSibling);
    } else {
      navbar.insertBefore(toggleBtn, navLinks);
    }
    
    // State interaction 
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      
      // Sync actions visibility (like Bell icon + Profile) manually 
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        if (navLinks.classList.contains('active')) {
          navActions.style.display = 'flex';
        } else {
          navActions.style.display = ''; // Fallback to CSS rules 
        }
      }
    });
  }

  // 2. Global Dashboard Sidebar Native Toggle 
  const dashboardContainer = document.querySelector('.dashboard-container');
  const sidebar = document.querySelector('.sidebar');
  
  if (dashboardContainer && sidebar) {
    // Build Mobile Sidebar Interceptor 
    const sideToggleBtn = document.createElement('button');
    sideToggleBtn.className = 'mobile-sidebar-toggle';
    sideToggleBtn.innerHTML = '<i data-feather="layout"></i> Navigation Dashboard Menu';
    
    // Position at the absolute upper domain of the grid 
    dashboardContainer.insertBefore(sideToggleBtn, dashboardContainer.firstChild);
    
    sideToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Force post-injection Feather SVG mapping functionally 
  if(typeof feather !== 'undefined') {
    feather.replace();
  }

  // 3. Global Reveal-on-Scroll Engine for animations
  function reveal() {
    var reveals = document.querySelectorAll('.reveal');
    for (var i = 0; i < reveals.length; i++) {
      var windowHeight = window.innerHeight;
      var elementTop = reveals[i].getBoundingClientRect().top;
      var elementVisible = 50; 
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add('active');
      }
    }
  }
  window.addEventListener('scroll', reveal);
  
  // Use interval to handle dynamic content loads 
  setInterval(reveal, 500);
  reveal();
});
