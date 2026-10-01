const fs = require('fs');
console.log(fs.readFileSync('src/features/recaps/Recaps.tsx', 'utf-8').substring(0, 1000));
