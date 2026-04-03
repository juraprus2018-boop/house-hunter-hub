import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
}

const useRelatedPosts = (currentSlug: string) => {
  return useQuery({
    queryKey: ["related-blog-posts", currentSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_image, published_at")
        .eq("status", "published")
        .neq("slug", currentSlug)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as RelatedPost[];
    },
    enabled: !!currentSlug,
    staleTime: 5 * 60 * 1000,
  });
};

const BlogRelatedPosts = ({ currentSlug }: { currentSlug: string }) => {
  const { data: posts } = useRelatedPosts(currentSlug);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="border-t py-12">
      <div className="container max-w-4xl">
        <h2 className="font-display text-2xl font-bold text-foreground mb-8">
          Gerelateerde artikelen
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
            >
              {post.cover_image && (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                {post.published_at && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <time dateTime={post.published_at}>
                      {new Date(post.published_at).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogRelatedPosts;
