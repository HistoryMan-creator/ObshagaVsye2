const fs = require('fs');
const content = fs.readFileSync('data.js', 'utf8');

// Use regex to find all "q:" and "a:" strings
const qRegex = /q:\s*(['"`])(.*?)\1/g;
const aRegex = /a:\s*(['"`])(.*?)\1/g;

let qs = [];
let match;
while ((match = qRegex.exec(content)) !== null) {
    qs.push(match[2]);
}

let as = [];
while ((match = aRegex.exec(content)) !== null) {
    as.push(match[2]);
}

// Find Task 18 terms
const termRegex = /"([^"]+)":\s*{\s*textReference:/g;
let terms = [];
while ((match = termRegex.exec(content)) !== null) {
    terms.push(match[1]);
}

let out = "TERMS:\n" + terms.join(', ') + "\n\nQ&A:\n";
for(let i=0; i<Math.min(qs.length, as.length); i++) {
    out += `Q: ${qs[i]}\nA: ${as[i]}\n\n`;
}

fs.writeFileSync('facts.txt', out);
console.log('Facts extracted to facts.txt');
