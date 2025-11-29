import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).text('ShopHub', 50, 45);
      doc.fontSize(10).text('www.shophub.com', 50, 75);

      // Invoice title
      doc.fontSize(20).text('INVOICE', 400, 45, { align: 'right' });

      // Invoice details
      doc.fontSize(10);
      doc.text(`Invoice #: ${order.orderNumber}`, 400, 80, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 95, { align: 'right' });
      doc.text(`Status: ${order.paymentInfo?.status === 'paid' ? 'PAID' : 'UNPAID'}`, 400, 110, { align: 'right' });

      // Horizontal line
      doc.moveTo(50, 140).lineTo(550, 140).stroke();

      // Customer Info
      doc.fontSize(12).text('Bill To:', 50, 160);
      doc.fontSize(10);
      doc.text(user.name, 50, 180);
      doc.text(user.email, 50, 195);
      
      // Shipping Address
      doc.fontSize(12).text('Ship To:', 300, 160);
      doc.fontSize(10);
      doc.text(order.shippingAddress.fullName, 300, 180);
      doc.text(order.shippingAddress.address, 300, 195);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`, 300, 210);
      doc.text(order.shippingAddress.country, 300, 225);

      // Table Header
      const tableTop = 270;
      doc.fontSize(10);
      
      // Table header background
      doc.rect(50, tableTop, 500, 20).fill('#4F46E5');
      doc.fillColor('#FFFFFF');
      doc.text('Item', 60, tableTop + 5);
      doc.text('Qty', 320, tableTop + 5, { width: 50, align: 'center' });
      doc.text('Price', 380, tableTop + 5, { width: 70, align: 'right' });
      doc.text('Total', 460, tableTop + 5, { width: 80, align: 'right' });
      doc.fillColor('#000000');

      // Table rows
      let yPosition = tableTop + 30;
      order.orderItems.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(50, yPosition - 5, 500, 25).fill('#f9fafb');
          doc.fillColor('#000000');
        }
        
        doc.text(item.name.substring(0, 40), 60, yPosition, { width: 250 });
        doc.text(item.quantity.toString(), 320, yPosition, { width: 50, align: 'center' });
        doc.text(`₹${item.price.toFixed(2)}`, 380, yPosition, { width: 70, align: 'right' });
        doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });
        
        yPosition += 25;
      });

      // Totals section
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 15;

      // Subtotal, Tax, Shipping, Discount, Total
      const totalsX = 380;
      
      doc.text('Subtotal:', totalsX, yPosition);
      doc.text(`₹${order.itemsPrice.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });
      yPosition += 20;

      doc.text('Shipping:', totalsX, yPosition);
      doc.text(`₹${order.shippingPrice.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });
      yPosition += 20;

      doc.text('Tax:', totalsX, yPosition);
      doc.text(`₹${order.taxPrice.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });
      yPosition += 20;

      if (order.discount && order.discount > 0) {
        doc.fillColor('#10B981');
        doc.text('Discount:', totalsX, yPosition);
        doc.text(`-₹${order.discount.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });
        doc.fillColor('#000000');
        yPosition += 20;
      }

      // Total
      doc.moveTo(totalsX, yPosition).lineTo(540, yPosition).stroke();
      yPosition += 10;
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Total:', totalsX, yPosition);
      doc.text(`₹${order.totalPrice.toFixed(2)}`, 460, yPosition, { width: 80, align: 'right' });

      // Payment Info
      yPosition += 50;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Payment Method: ${order.paymentInfo?.method || 'N/A'}`, 50, yPosition);
      if (order.paymentInfo?.paidAt) {
        doc.text(`Paid At: ${new Date(order.paymentInfo.paidAt).toLocaleString()}`, 50, yPosition + 15);
      }

      // Footer
      doc.fontSize(8).fillColor('#6b7280');
      doc.text('Thank you for shopping with ShopHub!', 50, 750, { align: 'center' });
      doc.text('For questions about your order, please contact support@shophub.com', 50, 765, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default { generateInvoicePDF };
