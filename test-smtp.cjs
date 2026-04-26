const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("SMTP Error details below:");
    console.log(error);
  } else {
    console.log("SUCCESS! Server is ready to take our messages");
  }
});
