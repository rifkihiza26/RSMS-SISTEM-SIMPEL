const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// I want to rename `OwnerAdminDashboard` to `AdminDashboard` and remove the `role` prop.
// Then I will create a new `OwnerDashboard` that only shows the super high-level summary.

content = content.replace("function OwnerAdminDashboard({ role }: { role: 'ADMIN' | 'OWNER' }) {", "function AdminDashboard() {");
content = content.replace("{role === 'ADMIN' && (", "");
content = content.replace("</>\n      )}", ""); // Wait this might be dangerous if matching is wrong, I'll use regex.

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', content);
