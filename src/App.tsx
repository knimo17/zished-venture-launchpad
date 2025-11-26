import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AuthProvider, ProtectedRoute } from "@/hooks/useAuth";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import RolePage from "./pages/RolePage";
import IndustriesPage from "./pages/IndustriesPage";
import IdealPage from "./pages/IdealPage";
import ProcessPage from "./pages/ProcessPage";
import ApplyPage from "./pages/ApplyPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ApplicationDetail from "./pages/ApplicationDetail";
import InternshipsPage from "./pages/InternshipsPage";
import ManageInternships from "./pages/ManageInternships";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnnouncementBanner />
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/role" element={<RolePage />} />
            <Route path="/industries" element={<IndustriesPage />} />
            <Route path="/ideal-candidate" element={<IdealPage />} />
            <Route path="/process" element={<ProcessPage />} />
            <Route path="/internships" element={<InternshipsPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/application/:id" 
              element={
                <ProtectedRoute>
                  <ApplicationDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/internships" 
              element={
                <ProtectedRoute>
                  <ManageInternships />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
