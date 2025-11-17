const fs = require('fs');

const filePath = process.argv[2];
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

let openDivs = [];
let errors = [];

lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Count opening divs
    const openMatches = line.match(/<div[^>]*>/g);
    if (openMatches) {
        openMatches.forEach(() => {
            openDivs.push(lineNum);
        });
    }

    // Count closing divs
    const closeMatches = line.match(/<\/div>/g);
    if (closeMatches) {
        closeMatches.forEach(() => {
            if (openDivs.length === 0) {
                errors.push(`Line ${lineNum}: Closing div without opening (${line.trim().substring(0, 60)})`);
            } else {
                openDivs.pop();
            }
        });
    }

    // Report status around problem areas
    if ((lineNum >= 1635 && lineNum <= 1645) || (lineNum >= 1625 && lineNum <= 1635)) {
        console.log(`Line ${lineNum}: ${openDivs.length} open divs - ${line.trim().substring(0, 70)}`);
    }
});

console.log('\n=== Summary ===');
console.log(`Total unclosed divs: ${openDivs.length}`);
if (openDivs.length > 0) {
    console.log(`Lines with unclosed divs: ${openDivs.slice(-10)}`);
}

if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(err => console.log(err));
}
