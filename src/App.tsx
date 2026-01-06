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
import ManageGoalTemplates from "./pages/ManageGoalTemplates";
import AssessmentV2 from "./pages/AssessmentV2";
import AssessmentThankYou from "./pages/AssessmentThankYou";
import WeeklyReportForm from "./pages/WeeklyReportForm";
import WeeklyReportThankYou from "./pages/WeeklyReportThankYou";
import AdminWeeklyReports from "./pages/AdminWeeklyReports";
import WeeklyReportDetail from "./pages/WeeklyReportDetail";
import TeamTasks from "./pages/TeamTasks";
import TeamGoals from "./pages/TeamGoals";
import TeamMembers from "./pages/TeamMembers";
import TeamSignup from "./pages/TeamSignup";
import TeamLogin from "./pages/TeamLogin";
import TeamApplications from "./pages/TeamApplications";
import TeamWeeklyReport from "./pages/TeamWeeklyReport";
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
            
            {/* Team signup route (no navigation/banner) */}
            <Route path="/team/signup" element={<TeamSignup />} />
            
            {/* Team tasks/goals routes (have their own header) */}
            <Route path="/team/tasks" element={<TeamTasks />} />
            <Route path="/team/goals" element={<TeamGoals />} />
            <Route path="/team/lists" element={<TeamGoals />} /> {/* Redirect old route */}
            <Route path="/team/members" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
            <Route path="/team/applications" element={<TeamApplications />} />
            <Route path="/team/application/:id" element={<ApplicationDetail />} />
            <Route path="/team/weekly-report" element={<TeamWeeklyReport />} />
            
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
              
              {/* Team login (has main navigation) */}
              <Route path="/team/login" element={<TeamLogin />} />
              
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
              <Route 
                path="/admin/goal-templates" 
                element={
                  <ProtectedRoute>
                    <ManageGoalTemplates />
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
