import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useGameStore } from "./store/gameStore";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import CharacterCreation from "./pages/CharacterCreation";
import GameWorld from "./pages/GameWorld";

// Auth wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useGameStore();
  
  if (!isAuthenticated || !token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const CharacterRequired = ({ children }) => {
  const { character, isAuthenticated } = useGameStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (!character) {
    return <Navigate to="/create-character" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated, token, fetchPlayer, notifications, player, character, initializeAuth } = useGameStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      // First, try to restore session from stored token
      const hasValidToken = await initializeAuth();
      
      if (hasValidToken) {
        // Session restored, no need to fetch again
      } else if (token && isAuthenticated) {
        // Token was set during this session (login/register)
        try {
          await fetchPlayer();
        } catch (err) {
          console.error('Init error:', err);
        }
      }
      setInitializing(false);
    };
    init();
  }, []);

  // Refetch player when token changes (after login)
  useEffect(() => {
    const fetchOnLogin = async () => {
      if (token && isAuthenticated && !initializing) {
        try {
          await fetchPlayer();
        } catch (err) {
          console.error('Fetch after login error:', err);
        }
      }
    };
    fetchOnLogin();
  }, [token, isAuthenticated]);

  // Show notifications
  useEffect(() => {
    notifications.forEach(n => {
      if (n.type === 'success') toast.success(n.message);
      else if (n.type === 'error') toast.error(n.message);
      else toast.info(n.message);
    });
  }, [notifications]);

  if (initializing) {
    return (
      <div className="h-screen w-screen bg-[#0c0a09] flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="font-cinzel text-gold text-xl tracking-wider">Loading Quest Of Honor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0c0a09]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            isAuthenticated && character ? <Navigate to="/game" replace /> : 
            isAuthenticated && !character ? <Navigate to="/create-character" replace /> :
            <LandingPage />
          } />
          <Route path="/create-character" element={
            <ProtectedRoute>
              {character ? <Navigate to="/game" replace /> : <CharacterCreation />}
            </ProtectedRoute>
          } />
          <Route path="/game" element={
            <CharacterRequired>
              <GameWorld />
            </CharacterRequired>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1c1917',
            border: '1px solid #44403c',
            color: '#f5f5f4'
          }
        }}
      />
    </div>
  );
}

export default App;
