// Manual bank-transfer payment config (no payment gateway).
//
// All values are PUBLIC — they ship in the built client — and come from Vite env
// vars so real production details live in .env.local (gitignored) and are NEVER
// committed to source. Every field degrades gracefully when unset, so a default
// build with no payment env still renders the sheet without crashing.

const env = import.meta.env

// Telegram is the only support channel (WhatsApp rejected for launch). Falls
// back to the official support handle so the receipt flow works even when
// VITE_SUPPORT_TELEGRAM_URL is unset.
const DEFAULT_TELEGRAM_URL = 'https://t.me/RanandegiYarSupport'

export interface ManualPaymentConfig {
  priceToman: string    // raw env string ('' when unset)
  cardNumber: string
  accountHolder: string
  telegramUrl: string
}

export const manualPayment: ManualPaymentConfig = {
  priceToman:    (env.VITE_SUBSCRIPTION_PRICE_TOMAN ?? '').trim(),
  cardNumber:    (env.VITE_PAYMENT_CARD_NUMBER ?? '').trim(),
  accountHolder: (env.VITE_PAYMENT_ACCOUNT_HOLDER ?? '').trim(),
  telegramUrl:   (env.VITE_SUPPORT_TELEGRAM_URL ?? '').trim() || DEFAULT_TELEGRAM_URL,
}

/** True when a subscription price has been configured. */
export const hasPrice = manualPayment.priceToman !== ''

/** Support link for sending the payment receipt (always set — env override or default). */
export const supportUrl = manualPayment.telegramUrl

/**
 * Grouped price number (Persian digits), no 'تومان' suffix. A non-numeric
 * custom string is returned as-is; an empty value yields ''.
 */
export function formatPriceNumber(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/[^\d]/g, '')
  if (digits === '') return raw
  return Number(digits).toLocaleString('fa-IR')
}

/**
 * Human-readable price. A numeric value is grouped with Persian digits + 'تومان';
 * a non-numeric custom string is shown as-is; an empty value yields ''.
 */
export function formatPriceToman(raw: string): string {
  const number = formatPriceNumber(raw)
  return number ? `${number} تومان` : ''
}
