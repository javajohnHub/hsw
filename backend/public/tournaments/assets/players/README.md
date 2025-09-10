# Player Images

## Image Requirements
- **Format**: WebP (preferred), JPG, or PNG
- **Size**: Recommended 256x256px or higher (square aspect ratio)
- **Naming**: Lowercase player name with special characters removed

## Current Players and Required Images:

1. `highscorewins.webp` - HighScoreWins
2. `apollofish_games.webp` - Apollofish_Games
3. `eeyoredad.webp` - EeyoreDad
4. `foochcade.webp` - FOOCHcade
5. `dab_a_dab0711.webp` - Dab_a_dab0711
6. `crownjo.webp` - Crownjo
7. `fizikzbound.webp` - Fizikzbound
8. `aztek138.webp` - aztek138
9. `jammin247.webp` - Jammin247
10. `momoneygaming.webp` - MoMoneyGaming
11. `xtremepot420.webp` - Xtremepot420
12. `bwhizzle817.webp` - BWhizzle817

## Naming Convention:
- Convert player name to lowercase
- Remove special characters except underscores
- Keep underscores as-is
- Add `.webp` extension

Example: "Player_Name123!" becomes "player_name123.webp"

## Adding New Players:
When adding new players through the admin interface:
1. Add the player with their name
2. Optionally specify a custom image URL in the "Image URL" field
3. If no custom URL is provided, the system will automatically generate a path based on the player name
4. Add the corresponding image file to this directory

## Image Display:
- Public page: Shows player avatar (40x40px) next to name in leaderboard
- Admin page: Shows player avatar (48x48px) in player management
- Automatic fallback behavior if image is missing
