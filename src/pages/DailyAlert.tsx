import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DailyAlertSection from "@/components/home/DailyAlertSection";
import SEOHead from "@/components/seo/SEOHead";

const DailyAlert = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Dagelijkse Alert - WoonPeek"
        description="Ontvang dagelijks een e-mail met het nieuwste woningaanbod. Schrijf je gratis in voor de WoonPeek dagelijkse alert."
      />
      <Header />
      <main className="flex-1">
        <DailyAlertSection />
      </main>
      <Footer />
    </div>
  );
};

export default DailyAlert;
