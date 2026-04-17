import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, Save } from "lucide-react";

interface AdSlotRow {
  id: string;
  slot_key: string;
  name: string;
  description: string | null;
  ad_code: string | null;
  is_active: boolean;
}

const AdminAds = () => {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { ad_code: string; is_active: boolean }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data: slots, isLoading } = useQuery({
    queryKey: ["admin-ad-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_slots")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as AdSlotRow[];
    },
  });

  useEffect(() => {
    if (!slots) return;
    const next: Record<string, { ad_code: string; is_active: boolean }> = {};
    slots.forEach((s) => {
      next[s.id] = { ad_code: s.ad_code ?? "", is_active: s.is_active };
    });
    setDrafts(next);
  }, [slots]);

  const handleSave = async (slot: AdSlotRow) => {
    const draft = drafts[slot.id];
    if (!draft) return;
    setSavingKey(slot.id);
    const { error } = await supabase
      .from("ad_slots")
      .update({ ad_code: draft.ad_code, is_active: draft.is_active })
      .eq("id", slot.id);
    setSavingKey(null);

    if (error) {
      toast({ title: "Opslaan mislukt", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Opgeslagen", description: `${slot.name} is bijgewerkt.` });
    queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
    queryClient.invalidateQueries({ queryKey: ["ad-slot", slot.slot_key] });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Advertenties</h1>
          <p className="mt-1 text-muted-foreground">
            Plaats hier je Google Ads (AdSense) code per locatie. Plak de complete snippet (incl. {"<script>"} en {"<ins>"} tags) en zet de slot aan.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {slots?.map((slot) => {
              const draft = drafts[slot.id] ?? { ad_code: "", is_active: false };
              const hasCode = (draft.ad_code ?? "").trim().length > 0;
              return (
                <Card key={slot.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {slot.name}
                            <Badge variant={draft.is_active && hasCode ? "default" : "secondary"}>
                              {draft.is_active && hasCode ? "Actief" : "Inactief"}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">{slot.description}</CardDescription>
                          <p className="mt-1 text-xs text-muted-foreground">
                            slot key: <code className="rounded bg-muted px-1 py-0.5">{slot.slot_key}</code>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${slot.id}`} className="text-sm">
                          Actief
                        </Label>
                        <Switch
                          id={`active-${slot.id}`}
                          checked={draft.is_active}
                          onCheckedChange={(checked) =>
                            setDrafts((d) => ({
                              ...d,
                              [slot.id]: { ...d[slot.id], is_active: checked },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`code-${slot.id}`} className="text-sm font-medium">
                        Advertentie code (HTML)
                      </Label>
                      <Textarea
                        id={`code-${slot.id}`}
                        value={draft.ad_code}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [slot.id]: { ...d[slot.id], ad_code: e.target.value },
                          }))
                        }
                        placeholder='<ins class="adsbygoogle" ...></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'
                        className="mt-2 min-h-40 font-mono text-xs"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Tip: laat dit veld leeg om de advertentie tijdelijk te verbergen zonder de slot te verwijderen.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave(slot)}
                        disabled={savingKey === slot.id}
                        className="gap-2"
                      >
                        {savingKey === slot.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Opslaan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAds;
