// src/components/Layout.jsx
import React from 'react';
// 🚨 Import useLocation
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'; 
import { FaImage, FaPaintBrush, FaListAlt, FaCog, FaSignOutAlt, FaBell, FaUserCircle, FaInbox, FaComments, FaHistory } from 'react-icons/fa'; 
import { useAuth } from '../context/AuthContext';

function Layout() {
    const { user, logout, commissionRequests, isAdmin } = useAuth(); 
    const navigate = useNavigate();
    // 🚨 เรียกใช้ useLocation
    const location = useLocation(); 

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    // นับจำนวน Commission Request ที่เป็น 'New Request'
    const newRequestsCount = commissionRequests.filter(req => req.status === 'New Request').length;
    
    // 🚨 ฟังก์ชันใหม่: พา Admin ไปหน้า Inbox
    const handleNotificationClick = () => {
        // ทำงานเมื่อเป็น Admin เท่านั้น
        if (isAdmin) {
            navigate('/dashboard/inbox');
        }
    };
    
    // 🚨 ฟังก์ชันสำหรับกำหนด Class เมื่อเป็น Active Link
    const getLinkClasses = (path) => {
        // ตรวจสอบว่า path ปัจจุบันเริ่มต้นด้วย path ที่กำหนด
        const isActive = location.pathname.startsWith(`/dashboard/${path}`);
        
        return `flex items-center p-3 rounded-lg transition-colors duration-200 ${
            isActive 
                ? 'bg-blue-700 text-white font-bold shadow-md' // Active State
                : 'text-blue-200 hover:bg-blue-700 hover:text-white' // Inactive State
        }`;
    };

    //---------------------------//
    console.log('Current User:', user);
    console.log('Is Admin:', isAdmin);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-72 bg-blue-900 text-blue-100 flex flex-col shadow-lg">
                <div className="p-5 text-2xl font-bold border-b border-blue-800 flex items-center">
                    <FaPaintBrush className="mr-3 text-blue-300" />
                    Fezeaix Commission
                </div>
                {/* 🚨 เพิ่ม overflow-y-auto */}
                <nav className="flex-1 p-5 overflow-y-auto"> 
                    <ul>
                        <li className="mb-2">
                            {/* 🚨 ใช้ getLinkClasses */}
                            <Link to="/dashboard/gallery" className={getLinkClasses('gallery')}>
                                <FaImage className="mr-3 text-blue-300" /> Gallery
                            </Link>
                        </li>
                        <li className="mb-2">
                            {/* 🚨 ใช้ getLinkClasses */}
                            <Link to="/dashboard/commission" className={getLinkClasses('commission')}>
                                <FaPaintBrush className="mr-3 text-blue-300" /> Commission
                            </Link>
                        </li>

                        {/* Messages Link สำหรับ Client ทุกคน (User ทั่วไป) */}
                        {!isAdmin && ( 
                            <li className="mb-2">
                                {/* 🚨 ใช้ getLinkClasses */}
                                <Link to="/dashboard/messages" className={getLinkClasses('messages')}>
                                    <FaComments className="mr-3 text-blue-300" /> Messages
                                </Link>
                            </li>
                        )}
                        
                        {/* History Link สำหรับ Client ทุกคน (User ทั่วไป) */}
                        {!isAdmin && ( 
                            <li className="mb-2">
                                {/* 🚨 ใช้ getLinkClasses */}
                                <Link to="/dashboard/history" className={getLinkClasses('history')}>
                                    <FaHistory className="mr-3 text-blue-300" /> History
                                </Link>
                            </li>
                        )}
                        
                        {/* แสดง Inbox Link เฉพาะถ้าเป็น Admin */}
                        {isAdmin && (
                            <li className="mb-2">
                                {/* 🚨 ใช้ getLinkClasses */}
                                <Link to="/dashboard/inbox" className={getLinkClasses('inbox')}>
                                    <FaInbox className="mr-3 text-blue-300" /> Inbox
                                    {newRequestsCount > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {newRequestsCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        )}
                        <li className="mb-2">
                            {/* 🚨 ใช้ getLinkClasses */}
                            <Link to="/dashboard/queue" className={getLinkClasses('queue')}>
                                <FaListAlt className="mr-3 text-blue-300" /> Queue
                            </Link>
                        </li>
                        <li className="mb-2">
                            {/* 🚨 ใช้ getLinkClasses */}
                            <Link to="/dashboard/settings" className={getLinkClasses('settings')}>
                                <FaCog className="mr-3 text-blue-300" /> Settings
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div className="p-5 border-t border-blue-800">
                    <button onClick={handleLogout} className="flex items-center p-3 text-blue-200 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-200 w-full">
                        <FaSignOutAlt className="mr-3 text-blue-300" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header / Top Banner */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm z-10">
                    <h1 className="text-xl font-semibold text-gray-800">Welcome, {user ? user.username : 'Guest'}!</h1>
                    <div className="flex items-center space-x-4">
                        {/* แสดง Notification Bell พร้อม Badge เฉพาะ Admin */}
                        {isAdmin && (
                            <button 
                                // 🚨 เพิ่ม onClick event
                                onClick={handleNotificationClick} 
                                className={`relative transition-colors cursor-pointer ${newRequestsCount > 0 ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-blue-600'}`}
                                title={newRequestsCount > 0 ? `${newRequestsCount} New Request(s)` : 'No new notifications'}
                            >
                                <FaBell className="text-xl" />
                                {newRequestsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                        {newRequestsCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;