import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active search alerts with email notifications
    const { data: alerts, error: alertsError } = await supabase
      .from("search_alerts")
      .select("*")
      .eq("is_active", true)
      .eq("email_notifications", true);

    if (alertsError) throw alertsError;

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

    let searchAlertNotificationsSent = 0;
    let dailySubscriberNotificationsSent = 0;

    if (alerts && alerts.length > 0) {
      for (const alert of alerts) {
        const sinceDate = alert.last_notified_at || alert.created_at;

        // Find matching properties
        let query = supabase
          .from("properties")
          .select("id, title, city, price, listing_type, property_type, slug, street, house_number, images, surface_area, bedrooms")
          .eq("status", "actief")
          .gt("created_at", sinceDate)
          .order("created_at", { ascending: false })
          .limit(6);

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

        const propertyCardsHtml = properties
          .map((p) => {
            const priceFormatted = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(p.price);
            const url = `https://www.woonpeek.nl/woning/${p.slug || p.id}`;
            const image = p.images && p.images.length > 0 ? p.images[0] : "";
            const details: string[] = [];
            if (p.surface_area) details.push(`${p.surface_area} m²`);
            if (p.bedrooms) details.push(`${p.bedrooms} slpk`);
            return `
              <td style="width:50%;padding:6px;vertical-align:top;">
                <a href="${url}" style="text-decoration:none;color:inherit;display:block;">
                  <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;">
                    ${image ? `<img src="${image}" alt="${p.title}" style="width:100%;height:140px;object-fit:cover;display:block;" />` : `<div style="width:100%;height:140px;background:#f3f4f6;"></div>`}
                    <div style="padding:10px;">
                      <div style="font-weight:700;color:#0f766e;font-size:16px;">${priceFormatted}${p.listing_type === 'huur' ? '/mnd' : ''}</div>
                      <div style="font-weight:600;font-size:13px;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title}</div>
                      <div style="font-size:12px;color:#666;margin-top:2px;">${p.city}${details.length > 0 ? ` · ${details.join(' · ')}` : ''}</div>
                    </div>
                  </div>
                </a>
              </td>`;
          })
          .join("");

        // Build 2-column grid rows
        let gridHtml = "";
        for (let r = 0; r < properties.length; r += 2) {
          const allCards = propertyCardsHtml.split("</td>");
          const card1 = allCards[r] + "</td>";
          const card2 = r + 1 < properties.length ? allCards[r + 1] + "</td>" : "<td></td>";
          gridHtml += `<tr>${card1}${card2}</tr>`;
        }

        const html = `
          <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:12px;">
            <div style="text-align:center;margin-bottom:16px;">
              <h1 style="color:#0f766e;font-size:22px;margin:0;">🏠 WoonPeek</h1>
            </div>
            <h2 style="color:#1a1a1a;font-size:20px;text-align:center;">${properties.length} nieuwe ${properties.length === 1 ? 'woning' : 'woningen'} voor "${alert.name}"</h2>
            <p style="color:#666;text-align:center;font-size:14px;margin-bottom:16px;">Hier zijn de nieuwste resultaten voor jouw zoekalert.</p>
            <table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">
              ${gridHtml}
            </table>
            <p style="text-align:center;margin:20px 0;">
              <a href="https://www.woonpeek.nl/zoeken" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;">
                Bekijk alle woningen →
              </a>
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="color:#999;font-size:11px;text-align:center;">Je ontvangt dit bericht omdat je een zoekalert hebt ingesteld op WoonPeek. <a href="https://www.woonpeek.nl/zoekalerts" style="color:#999;">Beheer alerts</a></p>
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

          searchAlertNotificationsSent++;
        } catch (emailError) {
          console.error(`Failed to send email for alert ${alert.id}:`, emailError);
        }
      }
    }

    // Daily "new listings" subscribers (guest + account users)
    const { data: dailySubscribers, error: subscribersError } = await supabase
      .from("daily_alert_subscribers")
      .select("*")
      .eq("is_active", true);

    if (subscribersError) throw subscribersError;

    for (const subscriber of dailySubscribers || []) {
      const sinceDate = subscriber.last_notified_at || subscriber.subscribed_at || subscriber.created_at;

      const { count: newCount, error: countError } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "actief")
        .gt("created_at", sinceDate);

      if (countError) {
        console.error("Count error for daily subscriber:", subscriber.email, countError);
        continue;
      }

      if (!newCount || newCount === 0) continue;

      const { data: latestProperties, error: propsError } = await supabase
        .from("properties")
        .select("id, title, city, price, listing_type, property_type, slug, street, house_number, images, surface_area, bedrooms")
        .eq("status", "actief")
        .gt("created_at", sinceDate)
        .order("created_at", { ascending: false })
        .limit(6);

      if (propsError) {
        console.error("Properties error for daily subscriber:", subscriber.email, propsError);
        continue;
      }

      const propertyCardsHtml = (latestProperties || [])
        .map((p) => {
          const priceFormatted = new Intl.NumberFormat("nl-NL", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
          }).format(p.price);
          const url = `https://www.woonpeek.nl/woning/${p.slug || p.id}`;
          const image = p.images && p.images.length > 0 ? p.images[0] : "";
          const details: string[] = [];
          if (p.surface_area) details.push(`${p.surface_area} m²`);
          if (p.bedrooms) details.push(`${p.bedrooms} slpk`);
          if (p.property_type) details.push(p.property_type);
          return `
            <td style="width:50%;padding:6px;vertical-align:top;">
              <a href="${url}" style="text-decoration:none;color:inherit;display:block;">
                <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;">
                  ${image ? `<img src="${image}" alt="${p.title}" style="width:100%;height:140px;object-fit:cover;display:block;" />` : `<div style="width:100%;height:140px;background:#f3f4f6;"></div>`}
                  <div style="padding:10px;">
                    <div style="font-weight:700;color:#0f766e;font-size:16px;margin-bottom:2px;">${priceFormatted}${p.listing_type === "huur" ? "/mnd" : ""}</div>
                    <div style="font-weight:600;font-size:13px;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title}</div>
                    <div style="font-size:12px;color:#666;margin-top:2px;">${p.city}${details.length > 0 ? ` · ${details.join(" · ")}` : ""}</div>
                  </div>
                </div>
              </a>
            </td>`;
        })
        .join("");

      // Build rows of 2 cards each
      const cards = (latestProperties || []);
      let gridHtml = "";
      for (let r = 0; r < cards.length; r += 2) {
        const card1 = propertyCardsHtml.split("</td>")[r] + "</td>";
        const card2 = r + 1 < cards.length ? propertyCardsHtml.split("</td>")[r + 1] + "</td>" : "<td></td>";
        gridHtml += `<tr>${card1}${card2}</tr>`;
      }

      const unsubscribeUrl = `https://www.woonpeek.nl/alerts/afmelden/${subscriber.unsubscribe_token}`;
      const html = `
        <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:16px;">
            <h1 style="color:#0f766e;font-size:22px;margin:0;">🏠 WoonPeek</h1>
          </div>
          <h2 style="color:#1a1a1a;font-size:20px;text-align:center;margin-bottom:4px;">${newCount} nieuwe ${newCount === 1 ? 'woning' : 'woningen'} gevonden!</h2>
          <p style="color:#666;text-align:center;margin-bottom:16px;font-size:14px;">Hier is je dagelijks overzicht van het nieuwste woningaanbod.</p>
          <table style="width:100%;border-collapse:collapse;border-spacing:0;" cellpadding="0" cellspacing="0">
            ${gridHtml}
          </table>
          ${newCount > 6 ? `<p style="text-align:center;color:#666;font-size:13px;margin-top:8px;">...en ${newCount - 6} meer</p>` : ""}
          <p style="text-align:center;margin:20px 0;">
            <a href="https://www.woonpeek.nl/nieuw-aanbod" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;">
              Bekijk alle ${newCount} woningen →
            </a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#999;font-size:11px;text-align:center;">
            Je ontvangt deze e-mail omdat je je hebt aangemeld voor dagelijkse alerts op WoonPeek.
            <a href="${unsubscribeUrl}" style="color:#999;">Afmelden</a>
          </p>
        </div>
      `;

      try {
        await smtpClient.send({
          from: "WoonPeek <info@woonpeek.nl>",
          to: subscriber.email,
          subject: `${newCount} nieuwe woningen vandaag op WoonPeek`,
          content: "text/html",
          html,
        });

        await supabase
          .from("daily_alert_subscribers")
          .update({ last_notified_at: new Date().toISOString() })
          .eq("id", subscriber.id);

        dailySubscriberNotificationsSent++;
      } catch (emailError) {
        console.error(`Failed to send daily alert email to ${subscriber.email}:`, emailError);
      }
    }

    await smtpClient.close();

    return new Response(
      JSON.stringify({
        success: true,
        search_alert_notifications_sent: searchAlertNotificationsSent,
        daily_alert_notifications_sent: dailySubscriberNotificationsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check search alerts error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
