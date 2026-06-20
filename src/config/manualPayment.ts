// Manual bank-transfer payment config (no payment gateway).
//
// All values are PUBLIC — they ship in the built client — and come from Vite env
// vars so real production details live in .env.local (gitignored) and are NEVER
// committed to source. Every field degrades gracefully when unset, so a default
// build with no payment env still renders the sheet without crashing.

const env = import.meta.env

export interface ManualPaymentConfig {
  priceToman: string    // raw env string ('' when unset)
  cardNumber: string
  iban: string
  accountHolder: string
  whatsappUrl: string
  telegramUrl: string
}

export const manualPayment: ManualPaymentConfig = {
  priceToman:    (env.VITE_SUBSCRIPTION_PRICE_TOMAN ?? '').trim(),
  cardNumber:    (env.VITE_PAYMENT_CARD_NUMBER ?? '').trim(),
  iban:          (env.VITE_PAYMENT_IBAN ?? '').trim(),
  accountHolder: (env.VITE_PAYMENT_ACCOUNT_HOLDER ?? '').trim(),
  whatsappUrl:   (env.VITE_SUPPORT_WHATSAPP_URL ?? '').trim(),
  telegramUrl:   (env.VITE_SUPPORT_TELEGRAM_URL ?? '').trim(),
}

/** True when a subscription price has been configured. */
export const hasPrice = manualPayment.priceToman !== ''

/** First available support link (WhatsApp preferred), or '' when none configured. */
export const supportUrl = manualPayment.whatsappUrl || manualPayment.telegramUrl || ''

/**
 * Human-readable price. A numeric value is grouped with Persian digits + 'تومان';
 * a non-numeric custom string is shown as-is; an empty value yields ''.
 */
export function formatPriceToman(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/[^\d]/g, '')
  if (digits === '') return raw
  return `${Number(digits).toLocaleString('fa-IR')} تومان`
}
