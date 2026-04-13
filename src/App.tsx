import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CorpusSelectPage from './pages/CorpusSelectPage';
import TranslationPracticePage from './pages/TranslationPracticePage';
import AnalysisResultPage from './pages/AnalysisResultPage';
import ShortSentenceTopicsPage from './pages/ShortSentenceTopicsPage';
import ShortSentencePracticePage from './pages/ShortSentencePracticePage';
import ErrorBookPage from './pages/ErrorBookPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes (Wrapped in MainLayout) */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/corpus" element={<CorpusSelectPage />} />
            <Route path="/practice/:id" element={<TranslationPracticePage />} />
            <Route path="/analysis/:id" element={<AnalysisResultPage />} />
            <Route path="/short-sentence" element={<ShortSentenceTopicsPage />} />
            <Route path="/short-sentence/:topicId" element={<ShortSentencePracticePage />} />
            <Route path="/error-book" element={<ErrorBookPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
