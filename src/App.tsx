import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Home } from "./components/Home";
import { GameView } from "./components/GameView";
import { Auth } from "./components/Auth";
import { UserProfile } from "./components/UserProfile";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <div className="app-container">
          <div className="app-header">
            <h1 className="app-title">KOB Tracker</h1>
            <UserProfile />
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:gameId" element={<GameView />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
