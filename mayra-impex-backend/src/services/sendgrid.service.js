// SendGrid email service for Node.js
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 * @param {Array} [options.attachments] - Attachments (optional, see SendGrid docs)
 */
async function sendEmail({ to, subject, text, html, attachments }) {
  const msg = {
    to,
    from: process.env.EMAIL_USER, // Verified sender in SendGrid
    subject,
    text,
    html,
    attachments,
  };
  await sgMail.send(msg);
}

module.exports = { sendEmail };
