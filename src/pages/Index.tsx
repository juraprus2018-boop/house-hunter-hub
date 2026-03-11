import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import PopularCities from "@/components/home/PopularCities";
import CategorySection from "@/components/home/CategorySection";
import WhyUsSection from "@/components/home/WhyUsSection";
import CTASection from "@/components/home/CTASection";
import DailyAlertSection from "@/components/home/DailyAlertSection";
import SEOContentSection from "@/components/home/SEOContentSection";
import SEOHead from "@/components/seo/SEOHead";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="WoonPeek – Vind woningen in heel Nederland | Huurwoningen & koopwoningen"
        description="Zoek huurwoningen, appartementen, studio's en koopwoningen in heel Nederland. WoonPeek verzamelt dagelijks het nieuwste woningaanbod op één plek."
        canonical="https://woonpeek.nl"
      />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <PopularCities />
        <FeaturedListings />
        <CategorySection />
        <WhyUsSection />
        <DailyAlertSection />
        <CTASection />
        <SEOContentSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
