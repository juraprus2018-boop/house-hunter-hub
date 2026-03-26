const LOGO_URL = "https://www.woonpeek.nl/assets/logo-woonpeek-CMQsaJz-.png";

export const EMAIL_TEMPLATES: Record<string, { name: string; subject: string; getHtml: (recipientName?: string) => string }> = {
  "makelaar-welkom": {
    name: "Makelaar Welkom",
    subject: "Vergroot uw bereik met WoonPeek",
    getHtml: (name?: string) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;">
<div style="background:#1a365d;padding:30px;text-align:center;">
<img src="${LOGO_URL}" alt="WoonPeek" height="50" style="display:inline-block;" />
</div>
<div style="padding:30px;">
<p style="color:#1a365d;font-size:16px;margin:0 0 20px;">${name ? `Geachte ${name},` : "Geachte heer/mevrouw,"}</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 15px;">Graag stellen wij ons voor: wij zijn <strong>WoonPeek</strong>, een groeiend woningplatform in Nederland. Wij bieden makelaars de mogelijkheid om kosteloos hun woningaanbod bij ons te plaatsen.</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 20px;">Door uw aanbod op WoonPeek te plaatsen profiteert u van:</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Kosteloos uw woningen plaatsen</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Extra bezoekers naar uw eigen website</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Automatische koppeling via XML of JSON feed</td></tr>
<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#333333;font-size:14px;">Professionele presentatie van uw aanbod</td></tr>
<tr><td style="padding:10px 12px;color:#333333;font-size:14px;">Dagelijks nieuwe woningzoekers op ons platform</td></tr>
</table>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 25px;">De koppeling is eenvoudig. Of u een XML-feed heeft, handmatig wilt plaatsen of een andere voorkeur heeft, wij denken graag met u mee.</p>
<div style="text-align:center;margin:0 0 25px;">
<a href="https://www.woonpeek.nl/makelaar-koppelen" style="display:inline-block;background:#1a365d;color:#ffffff;text-decoration:none;padding:12px 30px;font-size:14px;font-weight:600;">Gratis aanmelden</a>
</div>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 5px;">Met vriendelijke groet,</p>
<p style="color:#1a365d;font-size:14px;font-weight:600;margin:0;">Team WoonPeek</p>
</div>
<div style="background:#f8fafc;padding:20px 30px;border-top:1px solid #e2e8f0;">
<p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">WoonPeek.nl | info@woonpeek.nl</p>
</div>
</div>`,
  },
  "makelaar-herinnering": {
    name: "Makelaar Herinnering",
    subject: "Herinnering: plaats kosteloos uw woningen op WoonPeek",
    getHtml: (name?: string) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;">
<div style="background:#1a365d;padding:30px;text-align:center;">
<img src="${LOGO_URL}" alt="WoonPeek" height="50" style="display:inline-block;" />
</div>
<div style="padding:30px;">
<p style="color:#1a365d;font-size:16px;margin:0 0 20px;">${name ? `Geachte ${name},` : "Geachte heer/mevrouw,"}</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 15px;">Onlangs hebben wij u benaderd over de mogelijkheid om kosteloos uw woningaanbod op WoonPeek te plaatsen. Graag herinneren wij u aan dit aanbod.</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 20px;">Makelaars die op WoonPeek staan, bereiken dagelijks extra woningzoekers zonder dat daar kosten aan verbonden zijn. De koppeling is snel geregeld.</p>
<div style="text-align:center;margin:0 0 25px;">
<a href="https://www.woonpeek.nl/makelaar-koppelen" style="display:inline-block;background:#1a365d;color:#ffffff;text-decoration:none;padding:12px 30px;font-size:14px;font-weight:600;">Nu aanmelden</a>
</div>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 15px;">Heeft u vragen of wilt u meer informatie? Neem gerust contact met ons op via <a href="mailto:info@woonpeek.nl" style="color:#1a365d;">info@woonpeek.nl</a>.</p>
<p style="color:#333333;font-size:14px;line-height:1.6;margin:0 0 5px;">Met vriendelijke groet,</p>
<p style="color:#1a365d;font-size:14px;font-weight:600;margin:0;">Team WoonPeek</p>
</div>
<div style="background:#f8fafc;padding:20px 30px;border-top:1px solid #e2e8f0;">
<p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">WoonPeek.nl | info@woonpeek.nl</p>
</div>
</div>`,
  },
};
