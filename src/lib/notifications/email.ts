const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Train with Jaime <onboarding@resend.dev>';

/** Envía un email transaccional vía Resend. Nunca lanza: si falla, solo avisa por consola. */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada: email omitido.');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      console.warn('[email] Resend respondió con error:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[email] Error enviando email:', err);
  }
}
