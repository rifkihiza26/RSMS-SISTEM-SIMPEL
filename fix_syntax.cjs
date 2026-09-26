const fs = require('fs')
let content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')
// Fix missing closing divs
content = content.replace(
  `— Rakyat Sinting Matic Shop —</div>\n                </div>\n              </div>\n`,
  `— Rakyat Sinting Matic Shop —</div>\n                </div>\n              </div>\n</div>\n        </div>\n      )}\n    </div>\n`
)
fs.writeFileSync('src/features/transactions/Transactions.tsx', content)
