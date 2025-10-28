import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY); // add this key to .env

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const pdfFile = formData.get("pdf") as File;

    if (!email || !pdfFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    await resend.emails.send({
      from: "Amal Foods <onboarding@resend.dev>",
      to: [email, "design1@movedigital.co.za"], // ✅ send to customer + manager
      subject: `Invoice — Amal Foods`,
      html: `
        <p>Dear ${name || "Customer"},</p>
        <p>Thank you for your order with <strong>Amal Foods</strong>.</p>
        <p>Your invoice is attached below.</p>
        <p>Kind regards,<br>Amal Foods Team</p>
      `,
      attachments: [
        {
          filename: pdfFile.name,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("⚠️ Email send failed:", err);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
