document.addEventListener('DOMContentLoaded', () => {
  // Supabase Configuration correctly initialized in supabase-config.js
  const dynamicUserName = localStorage.getItem("userName") || "Student";
  const dynamicUserInitials = dynamicUserName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const userRole = localStorage.getItem("userRole") || "Student";
  const isAdmin = (userRole === "Admin") || dynamicUserName.toLowerCase().includes("admin");

  // HTML Targets
  const threadListContainer = document.getElementById('threadListContainer');
  const activeThreadPanel = document.getElementById('activeThreadPanel');
  const emptyThreadPanel = document.getElementById('emptyThreadPanel');
  const chatArea = document.getElementById('chatArea');
  const viewThreadTitle = document.getElementById('viewThreadTitle');
  const viewThreadMeta = document.getElementById('viewThreadMeta');
  const viewThreadCategory = document.getElementById('viewThreadCategory');
  const replyInput = document.getElementById('replyInput');
  const sendReplyBtn = document.getElementById('sendReplyBtn');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const newPostModal = document.getElementById('newPostModal');
  const newPostForm = document.getElementById('newPostForm');

  let threadsDb = [];
  let activeThreadId = null;

  // 1. Fetch posts on page load
  async function loadThreads() {
    showLoadingState(true);
    try {
      const { data: posts, error } = await _supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      threadsDb = posts || [];
      await renderThreadList();
    } catch (err) {
      console.error("Error loading threads:", err);
      showForumToast("Error loading posts", "#ef4444", "alert-circle");
    } finally {
      showLoadingState(false);
    }
  }

  function showLoadingState(isLoading) {
    if (isLoading) {
      threadListContainer.innerHTML = '<div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.5);">Loading discussions...</div>';
    }
  }

  // 2. Fetch replies for a specific post
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

  async function renderThreadList() {
    threadListContainer.innerHTML = '';
    if (threadsDb.length === 0) {
      threadListContainer.innerHTML = '<div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.4);">No discussions yet. Start one!</div>';
      return;
    }

    // We need counts for each thread ideally, but for now we render placeholders or fetch counts in bulk if supported
    for (const thread of threadsDb) {
      const card = document.createElement('div');
      card.className = `thread-card ${activeThreadId === thread.id ? 'active' : ''}`;
      card.setAttribute('data-id', thread.id);
      
      const canModify = (thread.author === dynamicUserName) || isAdmin;

      // Simple tag mapping logic 
      let tagClass = 'tag-general';
      if (thread.category === 'Doubt') tagClass = 'tag-exam';
      if (thread.category === 'Project Help') tagClass = 'tag-assignment';

      card.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items: flex-start;">
          <div class="thread-title" style="flex:1;">${thread.title}</div>
        </div>
        ${canModify ? `
        <div class="post-actions" style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px; margin-bottom:8px;">
          <button class="btn-edit-post" style="background:none; border:1px solid #f5a623; color:#f5a623; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">✏️ Edit</button>
          <button class="btn-delete-post" style="background:none; border:1px solid #e74c3c; color:#e74c3c; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">🗑️ Delete</button>
        </div>` : ''}
        <div class="thread-meta">
          <span>Posted by ${thread.author} &bull; ${new Date(thread.created_at).toLocaleDateString()}</span>
          <span class="category-tag ${tagClass}">${thread.category}</span>
        </div>
        <div class="thread-stats">
          <button class="upvote-btn" data-thread="${thread.id}"><i data-feather="chevron-up" style="width:14px;"></i> <span>${thread.upvotes || 0}</span></button>
          <span id="reply-count-${thread.id}"><i data-feather="message-circle" style="width:14px;"></i> ... replies</span>
        </div>
      `;

      // Setup listeners
      card.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-delete-post') || e.target.closest('.btn-edit-post') || e.target.closest('.upvote-btn')) return;
        activeThreadId = thread.id;
        await renderThreadList();
        await openThreadView(thread);
      });

      const delBtn = card.querySelector('.btn-delete-post');
      if (delBtn) {
        delBtn.onclick = async (e) => {
          e.stopPropagation();
          if (confirm("Delete this post? All replies will also be removed.")) {
            // 5. Delete post and replies from Supabase
            const tid = thread.id;
            await _supabase.from('forum_replies').delete().eq('post_id', tid);
            const { error } = await _supabase.from('forum_posts').delete().eq('id', tid);
            
            if (error) {
              showForumToast("Error deleting", "#ef4444", "alert-circle");
            } else {
              threadsDb = threadsDb.filter(t => t.id !== tid);
              if (activeThreadId === tid) {
                activeThreadId = null;
                emptyThreadPanel.style.display = 'flex';
                activeThreadPanel.style.display = 'none';
              }
              await renderThreadList();
              showForumToast("Post deleted!", "#ef4444", "trash-2");
            }
          }
        };
      }

      const editBtn = card.querySelector('.btn-edit-post');
      if (editBtn) {
        editBtn.onclick = (e) => {
          e.stopPropagation();
          openEditThreadModal(thread);
        };
      }

      threadListContainer.appendChild(card);
      
      // Fetch and update reply count asynchronously
      _supabase.from('forum_replies').select('id', { count: 'exact', head: true }).eq('post_id', thread.id).then(({ count }) => {
        const countEl = document.getElementById(`reply-count-${thread.id}`);
        if (countEl) countEl.innerHTML = `<i data-feather="message-circle" style="width:14px;"></i> ${count || 0} replies`;
        feather.replace();
      });
    }
    feather.replace();
  }

  async function openThreadView(thread) {
    emptyThreadPanel.style.display = 'none';
    activeThreadPanel.style.display = 'flex';

    viewThreadTitle.textContent = thread.title;
    viewThreadMeta.innerHTML = `Posted by <strong>${thread.author}</strong> on ${new Date(thread.created_at).toLocaleDateString()}`;
    viewThreadCategory.textContent = thread.category;
    
    let tagClass = 'tag-general';
    if (thread.category === 'Doubt') tagClass = 'tag-exam';
    if (thread.category === 'Project Help') tagClass = 'tag-assignment';
    viewThreadCategory.className = `category-tag ${tagClass}`;

    const replies = await fetchReplies(thread.id);
    renderChatArea(thread, replies);
  }

  function renderChatArea(thread, replies) {
    chatArea.innerHTML = '';

    // Add the post content as the first "message"
    const postDiv = document.createElement('div');
    postDiv.className = `chat-message is-author`;
    const initials = (thread.author || "S").substring(0,2).toUpperCase();
    postDiv.innerHTML = `
      <div class="chat-avatar">${initials}</div>
      <div class="chat-bubble" style="width: 100%;">
        <div class="chat-message-header">
          <span class="chat-name">${thread.author}</span>
          <span class="chat-time">Original Post</span>
        </div>
        <div class="chat-text">${thread.content || "No content."}</div>
      </div>
    `;
    chatArea.appendChild(postDiv);

    // Add actual replies
    replies.forEach(reply => {
      const isOwner = reply.author === dynamicUserName;
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-message ${isOwner ? 'is-author' : ''}`;
      const rInitials = (reply.author || "S").substring(0,2).toUpperCase();
      
      msgDiv.innerHTML = `
        <div class="chat-avatar">${rInitials}</div>
        <div class="chat-bubble" style="position:relative; width: 100%;">
          <div class="chat-message-header">
            <div>
              <span class="chat-name">${reply.author}</span>
              <span class="chat-time">${new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${(isOwner || isAdmin) ? `
            <div class="reply-actions">
              <button class="del-reply-btn" data-id="${reply.id}" style="background:none; border:none; cursor:pointer; color: #fca5a5;"><i data-feather="trash-2" style="width:12px;"></i></button>
            </div>` : ''}
          </div>
          <div class="chat-text">${reply.content}</div>
        </div>
      `;
      chatArea.appendChild(msgDiv);
    });

    // Bind delete buttons
    chatArea.querySelectorAll('.del-reply-btn').forEach(btn => {
      btn.onclick = async function() {
        const rid = this.getAttribute('data-id');
        if (confirm("Delete this reply?")) {
          const { error } = await _supabase.from('forum_replies').delete().eq('id', rid);
          if (error) {
            showForumToast("Error deleting reply", "#ef4444", "alert-circle");
          } else {
            await openThreadView(thread);
            showForumToast("Reply deleted!", "#ef4444", "trash-2");
          }
        }
      };
    });

    chatArea.scrollTop = chatArea.scrollHeight;
    feather.replace();
  }

  // 4. Send reply to Supabase
  sendReplyBtn.addEventListener('click', async () => {
    const text = replyInput.value.trim();
    if (text && activeThreadId) {
      try {
        const { error } = await _supabase
          .from('forum_replies')
          .insert([{
            post_id: activeThreadId,
            author: dynamicUserName,
            content: text
          }]);

        if (error) throw error;

        replyInput.value = '';
        const thread = threadsDb.find(t => t.id === activeThreadId);
        await openThreadView(thread);
        await renderThreadList(); // Refresh counts
      } catch (err) {
        console.error("Error sending reply:", err);
        showForumToast("Error sending reply", "#ef4444", "alert-circle");
      }
    }
  });

  replyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendReplyBtn.click();
  });

  // 3. Insert new post to Supabase
  newPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cTitle = document.getElementById('postTitle').value;
    const cCategory = document.getElementById('postCategory').value;
    const cContent = document.getElementById('postContent').value;

    try {
      const { data: newPost, error } = await _supabase
        .from('forum_posts')
        .insert([{
          title: cTitle,
          content: cContent,
          author: dynamicUserName,
          category: cCategory,
          upvotes: 0
        }])
        .select()
        .single();

      if (error) throw error;

      newPostModal.style.display = 'none';
      newPostForm.reset();
      
      threadsDb.unshift(newPost);
      activeThreadId = newPost.id;
      await renderThreadList();
      await openThreadView(newPost);
      showForumToast("Post created!", "#10b981", "check-circle");
    } catch (err) {
      console.error("Error creating post:", err);
      showForumToast("Error creating post", "#ef4444", "alert-circle");
    }
  });

  // Modal Handlers
  openModalBtn.addEventListener('click', () => newPostModal.style.display = 'flex');
  closeModalBtn.addEventListener('click', () => {
    newPostModal.style.display = 'none';
    newPostForm.reset();
  });

  // Edit Post Logic
  let currentEditPost = null;
  const editPostModal = document.getElementById('editPostModal');
  const editPostForm = document.getElementById('editPostForm');
  
  function openEditThreadModal(thread) {
    currentEditPost = thread;
    document.getElementById('editPostTitle').value = thread.title;
    document.getElementById('editPostContent').value = thread.content || "";
    editPostModal.style.display = 'flex';
  }

  if (editPostForm) {
    editPostForm.onsubmit = async (e) => {
      e.preventDefault();
      const updatedTitle = document.getElementById('editPostTitle').value;
      const updatedContent = document.getElementById('editPostContent').value;

      try {
        const { error } = await _supabase
          .from('forum_posts')
          .update({ title: updatedTitle, content: updatedContent })
          .eq('id', currentEditPost.id);

        if (error) throw error;

        currentEditPost.title = updatedTitle;
        currentEditPost.content = updatedContent;
        
        editPostModal.style.display = 'none';
        await renderThreadList();
        if (activeThreadId === currentEditPost.id) {
          await openThreadView(currentEditPost);
        }
        showForumToast("Post updated!", "#10b981", "check-circle");
      } catch (err) {
        console.error("Error updating post:", err);
        showForumToast("Error updating", "#ef4444", "alert-circle");
      }
    };
  }

  function showForumToast(msg, bgColor, icon) {
    const toast = document.getElementById('forumToast');
    const tMsg = document.getElementById('toastMessage');
    const tIcon = document.getElementById('toastIcon');
    if (!toast) return;
    toast.style.background = bgColor;
    tMsg.textContent = msg;
    tIcon.innerHTML = `<i data-feather="${icon}" style="width: 20px;"></i>`;
    feather.replace();
    toast.style.display = 'flex';
    setTimeout(() => toast.style.display = 'none', 3000);
  }

  // Initial Load
  loadThreads();
});
