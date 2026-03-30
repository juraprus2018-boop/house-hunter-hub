import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Clock, ArrowRight } from "lucide-react";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(price);

const RecentlyViewed = () => {
  const { recentlyViewed } = useRecentlyViewed();

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="border-t py-10">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">Recent bekeken</h2>
          </div>
          <Link
            to="/zoeken"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Meer zoeken <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {recentlyViewed.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              to={`/woning/${item.slug || item.id}`}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.city}</p>
                <p className="text-sm font-bold text-primary">{formatPrice(item.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
