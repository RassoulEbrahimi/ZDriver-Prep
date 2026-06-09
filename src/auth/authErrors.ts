// Phase 7B — Map Firebase Auth error codes to friendly Persian messages.

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'ایمیل وارد شده معتبر نیست.',
  'auth/missing-email': 'لطفاً ایمیل را وارد کن.',
  'auth/email-already-in-use': 'این ایمیل قبلاً ثبت شده است. وارد شو.',
  'auth/weak-password': 'رمز عبور باید حداقل ۶ نویسه باشد.',
  'auth/missing-password': 'لطفاً رمز عبور را وارد کن.',
  'auth/wrong-password': 'ایمیل یا رمز عبور درست نیست.',
  'auth/invalid-credential': 'ایمیل یا رمز عبور درست نیست.',
  'auth/user-not-found': 'حسابی با این ایمیل پیدا نشد.',
  'auth/user-disabled': 'این حساب غیرفعال شده است.',
  'auth/too-many-requests': 'تلاش‌های زیاد. کمی بعد دوباره امتحان کن.',
  'auth/network-request-failed': 'اتصال برقرار نشد. اینترنت/فیلترشکن را بررسی کن.',
  'auth/operation-not-allowed': 'ورود با ایمیل فعلاً فعال نیست.',
}

const FALLBACK = 'مشکلی پیش آمد. دوباره امتحان کن.'

/** Best-effort Persian message for an unknown auth error. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code
  if (typeof code === 'string' && code in MESSAGES) return MESSAGES[code]
  return FALLBACK
}
