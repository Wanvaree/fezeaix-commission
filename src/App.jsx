// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import GalleryPage from './pages/dashboard/GalleryPage';
import CommissionPage from './pages/dashboard/CommissionPage';
import QueuePage from './pages/dashboard/QueuePage';
import SettingsPage from './pages/dashboard/SettingsPage';
import InboxPage from './pages/dashboard/InboxPage';
import MessagesPage from './pages/dashboard/MessagesPage';
import HistoryPage from './pages/dashboard/HistoryPage'; 
import { useAuth } from './context/AuthContext'; 

// กำหนด Base Path สำหรับ GitHub Pages (ใช้ชื่อ Repository: fezeaix-commission)
const basename = import.meta.env.PROD ? '/fezeaix-commission/' : '/'; 

// Component สำหรับ Protected Route ทั่วไป (ต้อง Login)
function ProtectedRoute({ children }) {
const { isAuthenticated, loading } = useAuth();
if (loading) {
return (
<div className="flex items-center justify-center min-h-screen bg-gray-100">
<p className="text-xl text-gray-700">Loading user data...</p>
</div>
);
}
return isAuthenticated ? children : <Navigate to="/login" replace />;
}
// Component ใหม่สำหรับ Admin Protected Route (ต้อง Login และเป็น Admin)
function AdminProtectedRoute({ children }) {
const { isAuthenticated, isAdmin, loading } = useAuth();
// เพิ่ม console.log ที่นี่
console.log('AdminProtectedRoute - Is Authenticated:', isAuthenticated);
console.log('AdminProtectedRoute - Is Admin:', isAdmin);
console.log('AdminProtectedRoute - Loading:', loading);

if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p className="text-xl text-gray-700">Loading user data...</p>
        </div>
    );
}

// ถ้าไม่ Login, Redirect ไปหน้า Login
if (!isAuthenticated) {
    console.log('AdminProtectedRoute - Redirecting to /login');
    return <Navigate to="/login" replace />;
}

// ถ้า Login แล้วแต่ไม่ใช่ Admin, Redirect ไปหน้า Gallery (หรือหน้าที่เหมาะสม)
if (!isAdmin) {
    console.log('AdminProtectedRoute - Redirecting to /dashboard/gallery (Not Admin)');
    return <Navigate to="/dashboard/gallery" replace />; // หรืออาจจะแสดงหน้า 403 Forbidden
}

// ถ้า Login และเป็น Admin, แสดง children
console.log('AdminProtectedRoute - Access Granted');
return children;
}
function App() {
const { isAuthenticated, loading } = useAuth();
return (
// แก้ไข: เพิ่ม basename prop
<Router basename={basename}> 
<Routes>
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
{/* Protected Routes for Dashboard */}
    <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route path="gallery" element={<GalleryPage />} />
      <Route path="commission" element={<CommissionPage />} />
      <Route path="queue" element={<QueuePage />} />
      <Route path="settings" element={<SettingsPage />} />
      {/* Route สำหรับ Client Chat */}
      <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      {/* Route สำหรับ History */}
      <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} /> 
      {/* ใช้ AdminProtectedRoute สำหรับ InboxPage */}
      <Route path="inbox" element={<AdminProtectedRoute><InboxPage /></AdminProtectedRoute>} />
      <Route index element={<Navigate to="gallery" replace />} />
    </Route>

    {/* Route สำหรับหน้าแรก (Root Path) */}
    <Route
      path="/"
      element={
        loading ? (
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p className="text-xl text-gray-700">Loading...</p>
          </div>
        ) : (
          isAuthenticated ? <Navigate to="/dashboard/gallery" replace /> : <Navigate to="/login" replace />
        )
      }
    />
  </Routes>
</Router>
);
}
export default App;