import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Settings from './pages/Settings';
import QuestionPage from "./pages/QuestionPage";
import RegisterPage from "./pages/Auth/Register";
import LoginPage from "./pages/Auth/Login";
import MainPage from "./pages/MainPage";
import GamePage from "./pages/GamePage";
import { GlobalStyles } from './styles';
import React from 'react';
import { AuthProvider } from './store/AuthContext';
import { useAuth } from './hooks/useAuth';
import EmotionPage from "./pages/EmotionPage";

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <GlobalStyles />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (pageType: string) => {
    console.log(`Navigating to: ${pageType}`);
    switch (pageType) {
      case 'mainMenu':
        navigate('/');
        break;
      case 'settings':
        navigate('/Settings');
        break;
      case 'game':
        navigate('/Game');
        break;
      default:
        console.warn(`Unknown pageType: ${pageType}`);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/Quest" element={<QuestionPage />} />
      <Route
        path="/Settings"
        element={
          <ProtectedRoute>
            <Settings onNavigate={handleNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/StartGame"
        element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        }
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/emotion-test" element={<EmotionPage />} />
      <Route
        path="/Game"
        element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
