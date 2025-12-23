import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
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
import ManageSiteContent from "./pages/ManageSiteContent";
import AssessmentV2 from "./pages/AssessmentV2";
import AssessmentThankYou from "./pages/AssessmentThankYou";
import WeeklyReportForm from "./pages/WeeklyReportForm";
import WeeklyReportThankYou from "./pages/WeeklyReportThankYou";
import AdminWeeklyReports from "./pages/AdminWeeklyReports";
import WeeklyReportDetail from "./pages/WeeklyReportDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Layout wrapper for pages with navigation
const MainLayout = () => (
  <>
    <AnnouncementBanner />
    <Navigation />
    <Outlet />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public assessment routes (no navigation/banner) */}
            <Route path="/assessment/:token" element={<AssessmentV2 />} />
            <Route path="/assessment-thank-you" element={<AssessmentThankYou />} />
            
            {/* Public weekly report routes (no navigation/banner) */}
            <Route path="/weekly-report/:token" element={<WeeklyReportForm />} />
            <Route path="/weekly-report-thank-you" element={<WeeklyReportThankYou />} />
            
            {/* Main app routes with navigation */}
            <Route element={<MainLayout />}>
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
              <Route 
                path="/admin/site-content" 
                element={
                  <ProtectedRoute>
                    <ManageSiteContent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/weekly-reports" 
                element={
                  <ProtectedRoute>
                    <AdminWeeklyReports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/weekly-report/:id" 
                element={
                  <ProtectedRoute>
                    <WeeklyReportDetail />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
