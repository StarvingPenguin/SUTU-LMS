const fs = require('fs');
const path = require('path');

const files = [
  'dashboard.html', 'courses.html', 'assignment.html', 'grades.html', 
  'announcements.html', 'forum.html', 'lesson.html', 'quiz.html', 
  'profile.html', 'admin.html', 'course-detail.html'
];

files.forEach(f => {
  let p = path.join('d:/Project_Moodle/pages', f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  // 1. Sidebar Links
  let asideRegex = /<aside class="sidebar">[\s\S]*?<\/aside>/ig;
  content = content.replace(asideRegex, (aside) => {
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Dashboard\s*)<\/a>/ig, <a href="dashboard.html"</a>);
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?My Courses\s*)<\/a>/ig, <a href="courses.html"</a>);
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Assignments\s*)<\/a>/ig, <a href="assignment.html"</a>);
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Grades\s*)<\/a>/ig, <a href="grades.html"</a>);
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Announcements\s*)<\/a>/ig, <a href="announcements.html"</a>);
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?(?:Forum|Discussion)\s*)<\/a>/ig, <a href="forum.html"</a>);
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Profile\s*)<\/a>/ig, <a href="profile.html"</a>);
    aside = aside.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Logout\s*)<\/a>/ig, `<a href="javascript:void(0);" onclick="['userName','userEmail','userRole','userDepartment','userEnrollment'].forEach(k=>localStorage.removeItem(k)); window.location.href='../index.html';"$1</a>`);
    return aside;
  });

  // 2. Navbar Links (nav-links)
  let navRegex = /<ul class="nav-links">[\s\S]*?<\/ul>/ig;
  content = content.replace(navRegex, (nav) => {
    nav = nav.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Home\s*)<\/a>/ig, <a href="../index.html"</a>);
    nav = nav.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?Announcements\s*)<\/a>/ig, <a href="announcements.html"</a>);
    nav = nav.replace(/<a href="[^"]*"([^>]*>(?:<i[^>]*><\/i>\s*)?(?:Support|Contact)\s*)<\/a>/ig, <a href="contact.html"</a>);
    return nav;
  });

  // 3. Logo Link safely targeting any <div class="logo"> child anchor content = content.replace(/(<div class="logo">\s*)<a href="[^"]*"(.*?)>/ig, $1<a href="../index.html">);
  content = content.replace(/(<div class="logo"><a href=")[^"]*(".*?>)/ig, $1../index.html);

  fs.writeFileSync(p, content);
  console.log(Updated successfully: );
});
