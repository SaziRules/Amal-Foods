import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = (formData.get("email") as string)?.trim();
    const name = (formData.get("name") as string)?.trim() || "Customer";
    const pdfFile = formData.get("pdf") as File | null;

    // ✅ order data from checkout
    const order = {
      order_number: formData.get("order-number") as string,
      total: Number(formData.get("total")),
      branch: formData.get("branch") as string,
      region: formData.get("region") as string,
      payment_method: formData.get("payment-method") as string,
    };

    if (!email || !pdfFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert PDF to base64
    const pdfArray = await pdfFile.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfArray).toString("base64");

    // ✅ Send email via Resend
    const { error } = await resend.emails.send({
      from: "Amal Foods <invoices@amalfoods.co.za>",
      replyTo: "orders@amalfoods.co.za",
      to: [email, "orders@amalfoods.co.za"], // customer + internal
      subject: `Proforma Invoice — Amal Foods`,
      html: `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; padding: 30px 0; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 0px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.08);">
      
      <!-- HEADER -->
      <div style="background-color: #111; padding: 25px 30px; text-align: center;">
        <img src="https://amalfoods.co.za/images/logo-dark.png" alt="Amal Foods" style="width: 160px; max-width: 100%;" />
      </div>

      <!-- BODY -->
      <div style="padding: 35px 30px; color: #333;">
        <h2 style="margin: 0 0 15px; color: #B80013;">Thank You for Your Order!</h2>

        <p style="margin: 0 0 15px; line-height: 1.6;">
          Dear <strong>${name}</strong>,
        </p>

        <p style="margin: 0 0 15px; line-height: 1.6;">
          We’re delighted to confirm that your order with <strong>Amal Foods</strong> has been successfully received.
          Your official invoice is attached below for your records.
        </p>

        <p style="margin: 0 0 15px; line-height: 1.6;">
          At Amal Foods, we pride ourselves on seamless service delivery — from effortless ordering to reliable pickup.
          Rest assured that your order is now being processed with the same care and passion we put into every product we make.
          We appreciate your trust and look forward to serving you again soon.
        </p>

        <div style="background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 15px 20px; margin: 25px 0;">
          <p style="margin: 0; font-size: 15px; color: #111;">
            <strong>Order Number:</strong> ${order.order_number || "Pending"}<br/>
            <strong>Total:</strong> R${Number(order.total).toFixed(2)}<br/>
            <strong>Branch:</strong> ${order.branch}<br/>
            <strong>Region:</strong> ${order.region}<br/>
            <strong>Payment Method:</strong> ${order.payment_method || "EFT before collection"}
          </p>
        </div>

        <!-- PAYMENT DETAILS -->
        <h3 style="margin: 25px 0 10px; color: #111;">Banking Details</h3>
        <p style="margin: 0 0 15px; line-height: 1.6;">
          <strong>Bank:</strong> Nedbank<br/>
          <strong>Account Name:</strong> Amal Holdings<br/>
          <strong>Account Number:</strong> 1169327818<br/>
          <strong>Reference:</strong> Your Full Name<br/>
        </p>
        <p style="margin: 0 0 15px; line-height: 1.6; color: #555;">
          Please send proof of payment to 
          <a href="mailto:orders@amalfoods.co.za" style="color: #B80013; text-decoration: none;">orders@amalfoods.co.za</a>
          before collection. Once confirmed, our friendly staff will prepare your order for pickup.
        </p>

        <a href="https://amalfoods.co.za"
          style="display:inline-block; background-color:#B80013; color:#fff; text-decoration:none;
                 padding:12px 25px; border-radius:30px; font-weight:bold; font-size:14px; margin-top:10px;">
          Visit Our Website
        </a>
      </div>

      <!-- FOOTER (Standardized for all clients) -->
      <div style="background: #000; color: #ccc; font-size: 12px; text-align: center; padding: 25px; line-height: 1.6;">
        <p style="margin: 0 0 6px;">1271 Umgeni Rd, Stamford Hill, Durban, 4025</p>
        <p style="margin: 0 0 6px;">031 303 7786</p>
        <p style="margin: 0 0 12px;">
          <a href="mailto:info@amalfoods.co.za" style="color: #B80013; text-decoration: none;">info@amalfoods.co.za</a>
        </p>
        <p style="margin: 0; color: #999;">
          © ${new Date().getFullYear()} Amal Foods. All rights reserved.<br/>
          Crafted with care to make every meal a little more special.
        </p>
      </div>
    </div>
  </div>
`,
      attachments: [
        {
          filename: pdfFile.name || "invoice.pdf",
          content: pdfBase64,
        },
      ],
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("⚠️ Email send failed:", err);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
