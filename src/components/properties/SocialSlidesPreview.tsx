import { useEffect, useRef, useState } from "react";
import { Sparkles, Download, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSlides, downloadSlidesZip, buildTikTokCaption, type SlideProperty } from "@/lib/tiktokSlides";
import { toast } from "sonner";

interface Props {
  property: SlideProperty;
}

/**
 * Toont de TikTok/Instagram carrousel-slides als horizontale slider
 * direct op de woningdetail-pagina, met download- en deel-acties.
 * Slides worden lazy gegenereerd zodra de gebruiker erop klikt.
 */
const SocialSlidesPreview = ({ property }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const generatedRef = useRef(false);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpen = async () => {
    setOpen(true);
    if (generatedRef.current) return;
    generatedRef.current = true;
    setLoading(true);
    try {
      const blobs = await generateSlides(property);
      setUrls(blobs.map((b) => URL.createObjectURL(b)));
    } catch (e) {
      toast.error("Kon slides niet genereren");
      generatedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSlidesZip(property);
      toast.success("ZIP gedownload");
    } catch {
      toast.error("Download mislukt");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildTikTokCaption(property));
      setCopied(true);
      toast.success("Caption gekopieerd");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/10 p-5 lg:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold">Deel deze woning op social media</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bekijk hoe deze woning eruitziet als TikTok of Instagram carrousel: 5 kant-en-klare verticale slides met prijs, foto's en kenmerken.
          </p>
          {!open && (
            <Button onClick={handleOpen} size="sm" className="mt-4">
              <Sparkles className="mr-2 h-4 w-4" />
              Toon social slides
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-5 border-t pt-5">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Slides worden gegenereerd...
            </div>
          ) : (
            <>
              <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 lg:-mx-6 lg:px-6 [scrollbar-width:thin]">
                {urls.map((url, i) => (
                  <div
                    key={url}
                    className="relative shrink-0 snap-start overflow-hidden rounded-xl border shadow-sm"
                    style={{ width: 200, height: 356 }}
                  >
                    <img
                      src={url}
                      alt={`Slide ${i + 1} van ${urls.length}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                      {i + 1}/{urls.length}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={handleDownload} disabled={downloading} size="sm">
                  {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download als ZIP
                </Button>
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  Kopieer caption
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: upload de slides in TikTok Photo Mode of Instagram Carrousel voor maximale impact.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialSlidesPreview;