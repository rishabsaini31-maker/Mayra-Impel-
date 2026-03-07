// Nodemailer email service for Node.js
const nodemailer = require("nodemailer");
const fs = require("fs");

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using Nodemailer
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 * @param {Array} [options.attachments] - Attachments (optional, see Nodemailer docs)
 */
async function sendEmail({ to, subject, text, html, attachments }) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments: attachments?.map((att) => ({
      filename: att.filename,
      content: att.content ? Buffer.from(att.content, "base64") : undefined,
      path: att.path,
      contentType: att.type,
      disposition: att.disposition,
    })),
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Nodemailer email sent");
  } catch (error) {
    console.error("❌ Nodemailer send error:", error);
    throw error;
  }
}

module.exports = { sendEmail };
