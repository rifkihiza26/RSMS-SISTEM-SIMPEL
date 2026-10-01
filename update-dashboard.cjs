const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// I will just replace the query block with a single large query block to compute all these 
// to save API calls and make it accurate.
