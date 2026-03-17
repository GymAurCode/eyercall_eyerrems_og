const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      if (fs.statSync(dirFile).isDirectory()) {
        filelist = walkSync(dirFile, filelist);
      } else {
        if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
          filelist.push(dirFile);
        }
      }
    } catch (err) { }
  });
  return filelist;
};

const dirsToScan = [
  'd:\\eyercall_eyerrems_og\\app',
  'd:\\eyercall_eyerrems_og\\components'
];

let files = [];
dirsToScan.forEach(dir => {
  files = walkSync(dir, files);
});

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace standard solid card backgrounds with glass backgrounds
  // E.g., bg-white dark:bg-[#0d212c] -> bg-white/60 dark:bg-[#0d212c]/60 backdrop-blur-md
  content = content.replace(/bg-white dark:bg-\[\#0d212c\]/g, 'bg-white/60 dark:bg-[#0d212c]/60 backdrop-blur-md');
  
  // Also catch bg-card sometimes used for cards
  // We need to be careful with bg-card, it might be in dashboard-layout which we already fixed
  if (!file.includes('dashboard-layout')) {
    content = content.replace(/bg-card(?=[\s"'])/g, 'bg-card/60 backdrop-blur-md');
  }

  // General detail page structural wrappers that might have bg-background or bg-white
  // Only applying lightly so we don't break everything, just targeted cards usually
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    updatedCount++;
  }
});

console.log(`Done. Updated ${updatedCount} files.`);
