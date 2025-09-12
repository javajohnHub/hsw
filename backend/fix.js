const fs = require('fs');
const path = require('path');

console.log('Fixing Apollofish_Games -> tbdt in matches.json...');

const matchesFile = path.join(__dirname, 'data', 'matches.json');
let content = fs.readFileSync(matchesFile, 'utf8');

const oldName = 'Apollofish_Games';
const newName = 'tbdt';

// Count occurrences before
const beforeCount = (content.match(new RegExp(oldName, 'g')) || []).length;
console.log(`Found ${beforeCount} occurrences of "${oldName}"`);

// Replace all occurrences
content = content.replace(new RegExp(oldName, 'g'), newName);

// Count after
const afterCount = (content.match(new RegExp(oldName, 'g')) || []).length;
console.log(`After replacement: ${afterCount} occurrences remaining`);

// Write back
fs.writeFileSync(matchesFile, content);
console.log(`Updated matches.json - replaced ${beforeCount} instances`);
