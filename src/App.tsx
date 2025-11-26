import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import RolePage from "./pages/RolePage";
import IndustriesPage from "./pages/IndustriesPage";
import IdealPage from "./pages/IdealPage";
import ProcessPage from "./pages/ProcessPage";
import ApplyPage from "./pages/ApplyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/role" element={<RolePage />} />
          <Route path="/industries" element={<IndustriesPage />} />
          <Route path="/ideal-candidate" element={<IdealPage />} />
          <Route path="/process" element={<ProcessPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
