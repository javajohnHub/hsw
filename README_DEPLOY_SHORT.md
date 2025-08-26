Quick deploy checklist

1) Build frontend
   npm --prefix tournament-app/client run build

2) Run the packer script
   powershell -ExecutionPolicy Bypass -File build_deploy_zip.ps1 -OutFile tournament-deploy.zip -Force

3) Copy the zip to server and unpack (example Ubuntu):
   sudo apt update && sudo apt install -y unzip nodejs npm nginx
   sudo unzip tournament-deploy.zip -d /opt/tournament
   sudo mv /opt/tournament/www /var/www/tournament
   sudo mv /opt/tournament/backend /opt/tournament/backend

4) Configure nginx
   sudo mv /opt/tournament/nginx-site.conf /etc/nginx/sites-available/tournament.conf
   sudo ln -s /etc/nginx/sites-available/tournament.conf /etc/nginx/sites-enabled/
   sudo systemctl restart nginx

5) Start backend with pm2
   sudo npm i -g pm2
   cd /opt/tournament/backend
   npm ci
   pm2 start index.js --name tournament-backend
   pm2 save

Notes:
 - Edit nginx config server_name and path as needed.
 - For systemd service instead of pm2, create a service unit for the backend.
