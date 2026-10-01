const fs = require('fs');
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');

// Remove notes, mechanic, motor_type states
content = content.replace(/const \[notes, setNotes\] = useState\(''\)/g, `const notes = ''`);
content = content.replace(/const \[motorType, setMotorType\] = useState\(''\)/g, `const motorType = ''`);
content = content.replace(/const \[mechanicId, setMechanicId\] = useState<string>\(''\)/g, `const mechanicId = ''`);
content = content.replace(/const \[notaType, setNotaType\] = useState\('KECIL'\)/g, `const notaType = 'KECIL'`);

// Remove Mechanics Query
const mechanicQueryRegex = /const \{ data: mechanics = \[\] \} = useQuery\(\{[\s\S]*?\}\)/g;
content = content.replace(mechanicQueryRegex, '');

// Remove the Info Tambahan UI section
const uiSectionRegex = /\{!\* INFO TAMBAHAN \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
content = content.replace(uiSectionRegex, '');

// Wait, the UI section might be tricky to regex perfectly. 
// Let's use sed or manual string replacement for UI.
fs.writeFileSync('src/features/cashier/Cashier.tsx', content);
