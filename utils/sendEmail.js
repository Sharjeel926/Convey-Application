const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const sendVerificationEmail = (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AdminEmail,
      pass: process.env.AdminPassword,
    },
  });

  const mailOptions = {
    from: process.env.AdminEmail,
    to: email,
    subject: "Email verification",
    text: `Your otp is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`Verification sent to your email`);
    }
  });
};

module.exports = sendVerificationEmail;
