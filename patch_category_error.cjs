const fs = require('fs');
let code = fs.readFileSync('src/features/settings/Settings.tsx', 'utf8');

code = code.replace(
  /await supabase\.from\(table\)\.insert\(\{ name: newCat\.trim\(\) \}\)/,
  `const { error } = await supabase.from(table).insert({ name: newCat.trim() })
    if (error) alert('Gagal: ' + error.message)`
);

fs.writeFileSync('src/features/settings/Settings.tsx', code);
