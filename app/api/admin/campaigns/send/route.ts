import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendBrevoEmail } from "@/lib/brevo";

export const maxDuration = 60;

const DAILY_LIMIT = 100;

export async function POST(req: NextRequest) {
  const { campaignName, subject, htmlContent, recipients } = await req.json() as {
    campaignName: string;
    subject: string;
    htmlContent: string;
    recipients: { email: string; name: string }[];
  };

  if (!subject || !htmlContent || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  /* Check how many campaign emails have already been sent today */
  const { data: todayLog } = await supabaseAdmin
    .from("campaign_sends")
    .select("count")
    .eq("date", today)
    .maybeSingle();

  const sentToday = (todayLog as any)?.count ?? 0;
  const remaining = DAILY_LIMIT - sentToday;

  if (remaining <= 0) {
    return NextResponse.json(
      { error: `Daily campaign limit of ${DAILY_LIMIT} reached. Resets at midnight.` },
      { status: 429 }
    );
  }

  /* Cap the list to however many sends remain */
  const toSend = recipients.slice(0, remaining);
  const wasCapped = toSend.length < recipients.length;

  /* Send in parallel batches of 10 */
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const BATCH = 10;

  for (let i = 0; i < toSend.length; i += BATCH) {
    const batch = toSend.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(r =>
        sendBrevoEmail({ to: r.email, name: r.name || "", subject, htmlContent })
      )
    );
    settled.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        errors.push(`${batch[idx].email}: ${result.reason?.message ?? "unknown error"}`);
      }
    });
  }

  /* Record the day's campaign send count */
  if (sent > 0) {
    await supabaseAdmin
      .from("campaign_sends")
      .upsert({ date: today, count: sentToday + sent }, { onConflict: "date" });
  }

  return NextResponse.json({
    sent,
    failed,
    wasCapped,
    cappedAt: DAILY_LIMIT,
    remaining: Math.max(0, remaining - sent),
    errors: errors.slice(0, 5),
  });
}
