import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface NeighborhoodReviewsProps {
  city: string;
  neighborhood: string;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={!interactive}
        onClick={() => onRate?.(star)}
        className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
      >
        <Star
          className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      </button>
    ))}
  </div>
);

const NeighborhoodReviews = ({ city, neighborhood }: NeighborhoodReviewsProps) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 0, pros: "", cons: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews = [], refetch } = useQuery({
    queryKey: ["neighborhood-reviews", city, neighborhood],
    queryFn: async () => {
      const { data } = await (supabase.from("neighborhood_reviews" as any)
        .select("*")
        .eq("city", city)
        .eq("neighborhood", neighborhood)
        .eq("is_approved", true)
        .order("created_at", { ascending: false }) as any);
      return (data as any[]) || [];
    },
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.rating === 0) {
      toast.error("Vul je naam in en geef een beoordeling.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("neighborhood_reviews" as any).insert({
        city,
        neighborhood,
        name: form.name.trim(),
        rating: form.rating,
        pros: form.pros.trim() || null,
        cons: form.cons.trim() || null,
        comment: form.comment.trim() || null,
      }) as any);
      if (error) throw error;
      toast.success("Bedankt! Je beoordeling wordt beoordeeld voordat deze zichtbaar wordt.");
      setForm({ name: "", rating: 0, pros: "", cons: "", comment: "" });
      setShowForm(false);
      refetch();
    } catch {
      toast.error("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t py-10">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Beoordelingen {neighborhood}
            </h2>
            {avgRating && (
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={Math.round(Number(avgRating))} />
                <span className="text-sm font-medium text-foreground">{avgRating}</span>
                <span className="text-sm text-muted-foreground">({reviews.length} beoordelingen)</span>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            Beoordeling plaatsen
          </Button>
        </div>

        {/* Review Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-xl border bg-card p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Naam *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Je naam" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Beoordeling *</label>
              <StarRating rating={form.rating} onRate={(r) => setForm({ ...form, rating: r })} interactive />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Pluspunten</label>
                <Textarea value={form.pros} onChange={(e) => setForm({ ...form, pros: e.target.value })} placeholder="Wat vind je goed?" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Minpunten</label>
                <Textarea value={form.cons} onChange={(e) => setForm({ ...form, cons: e.target.value })} placeholder="Wat kan beter?" rows={3} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Opmerking</label>
              <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Aanvullende opmerking..." rows={2} />
            </div>
            <Button type="submit" disabled={submitting} className="gap-2">
              <Send className="h-4 w-4" />
              {submitting ? "Verzenden..." : "Verstuur beoordeling"}
            </Button>
          </form>
        )}

        {/* Reviews list */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{review.name}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("nl-NL")}
                  </span>
                </div>
                {review.pros && (
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-green-600">+</span> {review.pros}</p>
                )}
                {review.cons && (
                  <p className="text-sm text-muted-foreground"><span className="font-medium text-red-500">-</span> {review.cons}</p>
                )}
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : !showForm ? (
          <p className="text-sm text-muted-foreground">
            Er zijn nog geen beoordelingen voor {neighborhood}. Woon jij hier? Deel je ervaring!
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default NeighborhoodReviews;
