import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ListingType = Database["public"]["Enums"]["listing_type"];
type PropertyType = Database["public"]["Enums"]["property_type"];

interface ApproveParams {
  scrapedProperty: any;
  overrides: Record<string, any>;
  userId: string;
}

export const useApproveScrapedProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scrapedProperty, overrides, userId }: ApproveParams) => {
      // Validate required fields
      if (!overrides.title || !overrides.city || !overrides.street || !overrides.house_number || !overrides.postal_code || !overrides.price) {
        throw new Error("Vul alle verplichte velden in (titel, stad, straat, huisnummer, postcode, prijs).");
      }

      // Insert into properties table
      const { data: newProperty, error: insertError } = await supabase
        .from("properties")
        .insert({
          title: overrides.title,
          description: overrides.description || null,
          price: Number(overrides.price),
          city: overrides.city,
          street: overrides.street,
          house_number: overrides.house_number,
          postal_code: overrides.postal_code,
          property_type: (overrides.property_type || "appartement") as PropertyType,
          listing_type: (overrides.listing_type || "huur") as ListingType,
          bedrooms: overrides.bedrooms ? Number(overrides.bedrooms) : null,
          bathrooms: overrides.bathrooms ? Number(overrides.bathrooms) : null,
          surface_area: overrides.surface_area ? Number(overrides.surface_area) : null,
          images: scrapedProperty.images || [],
          user_id: userId,
          status: "actief",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update scraped property status
      const { error: updateError } = await supabase
        .from("scraped_properties")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
          published_property_id: newProperty.id,
        })
        .eq("id", scrapedProperty.id);

      if (updateError) throw updateError;

      return newProperty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scraped-properties"] });
      queryClient.invalidateQueries({ queryKey: ["all-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};
