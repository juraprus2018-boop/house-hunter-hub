import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { useBlogPosts } from "@/hooks/useBlog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

const BlogPage = () => {
  const { data: posts, isLoading } = useBlogPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Blog – Tips & Advies over Woningen | WoonPeek"
        description="Lees onze artikelen over huurwoningen, koophuizen en de woningmarkt in Nederland. Tips, advies en marktinzichten op WoonPeek."
        canonical="https://woonpeek.nl/blog"
      />
      <Header />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container max-w-4xl">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Blog" },
              ]}
            />
            <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
              Blog
            </h1>
            <p className="mt-2 text-muted-foreground">
              Tips, advies en inzichten over de woningmarkt in Nederland
            </p>
          </div>
        </section>

        <section className="container max-w-4xl py-12">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <Skeleton className="aspect-[16/9] w-full sm:aspect-auto sm:h-48 sm:w-72" />
                    <div className="flex-1 p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="flex flex-col sm:flex-row">
                      {post.cover_image && (
                        <div className="aspect-[16/9] w-full overflow-hidden sm:aspect-auto sm:h-48 sm:w-72 shrink-0">
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardContent className="flex-1 p-6">
                        <h2 className="font-display text-xl font-semibold text-foreground line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="mt-2 text-muted-foreground line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        {post.published_at && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(post.published_at).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Nog geen artikelen
              </h2>
              <p className="mt-2 text-muted-foreground">
                Binnenkort verschijnen hier artikelen over de woningmarkt.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
