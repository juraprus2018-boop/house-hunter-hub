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
        title="WoonPeek – Zoek huurwoningen en koopwoningen | Dagelijks nieuw aanbod"
        description="Vind jouw ideale huurwoning of koopwoning op WoonPeek. Dagelijks nieuw woningaanbod uit heel Nederland. Zoek, vergelijk en ontvang alerts voor nieuwe woningen."
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
