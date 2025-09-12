const fs = require('fs');
const path = require('path');

const matchesPath = path.join(__dirname, 'data', 'matches.json');
let matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

// Replace all Apollofish_Games with tbdt
matches = matches.map(match => {
  const updated = {...match};
  if (updated.player1 === 'Apollofish_Games') updated.player1 = 'tbdt';
  if (updated.player2 === 'Apollofish_Games') updated.player2 = 'tbdt';
  if (updated.winner === 'Apollofish_Games') updated.winner = 'tbdt';
  if (updated.loser === 'Apollofish_Games') updated.loser = 'tbdt';
  if (updated.dqPlayer === 'Apollofish_Games') updated.dqPlayer = 'tbdt';
  return updated;
});

fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
console.log('Fixed all Apollofish_Games references');
