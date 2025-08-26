const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});
EOF