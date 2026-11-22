/** Public contact details, shown on the login page, checkout and legal pages. */
export const CONTACT_WHATSAPP = '962781630603';
export const CONTACT_WHATSAPP_DISPLAY = '+962 78 163 0603';
export const CONTACT_EMAIL = 'm7mdayoubibdah@gmail.com';

export function whatsappLink(text?: string): string {
  return `https://wa.me/${CONTACT_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
