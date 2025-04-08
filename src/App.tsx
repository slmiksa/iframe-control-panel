import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { IframeProvider } from "./contexts/IframeContext";
import { SystemAlertsProvider } from "./contexts/SystemAlertsContext";
import { useIframe } from "./contexts/IframeContext";
import { useEffect } from "react";
import { createNotificationsBucket } from "./integrations/supabase/createStorageBucket";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ControlPanel from "./pages/ControlPanel";
import NotFound from "./pages/NotFound";
import { BreakTimerModal } from "./components/BreakTimerModal";
import { NotificationModal } from "./components/NotificationModal";

// Protected Route component to redirect to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useIframe();
  
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const AppRoutes = () => {
  // Move the useEffect inside the component
  useEffect(() => {
    createNotificationsBucket();
    
    // Log global error handler to catch unhandled promises
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
    
    console.log("App initialized");
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/control-panel" element={
        <ProtectedRoute>
          <ControlPanel />
        </ProtectedRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  console.log("App rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <IframeProvider>
          <SystemAlertsProvider>
            <BrowserRouter>
              <AppRoutes />
              <BreakTimerModal />
              <NotificationModal />
            </BrowserRouter>
          </SystemAlertsProvider>
        </IframeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
