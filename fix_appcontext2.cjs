const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

code = code.replace(/orderId: newOrder\.id,\s*return newOrder;\s*\n\s*\n\s*\};\s*\};\s*/g, 'orderId: newOrder.id,\n    });\n    return newOrder;\n  };\n');
fs.writeFileSync('src/context/AppContext.tsx', code);
