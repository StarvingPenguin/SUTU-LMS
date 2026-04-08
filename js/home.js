document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Scroll Reveal Animation Engine ---
  function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
      var windowHeight = window.innerHeight;
      var elementTop = reveals[i].getBoundingClientRect().top;
      var elementVisible = 100;
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add("active");
      }
    }
  }
  window.addEventListener("scroll", reveal);
  // Trigger once on load
  setTimeout(reveal, 100);

  // --- 2. Dynamic Content Fetching ---
  async function loadDynamicHomeContent() {
    // Fallbacks
    const defaultHeroTitle = "Build Your Empire";
    const defaultHeroSub = "Join the Soviet Union Technological University digital initiative. Access world-class courses, expert certifications, and interactive training protocols — all under the banner of SUTU.";
    const defaultNews = [
      "Admissions for 2026 Academic Year are now open",
      "New specialized courses added to Technical Engineering",
      "Upcoming Unity Fest details announced on the dashboard",
      "Welcome to the upgraded SUTU LMS portal"
    ];

    try {
      // Check if site_settings table exists by doing a simple select. 
      // If it fails, we catch the error and use fallbacks const { data: settings, error: setErr } = await _supabase.from('site_settings').select('*').limit(1);
      
      if (!setErr && settings && settings.length > 0) {
        const config = settings[0];
        if (config.hero_title) document.getElementById('heroTitle').innerHTML = config.hero_title;
        if (config.hero_subtitle) document.getElementById('heroSubtitle').innerHTML = config.hero_subtitle;
        
        if (config.news_ticker && Array.isArray(config.news_ticker) && config.news_ticker.length > 0) {
          renderNewsTicker(config.news_ticker);
        } else {
          renderNewsTicker(defaultNews);
        }
      } else {
        console.warn("Using default site config or 'site_settings' table not found ");
        renderNewsTicker(defaultNews);
      }
    } catch (err) {
      console.error("Home config fetch intentionally handled:", err);
      renderNewsTicker(defaultNews);
    }

    // Fetch 3 top courses dynamically from Supabase
    try {
      const { data: courses, error: courseErr } = await _supabase
        .from('courses')
        .select('*')
        .limit(3);

      if (courseErr) throw courseErr;
      
      const grid = document.getElementById('dynamic-courses-grid');
      if (grid && courses && courses.length > 0) {
        grid.innerHTML = '';
        courses.forEach((c, index) => {
          // Add reveal delay for staggered loading
          const delayClass = `delay-${(index + 1) * 100}`;
          const img = c.image_url || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=600&auto=format&fit=crop';
          
          const card = document.createElement('div');
          card.className = `course-card premium-card reveal ${delayClass}`;
          card.innerHTML = `
            <div class="course-thumbnail">
              <img src="${img}" alt="${c.course_name}">
              <span class="course-badge">${c.course_code}</span>
            </div>
            <div class="course-details">
              <span class="badge-nptel" style="margin-bottom: 0.5rem; background: rgba(255,153,51,0.1); color: var(--accent-color); border: 1px solid var(--accent-color);">${c.department}</span>
              <h4 style="margin-top: 0.4rem; font-size: 1.2rem;">${c.course_name}</h4>
              <p class="course-faculty" style="margin-bottom: 1rem; font-size: 0.9rem;">By ${c.faculty_name}</p>
              <a href="pages/login.html" class="btn btn-outline" style="width: 100%; text-align: center;">View Details</a>
            </div>
          `;
          grid.appendChild(card);
        });
        // Re-trigger scroll reveal for newly added cards 
        setTimeout(reveal, 100);
      } else if (grid && (!courses || courses.length === 0)) {
        // Fallback cards if DB is empty
        grid.innerHTML = `
        <div class="course-card premium-card reveal delay-100">
          <div class="course-thumbnail">
            <img src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=600&auto=format&fit=crop" alt="Python">
            <span class="course-badge">CS101</span>
          </div>
          <div class="course-details">
            <span class="badge-nptel" style="margin-bottom: 0.5rem; background: rgba(255,153,51,0.1); color: var(--accent-color); border: 1px solid var(--accent-color);">Computer Engineering</span>
            <h4 style="margin-top: 0.4rem; font-size: 1.2rem;">Advanced Python Programming</h4>
            <p class="course-faculty" style="margin-bottom: 1rem; font-size: 0.9rem;">By Prof. Rajesh Khanna</p>
            <a href="pages/login.html" class="btn btn-outline" style="width: 100%; text-align: center;">View Details</a>
          </div>
        </div>
        `;
      }
    } catch(err) {
      console.error("Top courses fetch dynamically softly resolved:", err);
    }
  }

  function renderNewsTicker(newsItems) {
    const ticker = document.getElementById('dynamicNewsTicker');
    if (!ticker) return;
    ticker.innerHTML = '';
    newsItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.textContent = typeof item === 'object' ? item.text : item;
      ticker.appendChild(div);
    });
  }

  loadDynamicHomeContent();
});
