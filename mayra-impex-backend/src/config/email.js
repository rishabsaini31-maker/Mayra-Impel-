const nodemailer = require("nodemailer");

// Email transporter configuration

// Verify SMTP only when explicitly enabled to avoid startup timeouts on some hosts.
// Deprecated: Nodemailer config is no longer used. Email is now sent via SendGrid (see sendgrid.service.js).
// This file is retained for reference only and can be removed after migration is fully validated.

module.exports = null; // Exporting null as the transporter is deprecated
