import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import PropertyDetail from "./pages/PropertyDetail";
import Favorites from "./pages/Favorites";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminScrapers from "./pages/admin/AdminScrapers";
import AdminSettings from "./pages/admin/AdminSettings";
import MyProperties from "./pages/MyProperties";
import CreateProperty from "./pages/CreateProperty";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inloggen" element={<Login />} />
            <Route path="/registreren" element={<Register />} />
            <Route path="/zoeken" element={<Search />} />
            <Route path="/woning/:id" element={<PropertyDetail />} />
            <Route path="/favorieten" element={<Favorites />} />
            <Route path="/mijn-woningen" element={<MyProperties />} />
            <Route path="/plaatsen" element={<CreateProperty />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/woningen" element={<AdminProperties />} />
            <Route path="/admin/scrapers" element={<AdminScrapers />} />
            <Route path="/admin/instellingen" element={<AdminSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
