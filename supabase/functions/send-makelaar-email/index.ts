import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isDuplicateError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as { code?: string; message?: string };
  return maybeError.code === "23505" || maybeError.message?.toLowerCase().includes("duplicate recipient email") === true;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const rawRecipients: { email: string; name?: string }[] = body.recipients || [
      { email: body.recipientEmail, name: body.recipientName }
    ];
    const { subject, htmlContent, templateName, userId } = body;

    if (!userId) {
      throw new Error("Gebruiker niet gevonden voor verzending");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

    const results: { email: string; success: boolean; error?: string; skipped?: boolean }[] = [];

    const uniqueRecipients = Array.from(
      rawRecipients.reduce((map, recipient) => {
        if (!recipient?.email) return map;

        const normalizedEmail = normalizeEmail(recipient.email);
        if (!normalizedEmail || map.has(normalizedEmail)) return map;

        map.set(normalizedEmail, {
          email: normalizedEmail,
          name: recipient.name?.trim() || undefined,
        });

        return map;
      }, new Map<string, { email: string; name?: string }>()).values()
    );

    if (uniqueRecipients.length === 0) {
      throw new Error("Geen geldige ontvangers gevonden");
    }

    for (const recipient of uniqueRecipients) {
      const trackingId = crypto.randomUUID();
      const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?t=${trackingId}`;

      let personalizedHtml = htmlContent;
      if (recipient.name) {
        personalizedHtml = htmlContent.replace(/Geachte heer\/mevrouw,/g, `Geachte ${recipient.name},`);
      }

      const cleanHtml = personalizedHtml.replace(/\n\s+/g, '\n').replace(/\s{2,}/g, ' ').trim();
      const finalHtml = cleanHtml + `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`;

      const { data: reservation, error: reservationError } = await supabase
        .from("admin_sent_emails")
        .insert({
          recipient_email: recipient.email,
          recipient_name: recipient.name || null,
          subject,
          template_name: templateName,
          html_content: null,
          tracking_id: trackingId,
          sent_by: userId,
          status: "sending",
        })
        .select("id")
        .single();

      if (reservationError) {
        if (isDuplicateError(reservationError)) {
          results.push({ email: recipient.email, success: true, skipped: true });
          continue;
        }

        throw reservationError;
      }

      if (!reservation?.id) {
        results.push({ email: recipient.email, success: false, error: "Kon verzending niet reserveren" });
        continue;
      }

      // Create a fresh SMTP client per email to avoid connection timeout issues
      let client: SMTPClient | null = null;
      try {
        client = new SMTPClient({
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
          to: recipient.email,
          subject,
          content: "auto",
          html: finalHtml,
          encoding: "8bit",
        });

        await client.close();
        client = null;

        const { error: updateError } = await supabase
          .from("admin_sent_emails")
          .update({
            recipient_name: recipient.name || null,
            html_content: finalHtml,
            status: "sent",
          })
          .eq("id", reservation.id);

        if (updateError) {
          throw updateError;
        }

        results.push({ email: recipient.email, success: true });
      } catch (err) {
        if (client) {
          try { await client.close(); } catch { /* ignore */ }
        }

        await supabase
          .from("admin_sent_emails")
          .delete()
          .eq("id", reservation.id);

        results.push({ email: recipient.email, success: false, error: err instanceof Error ? err.message : "Unknown" });
      }
    }

    const sent = results.filter(r => r.success && !r.skipped).length;
    const failed = results.filter(r => !r.success).length;
    const skipped = results.filter(r => r.skipped).length;

    return new Response(JSON.stringify({ success: true, sent, failed, skipped, results }), {
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
