// Thin wrapper around the Resend API used by every outbound email in this project.

export async function sendEmail(env, { to, from, subject, html, replyTo, bcc }) {
  const body = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (replyTo) body.reply_to = replyTo;
  if (bcc) body.bcc = Array.isArray(bcc) ? bcc : [bcc];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend error: ${errBody}`);
  }
  return res.json();
}
