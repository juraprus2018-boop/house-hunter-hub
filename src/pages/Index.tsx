import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import CategorySection from "@/components/home/CategorySection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedListings />
        <CategorySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
