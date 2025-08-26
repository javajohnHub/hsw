const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

/**
 * Edwards Web Development Production Builder
 * Creates integrated frontend + backend deployment package with proper cache invalidation
 * @returns {Promise<void>}
 */
async function buildProduction() {
  console.log('🚀 Edwards Web Development - Building Fresh Integrated Website Package');
  console.log('=====================================================================');

  const projectRoot = path.join(__dirname, '..');
  const outputPath = path.join(projectRoot, 'edwards-webdev-production.zip');

  try {
    // Force clean all previous builds and caches
    console.log('🧹 Force cleaning all Edwards Web Development builds and caches...');
    
    // Clean frontend dist
    const frontendDistDir = path.join(projectRoot, 'frontend', 'dist');
    if (fs.existsSync(frontendDistDir)) {
      fs.rmSync(frontendDistDir, { recursive: true, force: true });
      console.log('🗑️  Removed frontend/dist directory');
    }

    // Clean backend dist
    const backendDistDir = path.join(projectRoot, 'backend', 'dist');
    if (fs.existsSync(backendDistDir)) {
      fs.rmSync(backendDistDir, { recursive: true, force: true });
      console.log('🗑️  Removed backend/dist directory');
    }

    // Clean backend public (old frontend files)
    const publicDir = path.join(projectRoot, 'backend', 'public');
    if (fs.existsSync(publicDir)) {
      fs.rmSync(publicDir, { recursive: true, force: true });
      console.log('🗑️  Removed backend/public directory');
    }

    // Clean production package if it exists
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { force: true });
      console.log('🗑️  Removed previous production package');
    }

    // Clear npm caches for both frontend and backend
    try {
      execSync('npm cache clean --force', { cwd: projectRoot, stdio: 'inherit' });
      execSync('npm cache clean --force', { cwd: path.join(projectRoot, 'frontend'), stdio: 'inherit' });
      execSync('npm cache clean --force', { cwd: path.join(projectRoot, 'backend'), stdio: 'inherit' });
      console.log('🧹 Cleared npm caches');
    } catch (error) {
      console.warn('⚠️  Cache cleaning completed with warnings');
    }

    // Build backend TypeScript with fresh compilation
    console.log('🔧 Building Edwards Web Development backend TypeScript (fresh build)...');
    try {
      execSync('npm run build', { 
        cwd: path.join(projectRoot, 'backend'), 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      console.log('✅ Backend TypeScript compilation completed');
    } catch (error) {
      console.error('❌ Backend TypeScript compilation failed:', error.message);
      throw new Error('Backend build failed - please check TypeScript errors above');
    }

    // Build Angular frontend with fresh compilation and production optimizations
    console.log('🎨 Building Edwards Web Development Angular frontend (fresh build)...');
    try {
      // First clean Angular cache
      execSync('ng cache clean', { 
        cwd: path.join(projectRoot, 'frontend'), 
        stdio: 'inherit'
      });
      
      // Build with fresh cache
      execSync('ng build --configuration production --verbose --delete-output-path', { 
        cwd: path.join(projectRoot, 'frontend'), 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      console.log('✅ Angular frontend compilation completed');
    } catch (error) {
      console.error('❌ Frontend Angular build failed:', error.message);
      throw new Error('Frontend build failed - please check Angular build errors above');
    }

    // Verify fresh builds exist
    if (!fs.existsSync(backendDistDir)) {
      throw new Error('Backend dist directory not found - TypeScript compilation failed');
    }

    if (!fs.existsSync(frontendDistDir)) {
      throw new Error('Frontend dist directory not found - Angular build failed');
    }

    console.log('✅ Verified both backend and frontend builds exist');

    // Create logs directory
    const logsDir = path.join(projectRoot, 'backend', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created logs directory');
    }

    // Integrate frontend with backend - copy fresh Angular build to backend/public
    console.log('🔗 Integrating fresh Angular build with Express backend...');
    
    // Find Angular build output directory
    const distContents = fs.readdirSync(frontendDistDir);
    console.log('📂 Frontend dist contents:', distContents);
    
    const angularBuildDir = distContents.find(dir => 
      fs.statSync(path.join(frontendDistDir, dir)).isDirectory()
    );
    
    if (angularBuildDir) {
      const sourceDir = path.join(frontendDistDir, angularBuildDir);
      const sourceDirContents = fs.readdirSync(sourceDir);
      console.log(`📂 Angular build directory (${angularBuildDir}) contents:`, sourceDirContents);
      
      // Copy fresh Angular build to backend/public
      fs.cpSync(sourceDir, publicDir, { recursive: true });
      console.log('✅ Integrated fresh Angular frontend with Express backend');
      console.log(`📁 Frontend files copied from: ${sourceDir}`);
      console.log(`📁 Frontend files copied to: ${publicDir}`);
      
      // Verify critical files exist in the integration
      const indexPath = path.join(publicDir, 'index.html');
      if (!fs.existsSync(indexPath)) {
        throw new Error('index.html not found in Angular build output after integration');
      }
      
      // List all files in public directory for verification
      const publicContents = fs.readdirSync(publicDir);
      console.log('📂 Backend public directory contents:', publicContents);
      console.log('✅ Verified index.html exists for client-side routing');
      
      // Check for main JS files to ensure fresh build
      const jsFiles = publicContents.filter(file => file.endsWith('.js'));
      const cssFiles = publicContents.filter(file => file.endsWith('.css'));
      console.log(`📦 Found ${jsFiles.length} JavaScript files and ${cssFiles.length} CSS files`);
      
    } else {
      throw new Error('Angular build directory not found in frontend/dist');
    }

    // Create production environment configuration
    const prodEnvContent = `# Edwards Web Development - Production Environment Configuration
NODE_ENV=production
PORT=3000

# Admin Authentication (CHANGE THESE IN PRODUCTION!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Email Configuration for Contact Forms
EMAIL_FROM=419webdev@gmail.com
EMAIL_TO=419webdev@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=419webdev@gmail.com
SMTP_PASS=your-production-app-password

# CORS Configuration (Add your production domains)
ALLOWED_ORIGINS=https://edwardswebdevelopment.com,https://www.edwardswebdevelopment.com

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Build timestamp for cache busting
BUILD_TIMESTAMP=${Date.now()}
`;

    fs.writeFileSync(path.join(projectRoot, 'backend', '.env.production'), prodEnvContent);
    console.log('📄 Created production environment template with build timestamp');

    // Create deployment documentation with verification steps
    const deploymentDocs = `# Edwards Web Development - Fresh Integrated Deployment

## Build Information

- **Build Date:** ${new Date().toISOString()}
- **Build Type:** Fresh integrated deployment with cache invalidation
- **Architecture:** Express.js backend serving Angular frontend as static files

## Architecture

This deployment package contains a freshly built Edwards Web Development website:
- **Express.js backend** serves both API endpoints and static Angular files
- **Angular frontend** is served as static files from the backend
- **Single PM2 process** handles the entire application
- **Fresh build** with all caches cleared for latest changes

## Features

- ✅ Fresh integrated Express + Angular deployment
- ✅ Client-side routing support with catch-all handler
- ✅ Professional business website for web development services
- ✅ Contact form with email notifications
- ✅ Admin authentication system
- ✅ Production security middleware
- ✅ PM2 process management
- ✅ Comprehensive logging

## Quick Deployment

1. **Extract package:**
   \`\`\`bash
   unzip edwards-webdev-production.zip
   cd edwards-webdev-production
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install --production
   \`\`\`

3. **Configure environment:**
   \`\`\`bash
   cp .env.production .env
   nano .env  # Update with your settings
   \`\`\`

4. **Start Edwards Web Development:**
   \`\`\`bash
   npm run pm2:start
   \`\`\`

## Verification

After deployment, verify everything is working:

- **Website:** http://your-server-ip (Fresh Angular frontend)
- **API Health:** http://your-server-ip/health
- **API Status:** http://your-server-ip/api/status
- **Admin Login:** http://your-server-ip/login

## Cache Busting

This build includes timestamp-based cache busting to ensure fresh content delivery.

## Management Commands

- \`pm2 logs edwards-webdev-api\` - View logs
- \`pm2 restart edwards-webdev-api\` - Restart
- \`pm2 monit\` - Monitor performance
- \`pm2 status\` - Check status

---
**Edwards Web Development** - Professional Web Development Services
Fresh Build: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(projectRoot, 'DEPLOYMENT.md'), deploymentDocs);
    console.log('📄 Created fresh deployment documentation');

    // Create production package.json with build info
    const prodPackageJson = {
      "name": "edwards-webdev-production",
      "version": "1.0.0",
      "description": "Edwards Web Development - Fresh Integrated Angular + Express production deployment",
      "main": "dist/server.js",
      "buildInfo": {
        "buildDate": new Date().toISOString(),
        "buildType": "fresh-integrated",
        "version": "1.0.0"
      },
      "scripts": {
        "start": "node dist/server.js",
        "pm2:start": "pm2 start ecosystem.config.js --env production",
        "pm2:stop": "pm2 stop edwards-webdev-api",
        "pm2:restart": "pm2 restart edwards-webdev-api",
        "pm2:delete": "pm2 delete edwards-webdev-api",
        "pm2:logs": "pm2 logs edwards-webdev-api",
        "pm2:monitor": "pm2 monit"
      },
      "dependencies": {
        "compression": "^1.8.0",
        "cors": "^2.8.5",
        "dotenv": "^16.0.3",
        "express": "^4.18.2",
        "express-rate-limit": "^6.7.0",
        "express-validator": "^6.15.0",
        "helmet": "^7.0.0",
        "nodemailer": "^6.9.7"
      },
      "keywords": [
        "edwards-web-development",
        "fresh-build",
        "integrated-deployment",
        "angular-express",
        "business-website",
        "production"
      ],
      "author": "Edwards Web Development",
      "license": "MIT",
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=9.0.0"
      }
    };

    fs.writeFileSync(
      path.join(projectRoot, 'production-package.json'), 
      JSON.stringify(prodPackageJson, null, 2)
    );

    // Create production ZIP package
    console.log('📦 Creating Edwards Web Development fresh integrated package...');
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log('\n✅ Edwards Web Development FRESH integrated package created!');
        console.log(`📊 Package Location: ${outputPath}`);
        console.log(`📊 Package Size: ${sizeInMB} MB`);
        console.log(`🕒 Build Timestamp: ${new Date().toISOString()}`);
        console.log('\n🏗️  Package Contents (Fresh Build):');
        console.log('   - Express backend (freshly compiled TypeScript)');
        console.log('   - Angular frontend (fresh build with cache invalidation)');
        console.log('   - PM2 configuration for single process');
        console.log('   - Production environment template with build timestamp');
        console.log('   - Fresh deployment documentation');
        console.log('\n🚀 Ready for Edwards Web Development fresh deployment!');
        console.log('\n⚠️  Note: This build cleared all caches to ensure fresh content');
        resolve();
      });

      archive.on('error', (err) => {
        console.error('❌ Error creating fresh package:', err);
        reject(err);
      });

      archive.pipe(output);

      // Add all necessary files for fresh integrated deployment
      archive.directory(backendDistDir, 'dist');
      archive.directory(publicDir, 'public');
      archive.file(path.join(projectRoot, 'production-package.json'), { name: 'package.json' });
      archive.file(path.join(projectRoot, 'backend', 'ecosystem.config.js'), { name: 'ecosystem.config.js' });
      archive.file(path.join(projectRoot, 'backend', '.env.production'), { name: '.env.production' });
      archive.file(path.join(projectRoot, 'DEPLOYMENT.md'), { name: 'README.md' });
      
      // Create logs directory placeholder
      archive.append('', { name: 'logs/.gitkeep' });

      archive.finalize();
    });

  } catch (error) {
    console.error('❌ Edwards Web Development fresh build failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  buildProduction().catch(console.error);
}

module.exports = buildProduction;