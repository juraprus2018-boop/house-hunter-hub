interface PageBannerProps {
  image: string;
  alt: string;
  children: React.ReactNode;
}

const PageBanner = ({ image, alt, children }: PageBannerProps) => {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute inset-0 bg-background/75" />
      </div>
      <div className="container relative py-12 md:py-16">
        {children}
      </div>
    </section>
  );
};

export default PageBanner;
