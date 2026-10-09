require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

(async () => {
  try {
    console.log("--- EmailJS Configuration Test ---");
    console.log("Service ID:", process.env.EMAILJS_SERVICE_ID);
    console.log("Template ID:", process.env.EMAILJS_TEMPLATE_ID);
    console.log("Public Key Loaded:", !!process.env.EMAILJS_PUBLIC_KEY);
    console.log("Private Key Loaded:", !!process.env.EMAILJS_PRIVATE_KEY);

    console.log("\nAttempting to send email...");
    await sendEmail({
      to: 'rajeshdhasmana304@gmail.com', // Aapka test email
      subject: 'Test Configuration Email',
      html: '<p>If you receive this, your backend EmailJS setup is perfectly working!</p>'
    });
    
    console.log("\n✅ Test email execution completed!");
  } catch (error) {
    console.error("\n❌ Test email failed with error:", error);
  }
})();
