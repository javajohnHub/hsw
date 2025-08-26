Deploy package contents:
 - backend/            -> node/express backend (start with node index.js)
 - tournament-app-server/ -> optional server from tournament-app (if present)
 - www/                -> built frontend (nginx should serve this)
 - nginx-site.conf     -> example nginx server block
 - start-backend.sh    -> simple start (not a production startup)
 - start-backend.bat   -> Windows start script

Quick server steps (on Ubuntu):
1) Copy the zip contents to the server, place frontend at /var/www/tournament
2) Install Node/npm and restore backend dependencies
   cd /opt/tournament/backend
   npm ci
3) Configure nginx using the provided nginx-site.conf (edit server_name and paths)
   sudo mv nginx-site.conf /etc/nginx/sites-available/tournament.conf
   sudo ln -s /etc/nginx/sites-available/tournament.conf /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
4) Start backend (use pm2 or systemd for reliability):
   # example with pm2
   npm i -g pm2
   pm2 start index.js --name tournament-backend --cwd /opt/tournament/backend
   pm2 save

Notes:
 - This package builder does not run builds for you. Ensure the frontend is built and its output copied into a dist folder before running this script.
 - Adjust paths and ports to match your server layout.
