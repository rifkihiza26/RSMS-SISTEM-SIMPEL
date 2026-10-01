const fs = require('fs');
let content = fs.readFileSync('src/routeTree.gen.tsx', 'utf-8');

// 1. Add import
if (!content.includes('import { Recaps }')) {
  content = content.replace(
    "import { Settings } from './features/settings/Settings'",
    "import { Settings } from './features/settings/Settings'\nimport { Recaps } from './features/recaps/Recaps'"
  );
}

// 2. Add route
if (!content.includes("path: '/recaps'")) {
  content = content.replace(
    "const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: Settings })",
    "const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: Settings })\nconst recapsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/recaps', component: Recaps })"
  );
}

// 3. Add to tree
if (!content.includes("recapsRoute")) {
  content = content.replace(
    "reportsRoute, settingsRoute\n])",
    "reportsRoute, settingsRoute, recapsRoute\n])"
  );
}

fs.writeFileSync('src/routeTree.gen.tsx', content);
