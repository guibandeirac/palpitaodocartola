import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SiteNav } from "@/components/SiteNav";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Copa from "./pages/Copa";
import SerieA from "./pages/SerieA";
import Titulos from "./pages/Titulos";
import Clube from "./pages/Clube";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Navegação fixa em todo o site, menos no admin
function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <SiteNav />
      <div className="pb-16 md:pb-0">{children}</div>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/serie-a" element={<SerieA />} />
          <Route path="/serie-b" element={<Index />} />
          <Route path="/serie-b/parciais" element={<Navigate to="/serie-b" replace />} />
          <Route path="/copa" element={<Copa />} />
          <Route path="/copa/parciais" element={<Navigate to="/copa" replace />} />
          <Route path="/titulos" element={<Titulos />} />
          <Route path="/clubes/:slug" element={<Clube />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
