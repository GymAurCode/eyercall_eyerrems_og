const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      if (fs.statSync(dirFile).isDirectory()) {
        filelist = walkSync(dirFile, filelist);
      } else {
        if (dirFile.endsWith('.tsx')) {
          filelist.push(dirFile);
        }
      }
    } catch (err) { }
  });
  return filelist;
};

const gradients = {
  primary: 'bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)]',
  success: 'bg-[linear-gradient(135deg,#22c55e,#15803d)]',
  warning: 'bg-[linear-gradient(135deg,#f59e0b,#b45309)]',
  destructive: 'bg-[linear-gradient(135deg,#ef4444,#b91c1c)]',
  ['orange-500']: 'bg-[linear-gradient(135deg,#f59e0b,#b45309)]',
  ['blue-500']: 'bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)]',
  secondary: 'bg-[linear-gradient(135deg,#64748b,#334155)]',
};

const fallbackGradients = [
  'bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)]',
  'bg-[linear-gradient(135deg,#22c55e,#15803d)]',
  'bg-[linear-gradient(135deg,#f59e0b,#b45309)]',
  'bg-[linear-gradient(135deg,#ef4444,#b91c1c)]',
  'bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)]',
];

const files = walkSync('d:\\eyercall_eyerrems_og\\app\\details');

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('stat-card')) {
    let newContent = content.replace(/className=(["`'])p-6 stat-card\1/g, 'className="p-6 relative overflow-hidden bg-white dark:bg-[#0d212c] rounded-xl border-l-4 border-l-[#24344c] dark:border-l-[#0d212c] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]"');
    
    // Replace icon wrappers and icons
    let cardWrapperRegex = /<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-([a-zA-Z0-9-]+)\/10.*?"[^>]*>\s*<([a-zA-Z0-9]+) className="h-5 w-5 (text-[a-zA-Z0-9-]+)" \/>\s*<\/div>/g;
    
    let cycle = 0;
    newContent = newContent.replace(cardWrapperRegex, (match, colorKey, iconComponent, colorTextClass) => {
      let grad = gradients[colorKey];
      if (!grad) {
        grad = fallbackGradients[cycle % fallbackGradients.length];
        cycle++;
      }
      return `<div className="flex h-12 w-12 items-center justify-center rounded-xl px-0 ${grad} text-white shadow-lg transition-transform duration-300 hover:scale-110">\n                <${iconComponent} className="h-6 w-6 text-white" />\n              </div>`;
    });

    if (newContent !== content) {
      // Small adjustment for the injected px-0 just in case.
      newContent = newContent.replace('px-0 bg-', 'bg-');
      fs.writeFileSync(file, newContent);
      console.log(`Updated ${file}`);
      updatedCount++;
    }
  }
});

console.log(`Done. Updated ${updatedCount} files.`);
