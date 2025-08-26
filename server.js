const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Health check
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            service: 'Edwards Web Development',
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    // API endpoints
    if (req.url === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.username === 'HSWAdmin42069' && data.password === 'highscorewins') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Login successful' }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }
    
    // Contact form endpoint
    if (req.url === '/api/contact' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('Contact form submission:', data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Thank you for your message! We will get back to you soon.' 
                }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }
    
    // Serve static files
    let filePath = path.join(process.cwd(), 'public', req.url === '/' ? 'index.html' : req.url);
    
    // Security check
    if (!filePath.startsWith(path.join(process.cwd(), 'public'))) {
        res.writeHead(403);
        res.end('Access denied');
        return;
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            // If file not found, serve index.html for SPA routing
            filePath = path.join(process.cwd(), 'public', 'index.html');
            fs.readFile(filePath, (err2, content2) => {
                if (err2) {
                    res.writeHead(404);
                    res.end('File not found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content2);
                }
            });
        } else {
            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.ico': 'image/x-icon',
                '.webp': 'image/webp'
            }[ext] || 'text/plain';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Edwards Web Development server running on port ${PORT}`);
    console.log(`📁 Serving frontend from: ${path.join(process.cwd(), 'public')}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
});