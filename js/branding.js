document.addEventListener('DOMContentLoaded', () => {
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // 1. Structural Page Loader logic
  const spinnerHtml = `
    <div id="pageLoader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: opacity 0.5s ease;">
      <div style="width: 50px; height: 50px; border: 4px solid #f1f5f9; border-top-color: #CC0000; border-radius: 50%; animation: sutu-spin 1s linear infinite;"></div>
      <p style="margin-top: 1rem; color: #000000; font-family: 'Poppins', sans-serif; font-weight: 600; letter-spacing: 1px;">SUTU LMS</p>
      <style>
        @keyframes sutu-spin { 
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); } 
        }
      </style>
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', spinnerHtml);

  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.getElementById('pageLoader');
      if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500); 
      }
    }, 1000); 
  });

  // 2. Scroll-to-Top Global Engine
  const scrollTopHtml = `
    <button id="scrollTopBtn" title="Scroll to Top" style="position: fixed; bottom: 30px; right: 30px; width: 45px; height: 45px; background-color: #000000; color: #FFFFFF; border: 2px solid #000000; border-radius: 50%; display: none; justify-content: center; align-items: center; cursor: pointer; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: all 0.3s ease; opacity: 0; transform: translateY(20px);">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
    </button>
  `;

  document.body.insertAdjacentHTML('beforeend', scrollTopHtml);

  const scrollBtn = document.getElementById('scrollTopBtn');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.style.display = 'flex';
      setTimeout(() => {
        scrollBtn.style.opacity = '1';
        scrollBtn.style.transform = 'translateY(0)';
      }, 10);
    } else {
      scrollBtn.style.opacity = '0';
      scrollBtn.style.transform = 'translateY(20px)';
      setTimeout(() => {
        if(window.scrollY <= 300) scrollBtn.style.display = 'none';
      }, 300);
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  scrollBtn.addEventListener('mouseover', () => {
    scrollBtn.style.backgroundColor = '#CC0000';
    scrollBtn.style.borderColor = '#CC0000';
    scrollBtn.style.color = '#FFFFFF';
    scrollBtn.style.transform = 'translateY(-3px)';
  });
  scrollBtn.addEventListener('mouseout', () => {
    scrollBtn.style.backgroundColor = '#000000';
    scrollBtn.style.borderColor = '#000000';
    scrollBtn.style.color = '#FFFFFF';
    scrollBtn.style.transform = 'translateY(0)';
  });

  // User Authentication UI state
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const activeUserName = isLoggedIn ? (localStorage.getItem("userName") || "") : "";
  const activeUserRole = isLoggedIn ? (localStorage.getItem("userRole") || "") : "";

  const userEmail = localStorage.getItem("userEmail") || "";

  const userInitials = activeUserName
    ? activeUserName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "";

  const globalAvatar = userEmail ? localStorage.getItem('sutu_avatar_' + userEmail) : null;

  if (isLoggedIn) {
    document.querySelectorAll(".user-name").forEach(el => el.textContent = activeUserName);
    document.querySelectorAll(".user-avatar").forEach(el => {
      if (globalAvatar) {
        el.innerHTML = `<img src="${globalAvatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        el.textContent = userInitials;
      }
    });
  } else {
    document.querySelectorAll(".user-name").forEach(el => el.textContent = "");
    document.querySelectorAll(".user-avatar").forEach(el => el.textContent = "");
  }

  const welcomeEl = document.getElementById("welcomeUserName");
  if (welcomeEl && isLoggedIn) {
    welcomeEl.textContent = `Welcome back, ${activeUserName}!`;
  }

  const navActions = document.querySelector(".nav-actions");
  
  if (userEmail && navActions && (navActions.querySelector('.btn-outline') || navActions.querySelector('.btn-primary'))) {
    const avatarContent = globalAvatar ? `<img src="${globalAvatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : userInitials;
    navActions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer;" class="user-profile-trigger">
        <span class="user-name" style="color: var(--bg-color); font-weight: 500;">${activeUserName}</span>
        <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--accent-color); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-weight: 700; overflow: hidden;">${avatarContent}</div>
      </div>
    `;
  }

  const userProfileContainers = document.querySelectorAll(".user-profile-trigger");
  userProfileContainers.forEach(container => {
    container.style.cursor = "pointer";
    container.title = "View Profile";
    container.addEventListener("click", () => {
      const isInsidePages = window.location.pathname.includes('/pages/');
      window.location.href = isInsidePages ? 'profile.html' : 'pages/profile.html';
    });
  });

});
