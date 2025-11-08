// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
function LoginPage() {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const { login } = useAuth();
const navigate = useNavigate();
const handleSubmit = async (e) => {
e.preventDefault();
setError('');
if (!username || !password) {
    setError('Please enter both username and password.');
    return;
}

const result = login(username, password); // เรียกใช้ฟังก์ชัน login จาก Context

if (result.success) {
  navigate('/dashboard/gallery'); // เข้าสู่ระบบสำเร็จ พาไปหน้า Dashboard
} else {
  setError(result.message); // แสดงข้อความ error เช่น "Invalid username or password."
}
};
return (
<div className="flex items-center justify-center min-h-screen bg-blue-800">
<div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
<h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login to Fezeaix Commission</h2>
<form onSubmit={handleSubmit}> {/* เพิ่ม onSubmit event */}
<div className="mb-4">
<label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
<input
type="text"
id="username"
className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder="Enter your username"
value={username}
onChange={(e) => setUsername(e.target.value)}
/>
</div>
<div className="mb-6">
<label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
<input
type="password"
id="password"
className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder="********"
value={password}
onChange={(e) => setPassword(e.target.value)}
/>
</div>
{error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors duration-200"
        >
          Sign In
        </button>
      </div>
      <p className="text-center text-gray-600 text-sm mt-4">
        Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-800 font-bold transition-colors duration-200">Register here</Link>
      </p>
    </form>
  </div>
</div>
);
}
export default LoginPage;