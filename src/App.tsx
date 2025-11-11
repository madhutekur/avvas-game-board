import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChessGame from "./games/ChessGame";
import LudoGame from "./games/LudoGame";
import BrainvitaGame from "./games/BrainvitaGame";
import CarromGame from "./games/CarromGame";
import ChineseCheckersGame from "./games/ChineseCheckersGame";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chess" element={<ChessGame />} />
          <Route path="/ludo" element={<LudoGame />} />
          <Route path="/brainvita" element={<BrainvitaGame />} />
          <Route path="/carrom" element={<CarromGame />} />
          <Route path="/chinese-checkers" element={<ChineseCheckersGame />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
