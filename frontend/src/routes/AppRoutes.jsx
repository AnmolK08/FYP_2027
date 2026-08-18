import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// We will import Pages here once we migrate them.
// For now, importing from legacy paths.
import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LeaderboardPage from '../pages/Leaderboard/LeaderboardPage';
import MentorPage from '../pages/Mentor/MentorPage';
import KnowledgePage from '../pages/Knowledge/KnowledgePage';
import StreaksPage from '../pages/Streaks/StreaksPage';
import InterviewPage from '../pages/Interview/InterviewPage';
import FlashCardsPage from '../pages/FlashCards/FlashCardsPage';
import ProblemsPage from '../pages/Problems/ProblemsPage';
import PredictorPage from '../pages/Predictor/PredictorPage';
import ResumePage from '../pages/Resume/ResumePage';
import SystemDesignPage from '../pages/SystemDesign/SystemDesignPage';
import TracksPage from '../pages/Tracks/TracksPage';

import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      
      {/* Protected Routes Wrapper could go here, or handled inside individual components. The existing code handles it per route or inside the component itself. */}
      {/* Example: <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
      
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/mentor" element={<MentorPage />} />
      <Route path="/knowledge" element={<KnowledgePage />} />
      <Route path="/streaks" element={<StreaksPage />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/flashcards" element={<FlashCardsPage />} />
      <Route path="/problems" element={<ProblemsPage />} />
      <Route path="/predictor" element={<PredictorPage />} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/sd" element={<SystemDesignPage />} />
      <Route path="/tracks" element={<TracksPage />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
