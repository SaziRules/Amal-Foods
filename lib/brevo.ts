export async function sendBrevoEmail({
  to, name, subject, htmlContent,
}: {
  to: string;
  name: string;
  subject: string;
  htmlContent: string;
}) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender:  { name: "Amal Foods", email: "admin@amalfoods.co.za" },
      replyTo: { email: "orders@amalfoods.co.za" },
      to: [{ email: to, name: name || to }],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo ${res.status}`);
  }
  return res.json();
}
