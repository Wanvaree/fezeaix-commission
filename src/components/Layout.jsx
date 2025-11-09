// src/components/Layout.jsx
import React, { useState, useRef, useEffect } from 'react'; 
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaImage, FaPaintBrush, FaListAlt, FaCog, FaSignOutAlt, FaBell, FaUserCircle, FaInbox, FaComments, FaHistory, FaChevronDown } from 'react-icons/fa'; 
import { useAuth } from '../context/AuthContext';

// 🚨 Component ย่อยสำหรับแถบแจ้งเตือน (Notification Dropdown)
function NotificationDropdown({ requests, handleClose }) {
    // requests ที่ส่งมาคือ requests ที่มี status เป็น 'New Request' แล้ว
    
    return (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl overflow-hidden animate-fade-in z-50 border border-gray-200">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                <span className="text-sm font-semibold text-red-600">{requests.length} New</span>
            </div>
            
            {requests.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                    No new commission requests.
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto">
                    {requests.map((request) => (
                        <Link
                            key={request.id}
                            to="/dashboard/inbox"
                            onClick={handleClose}
                            className="flex flex-col p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                            <p className="text-sm font-semibold text-blue-600 truncate">
                                {request.requesterUsername} requested {request.commissionType}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Status: <span className="font-medium text-red-600">{request.status}</span>
                            </p>
                            <span className="text-xs text-gray-400 mt-1 self-end">
                                {new Date(request.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </Link>
                    ))}
                    {/* 🚨 ลิงก์ดูทั้งหมด */}
                    <Link
                        to="/dashboard/inbox"
                        onClick={handleClose}
                        className="block py-2 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        View All in Inbox
                    </Link>
                </div>
            )}
        </div>
    );
}

function Layout() {
    const { user, logout, commissionRequests, isAdmin } = useAuth(); 
    const navigate = useNavigate();
    const location = useLocation(); 
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); 
    
    // 🚨 State ใหม่สำหรับ "ดูแล้ว" (ใช้ใน Local state แทนการยุ่งกับ DB)
    // เก็บ ID ของ New Request ที่ถูก Admin คลิกดูแล้ว
    const [viewedRequests, setViewedRequests] = useState(() => {
        const stored = localStorage.getItem('viewedRequests');
        return stored ? JSON.parse(stored) : [];
    });

    // 🚨 useEffect สำหรับ Sync viewedRequests ไปยัง Local Storage
    useEffect(() => {
        localStorage.setItem('viewedRequests', JSON.stringify(viewedRequests));
    }, [viewedRequests]);
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    // 🚨 Logic การนับแจ้งเตือนที่ยังไม่ได้ดู
    const newRequestsCount = commissionRequests.filter(
        req => req.status === 'New Request' && !viewedRequests.includes(req.id)
    ).length;
    
    // 🚨 ฟังก์ชัน: สลับสถานะ Dropdown และเคลียร์แจ้งเตือน
    const handleNotificationClick = () => {
        if (isAdmin) {
            setIsDropdownOpen(prev => {
                // ถ้ากำลังจะเปิด: เคลียร์แจ้งเตือนทั้งหมด
                if (!prev) {
                    const newRequestIds = commissionRequests
                        .filter(req => req.status === 'New Request')
                        .map(req => req.id);
                    
                    setViewedRequests(prevViewed => 
                        // เพิ่ม ID ใหม่ทั้งหมดเข้าไปใน viewedRequests
                        [...new Set([...prevViewed, ...newRequestIds])] 
                    );
                }
                return !prev;
            });
        }
    };
    
    // 🚨 ฟังก์ชัน: ปิด Dropdown
    const closeDropdown = () => {
        setIsDropdownOpen(false);
        // เมื่อปิด Dropdown, ให้ถือว่ารายการใน Dropdown ถูก "ดู" แล้ว
        const newRequestIds = commissionRequests
            .filter(req => req.status === 'New Request')
            .map(req => req.id);
                    
        setViewedRequests(prevViewed => 
            [...new Set([...prevViewed, ...newRequestIds])]
        ); 
    };

    // 🚨 useEffect: ปิด Dropdown เมื่อคลิกที่อื่น
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    const getLinkClasses = (path) => {
        const isActive = location.pathname.startsWith(`/dashboard/${path}`);
        
        return `flex items-center p-3 rounded-lg transition-colors duration-200 ${
            isActive 
                ? 'bg-blue-700 text-white font-bold shadow-md' 
                : 'text-blue-200 hover:bg-blue-700 hover:text-white' 
        }`;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar เดิม */}
            <aside className="w-72 bg-blue-900 text-blue-100 flex flex-col shadow-lg">
                <div className="p-5 text-2xl font-bold border-b border-blue-800 flex items-center">
                    <FaPaintBrush className="mr-3 text-blue-300" />
                    Fezeaix Commission
                </div>
                {/* 🚨 เพิ่ม overflow-y-auto */}
                <nav className="flex-1 p-5 overflow-y-auto"> 
                    <ul>
                        <li className="mb-2">
                            <Link to="/dashboard/gallery" className={getLinkClasses('gallery')}>
                                <FaImage className="mr-3 text-blue-300" /> Gallery
                            </Link>
                        </li>
                        <li className="mb-2">
                            <Link to="/dashboard/commission" className={getLinkClasses('commission')}>
                                <FaPaintBrush className="mr-3 text-blue-300" /> Commission
                            </Link>
                        </li>

                        {/* Messages Link สำหรับ Client ทุกคน (User ทั่วไป) */}
                        {!isAdmin && ( 
                            <li className="mb-2">
                                <Link to="/dashboard/messages" className={getLinkClasses('messages')}>
                                    <FaComments className="mr-3 text-blue-300" /> Messages
                                </Link>
                            </li>
                        )}
                        
                        {/* History Link สำหรับ Client ทุกคน (User ทั่วไป) */}
                        {!isAdmin && ( 
                            <li className="mb-2">
                                <Link to="/dashboard/history" className={getLinkClasses('history')}>
                                    <FaHistory className="mr-3 text-blue-300" /> History
                                </Link>
                            </li>
                        )}
                        
                        {/* แสดง Inbox Link เฉพาะถ้าเป็น Admin */}
                        {isAdmin && (
                            <li className="mb-2">
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
                            <Link to="/dashboard/queue" className={getLinkClasses('queue')}>
                                <FaListAlt className="mr-3 text-blue-300" /> Queue
                            </Link>
                        </li>
                        <li className="mb-2">
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
                        {/* 🚨 Notification Dropdown Area */}
                        {isAdmin && (
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={handleNotificationClick} 
                                    className={`relative p-2 rounded-full transition-colors ${newRequestsCount > 0 ? 'text-red-500 hover:text-red-600 bg-red-50' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}
                                    title={newRequestsCount > 0 ? `${newRequestsCount} New Request(s)` : 'No new notifications'}
                                >
                                    <FaBell className="text-xl" />
                                    {newRequestsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                            {newRequestsCount}
                                        </span>
                                    )}
                                </button>
                                
                                {isDropdownOpen && (
                                    <NotificationDropdown 
                                        requests={commissionRequests.filter(req => req.status === 'New Request')} 
                                        handleClose={closeDropdown} 
                                    />
                                )}
                            </div>
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