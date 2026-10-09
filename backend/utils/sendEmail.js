const emailjs = require('@emailjs/nodejs');

const sendEmail = async ({ to, subject, html, link }) => {
  // DEV-MODE FALLBACK: Agar EmailJS credentials .env mein nahi hain, toh email console mein print karo
  if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) {
    console.log('--- EMAIL (dev mode - EmailJS) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log('--- END EMAIL ---');
    
    // Yahan se aage mat badho, real email mat bhejo
    return;
  }

  try {
    const templateParams = {
      email: to,
      subject: subject,
      message: html, // We'll pass plain text here
      link: link     // Link variable for the button
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY, 
      }
    );

    console.log('Email sent successfully via EmailJS!', response.status, response.text);
  } catch (error) {
    console.error('Failed to send email via EmailJS:', error);
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;
