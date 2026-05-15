const { parse } = require('@babel/parser');
const fs = require('fs');

try {
  const code = fs.readFileSync('./src/services/rawgApi.js', 'utf8');
  parse(code, { sourceType: 'module' });
  console.log("No syntax errors");
} catch (e) {
  console.log("Syntax error:", e.message);
}
