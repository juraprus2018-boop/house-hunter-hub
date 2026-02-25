import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active alerts with email notifications
    const { data: alerts, error: alertsError } = await supabase
      .from("search_alerts")
      .select("*")
      .eq("is_active", true)
      .eq("email_notifications", true);

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: "No active alerts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smtpClient = new SMTPClient({
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

    let notificationsSent = 0;

    for (const alert of alerts) {
      const sinceDate = alert.last_notified_at || alert.created_at;

      // Find matching properties
      let query = supabase
        .from("properties")
        .select("id, title, city, price, listing_type, property_type, slug, street, house_number")
        .eq("status", "actief")
        .gt("created_at", sinceDate)
        .order("created_at", { ascending: false })
        .limit(10);

      if (alert.city) query = query.ilike("city", `%${alert.city}%`);
      if (alert.property_type) query = query.eq("property_type", alert.property_type);
      if (alert.listing_type) query = query.eq("listing_type", alert.listing_type);
      if (alert.min_price) query = query.gte("price", alert.min_price);
      if (alert.max_price) query = query.lte("price", alert.max_price);

      const { data: properties } = await query;

      if (!properties || properties.length === 0) continue;

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
      if (!userData?.user?.email) continue;

      const propertyListHtml = properties
        .map((p) => {
          const priceFormatted = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(p.price);
          const url = `https://www.woonpeek.nl/woning/${p.slug || p.id}`;
          return `<li style="margin-bottom:12px;"><a href="${url}" style="color:#2563eb;text-decoration:none;font-weight:600;">${p.title}</a><br/><span style="color:#666;">${p.street} ${p.house_number}, ${p.city} — ${priceFormatted}${p.listing_type === 'huur' ? '/mnd' : ''}</span></li>`;
        })
        .join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1a1a1a;">Nieuwe woningen voor "${alert.name}"</h2>
          <p style="color:#666;">Er ${properties.length === 1 ? 'is' : 'zijn'} ${properties.length} nieuwe ${properties.length === 1 ? 'woning' : 'woningen'} gevonden:</p>
          <ul style="list-style:none;padding:0;">${propertyListHtml}</ul>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
          <p style="color:#999;font-size:12px;">Je ontvangt dit bericht omdat je een zoekalert hebt ingesteld op WoonPeek. Je kunt alerts beheren op <a href="https://www.woonpeek.nl/zoekalerts">woonpeek.nl/zoekalerts</a>.</p>
        </div>
      `;

      try {
        await smtpClient.send({
          from: "WoonPeek <info@woonpeek.nl>",
          to: userData.user.email,
          subject: `${properties.length} nieuwe ${properties.length === 1 ? 'woning' : 'woningen'} voor "${alert.name}"`,
          content: "text/html",
          html,
        });

        await supabase
          .from("search_alerts")
          .update({ last_notified_at: new Date().toISOString() })
          .eq("id", alert.id);

        notificationsSent++;
      } catch (emailError) {
        console.error(`Failed to send email for alert ${alert.id}:`, emailError);
      }
    }

    await smtpClient.close();

    return new Response(
      JSON.stringify({ message: `Sent ${notificationsSent} notifications` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check search alerts error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
