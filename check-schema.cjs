const fs = require('fs');
let openBill = fs.readFileSync('open_bill.sql', 'utf-8');
console.log(openBill.substring(0, 1000));
