import jsPDF from 'jspdf';
import type { ApiMachineDelivery } from '../../../shared/api/types';

/**
 * Generates a professional PDF receipt for machine delivery
 * Following clean code principles and proper formatting
 */
export function generateDeliveryPdf(delivery: ApiMachineDelivery): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const primaryColor = '#059669'; // Green for delivery
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
  addText('تسليم آلة - إيصال', pageWidth / 2, 15, 20, true, 'center');
  addText('Machine Delivery Receipt', pageWidth / 2, 25, 12, false, 'center');

  // Reception & Delivery Info
  let yPos = 50;
  doc.setTextColor('#000000');

  const receptionId = delivery.machineReception && typeof delivery.machineReception === 'object' && 'customId' in delivery.machineReception
    ? delivery.machineReception.customId
    : '—';

  addText(`رقم الاستلام: ${receptionId}`, pageWidth - margin, yPos, 14, true);
  yPos += 8;
  const deliveryDate = new Date(delivery.deliveryDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setTextColor(grayColor);
  addText(`تاريخ التسليم: ${deliveryDate}`, pageWidth - margin, yPos, 11);

  // Machine Information Section
  yPos += 15;
  doc.setFillColor(lightGrayColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(primaryColor);
  addText('معلومات الآلة', pageWidth - margin - 2, yPos + 6, 12, true);

  yPos += 15;
  addField('اسم الآلة', delivery.machineName || 'غير محدد', margin, yPos, pageWidth - 2 * margin);

  if (delivery.machineDetails) {
    yPos += 12;
    addField('تفاصيل الآلة', delivery.machineDetails, margin, yPos, pageWidth - 2 * margin);
  }

  // Customer Information Section
  yPos += 20;
  doc.setFillColor(lightGrayColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(primaryColor);
  addText('بيانات الزبون', pageWidth - margin - 2, yPos + 6, 12, true);

  yPos += 15;
  addField('اسم الزبون', delivery.customerName || 'غير محدد', margin, yPos, pageWidth - 2 * margin);

  // Get customer phone from reception if available
  if (delivery.machineReception && typeof delivery.machineReception === 'object' && 'customerPhone' in delivery.machineReception) {
    const customerPhone = delivery.machineReception.customerPhone;
    if (customerPhone) {
      yPos += 12;
      addField('الجوال', customerPhone, margin, yPos, pageWidth - 2 * margin);
    }
  }

  // Delivery Details Section
  yPos += 20;
  doc.setFillColor(lightGrayColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(primaryColor);
  addText('تفاصيل التسليم', pageWidth - margin - 2, yPos + 6, 12, true);

  yPos += 15;
  addField('تاريخ التسليم', deliveryDate, margin, yPos, pageWidth - 2 * margin);

  if (delivery.deliveredBy && typeof delivery.deliveredBy === 'object' && 'name' in delivery.deliveredBy) {
    yPos += 12;
    addField('المسلم', delivery.deliveredBy.name, margin, yPos, pageWidth - 2 * margin);
  }

  // Notes
  if (delivery.notes) {
    yPos += 20;
    doc.setFillColor(lightGrayColor);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(primaryColor);
    addText('ملاحظات', pageWidth - margin - 2, yPos + 6, 12, true);

    yPos += 12;
    doc.setTextColor('#000000');
    const notesLines = doc.splitTextToSize(delivery.notes, pageWidth - 2 * margin - 4);
    addBox(margin, yPos, pageWidth - 2 * margin, Math.max(15, notesLines.length * 5 + 4));
    doc.text(notesLines, pageWidth - margin - 2, yPos + 5, { align: 'right' });
    yPos += Math.max(15, notesLines.length * 5 + 4);
  }

  // Reception info from original reception
  if (delivery.machineReception && typeof delivery.machineReception === 'object') {
    const reception = delivery.machineReception;

    if ('receptionDate' in reception) {
      yPos += 15;
      const receptionDate = new Date(reception.receptionDate).toLocaleDateString('ar-SA');
      doc.setTextColor(grayColor);
      doc.setFontSize(9);
      addText(`تاريخ الاستلام: ${receptionDate}`, pageWidth - margin, yPos, 9);
    }

    if ('customerProblemDesc' in reception && reception.customerProblemDesc) {
      yPos += 6;
      doc.setFontSize(9);
      const problemText = `المشكلة الأصلية: ${reception.customerProblemDesc}`;
      const problemLines = doc.splitTextToSize(problemText, pageWidth - 2 * margin - 4);
      doc.text(problemLines, pageWidth - margin - 2, yPos, { align: 'right' });
    }
  }

  // Footer - Signature Section
  yPos = pageHeight - 40;
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth / 2 - 5, yPos);
  doc.line(pageWidth / 2 + 5, yPos, pageWidth - margin, yPos);

  yPos += 5;
  doc.setTextColor(grayColor);
  addText('توقيع المسلم', pageWidth / 4, yPos, 10, false, 'center');
  addText('توقيع الزبون', 3 * pageWidth / 4, yPos, 10, false, 'center');

  // Footer note - Important
  yPos = pageHeight - 20;
  doc.setFillColor('#fef3c7');
  doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 16, 'F');
  doc.setFontSize(10);
  doc.setTextColor('#92400e');
  addText('✓ الآلة تم تسليمها بحالة جيدة', pageWidth / 2, yPos, 10, true, 'center');
  addText('Machine delivered in good condition', pageWidth / 2, yPos + 5, 8, false, 'center');

  // Generate and download PDF
  const fileName = `تسليم_آلة_${receptionId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
