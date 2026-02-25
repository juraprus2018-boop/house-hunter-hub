import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { useBlogPost } from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || "");

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center">
          <h1 className="font-display text-2xl font-bold">Artikel niet gevonden</h1>
          <Button asChild className="mt-4">
            <Link to="/blog">Terug naar blog</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    datePublished: post.published_at,
    dateModified: post.updated_at,
    publisher: {
      "@type": "Organization",
      name: "WoonPeek",
      url: "https://woonpeek.nl",
    },
    ...(post.cover_image ? { image: post.cover_image } : {}),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={post.meta_title || `${post.title} | WoonPeek Blog`}
        description={post.meta_description || post.excerpt || post.title}
        canonical={`https://woonpeek.nl/blog/${post.slug}`}
        ogImage={post.cover_image || undefined}
        ogType="article"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <article>
          {post.cover_image && (
            <div className="relative bg-muted">
              <div className="container">
                <div className="aspect-[21/9] overflow-hidden">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="container max-w-3xl py-8">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blog" },
                { label: post.title },
              ]}
            />

            <Button variant="ghost" asChild className="mt-4 mb-6">
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug naar blog
              </Link>
            </Button>

            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {post.title}
            </h1>

            {post.published_at && (
              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>
            )}

            <div className="mt-8 prose prose-lg max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
