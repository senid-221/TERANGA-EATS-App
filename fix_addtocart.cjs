const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// The messed up part looks like:
/*
      return [...prev, item];
      return [...prev, item];
  };
    showToast(t('addedToCartSuccess'));
  });
*/

code = code.replace(/return \[\.\.\.prev, item\];\s*return \[\.\.\.prev, item\];\s*\};\s*showToast\(t\('addedToCartSuccess'\)\);\s*\}\);/g, 
`return [...prev, item];\n    });\n    showToast(t('addedToCartSuccess'));\n  };`);

fs.writeFileSync('src/context/AppContext.tsx', code);
