const { execSync } = require('child_process');
const path = require('path');

/**
 * Edwards Web Development Quick Deploy
 * Builds and deploys the professional business website in one command
 * @returns {Promise<void>}
 */
async function quickDeploy() {
  console.log('🚀 Edwards Web Development - Quick Deploy to Production');
  console.log('=====================================================');
  
  const projectRoot = path.join(__dirname, '..');
  
  try {
    // Build Edwards Web Development production package
    console.log('📦 Building Edwards Web Development production package...');
    execSync('npm run build:prod', { 
      cwd: projectRoot, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    // Deploy Edwards Web Development to server
    console.log('🚀 Deploying Edwards Web Development to production server...');
    execSync('node scripts/deploy-to-server.js', { 
      cwd: projectRoot, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    console.log('\n✅ Edwards Web Development quick deploy completed successfully!');
    console.log('🌐 Your professional web development business website is now live!');
    
  } catch (error) {
    console.error('❌ Edwards Web Development quick deploy failed:', error.message);
    console.error('💡 Please check the build logs above for specific error details.');
    process.exit(1);
  }
}

if (require.main === module) {
  quickDeploy();
}

module.exports = { quickDeploy };