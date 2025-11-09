// src/components/Layout.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaImage, FaPaintBrush, FaListAlt, FaCog, FaSignOutAlt, FaBell, FaUserCircle, FaInbox, FaComments, FaHistory, FaChevronDown, FaVolumeUp, FaTrashAlt } from 'react-icons/fa'; 
import { useAuth } from '../context/AuthContext';

// 🚨 Component ย่อยสำหรับแถบแจ้งเตือน (Admin/Client Dropdown)
function NotificationDropdown({ alerts, isClient, handleClose, handleClearAll }) { 
    
    // เรียงตามเวลาใหม่สุด
    const sortedAlerts = alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 
    
    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden animate-fade-in z-50 border border-gray-200">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">{isClient ? 'New Message/Status Alerts' : 'All Notifications'}</h3> 
                <button 
                    onClick={handleClearAll} // 🚨 ปุ่ม Clear All
                    className="flex items-center text-red-500 hover:text-red-700 text-xs font-semibold p-1 rounded transition-colors"
                >
                    <FaTrashAlt className="mr-1" size={12} /> Clear All
                </button>
            </div>
            
            {sortedAlerts.length === 0 ? ( 
                <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications.
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto">
                    {sortedAlerts.map((alert) => ( 
                        <Link
                            key={alert.id + alert.type} 
                            to={isClient ? "/dashboard/messages" : "/dashboard/inbox"} // Client ไปหน้า Messages, Admin ไปหน้า Inbox
                            onClick={handleClose}
                            className="flex flex-col p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                <span className={`mr-2 font-bold ${alert.type === 'REQUEST' ? 'text-red-600' : alert.type === 'STATUS' ? 'text-green-600' : 'text-orange-600'}`}>
                                    {alert.type === 'REQUEST' ? '🚨 REQUEST:' : alert.type === 'STATUS' ? '✅ STATUS:' : '💬 MESSAGE:'}
                                </span>
                                {alert.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 truncate">{alert.subtitle}</p>
                            <span className="text-xs text-gray-400 mt-1 self-end">
                                {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span >
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function Layout() {
    const { user, logout, commissionRequests, isAdmin, clearClientNotifications } = useAuth(); 
    const navigate = useNavigate();
    const location = useLocation(); 
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); 
    
    // Admin Notification States
    const [viewedRequests, setViewedRequests] = useState(() => {
        const stored = localStorage.getItem('viewedRequests');
        return stored ? JSON.parse(stored) : [];
    });
    const [adminLastViewedMessages, setAdminLastViewedMessages] = useState(() => {
        const stored = localStorage.getItem('adminLastViewedMessages');
        return stored ? JSON.parse(stored) : {}; 
    });
    
    // Note: ลบ State notificationStatus และ handleEnableNotifications ออก (ไม่ใช้ Web Noti แล้ว)

    // useEffects for Local Storage Sync
    useEffect(() => {
        localStorage.setItem('viewedRequests', JSON.stringify(viewedRequests));
    }, [viewedRequests]);
    
    useEffect(() => {
        localStorage.setItem('adminLastViewedMessages', JSON.stringify(adminLastViewedMessages));
    }, [adminLastViewedMessages]);
    
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    // -----------------------------------------------------------
    // 🚨 Client Notification Logic (สำคัญสำหรับการแสดงผลจุดแดง)
    // -----------------------------------------------------------
    const clientMessageAlerts = commissionRequests.filter(req => {
        if (req.requesterUsername !== user?.username) return false; 
        
        const lastMessage = req.messages && req.messages.length > 0 ? req.messages[req.messages.length - 1] : null;
        
        const lastViewedTimestamp = req.lastViewedByClient?.[user.username] || new Date(0).toISOString();
        const isUnread = new Date(req.timestamp).getTime() > new Date(lastViewedTimestamp).getTime(); 
        
        // 🚨🚨 FIX: ตรวจสอบไม่ให้ Client แจ้งเตือนข้อความที่ตัวเองส่งไป
        if (isUnread && lastMessage && lastMessage.sender === user.username) {
             // ถ้าเป็นการอัปเดตเนื่องจากข้อความล่าสุดมาจาก Client เอง, ไม่ต้องแสดง Alert
             if (new Date(lastMessage.timestamp).getTime() === new Date(req.timestamp).getTime()) {
                  if (lastMessage.sender === user.username) {
                       return false;
                  }
             }
             return true; 
        }

        // ตรวจสอบขั้นสุดท้าย
        return isUnread;

    }).map(req => {
        const lastMessage = req.messages && req.messages.length > 0 ? req.messages[req.messages.length - 1] : null;
        
        // Check if the last activity was an Admin message (fezeaix is the admin's fixed username)
        const isNewMessageFromAdmin = lastMessage?.sender === 'fezeaix'; 
        
        return ({
            id: req.id,
            // 🚨🚨 FIX: ถ้าข้อความล่าสุดมาจาก Admin ให้จัดเป็น MESSAGE เสมอ
            type: isNewMessageFromAdmin ? 'MESSAGE' : 'STATUS', 
            title: req.commissionType,
            // 🚨🚨 FIX: ปรับปรุง Subtitle
            subtitle: isNewMessageFromAdmin 
                ? `Artist: ${lastMessage.text}` // แสดงข้อความพร้อมระบุว่า Artist ส่งมา
                : `Status updated to: ${req.status}`, // แสดงสถานะ
            timestamp: req.timestamp
        });
    });
    
    const clientNewMessagesCount = clientMessageAlerts.length;


    // -----------------------------------------------------------
    // 🚨 Admin Notification Logic (New/Fixed)
    // -----------------------------------------------------------
    
    // 1. New Request List (สำหรับ Dropdown และ Count)
    const newRequestAlerts = commissionRequests.filter(
        req => req.status === 'New Request' && !viewedRequests.includes(req.id)
    );
    const adminNewRequestsCount = newRequestAlerts.length;

    // 2. New Message Alert List (จาก Client)
    const newMessageAlerts = commissionRequests.filter(req => {
        const lastMessage = req.messages && req.messages.length > 0 ? req.messages[req.messages.length - 1] : null;
        if (!lastMessage) return false;
        
        if (req.status === 'New Request' && newRequestAlerts.some(r => r.id === req.id)) return false; 

        const isFromClient = lastMessage.sender !== 'fezeaix' && lastMessage.sender !== 'System';
        if (!isFromClient) return false;
        
        const lastViewedTimestamp = adminLastViewedMessages[req.id] || new Date(0).toISOString();
        
        return new Date(lastMessage.timestamp).getTime() > new Date(lastViewedTimestamp).getTime();
    }).map(req => ({
        id: req.id,
        type: 'MESSAGE',
        title: req.requesterUsername,
        subtitle: req.messages[req.messages.length - 1].text,
        timestamp: req.messages[req.messages.length - 1].timestamp
    }));
    const adminNewMessageAlertCount = newMessageAlerts.length;


    // 🚨 รวมตัวนับทั้งหมดสำหรับ Header Bell และ Sidebar Link
    const totalAdminNotificationCount = adminNewRequestsCount + adminNewMessageAlertCount;
    
    // เลือกตัวนับที่เหมาะสมสำหรับ Header Bell
    const notificationCount = isAdmin ? totalAdminNotificationCount : clientNewMessagesCount;

    
    // 🚨 ฟังก์ชัน: เคลียร์แจ้งเตือนทั้งหมด (เรียกจากปุ่มใน Dropdown)
    const handleClearAllAdminNotifications = () => {
        if (window.confirm("Are you sure you want to clear all unread notifications?")) {
            localStorage.removeItem('viewedRequests');
            setViewedRequests([]);

            const now = new Date().toISOString();
            const updatedViewedMessages = {}; 
            
            commissionRequests.forEach(req => {
                 updatedViewedMessages[req.id] = now;
            });
            setAdminLastViewedMessages(updatedViewedMessages);
            localStorage.setItem('adminLastViewedMessages', JSON.stringify(updatedViewedMessages));
            
            setIsDropdownOpen(false); // ปิด Dropdown
        }
    };
    
    // 🚨 ฟังก์ชัน: เคลียร์แจ้งเตือนทั้งหมดของ Client
    const handleClearAllClientNotifications = () => {
         if (window.confirm("Are you sure you want to clear all message alerts?")) {
             clearClientNotifications(); // เรียกใช้ AuthContext Function
             setIsDropdownOpen(false);
         }
    };
    
    // 🚨 ฟังก์ชัน: สลับสถานะ Dropdown (Admin/Client)
    const handleNotificationClick = () => {
        setIsDropdownOpen(prev => !prev);
    };
    
    // 🚨 ฟังก์ชัน: ปิด Dropdown (ใช้เมื่อคลิกนอก Dropdown - ไม่เคลียร์ทั้งหมด)
    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };


    // 🚨 useEffect: Trigger Admin Message Alert Clear เมื่อเข้าหน้า Inbox
    useEffect(() => {
        if (isAdmin && location.pathname.startsWith('/dashboard/inbox')) {
            const now = new Date().toISOString();
            const newViewedMessages = { ...adminLastViewedMessages };
            
            const alertsToClear = [...newRequestAlerts.map(r => r.id), ...newMessageAlerts.map(r => r.id)];

            alertsToClear.forEach(id => {
                newViewedMessages[id] = now;
            });

            setViewedRequests(prevViewed => [...new Set([...prevViewed, ...newRequestAlerts.map(r => r.id)])]);

            const didMessageAlertsChange = newMessageAlerts.length > 0; 
            const didRequestAlertsChange = newRequestAlerts.length > 0;
            
            if (didMessageAlertsChange || didRequestAlertsChange) {
                 setAdminLastViewedMessages(newViewedMessages);
                 localStorage.setItem('adminLastViewedMessages', JSON.stringify(newViewedMessages));
            }
        }
        
        // useEffect เดิมสำหรับปิด Dropdown
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef, isAdmin, location.pathname, commissionRequests]); 

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
                                {/* 🚨🚨 FIX: แสดง Client Message Count ใน Sidebar ด้วย Pulse Dot 🚨🚨 */}
                                <Link 
                                    to="/dashboard/messages" 
                                    className={getLinkClasses('messages')}
                                >
                                    <FaComments className={`mr-3 ${clientNewMessagesCount > 0 ? 'text-yellow-400' : 'text-blue-300'}`} />
                                    Messages
                                    {clientNewMessagesCount > 0 && ( 
                                        <span className="ml-auto relative flex h-3 w-3">
                                            {/* Pulse Ring */}
                                            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            {/* Solid Dot */}
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
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
                                    <FaInbox className={`mr-3 ${totalAdminNotificationCount > 0 ? 'text-yellow-400' : 'text-blue-300'}`} /> 
                                    Inbox
                                    {totalAdminNotificationCount > 0 && (
                                        <span className="ml-auto relative flex h-3 w-3">
                                            {/* Pulse Ring */}
                                            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            {/* Solid Dot */}
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
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
                        {/* 🚨 Notification Dropdown Area (Bell Icon) */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={handleNotificationClick} 
                                // 🚨 เพิ่ม pulse animation class
                                className={`relative p-2 rounded-full transition-colors ${notificationCount > 0 ? 'text-red-500 hover:text-red-600 bg-red-50 animate-pulse' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}
                                title={notificationCount > 0 ? `${notificationCount} New Notification(s)` : 'No new notifications'}
                            >
                                <FaBell className="text-xl" />
                                {/* 🚨 ตัวเลขวงกลมแดง */}
                                {notificationCount > 0 && ( 
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Dropdown แสดงเฉพาะ Admin/Client */}
                            {isDropdownOpen && (
                                <NotificationDropdown 
                                    alerts={isAdmin ? [...newRequestAlerts, ...newMessageAlerts] : clientMessageAlerts}
                                    isClient={!isAdmin}
                                    handleClearAll={isAdmin ? handleClearAllAdminNotifications : handleClearAllClientNotifications} 
                                    handleClose={closeDropdown} 
                                />
                            )}
                        </div>
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