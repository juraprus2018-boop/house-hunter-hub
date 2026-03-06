import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import PopularCities from "@/components/home/PopularCities";
import CategorySection from "@/components/home/CategorySection";
import CTASection from "@/components/home/CTASection";
import DailyAlertSection from "@/components/home/DailyAlertSection";
import SEOContentSection from "@/components/home/SEOContentSection";
import SEOHead from "@/components/seo/SEOHead";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="WoonPeek – Uitgebreid aanbod woonruimtes | Duizenden websites doorzocht"
        description="WoonPeek doorzoekt duizenden websites en verzamelt het woningaanbod op één plek. Vind huurwoningen en koopwoningen in heel Nederland."
        canonical="https://woonpeek.nl"
      />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedListings />
        <PopularCities />
        <CategorySection />
        <CTASection />
        <DailyAlertSection />
        <SEOContentSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
