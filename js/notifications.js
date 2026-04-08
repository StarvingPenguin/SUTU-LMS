document.addEventListener('DOMContentLoaded', async () => {

  const notificationBell = document.getElementById('globalNavBell');
  const badge = document.getElementById('navGlobalUnreadCount');
  const dropdown = document.getElementById('globalNotifDropdown');
  const notifList = document.getElementById('globalNotifList');
  const markAllReadBtn = document.getElementById('markAllReadBtn');

  if(!notificationBell || !dropdown || !notifList) return;

  let notificationsDb = [];

  async function fetchRealNotifications() {
    try {
      // Fetch Latest 5 Announcements (Circulars & General)
      const { data: announcements, error } = await _supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (announcements) {
        notificationsDb = announcements.map(ann => {
          let icon = 'bell';
          let color = 'var(--accent-color)';
          let bg = 'var(--accent-light)';

          // Contextual Icons based on Category
          if (ann.category === 'exam') { icon = 'edit'; color = '#ef4444'; bg = '#fee2e2'; }
          else if (ann.category === 'assignment') { icon = 'file-text'; color = '#3b82f6'; bg = '#eff6ff'; }
          else if (ann.category === 'holiday') { icon = 'calendar'; color = '#10b981'; bg = '#ecfdf5'; }
          else if (ann.important) { icon = 'alert-octagon'; color = '#f5a623'; bg = '#fef3c7'; }

          return {
            id: ann.id,
            type: ann.category || "general",
            icon: icon,
            color: color,
            bg: bg,
            isRead: false,
            time: formatNotifTime(ann.created_at),
            message: `<strong>${ann.title}</strong>: ${ann.content.substring(0, 50)}...`
          };
        });
      }
      renderNotifications();
    } catch (err) {
      console.error('Notification fetch error:', err);
      renderNotifications(); 
    }
  }

  function formatNotifTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return date.toLocaleDateString();
  }

  function calculateUnreadCount() {
    if (!badge) return;
    const count = notificationsDb.filter(n => !n.isRead).length;
    if(count > 0) {
      badge.style.display = 'flex';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  }

  function renderNotifications() {
    if (!notifList) return;
    notifList.innerHTML = '';

    if(notificationsDb.length === 0) {
      notifList.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: #94a3b8;">
          <i data-feather="bell-off" style="width: 38px; height: 38px; margin-bottom: 0.75rem; opacity: 0.3;"></i>
          <p style="font-size: 0.9rem;">No new notifications</p>
        </div>
      `;
      if (typeof feather !== 'undefined') feather.replace();
      calculateUnreadCount();
      return;
    }

    notificationsDb.forEach(notif => {
      const notifItem = document.createElement('div');
      notifItem.className = `notif-item ${notif.isRead ? 'is-read' : ''}`;
      notifItem.style.cssText = "display:flex; align-items:flex-start; padding:1.2rem 1rem; border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background 0.2s;";
      
      notifItem.innerHTML = `
        <div class="notif-icon-box" style="background: ${notif.bg}; color: ${notif.color}; padding: 10px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <i data-feather="${notif.icon}" style="width: 18px;"></i>
        </div>
        <div class="notif-content" style="flex: 1; margin-left: 1rem; overflow: hidden;">
          <div class="notif-text" style="font-size: 0.88rem; color: #334155; line-height: 1.4; white-space: normal; word-wrap: break-word;">${notif.message}</div>
          <div class="notif-time" style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.4rem; display: flex; align-items: center; gap: 4px;">
            <i data-feather="clock" style="width: 12px;"></i> ${notif.time}
          </div>
        </div>
      `;

      notifItem.onclick = (e) => {
        notif.isRead = true;
        notifItem.style.opacity = '0.7'; 
        calculateUnreadCount();
        window.location.href = 'announcements.html';
      };

      notifList.appendChild(notifItem);
    });

    if (typeof feather !== 'undefined') feather.replace();
    calculateUnreadCount();
  }

  if (notificationBell) {
    notificationBell.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.classList.toggle('show');
    });
  }

  if(markAllReadBtn) {
    markAllReadBtn.onclick = (e) => {
      e.stopPropagation();
      notificationsDb.forEach(n => n.isRead = true);
      renderNotifications();
    };
  }

  document.addEventListener('click', (e) => {
    if (dropdown && notificationBell && !notificationBell.contains(e.target) && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  });

  fetchRealNotifications();
});
