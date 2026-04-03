import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { addBlogAutoLinks } from "@/lib/blogAutoLinks";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBanner from "@/components/layout/PageBanner";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { useBlogPost } from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import BlogRelatedLinks from "@/components/blog/BlogRelatedLinks";
import bannerBlog from "@/assets/banner-blog.jpg";

function cleanBlogHtml(html: string): string {
  let cleaned = html;
  cleaned = cleaned.replace(
    /<p>\s*<strong>([^<]{10,120})<\/strong>\s*<\/p>/gi,
    '<h2>$1</h2>'
  );
  cleaned = cleaned.replace(
    /(?:^|<br\s*\/?>|\n)\s*<strong>([^<]{10,120})<\/strong>\s*(?:<br\s*\/?>|\n)/gi,
    '<h2>$1</h2>'
  );
  cleaned = cleaned.replace(/<\/p>\s*<p>/gi, '</p>\n\n<p>');
  cleaned = cleaned.replace(/<\/p>\s*<h2>/gi, '</p>\n\n<h2>');
  cleaned = cleaned.replace(
    /<p>\s*<strong>Tip:<\/strong>\s*([\s\S]*?)<\/p>/gi,
    '<blockquote><p><strong>Tip:</strong> $1</p></blockquote>'
  );
  return cleaned;
}

/** Parse enriched meta_description that may contain JSON with FAQ data */
function parseSeoMeta(metaDescription: string | null): {
  description: string;
  faqQuestions: { question: string; answer: string }[];
  primaryKeyword: string;
} {
  if (!metaDescription) return { description: "", faqQuestions: [], primaryKeyword: "" };

  try {
    const parsed = JSON.parse(metaDescription);
    return {
      description: parsed.meta_description || metaDescription,
      faqQuestions: parsed.faq_questions || [],
      primaryKeyword: parsed.primary_keyword || "",
    };
  } catch {
    return { description: metaDescription, faqQuestions: [], primaryKeyword: "" };
  }
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || "");
  const cleanedContent = useMemo(() => post ? addBlogAutoLinks(cleanBlogHtml(post.content)) : "", [post]);

  const seoMeta = useMemo(() => parseSeoMeta(post?.meta_description || null), [post]);

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

  const canonicalUrl = `https://www.woonpeek.nl/blog/${post.slug}`;

  // Rich Article schema
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: seoMeta.description || post.excerpt || "",
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Organization",
      name: "WoonPeek",
      url: "https://www.woonpeek.nl",
      logo: {
        "@type": "ImageObject",
        url: "https://www.woonpeek.nl/favicon.png",
      },
    },
    publisher: {
      "@type": "Organization",
      name: "WoonPeek",
      url: "https://www.woonpeek.nl",
      logo: {
        "@type": "ImageObject",
        url: "https://www.woonpeek.nl/favicon.png",
      },
    },
    ...(post.cover_image ? { image: post.cover_image } : {}),
    ...(seoMeta.primaryKeyword ? { keywords: seoMeta.primaryKeyword } : {}),
    inLanguage: "nl-NL",
    isAccessibleForFree: true,
  };

  // FAQPage schema (for rich snippets in Google)
  const faqJsonLd = seoMeta.faqQuestions.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoMeta.faqQuestions.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  // BreadcrumbList schema
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.woonpeek.nl",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://www.woonpeek.nl/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={post.meta_title || `${post.title} | WoonPeek Blog`}
        description={seoMeta.description || post.excerpt || post.title}
        canonical={canonicalUrl}
        ogImage={post.cover_image || undefined}
        ogType="article"
      />
      {/* Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* FAQ structured data for rich snippets */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <article itemScope itemType="https://schema.org/Article">
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
            <h1 className="font-display text-3xl font-bold text-foreground leading-tight md:text-5xl lg:text-[3.25rem]" itemProp="headline">
              {post.title}
            </h1>
            {post.published_at && (
              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at} itemProp="datePublished">
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
              itemProp="articleBody"
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
