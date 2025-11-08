// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

// ฟังก์ชันสำหรับตรวจสอบความปลอดภัยของรหัสผ่าน
const validatePassword = (password) => {
    // 1. ความยาว: 8 ถึง 16 ตัวอักษร
    if (password.length < 8 || password.length > 16) {
        return 'Password must be between 8 and 16 characters long.';
    }

    // 2. ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z)
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter (A-Z).';
    }

    // 3. ต้องมีตัวอักษรพิมพ์เล็ก (a-z)
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter (a-z).';
    }

    // 4. ต้องมีตัวเลข (0-9)
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number (0-9).';
    }

    return null; // ไม่มีข้อผิดพลาด
};

function RegisterPage() {
const [displayName, setDisplayName] = useState('');
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [error, setError] = useState('');
const [successMessage, setSuccessMessage] = useState('');
const { register } = useAuth();
const navigate = useNavigate();
const handleSubmit = async (e) => {
e.preventDefault();
setError('');
setSuccessMessage('');

if (!username || !password || !displayName || !confirmPassword) {
    setError('Please fill in all fields.');
    return;
}

if (password !== confirmPassword) {
  setError('Passwords do not match.');
  return;
}

// <--- เพิ่มการตรวจสอบความปลอดภัยของรหัสผ่านที่นี่ --->
const passwordError = validatePassword(password);
if (passwordError) {
    setError(passwordError);
    return;
}
// <--- สิ้นสุดการตรวจสอบ --->

const result = register(username, password); // เรียกใช้ฟังก์ชัน register จาก Context

if (result.success) {
  setSuccessMessage(result.message);
  // หลังจากลงทะเบียนสำเร็จ ให้รอ 2 วินาทีแล้วค่อยไปหน้า Login
  setTimeout(() => {
    navigate('/login');
  }, 2000);
} else {
  setError(result.message); // แสดงข้อความ error เช่น "Username already exists."
}
};
return (
<div className="flex items-center justify-center min-h-screen bg-blue-800">
<div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
<h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create your Fezeaix Account</h2>
<form onSubmit={handleSubmit}> {/* เพิ่ม onSubmit event */}
<div className="mb-4">
<label htmlFor="displayname" className="block text-gray-700 text-sm font-semibold mb-2">Display Name</label>
<input
type="text"
id="displayname"
className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder="Your display name"
value={displayName}
onChange={(e) => setDisplayName(e.target.value)}
/>
</div>
<div className="mb-4">
<label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
<input
type="text"
id="username"
className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder="Choose a username"
value={username}
onChange={(e) => setUsername(e.target.value)}
/>
</div>
<div className="mb-4">
<label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
{/* เพิ่มคำแนะนำด้านความปลอดภัย */}
<p className="text-xs text-gray-500 mb-1">Min 8-16 chars, include A-Z, a-z, 0-9.</p> 
<input
type="password"
id="password"
className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder=""
value={password}
onChange={(e) => setPassword(e.target.value)}
/>
</div>
<div className="mb-6">
<label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold mb-2">Confirm Password</label>
<input
type="password"
id="confirmPassword"
className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder=""
value={confirmPassword}
onChange={(e) => setConfirmPassword(e.target.value)}
/>
</div>
{error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm mb-4 text-center">{successMessage}</p>}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors duration-200"
        >
          Register
        </button>
      </div>
      <p className="text-center text-gray-600 text-sm mt-4">
        Already have an account?
        <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold transition-colors duration-200">Login here</Link>
      </p>
    </form>
  </div>
</div>
);
}
export default RegisterPage;