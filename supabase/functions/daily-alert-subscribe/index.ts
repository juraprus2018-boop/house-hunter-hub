import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+[1-9]\d{6,14}$/;

async function verifyTurnstileToken(token: string, remoteIp?: string | null) {
  const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secretKey) return { success: true };
  if (!token) return { success: false, message: "Captcha-token ontbreekt." };

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (remoteIp) formData.append("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) return { success: false, message: "Captcha-verificatie mislukt." };
  const data = await res.json();
  return {
    success: data.success === true,
    message: data.success === true ? undefined : "Captcha-controle mislukt. Probeer opnieuw.",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { email, city, phone_number, whatsapp_enabled, source, turnstileToken } = await req.json().catch(() => ({}));

    // Validate captcha
    const captcha = await verifyTurnstileToken(String(turnstileToken || ""), req.headers.get("x-forwarded-for"));
    if (!captcha.success) {
      return new Response(JSON.stringify({ error: captcha.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate city (required)
    const cleanCity = String(city || "").trim();
    if (!cleanCity) {
      return new Response(JSON.stringify({ error: "Selecteer een stad." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate phone if WhatsApp enabled
    const wantWhatsapp = whatsapp_enabled === true;
    const cleanPhone = String(phone_number || "").trim();
    if (wantWhatsapp && (!cleanPhone || !phoneRegex.test(cleanPhone))) {
      return new Response(JSON.stringify({ error: "Vul een geldig telefoonnummer in met landcode (bijv. +31612345678)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve user
    let user: { id: string; email?: string | null } | null = null;
    if (jwt) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
      if (!userError) {
        user = userData.user ? { id: userData.user.id, email: userData.user.email } : null;
      }
    }

    const targetEmail = String(user?.email ?? email ?? "").trim().toLowerCase();
    if (!targetEmail || !emailRegex.test(targetEmail)) {
      return new Response(JSON.stringify({ error: "Voer een geldig e-mailadres in." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("daily_alert_subscribers")
      .select("*")
      .ilike("email", targetEmail)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.is_active && existing?.city === cleanCity) {
      return new Response(
        JSON.stringify({
          success: true,
          already_active: true,
          message: `Je staat al ingeschreven voor alerts in ${cleanCity}.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isReactivation = Boolean(existing && !existing.is_active);

    const upsertPayload = {
      email: targetEmail,
      user_id: user?.id ?? existing?.user_id ?? null,
      is_active: true,
      unsubscribed_at: null,
      city: cleanCity,
      phone_number: wantWhatsapp ? cleanPhone : existing?.phone_number ?? null,
      whatsapp_enabled: wantWhatsapp,
      source: String(source || (user ? "account" : "guest")).substring(0, 50),
      subscribed_at: isReactivation ? existing?.subscribed_at ?? new Date().toISOString() : new Date().toISOString(),
      last_notified_at: null,
    };

    const { data: saved, error: upsertError } = await supabaseAdmin
      .from("daily_alert_subscribers")
      .upsert(upsertPayload, { onConflict: "email" })
      .select("*")
      .single();

    if (upsertError) throw upsertError;

    // Send admin notification
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

    try {
      const actionText = isReactivation ? "opnieuw ingeschreven" : "nieuw ingeschreven";
      await client.send({
        from: "WoonPeek <info@woonpeek.nl>",
        to: "info@woonpeek.nl",
        subject: `Alert-inschrijving: ${targetEmail} (${cleanCity})`,
        content: "text/html",
        html: `
          <h2>Nieuwe alert-inschrijving</h2>
          <p><strong>E-mail:</strong> ${targetEmail}</p>
          <p><strong>Stad:</strong> ${cleanCity}</p>
          <p><strong>WhatsApp:</strong> ${wantWhatsapp ? `Ja (${cleanPhone})` : "Nee"}</p>
          <p><strong>Status:</strong> ${actionText}</p>
          <p><strong>Gebruiker ID:</strong> ${saved.user_id || "niet ingelogd"}</p>
          <p><strong>Bron:</strong> ${saved.source}</p>
          <p><strong>Tijdstip:</strong> ${new Date().toLocaleString("nl-NL")}</p>
        `,
      });
    } finally {
      await client.close();
    }

    const channels = ["e-mail"];
    if (wantWhatsapp) channels.push("WhatsApp");

    return new Response(
      JSON.stringify({
        success: true,
        already_active: false,
        message: `Je bent ingeschreven voor woningalerts in ${cleanCity} via ${channels.join(" en ")}.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("daily-alert-subscribe error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
