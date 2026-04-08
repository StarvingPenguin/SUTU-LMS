document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  
  // Conditionally inject Admin Sidebar if user is Admin and NOT on admin.html
  const role = localStorage.getItem('userRole') || '';
  const isAdmin = role === 'Admin' || role === 'Faculty';
  const isInsideAdminPage = window.location.pathname.includes('admin.html');
  const sidebarNav = document.querySelector('.sidebar-nav');
  
  if (isAdmin && sidebarNav && !isInsideAdminPage) {
    sidebarNav.innerHTML = `
      <li><a href="admin.html?target=admin-dashboard"><i data-feather="monitor" style="margin-right: 12px; width: 20px;"></i> <span>Dashboard Overview</span></a></li>
      <li><a href="admin.html?target=admin-users"><i data-feather="users" style="margin-right: 12px; width: 20px;"></i> <span>Manage Users</span></a></li>
      <li><a href="admin.html?target=admin-courses"><i data-feather="book" style="margin-right: 12px; width: 20px;"></i> <span>Manage Courses</span></a></li>
      <li><a href="admin.html?target=admin-announcements"><i data-feather="bell" style="margin-right: 12px; width: 20px;"></i> <span>Notifications</span></a></li>
      <li><a href="admin.html?target=admin-mock-tests"><i data-feather="edit-3" style="margin-right: 12px; width: 20px;"></i> <span>Manage Mock Tests</span></a></li>
      <li><a href="doubts.html" class="${window.location.pathname.includes('doubts.html') ? 'active' : ''}"><i data-feather="help-circle" style="margin-right: 12px; width: 20px;"></i> <span>Doubt Sessions</span></a></li>
      <li><a href="forum.html" class="${window.location.pathname.includes('forum.html') ? 'active' : ''}"><i data-feather="message-square" style="margin-right: 12px; width: 20px;"></i> <span>Discussion Forums</span></a></li>
      <li><a href="admin.html?target=admin-settings"><i data-feather="sliders" style="margin-right: 12px; width: 20px;"></i> <span>Site Settings</span></a></li>
      <li><a href="admin.html?target=admin-reports"><i data-feather="file-text" style="margin-right: 12px; width: 20px;"></i> <span>System Reports</span></a></li>
      <li style="margin-top: 3rem;"><a href="javascript:void(0);" onclick="localStorage.clear(); window.location.href='../index.html';" style="color: #ef4444;"><i data-feather="log-out" style="margin-right: 12px; width: 20px;"></i> <span>Secure Logout</span></a></li>
    `;
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  // Check for saved state
  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (isCollapsed && sidebar) {
    sidebar.classList.add('collapsed');
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const nowCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', nowCollapsed);
      
      // Re-run feather icons to ensure any dynamically changed icons are correctly rendered
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    });
  }
});
