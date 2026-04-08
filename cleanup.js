const fs = require('fs');
const path = require('path');

// 1. Minify/Clean CSS strictly parsing const cssFile = 'd:/Project_Moodle/css/style.css';
if(fs.existsSync(cssFile)) {
  let cssContent = fs.readFileSync(cssFile, 'utf8');
  // Strip comments to cleanly minify cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
  // Collapse multi-newlines cssContent = cssContent.replace(/^\s*[\r\n]/gm, '');
  fs.writeFileSync(cssFile, cssContent);
}

// 2. Minify/Clean JS const jsDir = 'd:/Project_Moodle/js';
if(fs.existsSync(jsDir)) {
  fs.readdirSync(jsDir).forEach(file => {
    if(file.endsWith('.js')) {
      let p = path.join(jsDir, file);
      let jsContent = fs.readFileSync(p, 'utf8');
      // Remove Block Comments 
      jsContent = jsContent.replace(/\/\*[\s\S]*?\*\//g, '');
      // Remove Inline Comments jsContent = jsContent.replace(/^[ \t]*\/\/.*$/gm, '');
      // Strip Empty Lines jsContent = jsContent.replace(/^\s*[\r\n]/gm, '');
      fs.writeFileSync(p, jsContent);
    }
  });
}

// 3. Link \ Image Checker replacing broken # links const walkHtml = function(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkHtml(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
};

const htmlFiles = walkHtml('d:/Project_Moodle');
htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const isRoot = file === path.normalize('d:/Project_Moodle/index.html') || file === path.normalize('d:/Project_Moodle/sitemap.html');
  
  // Replace empty hashes with conceptual proper anchors if (isRoot) {
    content = content.replace(/href=["']#["']/g, 'href="index.html"');
    content = content.replace(/<img(.*?)src=["']#["'](.*?)>/g, '<img="https://via.placeholder.com/600x400?text=SUTU+Placeholder">');
    content = content.replace(/<img(.*?)src=["']["'](.*?)>/g, '<img="https://via.placeholder.com/600x400?text=SUTU+Placeholder">');
  } else {
    content = content.replace(/href=["']#["']/g, 'href="dashboard.html"');
    content = content.replace(/<img(.*?)src=["']#["'](.*?)>/g, '<img="https://via.placeholder.com/600x400?text=SUTU+Placeholder">');
    content = content.replace(/<img(.*?)src=["']["'](.*?)>/g, '<img="https://via.placeholder.com/600x400?text=SUTU+Placeholder">');
  }
  
  fs.writeFileSync(file, content);
});
console.log('Successfully Minified & Prepared for Deployment.');

