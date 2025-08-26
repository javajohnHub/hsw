# RND Overlay Tournament Management - Electron Desktop App

This is the Electron desktop application version of the RND Overlay Tournament Management system.

## Features

- **Desktop Application**: Runs as a native desktop app on Windows, Mac, and Linux
- **Built-in Server**: Includes the backend server, no need for separate installation
- **Tournament Management**: Complete player, match, and season management
- **Spinning Wheels**: Player selection and game selection wheels
- **Admin Interface**: Full administrative controls
- **Persistent Data**: All data stored locally in JSON files

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run electron:dev
   ```
   This will start both the Angular dev server and Electron app.

### Building for Production

#### Quick Start (Windows)
- Double-click `start-electron.bat` to run the app
- Double-click `build-electron.bat` to create a distributable

#### Manual Commands
1. Build Electron main process:
   ```bash
   npm run build:electron
   ```

2. Build Angular app:
   ```bash
   npm run build
   ```

3. Run Electron:
   ```bash
   npm run electron
   ```

4. Create distributable:
   ```bash
   npm run electron:dist
   ```

### Available Scripts

- `npm run electron:dev` - Run in development mode with hot reload
Electron packaging removed

This file previously documented Electron desktop packaging for the Tournament app.

The current web-first branch has removed Electron packaging and scripts. Restore from git history or a dedicated branch if desktop builds are required.

