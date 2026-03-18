import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import PropertyDetail from "./pages/PropertyDetail";
import Favorites from "./pages/Favorites";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminScrapers from "./pages/admin/AdminScrapers";
import AdminSettings from "./pages/admin/AdminSettings";

import MyProperties from "./pages/MyProperties";
import CreateProperty from "./pages/CreateProperty";
import EditProperty from "./pages/EditProperty";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Disclaimer from "./pages/Disclaimer";
import CityPage from "./pages/CityPage";
import SearchAlerts from "./pages/SearchAlerts";
import Profile from "./pages/Profile";
import FAQ from "./pages/FAQ";
import Cities from "./pages/Cities";
import BlogPage from "./pages/Blog";
import BlogPostPage from "./pages/BlogPost";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDailyActivity from "./pages/admin/AdminDailyActivity";
import AdminFacebookQueue from "./pages/admin/AdminFacebookQueue";
import AdminMakelaarLeads from "./pages/admin/AdminMakelaarLeads";
import ListingTypePage from "./pages/ListingTypePage";
import PropertyTypeCityPage from "./pages/PropertyTypeCityPage";
import FilteredLandingPage from "./pages/FilteredLandingPage";
import NewListings from "./pages/NewListings";
import NewListingsCity from "./pages/NewListingsCity";
import NeighborhoodPage from "./pages/NeighborhoodPage";
import PostPropertyStart from "./pages/PostPropertyStart";
import AlertUnsubscribe from "./pages/AlertUnsubscribe";
import DailyAlert from "./pages/DailyAlert";
import About from "./pages/About";
import MakelaarKoppelen from "./pages/MakelaarKoppelen";
import { cityPath } from "@/lib/cities";

const queryClient = new QueryClient();

const LegacyCityRedirect = () => {
  const { city } = useParams<{ city: string }>();
  const location = useLocation();

  if (!city) return <Navigate to="/steden" replace />;
  if (city.startsWith("woningen-")) return <CityPage />;

  return <Navigate to={`${cityPath(city)}${location.search}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inloggen" element={<Login />} />
            <Route path="/registreren" element={<Register />} />
            <Route path="/zoeken" element={<Search />} />
            <Route path="/verkennen" element={<Explore />} />
            <Route path="/woning/:slug" element={<PropertyDetail />} />
            <Route path="/favorieten" element={<Favorites />} />
            <Route path="/mijn-woningen" element={<MyProperties />} />
            <Route path="/woning-plaatsen" element={<PostPropertyStart />} />
            <Route path="/plaatsen" element={<CreateProperty />} />
            <Route path="/woning/:id/bewerken" element={<EditProperty />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/woningen" element={<AdminProperties />} />
            {/* Review queue removed - using Daisycon feeds now */}
            <Route path="/admin/scrapers" element={<AdminScrapers />} />
            <Route path="/admin/instellingen" element={<AdminSettings />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/gebruikers" element={<AdminUsers />} />
            <Route path="/admin/dagoverzicht" element={<AdminDailyActivity />} />
            <Route path="/admin/facebook" element={<AdminFacebookQueue />} />
            <Route path="/admin/leads" element={<AdminMakelaarLeads />} />
            <Route path="/voorwaarden" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/veelgestelde-vragen" element={<FAQ />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/zoekalerts" element={<SearchAlerts />} />
            <Route path="/profiel" element={<Profile />} />
            <Route path="/steden" element={<Cities />} />
            <Route path="/nieuw-aanbod" element={<NewListings />} />
            <Route path="/nieuw-aanbod/:city" element={<NewListingsCity />} />
            <Route path="/dagelijkse-alert" element={<DailyAlert />} />
            <Route path="/over-woonpeek" element={<About />} />
            <Route path="/makelaar-koppelen" element={<MakelaarKoppelen />} />
            <Route path="/alerts/afmelden/:token" element={<AlertUnsubscribe />} />
            <Route path="/huurwoningen/:city?" element={<ListingTypePage listingType="huur" />} />
            <Route path="/koopwoningen/:city?" element={<ListingTypePage listingType="koop" />} />
            <Route path="/appartementen/:city?" element={<PropertyTypeCityPage propertyType="appartement" />} />
            <Route path="/huizen/:city?" element={<PropertyTypeCityPage propertyType="huis" />} />
            <Route path="/studios/:city?" element={<PropertyTypeCityPage propertyType="studio" />} />
            <Route path="/kamers/:city?" element={<PropertyTypeCityPage propertyType="kamer" />} />
            <Route path="/woningen/:city/:filter" element={<FilteredLandingPage />} />
            <Route path="/wijk/:city/:neighborhood" element={<NeighborhoodPage />} />
            <Route path="/:city" element={<LegacyCityRedirect />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
