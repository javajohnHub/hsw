"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const nodemailer_1 = __importDefault(require("nodemailer"));
const router = (0, express_1.Router)();
router.post('/send', [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Company name must not exceed 100 characters'),
    (0, express_validator_1.body)('service')
        .trim()
        .isIn(['website-development', 'web-application', 'e-commerce', 'maintenance', 'consultation', 'other'])
        .withMessage('Please select a valid service'),
    (0, express_validator_1.body)('budget')
        .optional()
        .trim()
        .isIn(['under-5k', '5k-10k', '10k-25k', '25k-50k', 'over-50k', 'discuss'])
        .withMessage('Please select a valid budget range'),
    (0, express_validator_1.body)('message')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters')
], async (req, res) => {
    try {
        console.log('📧 Edwards Web Development contact form submission received');
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('❌ Contact form validation errors:', errors.array());
            res.status(400).json({
                success: false,
                message: 'Please correct the validation errors',
                errors: errors.array()
            });
            return;
        }
        const contactData = req.body;
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        const emailSubject = `Edwards Web Development - New Client Inquiry from ${contactData.name}`;
        const emailText = `
Edwards Web Development - New Client Inquiry

Contact Information:
==================
Name: ${contactData.name}
Email: ${contactData.email}
Phone: ${contactData.phone || 'Not provided'}
Company: ${contactData.company || 'Individual/Not specified'}

Service Requirements:
===================
Service Interest: ${formatServiceName(contactData.service)}
Budget Range: ${formatBudgetRange(contactData.budget)}

Client Message:
=============
${contactData.message}

Inquiry Details:
==============
Submitted: ${new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York',
            dateStyle: 'full',
            timeStyle: 'long'
        })}
IP Address: ${req.ip || 'Not available'}
User Agent: ${req.headers['user-agent'] || 'Not available'}

---
Edwards Web Development
Professional Web Development Services
Contact: 419webdev@gmail.com
      `;
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #667eea; }
    .section h3 { margin-top: 0; color: #667eea; }
    .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 0.9em; }
    .highlight { background: #e7f3ff; padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Edwards Web Development</h1>
    <p>New Client Inquiry Received</p>
  </div>
  
  <div class="content">
    <div class="section">
      <h3>📋 Contact Information</h3>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
      <p><strong>Phone:</strong> ${contactData.phone ? `<a href="tel:${contactData.phone}">${contactData.phone}</a>` : 'Not provided'}</p>
      <p><strong>Company:</strong> ${contactData.company || 'Individual/Not specified'}</p>
    </div>
    
    <div class="section">
      <h3>💼 Service Requirements</h3>
      <p><strong>Service Interest:</strong> ${formatServiceName(contactData.service)}</p>
      <p><strong>Budget Range:</strong> ${formatBudgetRange(contactData.budget)}</p>
    </div>
    
    <div class="section">
      <h3>💬 Client Message</h3>
      <div class="highlight">
        <p>${contactData.message.replace(/\n/g, '<br>')}</p>
      </div>
    </div>
    
    <div class="section">
      <h3>📊 Inquiry Details</h3>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York',
            dateStyle: 'full',
            timeStyle: 'long'
        })}</p>
      <p><strong>Source IP:</strong> ${req.ip || 'Not available'}</p>
    </div>
  </div>
  
  <div class="footer">
    <p><strong>Edwards Web Development</strong><br>
    Professional Web Development Services<br>
    📧 <a href="mailto:419webdev@gmail.com">419webdev@gmail.com</a></p>
  </div>
</body>
</html>
      `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Edwards Web Development" <noreply@edwardswebdevelopment.com>',
            to: process.env.EMAIL_TO || '419webdev@gmail.com',
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
            replyTo: contactData.email
        });
        console.log('✅ Edwards Web Development client inquiry email sent successfully');
        const autoResponseSubject = 'Thank you for contacting Edwards Web Development';
        const autoResponseText = `
Dear ${contactData.name},

Thank you for your interest in Edwards Web Development services!

We have received your inquiry regarding ${formatServiceName(contactData.service)} and will review your requirements carefully. Our team of professional web developers will respond to your inquiry within 24 hours during business days.

Your Inquiry Summary:
- Service: ${formatServiceName(contactData.service)}
- Budget Range: ${formatBudgetRange(contactData.budget)}
- Submitted: ${new Date().toLocaleString()}

What happens next:
1. Our team will review your specific requirements
2. We'll prepare a customized proposal for your project
3. We'll schedule a consultation call to discuss your vision
4. We'll provide you with a detailed project timeline and quote

Edwards Web Development specializes in:
• Custom Website Development & Design
• Web Applications & E-commerce Solutions
• API Development & Third-party Integrations
• Website Maintenance & Performance Optimization
• SEO Optimization & Digital Marketing Support

If you have any urgent questions, please don't hesitate to contact us directly at 419webdev@gmail.com.

Best regards,
The Edwards Web Development Team

---
Edwards Web Development
Professional Web Development Services
Email: 419webdev@gmail.com
Website: Professional business solutions for your digital needs
      `;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Edwards Web Development" <419webdev@gmail.com>',
            to: contactData.email,
            subject: autoResponseSubject,
            text: autoResponseText,
            html: autoResponseText.replace(/\n/g, '<br>')
        });
        console.log('✅ Auto-response sent to client');
        res.status(200).json({
            success: true,
            message: 'Thank you for your message! We have received your inquiry and will contact you within 24 hours. Please check your email for a confirmation.'
        });
    }
    catch (error) {
        console.error('🚨 Edwards Web Development contact form error:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        res.status(500).json({
            success: false,
            message: 'We apologize, but there was an issue sending your message. Please try again or contact us directly at 419webdev@gmail.com.'
        });
    }
});
function formatServiceName(service) {
    const serviceMap = {
        'website-development': 'Custom Website Development',
        'web-application': 'Web Application Development',
        'e-commerce': 'E-commerce Solution',
        'maintenance': 'Website Maintenance & Support',
        'consultation': 'Web Development Consultation',
        'other': 'Other Services'
    };
    return serviceMap[service] || service;
}
function formatBudgetRange(budget) {
    if (!budget)
        return 'To be discussed';
    const budgetMap = {
        'under-5k': 'Under $5,000',
        '5k-10k': '$5,000 - $10,000',
        '10k-25k': '$10,000 - $25,000',
        '25k-50k': '$25,000 - $50,000',
        'over-50k': 'Over $50,000',
        'discuss': 'Prefer to discuss'
    };
    return budgetMap[budget] || budget;
}
router.get('/status', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Edwards Web Development contact service is operational',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        emailConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    });
});
router.get('/services', (req, res) => {
    res.status(200).json({
        success: true,
        services: [
            {
                id: 'website-development',
                name: 'Custom Website Development',
                description: 'Professional, responsive websites tailored to your business needs'
            },
            {
                id: 'web-application',
                name: 'Web Application Development',
                description: 'Complex web applications with advanced functionality'
            },
            {
                id: 'e-commerce',
                name: 'E-commerce Solutions',
                description: 'Complete online stores with payment processing and inventory management'
            },
            {
                id: 'maintenance',
                name: 'Website Maintenance & Support',
                description: 'Ongoing support, updates, and optimization for existing websites'
            },
            {
                id: 'consultation',
                name: 'Web Development Consultation',
                description: 'Expert advice on web development strategy and technology choices'
            },
            {
                id: 'other',
                name: 'Other Services',
                description: 'Custom solutions tailored to your unique business requirements'
            }
        ]
    });
});
exports.default = router;
