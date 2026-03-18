import { CONTACT, WHATSAPP_BASE_URL } from '../../shared/constants';
import type { CartItem } from '../../shared/types';

export function generateWhatsAppLink(message: string): string {
  const phone = CONTACT.whatsapp.replace(/\+/g, '');
  return `${WHATSAPP_BASE_URL}${phone}?text=${encodeURIComponent(message)}`;
}

export function generateQuoteMessage(
  items: CartItem[],
  lang: 'ar' | 'en',
): string {
  if (lang === 'ar') {
    let msg = 'مرحباً، أرغب في طلب عرض سعر للمنتجات التالية:\n\n';
    items.forEach((item, index) => {
      msg += `${index + 1}. ${item.product.name.ar} - الكمية: ${item.quantity}\n`;
    });
    msg += '\nشكراً لكم.';
    return msg;
  }

  let msg = 'Hello, I would like to request a quote for the following products:\n\n';
  items.forEach((item, index) => {
    msg += `${index + 1}. ${item.product.name.en} - Qty: ${item.quantity}\n`;
  });
  msg += '\nThank you.';
  return msg;
}

export function generateProductInquiry(
  productName: string,
  lang: 'ar' | 'en',
): string {
  if (lang === 'ar') {
    return `مرحباً، أرغب في الاستفسار عن المنتج: ${productName}`;
  }
  return `Hello, I would like to inquire about the product: ${productName}`;
}

export function openWhatsApp(message: string): void {
  const link = generateWhatsAppLink(message);
  window.open(link, '_blank', 'noopener,noreferrer');
}
