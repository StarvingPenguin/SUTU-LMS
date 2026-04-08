document.addEventListener('DOMContentLoaded', () => {

  // 1. Identity
  const userRole = localStorage.getItem("userRole") || "";
  const dynamicUserName = localStorage.getItem("userName") || "";
  // Strict role check — only Admin or Faculty from the database, no name-based heuristics
  const isAdmin = (userRole === "Admin" || userRole === "Faculty");

  const feed = document.getElementById('feedContainer');
  const newBtn = document.getElementById('newAnnouncementBtn');
  const newModal = document.getElementById('newAnnouncementModal');
  const editModal = document.getElementById('editAnnouncementModal');
  const toast = document.getElementById('announcementToast');

  let announcementsDb = [];

  async function loadAnnouncements() {
    const { data, error } = await _supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error loading announcements:", error);
      showToast("Error loading announcements", "#ef4444");
      return;
    }

    if (data && data.length > 0) {
      announcementsDb = data.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category: a.category,
        categoryLabel: a.category.charAt(0).toUpperCase() + a.category.slice(1),
        author: a.author,
        important: a.important,
        date: new Date(a.created_at).toLocaleDateString()
      }));
    } else {
      announcementsDb = [];
    }
    renderFeed('all');
  }

  if (isAdmin && newBtn) newBtn.style.display = 'flex';

  function showToast(msg, bg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = bg;
    toast.style.display = 'flex';
    setTimeout(() => toast.style.display = 'none', 3000);
  }

  function renderFeed(filter = 'all') {
    if (!feed) return;
    feed.innerHTML = '';
    const filtered = filter === 'all' ? announcementsDb : announcementsDb.filter(a => a.category === filter);

    if (filtered.length === 0) {
      feed.innerHTML = '<div style="text-align:center; padding:4rem; color:#94a3b8;">No announcements found.</div>';
      return;
    }

    filtered.forEach(a => {
      const card = document.createElement('div');
      card.className = `announcement-card ${a.important ? 'urgent' : ''}`;
      card.innerHTML = `
        ${a.important ? `<div class="urgent-badge">⚠️ Important</div>` : ''}
        <div class="announcement-header">
          <div>
            <h2 class="announcement-title">${a.title}</h2>
            <div class="announcement-meta">
              <span>📅 ${a.date}</span> | <span>👤 ${a.author}</span>
            </div>
          </div>
          <span class="category-tag tag-${a.category}">${a.categoryLabel}</span>
        </div>
        <div class="announcement-body" style="margin-top:1rem;">${a.content}</div>
        ${isAdmin ? `
          <div style="display:flex; gap:8px; margin-top:12px; justify-content:flex-end;">
            <button class="e-a" data-id="${a.id}" style="border:1px solid #f5a623; color:#f5a623; background:none; padding:4px 12px; border-radius:4px; cursor:pointer;">✏️ Edit</button>
            <button class="d-a" data-id="${a.id}" style="border:1px solid #ef4444; color:#ef4444; background:none; padding:4px 12px; border-radius:4px; cursor:pointer;">🗑️ Delete</button>
          </div>
        ` : ''}
      `;
      feed.appendChild(card);
    });
    if (typeof feather !== 'undefined') feather.replace();
  }

  // Event Delegation for Feed Actions
  if (feed) {
    feed.addEventListener('click', async (e) => {
      const eb = e.target.closest('.e-a');
      const db_btn = e.target.closest('.d-a');

      if (eb) {
        const a = announcementsDb.find(x => x.id == eb.dataset.id);
        if (!a) return;
        editingId = a.id;
        document.getElementById('editAnnTitle').value = a.title;
        document.getElementById('editAnnCategory').value = a.category;
        document.getElementById('editAnnImportant').checked = a.important;
        document.getElementById('editAnnContent').value = a.content;
        editModal.style.display = 'flex';
      } else if (db_btn) {
        if (confirm("Delete this announcement?")) {
          const idToDelete = db_btn.dataset.id;
          const { error } = await _supabase
            .from('announcements')
            .delete()
            .eq('id', idToDelete);
          
          if (error) {
            showToast("Error deleting", "#ef4444");
            return;
          }
          await loadAnnouncements();
          showToast("Announcement Deleted", "#ef4444");
        }
      }
    });
  }

  // Modal behavior
  if (newBtn) newBtn.onclick = () => newModal.style.display = 'flex';

  const closeNewBtn = document.getElementById('closeNewModalBtn');
  const cancelNewBtn = document.getElementById('cancelNewModalBtn');
  const closeEditBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditModalBtn');

  if (closeNewBtn) closeNewBtn.onclick = () => newModal.style.display = 'none';
  if (cancelNewBtn) cancelNewBtn.onclick = () => newModal.style.display = 'none';
  if (closeEditBtn) closeEditBtn.onclick = () => editModal.style.display = 'none';
  if (cancelEditBtn) cancelEditBtn.onclick = () => editModal.style.display = 'none';

  if (newModal) newModal.addEventListener('click', (e) => { if (e.target === newModal) newModal.style.display = 'none'; });
  if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.style.display = 'none'; });

  const newForm = document.getElementById('newAnnouncementForm');
  if (newForm) {
    newForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('newAnnTitle').value;
      const category = document.getElementById('newAnnCategory').value;
      const important = document.getElementById('newAnnImportant').checked;
      const content = document.getElementById('newAnnContent').value;

      const { error } = await _supabase
        .from('announcements')
        .insert([{
          title: title,
          content: content,
          category: category,
          author: dynamicUserName,
          important: important
        }]);

      if (error) {
        showToast("Error posting", "#ef4444");
        return;
      }

      await loadAnnouncements();
      newModal.style.display = 'none';
      newForm.reset();
      showToast("Announcement Published", "#10b981");
    };
  }

  let editingId = null;
  const editForm = document.getElementById('editAnnouncementForm');
  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('editAnnTitle').value;
      const category = document.getElementById('editAnnCategory').value;
      const important = document.getElementById('editAnnImportant').checked;
      const content = document.getElementById('editAnnContent').value;

      const { error } = await _supabase
        .from('announcements')
        .update({
          title: title,
          content: content,
          category: category,
          important: important
        })
        .eq('id', editingId);

      if (error) {
        showToast("Error updating", "#ef4444");
        return;
      }

      await loadAnnouncements();
      editModal.style.display = 'none';
      showToast("Announcement Updated", "#10b981");
    };
  }

  document.querySelectorAll('.filter-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderFeed(b.dataset.filter);
    };
  });

  // Initial Load
  loadAnnouncements();
});
