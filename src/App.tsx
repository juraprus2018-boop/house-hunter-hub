import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AdminReviewQueue from "./pages/admin/AdminReviewQueue";
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
import ListingTypePage from "./pages/ListingTypePage";

const queryClient = new QueryClient();

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
            <Route path="/plaatsen" element={<CreateProperty />} />
            <Route path="/woning/:id/bewerken" element={<EditProperty />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/woningen" element={<AdminProperties />} />
            <Route path="/admin/review" element={<AdminReviewQueue />} />
            <Route path="/admin/scrapers" element={<AdminScrapers />} />
            <Route path="/admin/instellingen" element={<AdminSettings />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/gebruikers" element={<AdminUsers />} />
            <Route path="/admin/dagoverzicht" element={<AdminDailyActivity />} />
            <Route path="/voorwaarden" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/veelgestelde-vragen" element={<FAQ />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/zoekalerts" element={<SearchAlerts />} />
            <Route path="/profiel" element={<Profile />} />
            <Route path="/steden" element={<Cities />} />
            <Route path="/huurwoningen/:city?" element={<ListingTypePage listingType="huur" />} />
            <Route path="/koopwoningen/:city?" element={<ListingTypePage listingType="koop" />} />
            <Route path="/:city" element={<CityPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
