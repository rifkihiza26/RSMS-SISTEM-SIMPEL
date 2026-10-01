const fs = require('fs');
let content = fs.readFileSync('src/routeTree.gen.tsx', 'utf-8');

if (!content.includes('import { Payroll }')) {
  content = content.replace(
    "import { Recaps } from './features/recaps/Recaps'",
    "import { Recaps } from './features/recaps/Recaps'\nimport { Payroll } from './features/payroll/Payroll'"
  );
  
  content = content.replace(
    "const recapsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/recaps', component: Recaps })",
    "const recapsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/recaps', component: Recaps })\nconst payrollRoute = createRoute({ getParentRoute: () => rootRoute, path: '/payroll', component: Payroll })"
  );
  
  content = content.replace(
    "reportsRoute, settingsRoute, recapsRoute\n])",
    "reportsRoute, settingsRoute, recapsRoute, payrollRoute\n])"
  );
  
  fs.writeFileSync('src/routeTree.gen.tsx', content);
}
