const PDFDocument = require('pdfkit');

/**
 * PDF Service
 * Handles PDF generation for invoices and reports
 */

class PDFService {
  /**
   * Generate invoice PDF
   * @param {Object} invoiceData - Invoice data with customer, items, etc.
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateInvoicePDF(invoiceData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice ${invoiceData.invoice_number}`,
            Author: 'Fresh Dairy',
            Subject: 'Invoice'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        this.addHeader(doc, invoiceData);

        // Company and Customer Details
        this.addCompanyDetails(doc);
        this.addCustomerDetails(doc, invoiceData);

        // Invoice Details
        this.addInvoiceDetails(doc, invoiceData);

        // Line Items Table
        this.addLineItemsTable(doc, invoiceData);

        // Totals
        this.addTotals(doc, invoiceData);

        // Payment Info
        this.addPaymentInfo(doc, invoiceData);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF
   */
  addHeader(doc, invoiceData) {
    // Company Logo/Name (you can add logo image here)
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text('FRESH DAIRY', 50, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#7f8c8d')
      .text('Quality Milk & Dairy Products', 50, 85);

    // Invoice Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#e74c3c')
      .text('INVOICE', 400, 50, { align: 'right' });

    // Horizontal line
    doc
      .strokeColor('#ecf0f1')
      .lineWidth(2)
      .moveTo(50, 110)
      .lineTo(550, 110)
      .stroke();
  }

  /**
   * Add company details
   */
  addCompanyDetails(doc) {
    const startY = 130;

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text('From:', 50, startY);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#34495e')
      .text('Fresh Dairy Pvt. Ltd.', 50, startY + 15)
      .text('123 Dairy Farm Road', 50, startY + 30)
      .text('Mumbai, Maharashtra 400001', 50, startY + 45)
      .text('Phone: +91 98765 43210', 50, startY + 60)
      .text('Email: info@freshdairy.com', 50, startY + 75)
      .text('GSTIN: 27XXXXX1234X1ZX', 50, startY + 90);
  }

  /**
   * Add customer details
   */
  addCustomerDetails(doc, invoiceData) {
    const startY = 130;

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text('Bill To:', 320, startY);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#34495e')
      .text(invoiceData.customer.full_name, 320, startY + 15)
      .text(invoiceData.customer.customer_code, 320, startY + 30);

    let addressY = startY + 45;
    if (invoiceData.customer.address_line1) {
      doc.text(invoiceData.customer.address_line1, 320, addressY);
      addressY += 15;
    }
    if (invoiceData.customer.address_line2) {
      doc.text(invoiceData.customer.address_line2, 320, addressY);
      addressY += 15;
    }

    const cityPincode = `${invoiceData.customer.city || ''} ${invoiceData.customer.pincode || ''}`.trim();
    if (cityPincode) {
      doc.text(cityPincode, 320, addressY);
      addressY += 15;
    }

    if (invoiceData.customer.phone) {
      doc.text(`Phone: ${invoiceData.customer.phone}`, 320, addressY);
      addressY += 15;
    }

    if (invoiceData.customer.email) {
      doc.text(`Email: ${invoiceData.customer.email}`, 320, addressY);
    }
  }

  /**
   * Add invoice details
   */
  addInvoiceDetails(doc, invoiceData) {
    const startY = 260;

    // Create a box for invoice details
    doc
      .rect(50, startY, 500, 60)
      .fillAndStroke('#ecf0f1', '#bdc3c7');

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text('Invoice Number:', 60, startY + 10)
      .text('Invoice Date:', 60, startY + 30)
      .text('Billing Period:', 250, startY + 10)
      .text('Due Date:', 250, startY + 30)
      .text('Status:', 440, startY + 10);

    doc
      .font('Helvetica')
      .fillColor('#34495e')
      .text(invoiceData.invoice_number, 155, startY + 10)
      .text(this.formatDate(invoiceData.invoice_date), 140, startY + 30)
      .text(
        `${this.formatDate(invoiceData.billing_period_start)} - ${this.formatDate(invoiceData.billing_period_end)}`,
        340,
        startY + 10
      )
      .text(this.formatDate(invoiceData.due_date), 310, startY + 30);

    // Status with color
    const statusColor = this.getStatusColor(invoiceData.status);
    doc
      .font('Helvetica-Bold')
      .fillColor(statusColor)
      .text(invoiceData.status.toUpperCase(), 480, startY + 10);
  }

  /**
   * Add line items table
   */
  addLineItemsTable(doc, invoiceData) {
    const tableTop = 350;
    const tableHeaders = ['#', 'Description', 'Quantity', 'Unit Price', 'Amount'];
    const columnWidths = [30, 250, 70, 80, 80];
    const columnPositions = [50, 80, 330, 400, 480];

    // Table header
    doc
      .rect(50, tableTop, 500, 25)
      .fillAndStroke('#3498db', '#2980b9');

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#ffffff');

    tableHeaders.forEach((header, i) => {
      const align = i > 1 ? 'right' : 'left';
      const x = i > 1 ? columnPositions[i] + columnWidths[i] - 10 : columnPositions[i];
      doc.text(header, x, tableTop + 7, {
        width: columnWidths[i],
        align: align
      });
    });

    // Table rows
    let currentY = tableTop + 25;
    const rowHeight = 30;

    invoiceData.line_items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc
          .rect(50, currentY, 500, rowHeight)
          .fill('#f8f9fa');
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#2c3e50');

      // Row number
      doc.text((index + 1).toString(), columnPositions[0], currentY + 8);

      // Description
      doc.text(item.description || item.product_name, columnPositions[1], currentY + 8, {
        width: columnWidths[1] - 10,
        height: rowHeight,
        ellipsis: true
      });

      // Quantity
      doc.text(
        item.quantity.toString(),
        columnPositions[2] + columnWidths[2] - 10,
        currentY + 8,
        { width: columnWidths[2], align: 'right' }
      );

      // Unit Price
      doc.text(
        `₹${parseFloat(item.unit_price).toFixed(2)}`,
        columnPositions[3] + columnWidths[3] - 10,
        currentY + 8,
        { width: columnWidths[3], align: 'right' }
      );

      // Amount
      doc.text(
        `₹${parseFloat(item.line_total).toFixed(2)}`,
        columnPositions[4] + columnWidths[4] - 10,
        currentY + 8,
        { width: columnWidths[4], align: 'right' }
      );

      currentY += rowHeight;
    });

    // Table border
    doc
      .rect(50, tableTop, 500, currentY - tableTop)
      .stroke('#bdc3c7');

    return currentY;
  }

  /**
   * Add totals section
   */
  addTotals(doc, invoiceData) {
    let startY = 350 + 25 + (invoiceData.line_items.length * 30) + 20;

    // Ensure we don't go off the page
    if (startY > 650) {
      doc.addPage();
      startY = 100;
    }

    const labelX = 350;
    const valueX = 480;
    const lineHeight = 20;

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#2c3e50');

    // Subtotal
    doc.text('Subtotal:', labelX, startY);
    doc.text(`₹${parseFloat(invoiceData.subtotal).toFixed(2)}`, valueX, startY, { align: 'right' });

    // Discount
    if (invoiceData.discount_amount && parseFloat(invoiceData.discount_amount) > 0) {
      startY += lineHeight;
      doc.fillColor('#e74c3c');
      doc.text('Discount:', labelX, startY);
      doc.text(`-₹${parseFloat(invoiceData.discount_amount).toFixed(2)}`, valueX, startY, { align: 'right' });
      doc.fillColor('#2c3e50');
    }

    // Tax
    if (invoiceData.tax_amount && parseFloat(invoiceData.tax_amount) > 0) {
      startY += lineHeight;
      doc.text('Tax/GST:', labelX, startY);
      doc.text(`₹${parseFloat(invoiceData.tax_amount).toFixed(2)}`, valueX, startY, { align: 'right' });
    }

    // Line before total
    startY += lineHeight;
    doc
      .strokeColor('#bdc3c7')
      .lineWidth(1)
      .moveTo(350, startY)
      .lineTo(550, startY)
      .stroke();

    // Total
    startY += 10;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50');
    doc.text('Total Amount:', labelX, startY);
    doc.text(`₹${parseFloat(invoiceData.total_amount).toFixed(2)}`, valueX, startY, { align: 'right' });

    // Amount Paid
    if (invoiceData.amount_paid && parseFloat(invoiceData.amount_paid) > 0) {
      startY += lineHeight + 5;
      doc.fontSize(10).fillColor('#27ae60');
      doc.text('Amount Paid:', labelX, startY);
      doc.text(`₹${parseFloat(invoiceData.amount_paid).toFixed(2)}`, valueX, startY, { align: 'right' });
    }

    // Balance Due
    startY += lineHeight + 5;
    const balanceDue = parseFloat(invoiceData.balance_amount || invoiceData.total_amount);
    const balanceColor = balanceDue > 0 ? '#e74c3c' : '#27ae60';

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(balanceColor);
    doc.text('Balance Due:', labelX, startY);
    doc.text(`₹${balanceDue.toFixed(2)}`, valueX, startY, { align: 'right' });

    return startY;
  }

  /**
   * Add payment information
   */
  addPaymentInfo(doc, invoiceData) {
    const startY = 650;

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#2c3e50')
      .text('Payment Information:', 50, startY);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#34495e')
      .text('Please make payment to:', 50, startY + 20)
      .text('Bank: HDFC Bank', 50, startY + 35)
      .text('Account Name: Fresh Dairy Pvt. Ltd.', 50, startY + 50)
      .text('Account Number: 1234567890', 50, startY + 65)
      .text('IFSC Code: HDFC0001234', 50, startY + 80)
      .text('UPI ID: freshdairy@hdfcbank', 50, startY + 95);

    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#7f8c8d')
      .text('Or pay cash/UPI to delivery person', 50, startY + 115);
  }

  /**
   * Add footer
   */
  addFooter(doc) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 50;

    doc
      .strokeColor('#ecf0f1')
      .lineWidth(1)
      .moveTo(50, footerY - 10)
      .lineTo(550, footerY - 10)
      .stroke();

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#95a5a6')
      .text(
        'Thank you for your business! For any queries, contact us at info@freshdairy.com or +91 98765 43210',
        50,
        footerY,
        { align: 'center', width: 500 }
      );

    doc
      .fontSize(7)
      .fillColor('#bdc3c7')
      .text(
        'This is a computer-generated invoice and does not require a signature.',
        50,
        footerY + 15,
        { align: 'center', width: 500 }
      );
  }

  /**
   * Helper: Format date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Helper: Get status color
   */
  getStatusColor(status) {
    const colors = {
      paid: '#27ae60',
      partially_paid: '#f39c12',
      overdue: '#e74c3c',
      sent: '#3498db',
      draft: '#95a5a6'
    };
    return colors[status] || '#7f8c8d';
  }
}

// Export singleton instance
module.exports = new PDFService();
