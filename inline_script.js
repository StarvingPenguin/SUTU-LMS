const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'announcements.html', 'courses.html', 'assignment.html', 'grades.html', 
  'forum.html', 'lesson.html', 'profile.html', 'quiz.html', 'admin.html', 'course-detail.html'
];

filesToUpdate.forEach(filename => {
  let file = path.join('d:/Project_Moodle/pages', filename);
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');

  // Add classes to the hardcoded identity blocks
  content = content.replace(/<span([^>]*)>\s*John Doe\s*<\/span>/ig, (match, p1) => {
    if (!p1.includes('class="user-name"')) {
      return <span class="user-name">John Doe</span>;
    }
    return match;
  });

  content = content.replace(/<div([^>]*)>\s*JD\s*<\/div>/ig, (match, p1) => {
    if (!p1.includes('class="user-avatar"')) {
      return <div class="user-avatar">JD</div>;
    }
    return match;
  });

  // Eradicate any old copies of similar scripts just to be clean
  content = content.replace(/<script>\s*const userName = localStorage\.getItem[\s\S]*?<\/script>\s*(?=<\/body>)/g, '');

  // The explicit JS requested by the user
  const scriptInjection = 
<script>
  const userName = localStorage.getItem("userName") || "Student";
  const userInitials = userName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();

  const nameEl = document.querySelector(".user-name");
  const avatarEl = document.querySelector(".user-avatar");
  if(nameEl) nameEl.textContent = userName;
  if(avatarEl) avatarEl.textContent = userInitials;
</script>
</body>;

  content = content.replace(/<\/body>/i, scriptInjection);

  fs.writeFileSync(file, content);
  console.log("Updated", filename);
});
