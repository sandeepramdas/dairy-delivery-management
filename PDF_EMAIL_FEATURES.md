# PDF Invoice & Email Features

## Overview
Your dairy delivery system now has **PDF invoice generation** and **email sending** capabilities!

## Features Added

### 1. **PDF Invoice Generation**
- Professional, beautifully formatted PDF invoices
- Company branding and details
- Customer information with full address
- Itemized line items table
- Subtotals, tax, discounts, and totals
- Payment information and bank details
- Invoice status with color coding

### 2. **Email Service**
- Send invoices via email with PDF attachment
- Send payment confirmation emails
- Send delivery reminder emails
- Professional HTML email templates
- Automatic status updates when invoice is sent

## API Endpoints

### Download Invoice PDF
```http
GET /api/v1/invoices/:id/download
Authorization: Bearer {token}
```

**Description:** Downloads the invoice as a PDF file

**Response:** PDF file download

**Example:**
```bash
curl -X GET http://localhost:3000/api/v1/invoices/{invoice_id}/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf
```

### Send Invoice via Email
```http
POST /api/v1/invoices/:id/send-email
Authorization: Bearer {token}
Roles: admin, manager
```

**Request Body:**
```json
{
  "email": "customer@example.com"  // Optional: override customer email
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice sent successfully",
  "data": {
    "sent_to": "customer@example.com"
  }
}
```

**Features:**
- Automatically uses customer email if not provided
- Attaches PDF invoice to email
- Updates invoice status from 'draft' to 'sent'
- Professional HTML email template

## Email Configuration

### Gmail Setup (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Scroll to "App passwords"
   - Generate password for "Mail" and "Other (Custom name)"
   - Copy the 16-character password

3. **Update `.env` file:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM_NAME=Fresh Dairy
```

### Production Email Services

For production, consider using professional email services:

#### **SendGrid** (Recommended)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

#### **AWS SES**
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your_aws_smtp_username
EMAIL_PASSWORD=your_aws_smtp_password
```

#### **Mailgun**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your_mailgun_password
```

## Usage Examples

### Example 1: Download Invoice PDF

```javascript
// Frontend code
const downloadInvoice = async (invoiceId) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/invoices/${invoiceId}/download`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${invoiceId}.pdf`;
  a.click();
};
```

### Example 2: Send Invoice Email

```javascript
// Frontend code
const sendInvoiceEmail = async (invoiceId, email) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/invoices/${invoiceId}/send-email`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })  // Optional
    }
  );

  const data = await response.json();
  console.log(data); // { success: true, message: "Invoice sent successfully" }
};
```

### Example 3: cURL Commands

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' \
  | jq -r '.data.token')

# Download invoice PDF
curl -X GET http://localhost:3000/api/v1/invoices/{invoice_id}/download \
  -H "Authorization: Bearer $TOKEN" \
  --output invoice.pdf

# Send invoice email to customer
curl -X POST http://localhost:3000/api/v1/invoices/{invoice_id}/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Send invoice to custom email
curl -X POST http://localhost:3000/api/v1/invoices/{invoice_id}/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"custom@example.com"}'
```

## Email Templates

### Invoice Email Template
Features:
- Professional header with company branding
- Invoice details (number, amount, due date)
- Payment methods information
- PDF attachment
- Responsive design

### Payment Confirmation Email
Features:
- Payment received confirmation
- Payment reference and details
- Amount paid and payment method
- Professional design

### Delivery Reminder Email
Features:
- Delivery date and scheduled items
- Product list with quantities
- Friendly reminder message

## Testing

### Test PDF Generation (Without Email)

1. Login and get a token
2. Get an invoice ID from `/api/v1/invoices`
3. Download the PDF:
```bash
curl -X GET http://localhost:3000/api/v1/invoices/{invoice_id}/download \
  -H "Authorization: Bearer $TOKEN" \
  --output test-invoice.pdf
```
4. Open the PDF file to verify

### Test Email Sending

**Prerequisites:**
- Configure email credentials in `.env`
- Ensure customer has an email address in database

**Steps:**
1. Update customer email:
```bash
curl -X PUT http://localhost:3000/api/v1/customers/{customer_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

2. Send invoice:
```bash
curl -X POST http://localhost:3000/api/v1/invoices/{invoice_id}/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

3. Check your email inbox!

## Customization

### PDF Customization

Edit `/src/services/pdfService.js`:

- **Company Details:** Update `addCompanyDetails()` method
- **Bank Information:** Update `addPaymentInfo()` method
- **Colors & Styling:** Modify color codes in various methods
- **Logo:** Add company logo using `doc.image()` in `addHeader()`

### Email Templates

Edit `/src/services/emailService.js`:

- **Invoice Email:** Modify `sendInvoiceEmail()` method
- **Payment Email:** Modify `sendPaymentConfirmationEmail()` method
- **Delivery Reminder:** Modify `sendDeliveryReminderEmail()` method

## Troubleshooting

### Email Not Sending

**Error: "Email service not configured"**
- Solution: Add EMAIL_USER and EMAIL_PASSWORD to `.env` file

**Error: "Username and Password not accepted"**
- Solution: Generate Gmail App Password (not regular password)
- Enable 2-Factor Authentication first

**Error: "Customer email not found"**
- Solution: Ensure customer has email in database or provide email in request body

### PDF Issues

**PDF appears blank**
- Check invoice has line items
- Check database query returns data

**PDF formatting issues**
- Adjust PDFKit settings in `pdfService.js`
- Test with different invoice data

## Performance Considerations

### Async Processing
For large volumes, consider:
- Queue-based email sending (using Bull, Bee-Queue)
- Background job processing
- Email batching

### Caching
- Cache generated PDFs temporarily
- Invalidate cache when invoice is updated

## Security Notes

1. **Never commit email credentials** to version control
2. Use **environment variables** for all sensitive data
3. **Validate email addresses** before sending
4. Implement **rate limiting** for email sending endpoints
5. **Log all email activities** for audit trail

## Future Enhancements

- [ ] Bulk email sending
- [ ] Email scheduling
- [ ] Email templates from database
- [ ] WhatsApp integration for invoice sharing
- [ ] SMS notifications
- [ ] Multi-language support for emails
- [ ] Custom email templates per customer
- [ ] Email delivery tracking
- [ ] Unsubscribe management
- [ ] Email analytics dashboard

## Support

For issues or questions:
- Check logs in terminal
- Verify `.env` configuration
- Test with a simple email first
- Check spam/junk folder

## Files Modified/Added

**New Files:**
- `/src/services/emailService.js` - Email sending service
- `/src/services/pdfService.js` - PDF generation service

**Modified Files:**
- `/src/controllers/invoiceController.js` - Added PDF/Email endpoints
- `/src/routes/invoiceRoutes.js` - Added new routes
- `/.env` - Added email configuration
- `/.env.example` - Added email configuration template

---

**Congratulations!** You now have professional PDF invoices and email capabilities in your dairy delivery system! 🎉
