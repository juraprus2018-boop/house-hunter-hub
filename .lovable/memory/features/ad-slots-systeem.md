---
name: ad-slots-systeem
description: Admin-managed Google Ads (AdSense) snippets per location via ad_slots table, rendered with AdSlot component on homepage, city, search and property detail pages
type: feature
---
Database table `ad_slots` (slot_key UNIQUE, name, description, ad_code, is_active) beheert advertentie HTML snippets. RLS: publiek mag alleen actieve slots lezen (nodig voor frontend), admins beheren alles.

Slots geseed: `homepage`, `city_page`, `search_page`, `property_detail`.

Frontend:
- Hook: `src/hooks/useAdSlot.ts` (10min cache).
- Component: `src/components/ads/AdSlot.tsx` injecteert HTML en re-executes inline `<script>` tags zodat AdSense initialiseert. Renders niets als ad_code leeg of slot inactief.
- Geplaatst op: `src/pages/Index.tsx` (na RecentlyViewed), `src/pages/CityPage.tsx` (tussen hero en results), `src/pages/Search.tsx` (boven results), `src/pages/PropertyDetail.tsx` (boven Reageer-CTA in sidebar).

Admin UI: `/admin/advertenties` (`src/pages/admin/AdminAds.tsx`). Plak AdSense snippet in textarea, toggle is_active, klik Opslaan. Cache wordt invalidated voor `["ad-slot", slotKey]`.
