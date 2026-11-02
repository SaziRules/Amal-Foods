import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: email.trim().toLowerCase(),
    options: {
      redirectTo: "https://amalfoods.co.za/customer/dashboard",
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const magicLink = data.properties?.action_link;
  if (!magicLink) {
    return NextResponse.json({ error: "Could not generate login link." }, { status: 500 });
  }

  try {
    await sendBrevoEmail({
      to: email.trim().toLowerCase(),
      name: "",
      subject: "Your Amal Foods login link",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#0d0d0d;color:#ffffff;padding:48px 40px;">
          <p style="color:#B80013;font-size:10px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 20px;">Amal Foods</p>
          <h1 style="font-size:28px;font-weight:900;text-transform:uppercase;margin:0 0 12px;line-height:1.1;">Sign in to<br/>your account.</h1>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.6;margin:0 0 36px;">
            Click the button below to sign in. This link expires in 1 hour and can only be used once.
          </p>
          <a href="${magicLink}"
             style="display:inline-block;background:#B80013;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:999px;font-weight:700;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">
            Access My Account →
          </a>
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:40px 0 0;line-height:1.6;">
            If you didn't request this, you can safely ignore this email.<br/>
            This link was requested for ${email.trim().toLowerCase()}.
          </p>
        </div>
      `,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
