const fs = require('fs');
const code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

let parenCount = 0;
let braceCount = 0;
let lastParenLine = -1;

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '(') {
      parenCount++;
      lastParenLine = i + 1;
    }
    if (c === ')') parenCount--;
    if (c === '{') braceCount++;
    if (c === '}') braceCount--;
  }
}

console.log(`Unclosed (: ${parenCount}, Unclosed {: ${braceCount}, Last opened (: line ${lastParenLine}`);
