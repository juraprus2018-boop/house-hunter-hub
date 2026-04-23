---
name: Best Of Listicle Pages
description: SEO-listicles per stad (top 10 goedkoopste/grootste huur, beste buurten)
type: feature
---
URL-formats: `/goedkoopste-huurwoningen/:city`, `/grootste-huurwoningen/:city`, `/beste-buurten/:city`.

Eén component `BestOfCityPage` met `variant` prop. Properties variants tonen top 10 actieve huurwoningen geordend op price asc / surface_area desc. Beste-buurten aggregeert properties per neighborhood en sorteert op aantal woningen.

Elke pagina heeft: ranked PropertyCards met #1-#10 badge, ItemList JSON-LD, FAQSchema (3 vragen), cross-links naar andere best-of varianten + stadspagina.

Geregistreerd in `src/App.tsx` en in `generate-sitemap` edge function (priority 0.6, weekly).