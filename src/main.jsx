// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
<AuthProvider> {/* ห่อหุ้ม App ที่นี่ */}
<App />
</AuthProvider>
</React.StrictMode>,
);