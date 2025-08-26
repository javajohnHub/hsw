interface ContactEmailData {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
}

export const sendContactEmail = async (data: ContactEmailData): Promise<void> => {
  // Just log contact form submissions to console
  console.log('📧 Contact form submission received:');
  console.log('Name:', data.name);
  console.log('Email:', data.email);
  console.log('Phone:', data.phone);
  console.log('Company:', data.company);
  console.log('Service:', data.service);
  console.log('Message:', data.message);
  console.log('---');
};
