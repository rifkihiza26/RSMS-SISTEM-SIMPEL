const fs = require('fs');
let content = fs.readFileSync('src/routeTree.gen.tsx', 'utf-8');
content = content.replace(
  "restocksRoute, mechanicsRoute, reportsRoute, settingsRoute",
  "restocksRoute, mechanicsRoute, reportsRoute, settingsRoute, recapsRoute"
);
fs.writeFileSync('src/routeTree.gen.tsx', content);
