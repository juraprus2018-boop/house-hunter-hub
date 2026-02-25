import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id, sender_name, sender_email, sender_phone, message } = await req.json();

    if (!property_id || !sender_name || !sender_email || !message) {
      return new Response(JSON.stringify({ error: "Vul alle verplichte velden in" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sender_email)) {
      return new Response(JSON.stringify({ error: "Ongeldig e-mailadres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get property details
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("title, city, street, house_number, user_id")
      .eq("id", property_id)
      .single();

    if (propError || !property) {
      return new Response(JSON.stringify({ error: "Woning niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get owner email
    const { data: ownerData } = await supabase.auth.admin.getUserById(property.user_id);
    const ownerEmail = ownerData?.user?.email;

    if (!ownerEmail) {
      return new Response(JSON.stringify({ error: "Eigenaar niet gevonden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedName = sender_name.substring(0, 100).replace(/[<>]/g, "");
    const sanitizedMessage = message.substring(0, 2000).replace(/[<>]/g, "");
    const sanitizedPhone = sender_phone ? sender_phone.substring(0, 20).replace(/[<>]/g, "") : null;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a1a1a;">Nieuw bericht over je woning</h2>
        <p style="color:#666;">Je hebt een bericht ontvangen over <strong>${property.title}</strong> (${property.street} ${property.house_number}, ${property.city}).</p>
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>Van:</strong> ${sanitizedName} (${sender_email})</p>
          ${sanitizedPhone ? `<p style="margin:0 0 8px;"><strong>Telefoon:</strong> ${sanitizedPhone}</p>` : ""}
          <p style="margin:0;"><strong>Bericht:</strong></p>
          <p style="white-space:pre-wrap;margin:8px 0 0;">${sanitizedMessage}</p>
        </div>
        <p style="color:#666;font-size:14px;">Je kunt direct reageren door te antwoorden op ${sender_email}.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="color:#999;font-size:12px;">Dit bericht is verzonden via WoonPeek.</p>
      </div>
    `;

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

    // Send to owner
    await smtpClient.send({
      from: "WoonPeek <info@woonpeek.nl>",
      to: ownerEmail,
      subject: `Nieuw bericht over: ${property.title}`,
      content: "text/html",
      html,
    });

    // Send copy to WoonPeek
    await smtpClient.send({
      from: "WoonPeek <info@woonpeek.nl>",
      to: "info@woonpeek.nl",
      subject: `[Kopie] Contactbericht: ${property.title}`,
      content: "text/html",
      html,
    });

    await smtpClient.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
