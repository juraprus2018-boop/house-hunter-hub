import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Settings as SettingsIcon } from "lucide-react";

interface SiteSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
}

const AdminSiteSettings = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  const toggleSetting = async (key: string, currentValue: boolean) => {
    setSaving(key);
    const newValue = !currentValue;
    const { error } = await (supabase as any)
      .from("site_settings")
      .update({ value: newValue })
      .eq("key", key);

    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Opgeslagen", description: "Instelling bijgewerkt." });
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-setting", key] });
    }
    setSaving(null);
  };

  const settingLabels: Record<string, { label: string; description: string }> = {
    city_realtors_enabled: {
      label: "Makelaars sectie op stadspagina's",
      description: "Toon de 'Makelaars in [stad]' sectie met foto's, beoordelingen en contactgegevens.",
    },
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold">Site-instellingen</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Beheer welke onderdelen op de website zichtbaar zijn.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {(settings || []).map((setting) => {
            const meta = settingLabels[setting.key] || {
              label: setting.key,
              description: setting.description || "",
            };
            const isOn = setting.value === true || setting.value === "true";
            return (
              <Card key={setting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{meta.label}</CardTitle>
                      <CardDescription className="mt-1">{meta.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {saving === setting.key && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Switch
                        checked={isOn}
                        onCheckedChange={() => toggleSetting(setting.key, isOn)}
                        disabled={saving === setting.key}
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
          {settings && settings.length === 0 && (
            <p className="text-muted-foreground">Geen instellingen gevonden.</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSiteSettings;
