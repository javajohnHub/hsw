const fs = require('fs');
const path = require('path');

// Create SVG logo with transparent background
const svg = `
<svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
  <!-- Logo symbol - stylized 'E' -->
  <rect x="10" y="10" width="60" height="60" fill="#2980b9" />
  <rect x="20" y="20" width="40" height="8" fill="white" />
  <rect x="20" y="36" width="30" height="8" fill="white" />
  <rect x="20" y="52" width="40" height="8" fill="white" />
  
  <!-- Company name -->
  <text x="80" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#2c3e50">
    Edwards Web Development
  </text>
  
  <!-- Tagline -->
  <text x="80" y="55" font-family="Arial, sans-serif" font-size="12" fill="#2c3e50">
    Professional Web Solutions
  </text>
</svg>
`;

// Write SVG file
const svgPath = path.join(__dirname, 'frontend', 'src', 'assets', 'edwards-logo-transparent.svg');
fs.writeFileSync(svgPath, svg);

console.log('SVG logo created successfully: edwards-logo-transparent.svg');

// Also create a simple PNG version using HTML5 Canvas approach
const createPNGVersion = () => {
  const canvasCode = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 20px; }
        canvas { border: 1px solid #ccc; }
    </style>
</head>
<body>
    <canvas id="logoCanvas" width="400" height="80"></canvas>
    <script>
        const canvas = document.getElementById('logoCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas (transparent background)
        ctx.clearRect(0, 0, 400, 80);
        
        // Draw logo symbol
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(10, 10, 60, 60);
        
        // Draw E cutouts
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(20, 20, 40, 8);
        ctx.clearRect(20, 36, 30, 8);
        ctx.clearRect(20, 52, 40, 8);
        
        // Draw company name
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Edwards Web Development', 80, 35);
        
        // Draw tagline
        ctx.font = '12px Arial';
        ctx.fillText('Professional Web Solutions', 80, 55);
        
        // Download as PNG
        const link = document.createElement('a');
        link.download = 'edwards-logo-transparent.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    </script>
</body>
</html>
  `;
  
  const htmlPath = path.join(__dirname, 'logo-generator.html');
  fs.writeFileSync(htmlPath, canvasCode);
  console.log('HTML logo generator created: logo-generator.html');
  console.log('Open this file in a browser to generate the PNG logo');
};

createPNGVersion();
