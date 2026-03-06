import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBanner from "@/components/layout/PageBanner";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { useBlogPost } from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import bannerBlog from "@/assets/banner-blog.jpg";

/**
 * Cleans up AI-generated blog HTML:
 * - Converts <p><strong>heading text</strong></p> patterns into proper <h2> tags
 * - Ensures paragraphs are properly separated
 */
function cleanBlogHtml(html: string): string {
  let cleaned = html;

  // Convert <p><strong>heading</strong></p> to <h2> (common AI pattern)
  cleaned = cleaned.replace(
    /<p>\s*<strong>([^<]{10,120})<\/strong>\s*<\/p>/gi,
    '<h2>$1</h2>'
  );

  // Convert standalone <strong>heading</strong> followed by newline/break to <h2>
  cleaned = cleaned.replace(
    /(?:^|<br\s*\/?>|\n)\s*<strong>([^<]{10,120})<\/strong>\s*(?:<br\s*\/?>|\n)/gi,
    '<h2>$1</h2>'
  );

  // Add spacing between consecutive paragraphs that lack it
  cleaned = cleaned.replace(/<\/p>\s*<p>/gi, '</p>\n\n<p>');

  // Add spacing before h2
  cleaned = cleaned.replace(/<\/p>\s*<h2>/gi, '</p>\n\n<h2>');

  // Convert <blockquote> that are just <p><strong>Tip:</strong>...</p> 
  // Wrap "Tip:" paragraphs in blockquote if not already
  cleaned = cleaned.replace(
    /<p>\s*<strong>Tip:<\/strong>\s*([\s\S]*?)<\/p>/gi,
    '<blockquote><p><strong>Tip:</strong> $1</p></blockquote>'
  );

  return cleaned;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || "");
  const cleanedContent = useMemo(() => post ? cleanBlogHtml(post.content) : "", [post]);

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
          <PageBanner image={post.cover_image || bannerBlog} alt={post.title}>
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blog" },
                { label: post.title },
              ]}
            />
            <Button variant="ghost" asChild className="mt-4 mb-4 -ml-3 text-foreground/80 hover:text-foreground">
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug naar blog
              </Link>
            </Button>
            <h1 className="font-display text-3xl font-bold text-foreground leading-tight md:text-5xl lg:text-[3.25rem]">
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
          </PageBanner>

          <div className="container max-w-4xl py-10 md:py-14">
            <div 
              className="prose prose-lg lg:prose-xl max-w-none 
                text-foreground 

                prose-headings:font-display prose-headings:text-foreground prose-headings:leading-tight

                prose-h2:text-2xl prose-h2:md:text-[1.875rem] prose-h2:mt-16 prose-h2:mb-6 prose-h2:border-b prose-h2:border-border prose-h2:pb-4
                prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-10 prose-h3:mb-4

                prose-p:text-muted-foreground prose-p:text-[1.0625rem] prose-p:md:text-lg prose-p:leading-[1.85] prose-p:mb-6

                prose-a:text-primary prose-a:font-semibold prose-a:underline prose-a:decoration-primary/40 prose-a:underline-offset-4 prose-a:transition-colors hover:prose-a:text-accent hover:prose-a:decoration-accent

                prose-strong:text-foreground prose-strong:font-bold

                prose-ul:my-8 prose-ul:space-y-3 prose-li:text-muted-foreground prose-li:text-[1.0625rem] prose-li:md:text-lg prose-li:leading-[1.8]
                prose-ol:my-8 prose-ol:space-y-3

                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-secondary prose-blockquote:py-5 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground prose-blockquote:my-10

                prose-img:rounded-xl prose-img:shadow-lg
              "
            >
              <div dangerouslySetInnerHTML={{ __html: cleanedContent }} />
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
