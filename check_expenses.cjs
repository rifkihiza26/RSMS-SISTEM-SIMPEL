const fs = require('fs')

// Using the same approach as we did to read env
require('dotenv').config()

console.log(fs.readFileSync('src/features/expenses/Expenses.tsx', 'utf8').substring(0, 1500))
