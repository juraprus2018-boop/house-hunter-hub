

## Alle scrapers voorzien van de juiste `complete_data` configuratie

### Wat gaan we doen?
Elke scraper krijgt in de database de juiste instelling zodat het systeem weet of een scraper **alle** woningen ophaalt (API-gebaseerd) of slechts een deel (HTML/eerste pagina).

### Classificatie van scrapers

| Scraper | Type | Alle woningen? | Instelling |
|---------|------|---------------|------------|
| Wooniezie | JSON API | Ja | `complete_data: true` (al ingesteld) |
| Kamernet | HTML (pagina 1) | Nee | `complete_data: false` |
| DirectWonen | HTML (pagina 1) | Nee | `complete_data: false` |
| Pararius | HTML (pagina 1) | Nee | `complete_data: false` |
| Vesteda | HTML (pagina 1) | Nee | `complete_data: false` |
| Huurwoningen.nl | HTML (pagina 1) | Nee | `complete_data: false` |
| Funda | Geblokkeerd | N.v.t. | `complete_data: false` |
| Jaap.nl | Geblokkeerd | N.v.t. | `complete_data: false` |
| Overige (123Wonen, De Key, etc.) | Niet geimplementeerd | N.v.t. | `complete_data: false` |

### Resultaat
- **Wooniezie** (API): woningen die niet meer in de API staan worden **direct** op inactief gezet
- **Alle andere scrapers** (HTML): woningen worden pas na **7 dagen** niet gezien op inactief gezet, om foutieve deactivering door paginering te voorkomen

### Technische stappen

1. **Database-update**: Voor alle scrapers behalve Wooniezie de config bijwerken met `complete_data: false` zodat dit expliciet is vastgelegd
2. Wooniezie heeft al `complete_data: true` -- geen actie nodig

Dit is een eenvoudige database-update van de `config` kolom in de `scrapers` tabel voor alle niet-Wooniezie scrapers.
