import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { email, source } = await req.json().catch(() => ({}));

    const { data: authData } = await supabaseUser.auth.getUser();
    const user = authData?.user ?? null;
    const targetEmail = String(user?.email ?? email ?? "").trim().toLowerCase();

    if (!targetEmail || !emailRegex.test(targetEmail)) {
      return new Response(JSON.stringify({ error: "Voer een geldig e-mailadres in." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("daily_alert_subscribers")
      .select("*")
      .ilike("email", targetEmail)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.is_active) {
      return new Response(
        JSON.stringify({
          success: true,
          already_active: true,
          message: "Je staat al ingeschreven voor dagelijkse alerts.",
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
        subject: `Alert-inschrijving: ${targetEmail}`,
        content: "text/html",
        html: `
          <h2>Nieuwe alert-inschrijving</h2>
          <p><strong>E-mail:</strong> ${targetEmail}</p>
          <p><strong>Status:</strong> ${actionText}</p>
          <p><strong>Gebruiker ID:</strong> ${saved.user_id || "niet ingelogd"}</p>
          <p><strong>Bron:</strong> ${saved.source}</p>
          <p><strong>Tijdstip:</strong> ${new Date().toLocaleString("nl-NL")}</p>
        `,
      });
    } finally {
      await client.close();
    }

    return new Response(
      JSON.stringify({
        success: true,
        already_active: false,
        message: "Je bent ingeschreven voor dagelijkse e-mailalerts.",
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
