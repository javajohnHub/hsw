const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const playersPath = path.join(dataDir, 'players.json');
const matchesPath = path.join(dataDir, 'matches.json');

console.log('Reading current data...');
const players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

console.log('Current players:', players.map(p => ({ id: p.id, name: p.name })));

// Find the old name that needs to be cascaded
const oldName = "Apollofish_Games";
const newName = "tbdt";

console.log(`\nLooking for matches with "${oldName}" to update to "${newName}"...`);

let updateCount = 0;
const updatedMatches = matches.map(match => {
  const updatedMatch = { ...match };
  let updated = false;
  
  // Update player1 and player2 fields
  if (updatedMatch.player1 === oldName) {
    updatedMatch.player1 = newName;
    updated = true;
    updateCount++;
    console.log(`Match ${match.id}: Updated player1 from "${oldName}" to "${newName}"`);
  }
  if (updatedMatch.player2 === oldName) {
    updatedMatch.player2 = newName;
    updated = true;
    updateCount++;
    console.log(`Match ${match.id}: Updated player2 from "${oldName}" to "${newName}"`);
  }
  
  // Update winner and loser fields if they exist
  if (updatedMatch.winner === oldName) {
    updatedMatch.winner = newName;
    updated = true;
    updateCount++;
    console.log(`Match ${match.id}: Updated winner from "${oldName}" to "${newName}"`);
  }
  if (updatedMatch.loser === oldName) {
    updatedMatch.loser = newName;
    updated = true;
    updateCount++;
    console.log(`Match ${match.id}: Updated loser from "${oldName}" to "${newName}"`);
  }
  
  // Update dqPlayer field if it exists
  if (updatedMatch.dqPlayer === oldName) {
    updatedMatch.dqPlayer = newName;
    updated = true;
    updateCount++;
    console.log(`Match ${match.id}: Updated dqPlayer from "${oldName}" to "${newName}"`);
  }
  
  return updatedMatch;
});

console.log(`\nTotal field updates: ${updateCount}`);

if (updateCount > 0) {
  console.log('Saving updated matches...');
  fs.writeFileSync(matchesPath, JSON.stringify(updatedMatches, null, 2));
  console.log('Matches updated successfully!');
} else {
  console.log('No matches found with the old name.');
}
