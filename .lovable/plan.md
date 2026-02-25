

# Plan: 6 verbeteringen voor WoonPeek

## 1. Dynamische Homepage Statistieken
De "-" placeholders in de HeroSection vervangen door echte aantallen uit de database.

**Aanpak:**
- Nieuwe hook `useHomeStats` in `useProperties.ts` die 3 queries uitvoert:
  - `SELECT COUNT(*) FROM properties WHERE status = 'actief'` (aantal woningen)
  - `SELECT COUNT(DISTINCT user_id) FROM profiles` (aantal gebruikers)  
  - `SELECT COUNT(DISTINCT city) FROM properties WHERE status = 'actief'` (aantal steden)
- Database functie `get_home_stats` aanmaken (via migration) die deze 3 waarden teruggeeft in 1 query (efficienter)
- `HeroSection.tsx` aanpassen om de hook te gebruiken en de echte aantallen te tonen

## 2. Delen-knop werkend maken
De "Delen" knop op de woningdetailpagina activeren met Web Share API / fallback opties.

**Aanpak:**
- In `PropertyDetail.tsx` de bestaande "Delen" knop vervangen door een werkende versie:
  - Op mobiel: Web Share API (native deelscherm)
  - Op desktop: Dropdown met WhatsApp, E-mail en "Link kopieren" opties
- Gebruik `navigator.share` met fallback naar een Popover met deelknoppen
- Geen backend wijzigingen nodig

## 3. Zoekalerts
Gebruikers kunnen e-mail notificaties instellen voor nieuwe woningen. De `search_alerts` tabel bestaat al.

**Aanpak:**
- Nieuwe pagina `src/pages/SearchAlerts.tsx` voor het beheren van alerts
- Route `/zoekalerts` toevoegen in `App.tsx`
- Link naar zoekalerts in het gebruikersmenu in de Header
- Formulier om een alert aan te maken (stad, type, prijs, etc.)
- Lijst van bestaande alerts met aan/uit switch en verwijderknop
- Nieuwe Edge Function `check-search-alerts` die:
  - Alle actieve alerts ophaalt
  - Per alert nieuwe woningen zoekt (created_at > last_notified_at)
  - Matching woningen e-mailt via de bestaande `send-email` functie
  - `last_notified_at` bijwerkt
- Hook `useSearchAlerts` voor CRUD operaties

## 4. Paginering op zoekpagina
Niet alle woningen tegelijk laden, maar per pagina (bv. 12 per pagina).

**Aanpak:**
- `useProperties` hook uitbreiden met `page` en `pageSize` parameters
- Supabase `.range()` gebruiken voor server-side paginering
- Aparte count-query voor totaal aantal resultaten
- Pagination component toevoegen onderaan de zoekresultaten in `Search.tsx`
- URL parameters `pagina` bijwerken bij navigatie

## 5. Gebruikersprofiel beheer
Pagina waar gebruikers hun naam, telefoon en profielfoto kunnen aanpassen.

**Aanpak:**
- Nieuwe pagina `src/pages/Profile.tsx`
- Route `/profiel` toevoegen in `App.tsx`
- Link naar profiel in het gebruikersmenu in de Header
- Formulier met velden: weergavenaam, telefoon, bio
- Profielfoto upload naar de bestaande `property-images` bucket (of nieuwe `avatars` bucket)
- Hook `useProfile` voor het ophalen en bijwerken van het profiel uit de `profiles` tabel
- Profiles tabel heeft al de juiste kolommen (display_name, phone, avatar_url, bio)

## 6. Contactformulier op woningdetailpagina
Voor gebruiker-geplaatste woningen (zonder source_url) een werkend contactformulier.

**Aanpak:**
- In `PropertyDetail.tsx` de bestaande "Stuur bericht" knop vervangen door een Dialog met een formulier
- Velden: naam, e-mail, telefoonnummer (optioneel), bericht
- Bij verzenden: de `send-email` Edge Function aanroepen om het bericht naar de eigenaar te sturen
- De eigenaar's e-mail ophalen via het user_id van de property (query op profiles of auth)
- Nieuwe Edge Function `send-contact-email` die:
  - Het bericht ontvangt
  - De eigenaar's e-mail opzoekt (via service role key)
  - E-mail stuurt naar eigenaar EN een kopie naar info@woonpeek.nl

---

## Technische details

### Database migratie
```sql
-- Functie voor homepage statistieken
CREATE OR REPLACE FUNCTION public.get_home_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'properties_count', (SELECT COUNT(*) FROM properties WHERE status = 'actief'),
    'users_count', (SELECT COUNT(*) FROM profiles),
    'cities_count', (SELECT COUNT(DISTINCT city) FROM properties WHERE status = 'actief')
  );
$$;
```

### Bestanden die aangemaakt worden
- `src/pages/SearchAlerts.tsx` - Zoekalerts pagina
- `src/pages/Profile.tsx` - Profielpagina
- `src/hooks/useSearchAlerts.ts` - Hook voor search alerts CRUD
- `src/hooks/useProfile.ts` - Hook voor profiel CRUD
- `supabase/functions/check-search-alerts/index.ts` - Edge Function voor alert checking
- `supabase/functions/send-contact-email/index.ts` - Edge Function voor contactformulier

### Bestanden die gewijzigd worden
- `src/components/home/HeroSection.tsx` - Dynamische stats
- `src/pages/PropertyDetail.tsx` - Delen-knop + contactformulier
- `src/pages/Search.tsx` - Paginering
- `src/hooks/useProperties.ts` - Paginering support + home stats hook
- `src/App.tsx` - Nieuwe routes
- `src/components/layout/Header.tsx` - Menu links voor profiel en zoekalerts
- `supabase/config.toml` - Nieuwe edge functions config

