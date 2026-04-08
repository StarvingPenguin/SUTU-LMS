document.addEventListener('DOMContentLoaded', () => {
  const dynamicUserName = localStorage.getItem("userName") || "Student";
  const dynamicUserInitials = dynamicUserName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const userRole = localStorage.getItem("userRole") || "Student";
  const isAdmin = (userRole === "Admin") || dynamicUserName.toLowerCase().includes("admin");

  // DOM Targets
  const doubtFeedPanel = document.getElementById('doubtFeedPanel');
  const doubtDetailPanel = document.getElementById('doubtDetailPanel');
  const doubtEmptyState = document.getElementById('doubtEmptyState');
  const doubtRepliesArea = document.getElementById('doubtRepliesArea');
  const detailTitle = document.getElementById('detailTitle');
  const detailMeta = document.getElementById('detailMeta');
  const detailSubjectBadge = document.getElementById('detailSubjectBadge');
  const detailStatusBadge = document.getElementById('detailStatusBadge');
  const detailQuestionText = document.getElementById('detailQuestionText');
  const detailImagePreview = document.getElementById('detailImagePreview');
  const detailImage = document.getElementById('detailImage');
  const doubtReplyInput = document.getElementById('doubtReplyInput');
  const sendDoubtReplyBtn = document.getElementById('sendDoubtReplyBtn');
  const startCallBtn = document.getElementById('startCallBtn');
  const openDoubtModalBtn = document.getElementById('openDoubtModalBtn');
  const closeDoubtModalBtn = document.getElementById('closeDoubtModalBtn');
  const newDoubtModal = document.getElementById('newDoubtModal');
  const newDoubtForm = document.getElementById('newDoubtForm');
  const doubtFilterBar = document.getElementById('doubtFilterBar');
  const doubtLoading = document.getElementById('doubtLoading');

  let doubtsDb = [];
  let activeDoubtId = null;
  let activeFilter = 'all';

  // ============================
  // 1. Load doubts from Supabase
  // ============================
  async function loadDoubts() {
    showLoading(true);
    try {
      const { data: posts, error } = await _supabase
        .from('forum_posts')
        .select('*')
        .eq('category', 'Doubt')
        .order('created_at', { ascending: false });

      if (error) throw error;
      doubtsDb = posts || [];
      renderDoubtFeed();
    } catch (err) {
      console.error("Error loading doubts:", err);
      showToast("Error loading doubts", "#ef4444", "alert-circle");
    } finally {
      showLoading(false);
    }
  }

  function showLoading(loading) {
    if (doubtLoading) doubtLoading.style.display = loading ? 'flex' : 'none';
  }

  // ============================
  // 2. Render the doubt feed
  // ============================
  function renderDoubtFeed() {
    // Clear existing cards (keep loading div)
    const existingCards = doubtFeedPanel.querySelectorAll('.doubt-card');
    existingCards.forEach(c => c.remove());

    const emptyMsg = doubtFeedPanel.querySelector('.doubt-feed-empty');
    if (emptyMsg) emptyMsg.remove();

    // Filter by subject
    const filteredDoubts = activeFilter === 'all'
      ? doubtsDb
      : doubtsDb.filter(d => extractSubject(d) === activeFilter);

    if (filteredDoubts.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'doubt-feed-empty';
      empty.innerHTML = `
        <i data-feather="inbox" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;"></i>
        <p style="color: #94a3b8; font-size: 0.95rem;">No doubts found. Be the first to ask!</p>
      `;
      doubtFeedPanel.appendChild(empty);
      feather.replace();
      return;
    }

    filteredDoubts.forEach((doubt, index) => {
      const card = document.createElement('div');
      card.className = `doubt-card ${activeDoubtId === doubt.id ? 'active' : ''}`;
      card.setAttribute('data-id', doubt.id);
      card.style.animationDelay = `${index * 0.05}s`;

      const subject = extractSubject(doubt);
      const subjectColor = getSubjectColor(subject);
      const timeAgo = getTimeAgo(doubt.created_at);
      const snippet = (doubt.content || '').substring(0, 100) + ((doubt.content || '').length > 100 ? '...' : '');
      const hasImage = doubt.image_url && doubt.image_url.trim() !== '';

      card.innerHTML = `
        <div class="doubt-card-top">
          <span class="doubt-subject-badge" style="background: ${subjectColor}15; color: ${subjectColor}; border-color: ${subjectColor}40;">${subject}</span>
          <span class="doubt-time">${timeAgo}</span>
        </div>
        <div class="doubt-card-title">${doubt.title}</div>
        <div class="doubt-card-snippet">${snippet}</div>
        <div class="doubt-card-footer">
          <div class="doubt-card-author">
            <div class="doubt-avatar-sm">${(doubt.author || 'S').substring(0, 2).toUpperCase()}</div>
            <span>${doubt.author || 'Anonymous'}</span>
          </div>
          <div class="doubt-card-stats">
            ${hasImage ? '<span class="doubt-has-image" title="Has reference image"><i data-feather="image" style="width:14px;"></i></span>' : ''}
            <span id="doubt-reply-count-${doubt.id}" class="doubt-reply-count"><i data-feather="message-circle" style="width:14px;"></i> ...</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        activeDoubtId = doubt.id;
        renderDoubtFeed();
        openDoubtDetail(doubt);
      });

      doubtFeedPanel.appendChild(card);

      // Async reply count
      _supabase.from('forum_replies').select('id', { count: 'exact', head: true }).eq('post_id', doubt.id).then(({ count }) => {
        const el = document.getElementById(`doubt-reply-count-${doubt.id}`);
        if (el) el.innerHTML = `<i data-feather="message-circle" style="width:14px;"></i> ${count || 0}`;
        feather.replace();
      });
    });
    feather.replace();
  }

  // ============================
  // 3. Open doubt detail panel
  // ============================
  async function openDoubtDetail(doubt) {
    doubtEmptyState.style.display = 'none';
    doubtDetailPanel.style.display = 'flex';

    const subject = extractSubject(doubt);
    const subjectColor = getSubjectColor(subject);

    detailTitle.textContent = doubt.title;
    detailMeta.innerHTML = `Asked by <strong>${doubt.author}</strong> on ${new Date(doubt.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    detailSubjectBadge.textContent = subject;
    detailSubjectBadge.style.background = `${subjectColor}15`;
    detailSubjectBadge.style.color = subjectColor;
    detailSubjectBadge.style.borderColor = `${subjectColor}40`;

    detailQuestionText.textContent = doubt.content || 'No description provided.';

    // Image
    if (doubt.image_url && doubt.image_url.trim() !== '') {
      detailImage.src = doubt.image_url;
      detailImagePreview.style.display = 'block';
    } else {
      detailImagePreview.style.display = 'none';
    }

    // Load replies
    const replies = await fetchReplies(doubt.id);
    renderReplies(doubt, replies);

    // Setup call button
    startCallBtn.onclick = () => {
      const roomName = `SUTU-Doubt-${doubt.id}-${doubt.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
      const jitsiUrl = `https://meet.jit.si/${roomName}`;
      window.open(jitsiUrl, '_blank');
      showToast("Video call room opened!", "#10b981", "video");
    };
  }

  // ============================
  // 4. Fetch & render replies
  // ============================
  async function fetchReplies(postId) {
    const { data: replies, error } = await _supabase
      .from('forum_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      return [];
    }
    return replies || [];
  }

  function renderReplies(doubt, replies) {
    doubtRepliesArea.innerHTML = '';

    if (replies.length === 0) {
      doubtRepliesArea.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #94a3b8;">
          <i data-feather="message-circle" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
          <p>No answers yet. Be the first to help!</p>
        </div>
      `;
      feather.replace();
      return;
    }

    replies.forEach(reply => {
      const isOwner = reply.author === dynamicUserName;
      const rDiv = document.createElement('div');
      rDiv.className = `doubt-reply ${isOwner ? 'is-mine' : ''}`;
      const rInitials = (reply.author || 'S').substring(0, 2).toUpperCase();

      rDiv.innerHTML = `
        <div class="doubt-reply-avatar">${rInitials}</div>
        <div class="doubt-reply-bubble">
          <div class="doubt-reply-header">
            <span class="doubt-reply-name">${reply.author}</span>
            <span class="doubt-reply-time">${new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Â· ${new Date(reply.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div class="doubt-reply-text">${reply.content}</div>
          ${(isOwner || isAdmin) ? `<button class="doubt-reply-delete" data-id="${reply.id}" title="Delete reply"><i data-feather="trash-2" style="width:12px;"></i></button>` : ''}
        </div>
      `;
      doubtRepliesArea.appendChild(rDiv);
    });

    // Bind delete buttons
    doubtRepliesArea.querySelectorAll('.doubt-reply-delete').forEach(btn => {
      btn.onclick = async function () {
        const rid = this.getAttribute('data-id');
        if (confirm("Delete this reply?")) {
          const { error } = await _supabase.from('forum_replies').delete().eq('id', rid);
          if (error) {
            showToast("Error deleting reply", "#ef4444", "alert-circle");
          } else {
            await openDoubtDetail(doubt);
            showToast("Reply deleted", "#ef4444", "trash-2");
          }
        }
      };
    });

    doubtRepliesArea.scrollTop = doubtRepliesArea.scrollHeight;
    feather.replace();
  }

  // ============================
  // 5. Send reply
  // ============================
  sendDoubtReplyBtn.addEventListener('click', async () => {
    const text = doubtReplyInput.value.trim();
    if (text && activeDoubtId) {
      try {
        const { error } = await _supabase
          .from('forum_replies')
          .insert([{
            post_id: activeDoubtId,
            author: dynamicUserName,
            content: text
          }]);

        if (error) throw error;
        doubtReplyInput.value = '';
        const doubt = doubtsDb.find(d => d.id === activeDoubtId);
        await openDoubtDetail(doubt);
        renderDoubtFeed(); // refresh counts
        showToast("Reply posted!", "#10b981", "check-circle");
      } catch (err) {
        console.error("Error sending reply:", err);
        showToast("Error sending reply", "#ef4444", "alert-circle");
      }
    }
  });

  doubtReplyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendDoubtReplyBtn.click();
  });

  // ============================
  // 6. Create new doubt
  // ============================
  newDoubtForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('doubtTitle').value.trim();
    const subject = document.getElementById('doubtSubject').value;
    const description = document.getElementById('doubtDescription').value.trim();
    const imageUrl = document.getElementById('doubtImageUrl').value.trim();

    if (!title || !description) return;

    try {
      const { data: newPost, error } = await _supabase
        .from('forum_posts')
        .insert([{
          title: title,
          content: description,
          author: dynamicUserName,
          category: 'Doubt',
          upvotes: 0,
          image_url: imageUrl || null,
          subject: subject
        }])
        .select()
        .single();

      if (error) throw error;

      newDoubtModal.style.display = 'none';
      newDoubtForm.reset();
      document.getElementById('imagePreviewArea').style.display = 'none';

      doubtsDb.unshift(newPost);
      activeDoubtId = newPost.id;
      renderDoubtFeed();
      await openDoubtDetail(newPost);
      showToast("Doubt posted! Peers and faculty will see it now.", "#10b981", "check-circle");
    } catch (err) {
      console.error("Error creating doubt:", err);
      showToast("Error posting doubt", "#ef4444", "alert-circle");
    }
  });

  // ============================
  // 7. Modal handlers
  // ============================
  openDoubtModalBtn.addEventListener('click', () => newDoubtModal.style.display = 'flex');
  closeDoubtModalBtn.addEventListener('click', () => {
    newDoubtModal.style.display = 'none';
    newDoubtForm.reset();
    document.getElementById('imagePreviewArea').style.display = 'none';
  });

  // Image URL preview in modal
  const doubtImageUrlInput = document.getElementById('doubtImageUrl');
  const modalImagePreview = document.getElementById('modalImagePreview');
  const imagePreviewArea = document.getElementById('imagePreviewArea');

  doubtImageUrlInput.addEventListener('input', () => {
    const url = doubtImageUrlInput.value.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      modalImagePreview.src = url;
      imagePreviewArea.style.display = 'block';
      modalImagePreview.onerror = () => { imagePreviewArea.style.display = 'none'; };
    } else {
      imagePreviewArea.style.display = 'none';
    }
  });

  // ============================
  // 8. Subject filter chips
  // ============================
  doubtFilterBar.querySelectorAll('.doubt-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      doubtFilterBar.querySelectorAll('.doubt-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-subject');
      renderDoubtFeed();
    });
  });

  // ============================
  // Utility Functions
  // ============================
  function extractSubject(doubt) {
    // Try the dedicated subject field, else fallback to content parsing
    if (doubt.subject) return doubt.subject;
    return 'Other';
  }

  function getSubjectColor(subject) {
    const colors = {
      'Mathematics': '#8b5cf6',
      'Physics': '#3b82f6',
      'Computer Science': '#10b981',
      'Electronics': '#f59e0b',
      'Chemistry': '#ef4444',
      'Other': '#6366f1'
    };
    return colors[subject] || '#64748b';
  }

  function getTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function showToast(msg, bgColor, icon) {
    const toast = document.getElementById('doubtToast');
    const tMsg = document.getElementById('doubtToastMessage');
    const tIcon = document.getElementById('doubtToastIcon');
    if (!toast) return;
    toast.style.background = bgColor;
    tMsg.textContent = msg;
    tIcon.innerHTML = `<i data-feather="${icon}" style="width: 20px;"></i>`;
    feather.replace();
    toast.style.display = 'flex';
    setTimeout(() => toast.style.display = 'none', 3500);
  }

  // Initial Load
  loadDoubts();
});

