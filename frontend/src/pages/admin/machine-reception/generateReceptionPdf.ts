import jsPDF from 'jspdf';
import type { ApiMachineReception } from '../../../shared/api/types';

/**
 * Generates a professional PDF receipt for machine reception
 * Following clean code principles and proper formatting
 */
export function generateReceptionPdf(reception: ApiMachineReception): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const primaryColor = '#1e40af';
  const grayColor = '#6b7280';
  const lightGrayColor = '#f3f4f6';

  // Helper functions
  const addText = (text: string, x: number, y: number, fontSize = 12, isBold = false, align: 'right' | 'center' | 'left' = 'right') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(text, x, y, { align });
  };

  const addBox = (x: number, y: number, width: number, height: number, fillColor?: string) => {
    if (fillColor) {
      doc.setFillColor(fillColor);
      doc.rect(x, y, width, height, 'F');
    } else {
      doc.setDrawColor(200);
      doc.rect(x, y, width, height);
    }
  };

  const addField = (label: string, value: string, x: number, y: number, width: number = 85) => {
    // Label
    doc.setTextColor(grayColor);
    addText(label, x + width, y, 10, false);

    // Value box
    addBox(x, y + 2, width, 8);
    doc.setTextColor('#000000');
    addText(value, x + width - 2, y + 7, 11, false);
  };

  // Page setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Header - Company name
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor('#ffffff');
  addText('استلام آلة - إيصال', pageWidth / 2, 15, 20, true, 'center');
  addText('Machine Reception Receipt', pageWidth / 2, 25, 12, false, 'center');

  // Reception ID and Date
  let yPos = 50;
  doc.setTextColor('#000000');
  addText(`رقم الاستلام: ${reception.customId}`, pageWidth - margin, yPos, 14, true);
  yPos += 8;
  const receptionDate = new Date(reception.receptionDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setTextColor(grayColor);
  addText(`التاريخ: ${receptionDate}`, pageWidth - margin, yPos, 11);

  // Machine Information Section
  yPos += 15;
  doc.setFillColor(lightGrayColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(primaryColor);
  addText('معلومات الآلة', pageWidth - margin - 2, yPos + 6, 12, true);

  yPos += 15;
  const machineName = reception.machine && typeof reception.machine === 'object' && 'name' in reception.machine
    ? reception.machine.name
    : reception.machineDetails || 'غير محدد';
  addField('اسم الآلة', machineName, margin, yPos, pageWidth - 2 * margin);

  if (reception.machineDetails) {
    yPos += 12;
    addField('تفاصيل الآلة', reception.machineDetails, margin, yPos, pageWidth - 2 * margin);
  }

  if (reception.serialNumber) {
    yPos += 12;
    addField('الرقم التسلسلي', reception.serialNumber, margin, yPos, pageWidth - 2 * margin);
  }

  // Customer Information Section
  yPos += 20;
  doc.setFillColor(lightGrayColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(primaryColor);
  addText('بيانات الزبون', pageWidth - margin - 2, yPos + 6, 12, true);

  yPos += 15;
  const customerName = reception.customer && typeof reception.customer === 'object' && 'name' in reception.customer
    ? reception.customer.name
    : reception.customerName || 'غير محدد';
  addField('اسم الزبون', customerName, margin, yPos, pageWidth - 2 * margin);

  if (reception.customerPhone) {
    yPos += 12;
    addField('الجوال', reception.customerPhone, margin, yPos, pageWidth - 2 * margin);
  }

  if (reception.customerAddress) {
    yPos += 12;
    addField('العنوان', reception.customerAddress, margin, yPos, pageWidth - 2 * margin);
  }

  // Reception Details Section
  yPos += 20;
  doc.setFillColor(lightGrayColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(primaryColor);
  addText('تفاصيل الاستلام', pageWidth - margin - 2, yPos + 6, 12, true);

  yPos += 15;
  const conditionText = reception.condition === 'complete' ? 'كاملة' : 'ناقصة';
  addField('حالة الآلة', conditionText, margin, yPos, 85);

  const warrantyText = reception.warranty ? 'نعم' : 'لا';
  addField('تحت الكفالة', warrantyText, pageWidth - margin - 85, yPos, 85);

  if (reception.condition === 'incomplete' && reception.receivedParts) {
    yPos += 12;
    addField('الأجزاء المستلمة/الناقصة', reception.receivedParts, margin, yPos, pageWidth - 2 * margin);
  }

  if (reception.expectedDeliveryDate) {
    yPos += 12;
    const expectedDate = new Date(reception.expectedDeliveryDate).toLocaleDateString('ar-SA');
    addField('تاريخ التسليم المتوقع', expectedDate, margin, yPos, pageWidth - 2 * margin);
  }

  // Problem Description
  if (reception.customerProblemDesc) {
    yPos += 20;
    doc.setFillColor(lightGrayColor);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(primaryColor);
    addText('وصف المشكلة', pageWidth - margin - 2, yPos + 6, 12, true);

    yPos += 12;
    doc.setTextColor('#000000');
    const problemLines = doc.splitTextToSize(reception.customerProblemDesc, pageWidth - 2 * margin - 4);
    addBox(margin, yPos, pageWidth - 2 * margin, Math.max(15, problemLines.length * 5 + 4));
    doc.text(problemLines, pageWidth - margin - 2, yPos + 5, { align: 'right' });
    yPos += Math.max(15, problemLines.length * 5 + 4);
  }

  // Notes
  if (reception.notes) {
    yPos += 8;
    doc.setTextColor(grayColor);
    const notesLines = doc.splitTextToSize(`ملاحظات: ${reception.notes}`, pageWidth - 2 * margin - 4);
    doc.setFontSize(10);
    doc.text(notesLines, pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += notesLines.length * 5;
  }

  // Received By
  const receiverName = reception.receivedBy && typeof reception.receivedBy === 'object' && 'name' in reception.receivedBy
    ? reception.receivedBy.name
    : reception.receivedByName;

  if (receiverName) {
    yPos += 15;
    doc.setTextColor(grayColor);
    addText(`مستلم الآلة: ${receiverName}`, pageWidth - margin, yPos, 10);
  }

  // Footer - Signature Section
  yPos = pageHeight - 40;
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth / 2 - 5, yPos);
  doc.line(pageWidth / 2 + 5, yPos, pageWidth - margin, yPos);

  yPos += 5;
  doc.setTextColor(grayColor);
  addText('توقيع المستلم', pageWidth / 4, yPos, 10, false, 'center');
  addText('توقيع الزبون', 3 * pageWidth / 4, yPos, 10, false, 'center');

  // Footer note
  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(grayColor);
  addText('يرجى الاحتفاظ بهذا الإيصال لحين استلام الآلة', pageWidth / 2, yPos, 8, false, 'center');
  addText('Please keep this receipt until machine delivery', pageWidth / 2, yPos + 4, 8, false, 'center');

  // Generate and download PDF
  const fileName = `استلام_آلة_${reception.customId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
