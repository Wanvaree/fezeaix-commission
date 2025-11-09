// src/pages/dashboard/SettingsPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// <--- ฟังก์ชันตรวจสอบรหัสผ่าน --->
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
// <--- สิ้นสุดฟังก์ชันตรวจสอบรหัสผ่าน --->


function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { changePassword } = useAuth();

    // 🚨 ยืนยัน: เป็น async และใช้ await
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('New password and confirmation do not match.');
            return;
        }
        
        // ตรวจสอบความปลอดภัยของรหัสผ่านใหม่
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        
        if (newPassword === currentPassword) {
            setError('New password must be different from the current password.');
            return;
        }

        // 🚨 ใช้ await ในการเรียก changePassword (ซึ่งจะมีการตรวจสอบ Hash/Plain Text)
        const result = await changePassword(currentPassword, newPassword);

        if (result.success) {
            setSuccessMessage(result.message);
            // เคลียร์ฟอร์ม
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="mt-4 border p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Change Password</h3>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div className="space-y-1">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                    {/* เพิ่มคำแนะนำด้านความปลอดภัย */}
                    <p className="text-xs text-gray-500 mb-1">Min 8-16 chars, include A-Z, a-z, 0-9.</p> 
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:bg-gray-400"
                >
                    Change Password
                </button>
            </form>
        </div>
    );
}


function SettingsPage() {
    const { user, isAdmin } = useAuth();

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Account Settings</h2>
            
            <div className="mb-6">
                <p className="text-gray-600 mb-2">จัดการรายละเอียดบัญชีและการตั้งค่าความปลอดภัยของคุณได้ที่นี่</p>
                <div className="space-y-1">
                    <p className="text-lg font-medium text-gray-700">Username: <span className="font-bold text-blue-600">{user?.username}</span></p>
                    <p className="text-lg font-medium text-gray-700">Role: <span className={`font-bold ${isAdmin ? 'text-red-600' : 'text-green-600'}`}>{isAdmin ? 'Artist (Admin)' : 'Client (User)'}</span></p>
                </div>
            </div>
            
            {/* Password Change Section */}
            <PasswordChangeForm />
            
            {/* Admin-specific Settings (Optional) */}
            {isAdmin && (
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Artist/Commission Settings</h3>
                    {/* 🚨 FIX: แก้ไขข้อความ Admin */}
                    <p className="text-gray-600">พื้นที่นี้ใช้สำหรับจัดการเงื่อนไขคอมมิชชัน ราคาค่าจ้าง และการตั้งค่าอื่น ๆ ในอนาคตcoming soon...</p>
                </div>
            )}
        </div>
    );
}

export default SettingsPage;