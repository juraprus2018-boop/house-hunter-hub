import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  /** 4-6 FAQ items recommended for rich snippet eligibility. */
  items: FAQItem[];
  /** Optional heading shown above the visible accordion. */
  title?: string;
  /** Optional subtitle / intro paragraph. */
  description?: string;
  /** When true, renders only the JSON-LD without visible UI (use sparingly: visible content matters for ranking). */
  hidden?: boolean;
  className?: string;
}

/**
 * Renders an SEO-friendly FAQ block with FAQPage JSON-LD schema.
 * Both the JSON-LD and the visible accordion answer come from the same source,
 * so Google can verify the markup matches the page content (a hard requirement
 * for rich snippet eligibility).
 */
const FAQSchema = ({ items, title = "Veelgestelde vragen", description, hidden = false, className }: FAQSchemaProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {!hidden && (
        <section className={cn("py-12 md:py-16", className)} aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 id="faq-heading" className="font-display text-2xl font-bold text-foreground md:text-3xl">
                {title}
              </h2>
              {description && (
                <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                      aria-expanded={isOpen}
                    >
                      <span className="font-semibold text-foreground">{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-border bg-muted/20 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default FAQSchema;