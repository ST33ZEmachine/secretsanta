import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupPage from './pages/GroupPage';
import JoinGroupPage from './pages/JoinGroupPage';
import WishlistPage from './pages/WishlistPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/join/:token" element={<JoinGroupPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/create-group" element={
              <ProtectedRoute>
                <Layout>
                  <CreateGroupPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/group/:groupId" element={
              <ProtectedRoute>
                <Layout>
                  <GroupPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/group/:groupId/wishlist" element={
              <ProtectedRoute>
                <Layout>
                  <WishlistPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/group/:groupId/wishlist/:participantId" element={
              <ProtectedRoute>
                <Layout>
                  <WishlistPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;