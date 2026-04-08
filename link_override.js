const fs = require('fs');
const path = require('path');

function walkHtml(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkHtml(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkHtml('d:/Project_Moodle');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const isRoot = file === path.normalize('d:/Project_Moodle/index.html') || file === path.normalize('d:/Project_Moodle/sitemap.html') || file === path.normalize('d:/Project_Moodle/template.html');

  const homePath = isRoot ? 'index.html' : '../index.html';
  const coursesPath = isRoot ? 'pages/courses.html' : 'courses.html';
  const aboutPath = isRoot ? 'pages/about.html' : 'about.html';
  const contactPath = isRoot ? 'pages/contact.html' : 'contact.html';
  const loginPath = isRoot ? 'pages/login.html' : 'login.html';
  const registerPath = isRoot ? 'pages/register.html' : 'register.html';

  // 1. Logo
  content = content.replace(/<a href="[^"]*">\s*SUTU <span>LMS<\/span>\s*<\/a>/g, <a href="">\n        SUTU <span>LMS</span>\n      </a>);
  content = content.replace(/<a href="[^"]*" style="margin-bottom: 0\.3rem;">SUTU <span>LMS<\/span><\/a>/g, <a href="" style="margin-bottom: 0.3rem;">SUTU <span>LMS</span></a>);

  // 2. Navbar Links correctly matching <li><a href="...">Text</a></li>
  content = content.replace(/<a href="[^"]*">Home<\/a>/g, <a href="">Home</a>);
  content = content.replace(/<a href="[^"]*">Courses<\/a>/g, <a href="">Courses</a>);
  content = content.replace(/<a href="[^"]*">About<\/a>/g, <a href="">About</a>);
  content = content.replace(/<a href="[^"]*">Contact<\/a>/g, <a href="">Contact</a>);
  
  // Auth navbar buttons (using regex to keep classes)
  content = content.replace(/<a href="[^"]*"([^>]*?)>Login<\/a>/g, <a href="">Login</a>);
  content = content.replace(/<a href="[^"]*"([^>]*?)>Register<\/a>/g, <a href="">Register</a>);
  
  // 3. Hero generic buttons
  content = content.replace(/<a href="[^"]*"([^>]*?)>Browse Courses<\/a>/g, <a href="">Browse Courses</a>);

  // 4. Sidebar mappings
  content = content.replace(/<a href="[^"]*"(.*?><i data-feather="book-open"[^>]*><\/i>\s*)My Courses<\/a>/g, <a href="courses.html" Courses</a>);
  content = content.replace(/<a href="[^"]*"(.*?><i data-feather="file-text"[^>]*><\/i>\s*)Assignments<\/a>/g, <a href="assignment.html"</a>);
  content = content.replace(/<a href="[^"]*"(.*?><i data-feather="award"[^>]*><\/i>\s*)Grades<\/a>/g, <a href="grades.html"</a>);
  content = content.replace(/<a href="[^"]*"(.*?><i data-feather="bell"[^>]*><\/i>\s*)Announcements<\/a>/g, <a href="announcements.html"</a>);
  content = content.replace(/<a href="[^"]*"(.*?><i data-feather="message-circle"[^>]*><\/i>\s*)Forum<\/a>/g, <a href="forum.html"</a>);
  content = content.replace(/<a href="[^"]*"(.*?><i data-feather="users"[^>]*><\/i>\s*)Forum<\/a>/g, <a href="forum.html"</a>);
  content = content.replace(/<a href="[^"]*"(.*?><i data-feather="user"[^>]*><\/i>\s*)Profile<\/a>/g, <a href="javascript:void(0);"</a>);

  // 5. Course Actions
  const detailPath = isRoot ? 'pages/course-detail.html' : 'course-detail.html';
  content = content.replace(/<a href="[^"]*"(.*?)>Enroll Now<\/a>/g, <a href="">Enroll Now</a>);
  content = content.replace(/<a href="[^"]*"(.*?)>Continue Learning<\/a>/g, <a href="">Continue Learning</a>);
  content = content.replace(/<a href="[^"]*"(.*?)>View Details<\/a>/g, <a href="">View Details</a>);

  // 6. Login/Register Auth Links
  content = content.replace(/<a href="[^"]*">Register here<\/a>/g, '<a href="register.html">Register here</a>');
  content = content.replace(/<a href="[^"]*">Login here<\/a>/g, '<a href="login.html">Login here</a>');

  // 7. Eradicate ALL remaining href="#" unconditionally everywhere 
  content = content.replace(/href="#"/g, 'href="javascript:void(0);"');

  fs.writeFileSync(file, content);
});

console.log("All Links Hardcoded & Replaced Successfully.")

