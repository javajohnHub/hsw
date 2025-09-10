const fs = require('fs');
const path = require('path');

// Test restore functionality
async function testRestore() {
  console.log('Testing restore functionality...');
  
  // Check if backup file exists
  const backupPath = 'test-backup.zip';
  if (!fs.existsSync(backupPath)) {
    console.log('No backup file found. Creating a test zip...');
    
    // First download a backup
    const { spawn } = require('child_process');
    const curl = spawn('curl', [
      '-X', 'GET',
      'http://localhost:3000/api/tournaments/admin/data/download',
      '-u', 'admin:admin123',
      '-o', 'test-backup.zip'
    ]);
    
    curl.on('close', (code) => {
      if (code === 0) {
        console.log('Backup downloaded successfully');
        uploadBackup();
      } else {
        console.log('Failed to download backup:', code);
      }
    });
  } else {
    console.log('Backup file exists, testing upload...');
    uploadBackup();
  }
}

function uploadBackup() {
  console.log('Testing restore upload...');
  
  const { spawn } = require('child_process');
  const curl = spawn('curl', [
    '-X', 'POST',
    'http://localhost:3000/api/tournaments/admin/data/restore',
    '-u', 'admin:admin123',
    '-F', 'zip=@test-backup.zip'
  ]);
  
  curl.stdout.on('data', (data) => {
    console.log('Response:', data.toString());
  });
  
  curl.stderr.on('data', (data) => {
    console.log('Error:', data.toString());
  });
  
  curl.on('close', (code) => {
    console.log('Upload completed with code:', code);
  });
}

testRestore();
