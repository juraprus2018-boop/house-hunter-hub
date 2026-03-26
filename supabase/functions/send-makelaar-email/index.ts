import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both single and bulk sending
    const recipients: { email: string; name?: string }[] = body.recipients || [
      { email: body.recipientEmail, name: body.recipientName }
    ];
    const { subject, htmlContent, templateName, userId } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

    const client = new SMTPClient({
      connection: {
        hostname: "woonpeek.nl",
        port: 465,
        tls: true,
        auth: {
          username: "info@woonpeek.nl",
          password: Deno.env.get("SMTP_PASSWORD") || "",
        },
      },
    });

    const results: { email: string; success: boolean; error?: string; skipped?: boolean }[] = [];

    // Check which recipients already received this template
    const emails = recipients.map((r: { email: string }) => r.email.toLowerCase());
    const { data: alreadySent } = await supabase
      .from("admin_sent_emails")
      .select("recipient_email")
      .eq("template_name", templateName)
      .in("recipient_email", emails);

    const alreadySentSet = new Set(
      (alreadySent || []).map((r: { recipient_email: string }) => r.recipient_email.toLowerCase())
    );

    for (const recipient of recipients) {
      const emailLower = recipient.email.toLowerCase();

      if (alreadySentSet.has(emailLower)) {
        results.push({ email: recipient.email, success: true, skipped: true });
        continue;
      }

      const trackingId = crypto.randomUUID();
      const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?t=${trackingId}`;

      let personalizedHtml = htmlContent;
      if (recipient.name) {
        personalizedHtml = htmlContent.replace(/Geachte heer\/mevrouw,/g, `Geachte ${recipient.name},`);
      }

      const cleanHtml = personalizedHtml.replace(/\n\s+/g, '\n').replace(/\s{2,}/g, ' ').trim();
      const finalHtml = cleanHtml + `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`;

      try {
        await client.send({
          from: "WoonPeek <info@woonpeek.nl>",
          to: recipient.email,
          subject,
          content: "auto",
          html: finalHtml,
          encoding: "8bit",
        });

        await supabase.from("admin_sent_emails").insert({
          recipient_email: recipient.email,
          recipient_name: recipient.name || null,
          subject,
          template_name: templateName,
          html_content: finalHtml,
          tracking_id: trackingId,
          sent_by: userId,
          status: "sent",
        });

        results.push({ email: recipient.email, success: true });
      } catch (err) {
        results.push({ email: recipient.email, success: false, error: err instanceof Error ? err.message : "Unknown" });
      }

      if (recipients.length > 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    await client.close();

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({ success: true, sent, failed, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send makelaar email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
