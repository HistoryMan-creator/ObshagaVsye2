const fs = require('fs');
const data = fs.readFileSync('data.js', 'utf8');

const regex = /a:\s*(['"`])(.*?)\1,\s*options:\s*\[(.*?)\]/g;
let m;
let issues = 0;
while ((m = regex.exec(data)) !== null) {
    const a = m[2];
    const optionsStr = m[3];
    // parse options
    const optRegex = /(['"`])(.*?)\1/g;
    let optMatch;
    let validOpts = [];
    while ((optMatch = optRegex.exec(optionsStr)) !== null) {
        validOpts.push(optMatch[2]);
    }
    
    let matched = 0;
    for (const opt of validOpts) {
        if (a.toLowerCase().includes(opt.toLowerCase())) {
            matched++;
        }
    }
    
    if (matched !== 1) {
        console.log(`WARNING: Answer "${a}" matches ${matched} options! Options:`, validOpts);
        issues++;
    }
}
console.log('Total issues:', issues);
