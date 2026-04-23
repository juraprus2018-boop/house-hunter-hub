import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CookieConsent from "@/components/CookieConsent";
import { cityPath } from "@/lib/cities";
import { usePageTracking } from "@/hooks/usePageTracking";

// Lazy-load every non-critical route to slash the initial JS bundle.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Search = lazy(() => import("./pages/Search"));
const Explore = lazy(() => import("./pages/Explore"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProperties = lazy(() => import("./pages/admin/AdminProperties"));
const AdminScrapers = lazy(() => import("./pages/admin/AdminScrapers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAds = lazy(() => import("./pages/admin/AdminAds"));
const AdminSiteSettings = lazy(() => import("./pages/admin/AdminSiteSettings"));
const MyProperties = lazy(() => import("./pages/MyProperties"));
const CreateProperty = lazy(() => import("./pages/CreateProperty"));
const EditProperty = lazy(() => import("./pages/EditProperty"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const CityPage = lazy(() => import("./pages/CityPage"));
const SearchAlerts = lazy(() => import("./pages/SearchAlerts"));
const Profile = lazy(() => import("./pages/Profile"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Cities = lazy(() => import("./pages/Cities"));
const BlogPage = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminDailyActivity = lazy(() => import("./pages/admin/AdminDailyActivity"));
const AdminFacebookQueue = lazy(() => import("./pages/admin/AdminFacebookQueue"));
const AdminMakelaarLeads = lazy(() => import("./pages/admin/AdminMakelaarLeads"));
const AdminEmailSender = lazy(() => import("./pages/admin/AdminEmailSender"));
const AdminAlertSubscribers = lazy(() => import("./pages/admin/AdminAlertSubscribers"));
const ListingTypePage = lazy(() => import("./pages/ListingTypePage"));
const PropertyTypeCityPage = lazy(() => import("./pages/PropertyTypeCityPage"));
const FilteredLandingPage = lazy(() => import("./pages/FilteredLandingPage"));
const NewListings = lazy(() => import("./pages/NewListings"));
const NewListingsCity = lazy(() => import("./pages/NewListingsCity"));
const NeighborhoodPage = lazy(() => import("./pages/NeighborhoodPage"));
const PostPropertyStart = lazy(() => import("./pages/PostPropertyStart"));
const AlertUnsubscribe = lazy(() => import("./pages/AlertUnsubscribe"));
const DailyAlert = lazy(() => import("./pages/DailyAlert"));
const About = lazy(() => import("./pages/About"));
const MakelaarKoppelen = lazy(() => import("./pages/MakelaarKoppelen"));
const Samenwerking = lazy(() => import("./pages/Samenwerking"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const AdminComments = lazy(() => import("./pages/admin/AdminComments"));
const AdminSearchQueries = lazy(() => import("./pages/admin/AdminSearchQueries"));
const AdminGoogleRanking = lazy(() => import("./pages/admin/AdminGoogleRanking"));
const AdminPageTypes = lazy(() => import("./pages/admin/AdminPageTypes"));
const UserChat = lazy(() => import("./pages/UserChat"));
const BudgetTool = lazy(() => import("./pages/BudgetTool"));
const CityComparePage = lazy(() => import("./pages/CityComparePage"));
const HuurprijsMonitor = lazy(() => import("./pages/HuurprijsMonitor"));
const PostcodePage = lazy(() => import("./pages/PostcodePage"));
const BudgetLandingPage = lazy(() => import("./pages/BudgetLandingPage"));
const CityGuidePage = lazy(() => import("./pages/CityGuidePage"));
const WoonQuiz = lazy(() => import("./pages/WoonQuiz"));
const IncomeLandingPage = lazy(() => import("./pages/IncomeLandingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Laden" />
  </div>
);

const LegacyCityRedirect = () => {
  const { city } = useParams<{ city: string }>();
  const location = useLocation();

  if (!city) return <Navigate to="/steden" replace />;
  if (city.startsWith("woningen-")) return <CityPage />;

  return <Navigate to={`${cityPath(city)}${location.search}`} replace />;
};

const RouterSideEffects = () => {
  usePageTracking();
  return <ScrollToTop />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouterSideEffects />
          <Suspense fallback={<RouteFallback />}>
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
              <Route path="/admin/scrapers" element={<AdminScrapers />} />
              <Route path="/admin/instellingen" element={<AdminSettings />} />
              <Route path="/admin/advertenties" element={<AdminAds />} />
              <Route path="/admin/site-instellingen" element={<AdminSiteSettings />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
              <Route path="/admin/gebruikers" element={<AdminUsers />} />
              <Route path="/admin/gebruikers/:userId" element={<AdminUserDetail />} />
              <Route path="/admin/dagoverzicht" element={<AdminDailyActivity />} />
              <Route path="/admin/facebook" element={<AdminFacebookQueue />} />
              <Route path="/admin/leads" element={<AdminMakelaarLeads />} />
              <Route path="/admin/email" element={<AdminEmailSender />} />
              <Route path="/admin/alerts" element={<AdminAlertSubscribers />} />
              <Route path="/admin/berichten" element={<AdminChat />} />
              <Route path="/admin/reacties" element={<AdminComments />} />
              <Route path="/admin/zoekopdrachten" element={<AdminSearchQueries />} />
              <Route path="/admin/google-ranking" element={<AdminGoogleRanking />} />
              <Route path="/admin/paginatypen" element={<AdminPageTypes />} />
              <Route path="/voorwaarden" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/veelgestelde-vragen" element={<FAQ />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/zoekalerts" element={<SearchAlerts />} />
              <Route path="/profiel" element={<Profile />} />
              <Route path="/berichten" element={<UserChat />} />
              <Route path="/steden" element={<Cities />} />
              <Route path="/nieuw-aanbod" element={<NewListings />} />
              <Route path="/nieuw-aanbod/:city" element={<NewListingsCity />} />
              <Route path="/dagelijkse-alert" element={<DailyAlert />} />
              <Route path="/over-woonpeek" element={<About />} />
              <Route path="/makelaar-koppelen" element={<MakelaarKoppelen />} />
              <Route path="/samenwerking" element={<Samenwerking />} />
              <Route path="/budget-tool" element={<BudgetTool />} />
              <Route path="/woonquiz" element={<WoonQuiz />} />
              <Route path="/vergelijk/:city1-vs-:city2" element={<CityComparePage />} />
              <Route path="/huurprijzen/:city" element={<HuurprijsMonitor />} />
              <Route path="/woningen-postcode-:postcode" element={<PostcodePage />} />
              <Route path="/huurwoningen-onder-:budget-:city" element={<BudgetLandingPage listingType="huur" />} />
              <Route path="/koopwoningen-onder-:budget-:city" element={<BudgetLandingPage listingType="koop" />} />
              <Route path="/huur-bij-inkomen-:income-:city" element={<IncomeLandingPage />} />
              <Route path="/verhuizen-naar-:city" element={<CityGuidePage />} />
              <Route path="/alerts/afmelden/:token" element={<AlertUnsubscribe />} />
              <Route path="/huurwoningen/:city/:filter" element={<FilteredLandingPage listingType="huur" />} />
              <Route path="/huurwoningen/:city?" element={<ListingTypePage listingType="huur" />} />
              <Route path="/koopwoningen/:city/:filter" element={<FilteredLandingPage listingType="koop" />} />
              <Route path="/koopwoningen/:city?" element={<ListingTypePage listingType="koop" />} />
              <Route path="/appartementen/:city/:filter" element={<FilteredLandingPage propertyType="appartement" />} />
              <Route path="/appartementen/:city?" element={<PropertyTypeCityPage propertyType="appartement" />} />
              <Route path="/huizen/:city/:filter" element={<FilteredLandingPage propertyType="huis" />} />
              <Route path="/huizen/:city?" element={<PropertyTypeCityPage propertyType="huis" />} />
              <Route path="/studios/:city/:filter" element={<FilteredLandingPage propertyType="studio" />} />
              <Route path="/studios/:city?" element={<PropertyTypeCityPage propertyType="studio" />} />
              <Route path="/kamers/:city/:filter" element={<FilteredLandingPage propertyType="kamer" />} />
              <Route path="/kamers/:city?" element={<PropertyTypeCityPage propertyType="kamer" />} />
              <Route path="/woningen/:city/:filter" element={<FilteredLandingPage />} />
              <Route path="/wijk/:city/:neighborhood" element={<NeighborhoodPage />} />
              <Route path="/:city" element={<LegacyCityRedirect />} />
              <Route path="/niet-gevonden" element={<NotFound />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
