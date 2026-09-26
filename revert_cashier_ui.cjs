const fs = require('fs');

// Read current open-bill logic file
const currentContent = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');
// Read the backup (original UI)
const backupContent = fs.readFileSync('src/features/cashier/Cashier.bak.tsx', 'utf8');

fs.writeFileSync('src/features/cashier/Cashier.tsx', backupContent);
console.log('Restored Cashier.bak.tsx');
