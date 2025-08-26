const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const urlParts = url.parse(req.url, true);
    const admin = urlParts.query.admin || '0';
    
    // Handle all routes with a simple response
    res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
    });
    
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Tournament Management</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center; 
                    padding: 50px; 
                    margin: 0;
                    min-height: 100vh;
                    box-sizing: border-box;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    margin: 0 auto;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                }
                .mode-badge {
                    display: inline-block;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .admin { background: #28a745; }
                .viewer { background: #ffc107; color: #333; }
                .nav-link {
                    display: inline-block;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 25px;
                    margin: 10px;
                    transition: all 0.3s ease;
                }
                .nav-link:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🏆 Tournament Management System</h1>
                
                <div class="mode-badge ${admin === '1' ? 'admin' : 'viewer'}">
                    ${admin === '1' ? '👑 ADMIN MODE' : '👀 VIEWER MODE'}
                </div>
                
                <p><strong>Current Path:</strong> ${req.url}</p>
                <p><strong>Server:</strong> Port 4000 (Tournament Service)</p>
                
                ${admin === '1' ? `
                    <div>
                        <h3>🔧 Admin Functions</h3>
                        <p>✅ Create/Edit Tournaments</p>
                        <p>✅ Manage Players</p>
                        <p>✅ Control Matches</p>
                        <p>✅ View Analytics</p>
                    </div>
                ` : `
                    <div>
                        <h3>📺 Viewer Functions</h3>
                        <p>📊 View Tournament Brackets</p>
                        <p>🎮 Watch Live Matches</p>
                        <p>📈 Check Player Stats</p>
                        <p>🏅 See Results</p>
                    </div>
                `}
                
                <div style="margin-top: 40px;">
                    <a href="/" class="nav-link">🏠 Main Site</a>
                    <a href="/tournament/?admin=0" class="nav-link">👀 Viewer Mode</a>
                    <a href="/tournament/?admin=1" class="nav-link">👑 Admin Mode</a>
                </div>
                
                <p style="margin-top: 30px; opacity: 0.8; font-size: 0.9em;">
                    This is a simplified tournament interface. The full Angular app can be configured later.
                </p>
            </div>
        </body>
        </html>
    `);
});

server.listen(4000, () => {
    console.log('🏆 Simple Tournament server running on port 4000');
});
