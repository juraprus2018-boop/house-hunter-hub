---
name: Inkomen Landingspagina's
description: SEO-pagina's per stad/inkomen die huurwoningen filteren op de 3x huur regel
type: feature
---
URL-format: `/huur-bij-inkomen-:income-:city` (bijv. `/huur-bij-inkomen-3500-amsterdam`).

Vaste inkomensbrackets: 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000.

Logica: maxRent = floor(income / 3) wordt doorgegeven aan useProperties. PropertyCards krijgen userIncome zodat affordability badges (Past binnen budget / Te duur) actief zijn.

Pagina bevat: hero stats card (max huur), unieke intro per stad/inkomen, FAQ over 3x regel, vakantiegeld en samen huren, en interne links naar andere inkomensbrackets in dezelfde stad.

Alle combinaties zijn opgenomen in de sitemap edge function (generate-sitemap) voor Google indexering.
