const fs = require('fs');
const code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

let parenStack = [];
let braceStack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let inMultilineComment = false;
let inTemplate = false;

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    const nextC = line[j+1];

    if (!inString && !inComment && !inMultilineComment && !inTemplate) {
      if (c === '/' && nextC === '/') {
        inComment = true;
        break; // skip rest of line
      }
      if (c === '/' && nextC === '*') {
        inMultilineComment = true;
        j++; continue;
      }
      if (c === "'" || c === '"') {
        inString = true;
        stringChar = c;
        continue;
      }
      if (c === '`') {
        inTemplate = true;
        continue;
      }
      
      if (c === '(') parenStack.push(i + 1);
      if (c === ')') parenStack.pop();
      if (c === '{') braceStack.push(i + 1);
      if (c === '}') braceStack.pop();
    } else if (inString) {
      if (c === '\\') { j++; continue; }
      if (c === stringChar) inString = false;
    } else if (inTemplate) {
      if (c === '\\') { j++; continue; }
      if (c === '`') inTemplate = false;
      // Note: doesn't handle nested `${}` blocks correctly but might be enough
    } else if (inMultilineComment) {
      if (c === '*' && nextC === '/') {
        inMultilineComment = false;
        j++; continue;
      }
    }
  }
  inComment = false;
}

console.log(`Unclosed (:`, parenStack);
console.log(`Unclosed {:`, braceStack);
