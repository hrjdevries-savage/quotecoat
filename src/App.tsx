import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import InboxDetail from "./pages/InboxDetail";
import { Quotes } from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import { ExcelPriceSettings } from "./pages/ExcelPriceSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Modern layout with sidebar and header - cache refresh

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes with Layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/home" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Home />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/inbox" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Inbox />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/inbox/:id" element={
                <ProtectedRoute>
                  <AppLayout>
                    <InboxDetail />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/quotes" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Quotes />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/quote/:id" element={
                <ProtectedRoute>
                  <AppLayout>
                    <QuoteDetail />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/excel-settings" element={
                <ProtectedRoute>
                  <AppLayout>
                    <ExcelPriceSettings />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;