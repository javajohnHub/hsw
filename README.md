# Edwards Web Development

Professional web development services for businesses of all sizes.

## 🚀 Features

- **Modern Angular Frontend**: Responsive, mobile-first design
- **TypeScript Express Backend**: Secure API with form handling
- **Professional Design**: Clean, business-focused interface
- **Contact Form**: Integrated email system for inquiries
- **SEO Optimized**: Built with search engine optimization in mind
- **Mobile Responsive**: Perfect on all devices

## 📁 Project Structure

```
mybizsite/
├── frontend/          # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Reusable components
│   │   │   ├── pages/         # Page components
│   │   │   └── services/      # Angular services
│   │   └── assets/            # Static assets
│   └── package.json
├── backend/           # Express TypeScript API
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Custom middleware
│   │   └── server.ts          # Main server file
│   └── package.json
└── package.json       # Root package.json
```

## 🛠️ Technologies Used

### Frontend
- Angular 17
- TypeScript
- SCSS
- Reactive Forms
- Router

### Backend
- Node.js
- Express
- TypeScript
- Nodemailer (email service)
- Express Validator
- Rate Limiting
- CORS & Security middleware

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm
- PM2 (for production deployment)

### Installation

1. **Clone the repository** (if using git)
   ```bash
   git clone <repository-url>
   cd mybizsite
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **For Development**
   ```bash
   npm run dev
   ```

5. **For Production (PM2)**
   ```bash
   npm run build
   npm run start
   ```

   This will start:
   - Frontend at `http://localhost:4200`
   - Backend at `http://localhost:3000`

## 📧 Email Configuration

The contact form uses Nodemailer for sending emails. Configure your email settings in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CONTACT_EMAIL=john@edwardswebdev.com
```

For Gmail, you'll need to use an App Password instead of your regular password.

## 🔧 Available Scripts

### Root Level
- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start production servers with PM2
- `npm run stop` - Stop PM2 processes
- `npm run restart` - Restart PM2 processes
- `npm run status` - Check PM2 status
- `npm run logs` - View PM2 logs

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests

### PM2 Management
- `npm run start` - Start with PM2
- `npm run stop` - Stop PM2 processes
- `npm run restart` - Restart PM2 processes
- `npm run reload` - Reload PM2 processes (zero-downtime)
- `npm run status` - Check PM2 status
- `npm run logs` - View PM2 logs
- `npm run monit` - Monitor PM2 processes

## 🚀 Deployment

### Frontend
The Angular app can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

### Backend
The Express API can be deployed to:
- Heroku
- Railway
- DigitalOcean
- AWS EC2

## 📋 Features

## Dist packages (quick deploy)

Two lightweight dist packages are provided under `deployments/` to make simple production deployments easier:

- `deployments/edwards-backend-dist` — minimal package that can serve the Edwards frontend from `frontend/dist` and use the existing server if present.
- `deployments/tournament-backend-dist` — minimal package to serve the Tournament app; run `deployments/tournament-backend-dist/sync-dist.cmd` (Windows) or `sync-dist.sh` (Linux) to copy the built `tournament-app/client/dist/retro-never-dies-client` into the package.

Usage:

1. Populate the dist with the sync script (or copy files manually).
2. cd into the dist folder and run `npm ci`.
3. Start with `npm start` or run under a supervisor (systemd/PM2).

These packages use wrapper servers that will prefer existing project server files when available, otherwise fall back to a minimal static express server.


### Pages
- **Home**: Hero section with service overview
- **About**: Business information and expertise
- **Services**: Detailed service offerings
- **Contact**: Contact form and business information

### Components
- **Header**: Navigation with responsive menu
- **Footer**: Links and contact information
- **Contact Form**: Validated form with email integration

### API Endpoints
- `GET /health` - Health check
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get contact information

## 🔐 Security Features

- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- Email validation
- XSS protection

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🎨 Customization

### Colors
Main color scheme uses:
- Primary: #3b82f6 (blue)
- Secondary: #10b981 (green)
- Accent: #e11d48 (red)

### Typography
- Font: Inter (Google Fonts)
- Headings: 600-700 weight
- Body: 400-500 weight

## 📞 Support

For questions or support regarding this project:
- Email: john@edwardswebdev.com
- Phone: (555) 123-4567

## 📄 License

This project is licensed under the MIT License.
