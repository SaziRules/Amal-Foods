interface TemplateArgs { subject: string; body: string; baseUrl: string; }

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl  = (s: string) => esc(s).replace(/\n/g, "<br/>");

const THUMBS = (baseUrl: string) => `
  <!-- GALLERY THUMBNAILS -->
  <div style="display:flex;gap:2px;">
    <img src="${baseUrl}/images/gallery/P64A2823.JPG" alt="" style="width:20%;height:88px;object-fit:cover;display:block;"/>
    <img src="${baseUrl}/images/gallery/P64A2850.JPG" alt="" style="width:20%;height:88px;object-fit:cover;display:block;"/>
    <img src="${baseUrl}/images/gallery/P64A2887.JPG" alt="" style="width:20%;height:88px;object-fit:cover;display:block;"/>
    <img src="${baseUrl}/images/gallery/P64A2933.jpg" alt="" style="width:20%;height:88px;object-fit:cover;display:block;"/>
    <img src="${baseUrl}/images/gallery/P64A3043.JPG" alt="" style="width:20%;height:88px;object-fit:cover;display:block;"/>
  </div>`;

/* ─────────────────────────────────────────────────────────────────────
   PROMOTIONAL — dark, punchy, one message
   ───────────────────────────────────────────────────────────────────── */
export function buildPromo({ subject, body, baseUrl }: TemplateArgs): string {
  const h = esc(subject || "Your November Order Is Waiting");
  const b = nl(body || "This is your reminder that our November order books close on the 15th. Place your order now to guarantee your spot. We can't hold stock past the deadline.");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800&display=swap" rel="stylesheet"/>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a0a; font-family: 'Montserrat', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
</style>
</head>
<body bgcolor="#0a0a0a">
<div style="max-width:600px;margin:0 auto;background:#0a0a0a;">

  <!-- HEADER -->
  <div style="background:#0f0f0f;padding:20px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <img src="${baseUrl}/images/logo-dark.png" alt="Amal Foods" style="height:44px;width:auto;display:block;"/>
  </div>

  <!-- URGENCY STRIP -->
  <div style="background:#B80013;padding:11px 32px;text-align:center;">
    <p style="color:#fff;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin:0;">Orders Close &nbsp;·&nbsp; 15 November 2025</p>
  </div>

  <!-- HERO IMAGE -->
  <img src="${baseUrl}/images/gallery/P64A3074.jpg" alt="" style="width:100%;max-width:600px;height:280px;object-fit:cover;display:block;"/>

  <!-- CONTENT -->
  <div style="padding:44px 36px 36px;">
    <h1 style="color:#ffffff;font-size:26px;font-weight:800;line-height:1.25;letter-spacing:-0.02em;margin:0 0 20px;">${h}</h1>
    <p style="color:rgba(255,255,255,0.55);font-size:15px;line-height:1.85;margin:0 0 36px;">${b}</p>
    <a href="https://www.amalfoods.co.za/" style="display:block;background:#B80013;color:#ffffff;text-align:center;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:17px 0;">Place Your Order Now</a>
  </div>

  <!-- CLOSE NOTE -->
  <div style="padding:0 36px 40px;">
    <p style="color:rgba(255,255,255,0.18);font-size:11px;text-align:center;letter-spacing:0.04em;">Orders received after 15 November cannot be guaranteed &nbsp;·&nbsp; T&Cs apply</p>
  </div>

  ${THUMBS(baseUrl)}

  <!-- FOOTER -->
  <div style="border-top:1px solid rgba(255,255,255,0.06);padding:24px 36px;text-align:center;">
    <p style="color:rgba(255,255,255,0.2);font-size:11px;line-height:1.9;margin:0 0 6px;">Amal Foods &nbsp;·&nbsp; KZN &nbsp;·&nbsp; Cape Town &nbsp;·&nbsp; Johannesburg</p>
    <p style="color:rgba(255,255,255,0.12);font-size:10px;margin:0;">
      You're receiving this as a valued customer.
      &nbsp;·&nbsp;
      <a href="#" style="color:rgba(184,0,19,0.5);text-decoration:none;">Unsubscribe</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────────
   NEWSLETTER — editorial, on-brand fonts, warm
   ───────────────────────────────────────────────────────────────────── */
export function buildNewsletter({ subject, body, baseUrl }: TemplateArgs): string {
  const h = esc(subject || "November Orders - What You Need to Know");
  const b = nl(body || "Each month we craft our menu around seasonal produce and your most-loved favourites. November is almost done. Your last chance to place before the 15th deadline.");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #F7F3EE; font-family: 'Roboto', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
</style>
</head>
<body bgcolor="#F7F3EE">
<div style="max-width:600px;margin:0 auto;background:#F7F3EE;">

  <!-- HEADER -->
  <div style="background:#111111;padding:22px 36px;display:flex;align-items:center;justify-content:space-between;">
    <img src="${baseUrl}/images/logo-dark.png" alt="Amal Foods" style="height:44px;width:auto;display:block;"/>
    <p style="color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-family:'Roboto Condensed',Arial;">November 2025</p>
  </div>

  <!-- IMAGE -->
  <img src="${baseUrl}/images/gallery/P64A3180.jpg" alt="" style="width:100%;max-width:600px;height:320px;object-fit:cover;display:block;"/>

  <!-- INTRO -->
  <div style="background:#ffffff;padding:44px 36px 36px;">
    <p style="color:#B80013;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;font-family:'Roboto Condensed',Arial;">November Issue</p>
    <h1 style="font-family:'Roboto Condensed',Arial;font-size:32px;font-weight:800;color:#111111;line-height:1.2;margin:0 0 20px;letter-spacing:-0.01em;">${h}</h1>
    <p style="color:rgba(0,0,0,0.55);font-size:15px;line-height:1.85;margin:0;">${b}</p>
  </div>

  <!-- DEADLINE CALLOUT -->
  <div style="background:#ffffff;padding:0 36px 36px;">
    <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:28px;display:flex;align-items:flex-start;gap:20px;">
      <div style="background:#B80013;color:#fff;font-family:'Roboto Condensed',Arial;font-weight:800;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;padding:10px 14px;white-space:nowrap;flex-shrink:0;">Closes</div>
      <div>
        <p style="font-family:'Roboto Condensed',Arial;font-size:22px;font-weight:800;color:#111111;margin:0 0 4px;line-height:1.15;">15 November 2025</p>
        <p style="color:rgba(0,0,0,0.4);font-size:13px;margin:0;">Orders received after this date cannot be guaranteed.</p>
      </div>
    </div>
  </div>

  <!-- CTA -->
  <div style="background:#ffffff;padding:0 36px 48px;">
    <a href="https://www.amalfoods.co.za/" style="display:block;background:#B80013;color:#ffffff;text-align:center;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:18px 0;font-family:'Roboto Condensed',Arial;">Order Before the 15th</a>
  </div>

  ${THUMBS(baseUrl)}

  <!-- FOOTER -->
  <div style="background:#EDEAE4;border-top:1px solid rgba(0,0,0,0.07);padding:24px 36px;text-align:center;">
    <p style="color:rgba(0,0,0,0.3);font-size:11px;line-height:1.9;margin:0 0 6px;">Amal Foods &nbsp;·&nbsp; KZN &nbsp;·&nbsp; Cape Town &nbsp;·&nbsp; Johannesburg</p>
    <p style="color:rgba(0,0,0,0.2);font-size:10px;margin:0;">
      You're receiving this as a valued customer.
      &nbsp;·&nbsp;
      <a href="#" style="color:#B80013;text-decoration:none;opacity:0.6;">Unsubscribe</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────────
   ANNOUNCEMENT — bold, centered, deadline-driven
   ───────────────────────────────────────────────────────────────────── */
export function buildAnnouncement({ subject, body, baseUrl }: TemplateArgs): string {
  const h = esc(subject || "Last Call - November Orders Close Soon");
  const b = nl(body || "We're putting the finishing touches on our November menu. Once the 15th passes, we can no longer accept new orders for this month. Don't miss your window.");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet"/>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #080808; font-family: 'Montserrat', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
</style>
</head>
<body bgcolor="#080808">
<div style="max-width:600px;margin:0 auto;background:#080808;">

  <!-- HEADER -->
  <div style="padding:28px 36px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);">
    <img src="${baseUrl}/images/logo-dark.png" alt="Amal Foods" style="height:44px;width:auto;display:inline-block;"/>
  </div>

  <!-- IMAGE -->
  <img src="${baseUrl}/images/gallery/P64A3148.jpg" alt="" style="width:100%;max-width:600px;height:300px;object-fit:cover;display:block;"/>

  <!-- DEADLINE BLOCK -->
  <div style="padding:44px 36px 0;text-align:center;">
    <p style="color:#B80013;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 18px;">Order Deadline</p>
    <div style="display:inline-block;border:1px solid rgba(255,255,255,0.1);padding:18px 40px;margin:0 0 28px;">
      <p style="color:#ffffff;font-size:44px;font-weight:900;line-height:1;letter-spacing:-0.03em;margin:0;">15 NOV</p>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;letter-spacing:0.1em;margin:8px 0 0;">2025 &nbsp;·&nbsp; ORDERS CLOSE</p>
    </div>
  </div>

  <!-- CONTENT -->
  <div style="padding:24px 36px 36px;text-align:center;">
    <h1 style="color:#ffffff;font-size:22px;font-weight:800;line-height:1.3;letter-spacing:-0.01em;margin:0 0 18px;">${h}</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:15px;line-height:1.85;max-width:460px;margin:0 auto 36px;">${b}</p>
    <a href="https://www.amalfoods.co.za/" style="display:inline-block;background:#B80013;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:17px 52px;">Place Your Order</a>
  </div>

  ${THUMBS(baseUrl)}

  <!-- FOOTER -->
  <div style="border-top:1px solid rgba(255,255,255,0.05);padding:24px 36px;text-align:center;">
    <p style="color:rgba(255,255,255,0.18);font-size:11px;line-height:1.9;margin:0 0 6px;">Amal Foods &nbsp;·&nbsp; KZN &nbsp;·&nbsp; Cape Town &nbsp;·&nbsp; Johannesburg</p>
    <p style="color:rgba(255,255,255,0.1);font-size:10px;margin:0;">
      You're receiving this as a valued customer.
      &nbsp;·&nbsp;
      <a href="#" style="color:rgba(184,0,19,0.5);text-decoration:none;">Unsubscribe</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

export function buildEmailHTML(template: string, subject: string, body: string, baseUrl: string): string {
  const args = { subject, body, baseUrl };
  if (template === "newsletter")   return buildNewsletter(args);
  if (template === "announcement") return buildAnnouncement(args);
  return buildPromo(args);
}
