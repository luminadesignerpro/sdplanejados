const fs = require('fs');
let script = fs.readFileSync('script10.js', 'utf8');

// Wrap calcVidro in try-catch
const calcVidroStart = script.indexOf('function calcVidro() {');
let braceCount = 0, inFunction = false, calcVidroEnd = -1;
for (let i = calcVidroStart; i < script.length; i++) {
  const ch = script[i];
  if (ch === '{') { braceCount++; inFunction = true; }
  else if (ch === '}') { braceCount--; if (inFunction && braceCount === 0) { calcVidroEnd = i + 1; break; } }
}

let calcVidroFunc = script.substring(calcVidroStart, calcVidroEnd);
const firstBrace = calcVidroFunc.indexOf('{');
const funcHeader = calcVidroFunc.substring(0, firstBrace + 1);
const funcBody = calcVidroFunc.substring(firstBrace + 1, calcVidroFunc.length - 1);

const newCalcVidro = funcHeader + '\n  try {' + funcBody + '\n  } catch (e) {\n    console.error("calcVidro erro:", e);\n    if (res) {\n      res.style.display = "block";\n      res.innerHTML = \`<div style="padding:14px;color:#ef4444;">⚠️ Erro no cálculo: ${e.message}</div>\`;\n    }\n  }\n}';

script = script.substring(0, calcVidroStart) + newCalcVidro + script.substring(calcVidroEnd);
console.log('calcVidro wrapped');

// Now calcMovel
const calcMovelStart = script.indexOf('function calcMovel() {');
braceCount = 0; inFunction = false; calcMovelEnd = -1;
for (let i = calcMovelStart; i < script.length; i++) {
  const ch = script[i];
  if (ch === '{') { braceCount++; inFunction = true; }
  else if (ch === '}') { braceCount--; if (inFunction && braceCount === 0) { calcMovelEnd = i + 1; break; } }
}

let calcMovelFunc = script.substring(calcMovelStart, calcMovelEnd);
const firstBrace2 = calcMovelFunc.indexOf('{');
const funcHeader2 = calcMovelFunc.substring(0, firstBrace2 + 1);
const funcBody2 = calcMovelFunc.substring(firstBrace2 + 1, calcMovelFunc.length - 1);

const newCalcMovel = funcHeader2 + '\n  try {' + funcBody2 + '\n  } catch (e) {\n    console.error("calcMovel erro:", e);\n    if (res) {\n      res.style.display = "block";\n      res.innerHTML = \`<div style="padding:14px;color:#ef4444;">⚠️ Erro no cálculo: ${e.message}</div>\`;\n    }\n  }\n}';

script = script.substring(0, calcMovelStart) + newCalcMovel + script.substring(calcMovelEnd);
console.log('calcMovel wrapped');

fs.writeFileSync('script10_modified.js', script);
console.log('Modified script saved, length:', script.length);