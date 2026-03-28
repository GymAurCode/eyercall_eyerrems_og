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

  // Revert glass backgrounds to original solid backgrounds
  // bg-white/60 dark:bg-[#0d212c]/60 backdrop-blur-md -> bg-white dark:bg-[#0d212c]
  content = content.replace(/bg-white\/60 dark:bg-\[\#0d212c\]\/60 backdrop-blur-md/g, 'bg-white dark:bg-[#0d212c]');
  
  // Also revert bg-card/60 backdrop-blur-md to bg-card
  if (!file.includes('dashboard-layout')) {
    content = content.replace(/bg-card\/60 backdrop-blur-md/g, 'bg-card');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Reverted ${file}`);
    updatedCount++;
  }
});

console.log(`Done. Reverted ${updatedCount} files.`);
