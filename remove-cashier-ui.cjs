const fs = require('fs');
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');

// Remove Motor input UI
content = content.replace(/\{\/\* Motor input \*\/\}([\s\S]*?)<\/div>\s*<\/div>/, '');

// Remove Mechanic selector UI
content = content.replace(/\{\/\* Mechanic selector \*\/\}([\s\S]*?)<\/select>\s*<\/div>/, '');

// Remove Nota selector
content = content.replace(/\{\/\* Nota Type \*\/\}([\s\S]*?)<\/select>\s*<\/div>/, '');

fs.writeFileSync('src/features/cashier/Cashier.tsx', content);
