"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContactEmail = void 0;
const sendContactEmail = async (data) => {
    console.log('📧 Contact form submission received:');
    console.log('Name:', data.name);
    console.log('Email:', data.email);
    console.log('Phone:', data.phone);
    console.log('Company:', data.company);
    console.log('Service:', data.service);
    console.log('Message:', data.message);
    console.log('---');
};
exports.sendContactEmail = sendContactEmail;
