const { sendEmail } = require("./sendgrid.service");

class EmailService {
  async sendCSVExportEmail({
    exportType,
    fileName,
    csvContent,
    requestedBy,
    pdfBuffer,
  }) {
    try {
      const destinationEmail =
        process.env.CSV_EXPORT_EMAIL ||
        process.env.ORDER_NOTIFICATION_EMAIL ||
        "rishabsainiupw165@gmail.com";

      const subject = `${exportType} CSV Export - Mayra Impex`;

      await sendEmail({
        to: destinationEmail,
        subject,
        text: `A ${exportType.toLowerCase()} CSV and PDF export was generated.${requestedBy?.email ? `\nRequested by: ${requestedBy.email}` : ""}`,
        attachments: [
          {
            filename: fileName,
            content: Buffer.from(csvContent).toString("base64"),
            type: "text/csv",
            disposition: "attachment",
          },
          ...(pdfBuffer
            ? [
                {
                  filename: fileName.replace(/\.csv$/, ".pdf"),
                  content: pdfBuffer.toString("base64"),
                  type: "application/pdf",
                  disposition: "attachment",
                },
              ]
            : []),
        ],
      });
      console.log("✅ CSV email sent");
      return { success: true };
    } catch (error) {
      console.error("❌ CSV email error:", error);
      throw error;
    }
  }

  async sendOrderEmail(orderDetails, pdfPath) {
    try {
      const destinationEmail =
        process.env.ORDER_NOTIFICATION_EMAIL || "rishabsainiupw165@gmail.com";

      const itemsList = orderDetails.items
        .map((item) => `- ${item.name} (Qty: ${item.quantity})`)
        .join("\n");

      // Read PDF and encode as base64 for attachment
      const fs = require("fs");
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString("base64");
      await sendEmail({
        to: destinationEmail,
        subject: `New Order #${orderDetails.orderId} - Mayra Impex`,
        text: `
New Order Request Received!

Order ID: #${orderDetails.orderId}
Date: ${orderDetails.orderDate}

Customer Details:
Name: ${orderDetails.customer.name}
Phone: ${orderDetails.customer.phone}

Delivery Details:
Name: ${orderDetails.delivery?.name || "-"}
Phone: ${orderDetails.delivery?.phone || "-"}
Shop Name: ${orderDetails.delivery?.shopName || "-"}
Address: ${orderDetails.delivery?.address || "-"}

Products Ordered:
${itemsList}

Please find the detailed order PDF attached.

---
Mayra Impex B2B Ordering System
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; margin-top: 20px; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #1e3a8a; }
    .products { background: white; padding: 15px; border-left: 4px solid #1e3a8a; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mayra Impex</h1>
      <p>New Order Request Received</p>
    </div>
    
    <div class="content">
      <div class="section">
        <p class="label">Order ID:</p>
        <p>#${orderDetails.orderId}</p>
      </div>
      
      <div class="section">
        <p class="label">Date:</p>
        <p>${orderDetails.orderDate}</p>
      </div>
      
      <div class="section">
        <p class="label">Customer Details:</p>
        <p><strong>Name:</strong> ${orderDetails.customer.name}</p>
        <p><strong>Phone:</strong> ${orderDetails.customer.phone}</p>
      </div>

      <div class="section">
        <p class="label">Delivery Details:</p>
        <p><strong>Name:</strong> ${orderDetails.delivery?.name || "-"}</p>
        <p><strong>Phone:</strong> ${orderDetails.delivery?.phone || "-"}</p>
        <p><strong>Shop Name:</strong> ${orderDetails.delivery?.shopName || "-"}</p>
        <p><strong>Address:</strong> ${orderDetails.delivery?.address || "-"}</p>
      </div>
      
      <div class="section">
        <p class="label">Products Ordered:</p>
        <div class="products">
          ${orderDetails.items
            .map(
              (item) => `
            <p>• ${item.name} <strong>(Qty: ${item.quantity})</strong></p>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Mayra Impex B2B Ordering System</p>
      <p>This is an automated email. Please check the attached PDF for complete order details.</p>
    </div>
  </div>
</body>
</html>
        `.trim(),
        attachments: [
          {
            filename: `order-${orderDetails.orderId}.pdf`,
            content: pdfBase64,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      });
      console.log("✅ Email sent");
      return { success: true };
    } catch (error) {
      console.error("❌ Email error:", error);
      throw error;
    }
  }
}

module.exports = new EmailService();
