const fs = require('fs');
const content = fs.readFileSync('data.js', 'utf8');

// A safer way to check options vs answers.
// We can just extract all "a:" and "options:" lines in pairs if they are close.
const lines = content.split('\n');
let issues = 0;
let lastA = null;
for(let i=0; i<lines.length; i++) {
    const l = lines[i];
    if(l.includes('a: "') || l.includes("a: '")) {
        const match = l.match(/a:\s*(['"])(.*?)\1/);
        if (match) lastA = match[2];
    }
    if(l.includes('options: [')) {
        const match = l.match(/options:\s*\[(.*?)\]/);
        if (match && lastA) {
            const opts = match[1].split(',').map(s=>s.trim().replace(/^['"]|['"]$/g, ''));
            let found = false;
            for(const o of opts) {
                if(lastA.toLowerCase().includes(o.toLowerCase())) found = true;
            }
            if(!found) {
                console.log(`Mismatch at line ${i+1}:\n Answer: ${lastA}\n Options: ${opts}`);
                issues++;
            }
            lastA = null;
        }
    }
}
console.log('Total option mismatches:', issues);
