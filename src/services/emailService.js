const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails using nodemailer
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment configuration
   */
  initializeTransporter() {
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    // For development, use ethereal email if no credentials provided
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️  Email credentials not configured. Using test mode.');
      // In production, you should throw an error here
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service error:', error.message);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  /**
   * Send a basic email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @param {Array} options.attachments - Attachments
   * @returns {Promise}
   */
  async sendEmail({ to, subject, text, html, attachments = [] }) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Fresh Dairy'} <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✉️  Email sent:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      throw error;
    }
  }

  /**
   * Send invoice email with PDF attachment
   * @param {Object} options
   * @param {string} options.to - Customer email
   * @param {string} options.customerName - Customer name
   * @param {string} options.invoiceNumber - Invoice number
   * @param {number} options.totalAmount - Invoice total
   * @param {string} options.dueDate - Due date
   * @param {Buffer} options.pdfBuffer - PDF buffer
   * @returns {Promise}
   */
  async sendInvoiceEmail({ to, customerName, invoiceNumber, totalAmount, dueDate, pdfBuffer }) {
    const subject = `Invoice ${invoiceNumber} - Fresh Dairy`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
          .amount { font-size: 24px; font-weight: bold; color: #4CAF50; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥛 Fresh Dairy</h1>
            <p>Invoice Statement</p>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>

            <p>Thank you for your continued business! Please find attached your invoice for the current billing period.</p>

            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Total Amount:</strong> <span class="amount">₹${totalAmount.toFixed(2)}</span></p>
              <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <p>The invoice is attached to this email as a PDF. Please review and process the payment by the due date to avoid any service interruption.</p>

            <p><strong>Payment Methods:</strong></p>
            <ul>
              <li>Cash payment to delivery person</li>
              <li>UPI/Online transfer</li>
              <li>Cheque/Bank transfer</li>
            </ul>

            <p>If you have any questions or concerns regarding this invoice, please don't hesitate to contact us.</p>

            <div class="footer">
              <p>Thank you for choosing Fresh Dairy!</p>
              <p style="font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Dear ${customerName},

Thank you for your continued business! Please find attached your invoice for the current billing period.

Invoice Number: ${invoiceNumber}
Total Amount: ₹${totalAmount.toFixed(2)}
Due Date: ${new Date(dueDate).toLocaleDateString('en-IN')}

The invoice is attached to this email as a PDF. Please review and process the payment by the due date.

Thank you for choosing Fresh Dairy!
    `;

    return await this.sendEmail({
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
  }

  /**
   * Send payment confirmation email
   * @param {Object} options
   */
  async sendPaymentConfirmationEmail({ to, customerName, paymentCode, amount, paymentDate, paymentMethod }) {
    const subject = `Payment Received - ${paymentCode}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .payment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
          .amount { font-size: 24px; font-weight: bold; color: #2196F3; }
          .checkmark { font-size: 48px; color: #4CAF50; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥛 Fresh Dairy</h1>
            <p>Payment Confirmation</p>
          </div>
          <div class="content">
            <div class="checkmark">✓</div>
            <h2 style="text-align: center; color: #4CAF50;">Payment Received Successfully!</h2>

            <p>Dear ${customerName},</p>

            <p>We have successfully received your payment. Thank you for your prompt payment!</p>

            <div class="payment-details">
              <p><strong>Payment Reference:</strong> ${paymentCode}</p>
              <p><strong>Amount Paid:</strong> <span class="amount">₹${amount.toFixed(2)}</span></p>
              <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
            </div>

            <p>This payment has been applied to your account and will reflect in your next statement.</p>

            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to,
      subject,
      html
    });
  }

  /**
   * Send delivery reminder email
   * @param {Object} options
   */
  async sendDeliveryReminderEmail({ to, customerName, deliveryDate, products }) {
    const subject = `Delivery Scheduled for ${new Date(deliveryDate).toLocaleDateString('en-IN')}`;

    const productList = products.map(p => `<li>${p.quantity} ${p.unit} of ${p.productName}</li>`).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🥛 Fresh Dairy</h1>
            <p>Delivery Reminder</p>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>

            <p>This is a reminder that your delivery is scheduled for <strong>${new Date(deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>

            <p><strong>Products to be delivered:</strong></p>
            <ul>
              ${productList}
            </ul>

            <p>Please ensure someone is available to receive the delivery.</p>

            <p>Thank you for choosing Fresh Dairy!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to,
      subject,
      html
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
