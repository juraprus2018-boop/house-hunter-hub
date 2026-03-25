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
    const { recipientEmail, recipientName, subject, htmlContent, templateName, trackingId, userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?t=${trackingId}`;

    const finalHtml = htmlContent + `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`;

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

    await client.send({
      from: "WoonPeek <info@woonpeek.nl>",
      to: recipientEmail,
      subject,
      content: "text/html",
      html: finalHtml,
    });

    await client.close();

    // Log to database
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    await supabase.from("admin_sent_emails").insert({
      recipient_email: recipientEmail,
      recipient_name: recipientName || null,
      subject,
      template_name: templateName,
      html_content: finalHtml,
      tracking_id: trackingId,
      sent_by: userId,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), {
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
