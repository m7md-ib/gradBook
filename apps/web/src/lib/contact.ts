/**
 * Public contact details, shown on the login page, checkout, footer and legal
 * pages. WhatsApp only, on purpose: no personal email address on the site.
 */
export const CONTACT_WHATSAPP = '962781630603';
export const CONTACT_WHATSAPP_DISPLAY = '+962 78 163 0603';

export function whatsappLink(text?: string): string {
  return `https://wa.me/${CONTACT_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
