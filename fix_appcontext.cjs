const fs = require('fs');
let lines = fs.readFileSync('src/context/AppContext.tsx', 'utf-8').split('\n');

const fixLines = {
  166: '      });',
  175: '  });',
  179: '  });',
  257: '  });',
  273: '    return [];\n  });',
  345: '  });',
  479: '  });',
  649: '  });',
};

for (const [line, text] of Object.entries(fixLines)) {
  const index = parseInt(line) - 1;
  lines[index] = text;
}

fs.writeFileSync('src/context/AppContext.tsx', lines.join('\n'));
