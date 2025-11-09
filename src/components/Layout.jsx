// src/components/Layout.jsx
import React, { useState, useRef, useEffect } from 'react'; 
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaImage, FaPaintBrush, FaListAlt, FaCog, FaSignOutAlt, FaBell, FaUserCircle, FaInbox, FaComments, FaHistory, FaChevronDown, FaVolumeUp } from 'react-icons/fa'; 
import { useAuth } from '../context/AuthContext';

// 🚨 Component ย่อยสำหรับแถบแจ้งเตือน (Notification Dropdown)
// 🚨🚨 NOTE: เปลี่ยนชื่อ prop และ Logic เพื่อแสดงทั้ง New Request และ New Message Alert
function NotificationDropdown({ requests, messageAlerts, handleClose }) { // 🚨 เพิ่ม messageAlerts
    
    // รวมรายการแจ้งเตือนทั้งหมดสำหรับแสดงใน Dropdown
    const allAlerts = [
        ...requests.map(req => ({ 
            ...req, 
            type: 'REQUEST', 
            title: `${req.requesterUsername} requested ${req.commissionType}`,
            subtitle: `Status: New Request`
        })),
        ...messageAlerts.map(req => ({ 
            ...req, 
            type: 'MESSAGE', 
            title: `New Message from ${req.requesterUsername}`,
            subtitle: `${req.commissionType}: ${req.messages[req.messages.length - 1].text}`
        }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // เรียงตามเวลาใหม่สุด

    return (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl overflow-hidden animate-fade-in z-50 border border-gray-200">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                <span className="text-sm font-semibold text-red-600">{allAlerts.length} New</span>
            </div>
            
            {allAlerts.length === 0 ? ( // 🚨 ใช้ allAlerts
                <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications.
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto">
                    {allAlerts.map((alert) => ( // 🚨 ใช้ allAlerts
                        <Link
                            key={alert.id}
                            to="/dashboard/inbox"
                            onClick={handleClose}
                            className="flex flex-col p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                            <p className="text-sm font-semibold text-blue-600 truncate">
                                🚨 {alert.type === 'REQUEST' ? 'New Request' : 'New Message'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{alert.title}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate">{alert.subtitle}</p>
                            <span className="text-xs text-gray-400 mt-1 self-end">
                                {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span >
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
    const { user, logout, commissionRequests, isAdmin, requestNotificationPermission } = useAuth(); 
    const navigate = useNavigate();
    const location = useLocation(); 
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); 
    
    // 🚨 State สำหรับติดตามสถานะ Notification Permission และ Admin Viewed Requests
    // ** viewedRequests (สำหรับ New Request ID) ยังคงใช้เพื่อแยกรายการ New Request ที่ถูก Admin คลิกดูแล้ว**
    const [viewedRequests, setViewedRequests] = useState(() => {
        const stored = localStorage.getItem('viewedRequests');
        return stored ? JSON.parse(stored) : [];
    });
    // ** adminLastViewedMessages (สำหรับ Message Alert) **
    const [adminLastViewedMessages, setAdminLastViewedMessages] = useState(() => {
        const stored = localStorage.getItem('adminLastViewedMessages');
        return stored ? JSON.parse(stored) : {}; // { requestId: timestamp }
    });
    
    const [notificationStatus, setNotificationStatus] = useState(Notification.permission);

    // 🚨 useEffect สำหรับ Sync viewedRequests & adminLastViewedMessages ไปยัง Local Storage
    useEffect(() => {
        localStorage.setItem('viewedRequests', JSON.stringify(viewedRequests));
    }, [viewedRequests]);
    
    useEffect(() => {
        localStorage.setItem('adminLastViewedMessages', JSON.stringify(adminLastViewedMessages));
    }, [adminLastViewedMessages]);
    
    // ... (handleEnableNotifications function เหมือนเดิม)
    const handleEnableNotifications = () => {
        requestNotificationPermission();
        setNotificationStatus(Notification.permission); 
    };

    // -----------------------------------------------------------
    // 🚨 Client Notification Logic (OK)
    // -----------------------------------------------------------
    const clientNewMessagesCount = commissionRequests.reduce((count, req) => {
        if (req.requesterUsername !== user?.username) return count; 
        const lastMessage = req.messages && req.messages.length > 0 
            ? req.messages[req.messages.length - 1] 
            : null;
        if (!lastMessage || lastMessage.sender !== 'fezeaix') return count;
        const lastViewedTimestamp = req.lastViewedByClient?.[user.username] || new Date(0).toISOString();
        if (new Date(lastMessage.timestamp).getTime() > new Date(lastViewedTimestamp).getTime()) {
            return count + 1;
        }
        return count;
    }, 0);


    // -----------------------------------------------------------
    // 🚨 Admin Notification Logic (New/Fixed)
    // -----------------------------------------------------------
    
    // 1. New Request List (สำหรับ Dropdown และ Count)
    const newRequestAlerts = commissionRequests.filter(
        req => req.status === 'New Request' && !viewedRequests.includes(req.id)
    );
    const adminNewRequestsCount = newRequestAlerts.length;

    // 2. New Message Alert List (สำหรับ Dropdown และ Count)
    const newMessageAlerts = commissionRequests.filter(req => {
        const lastMessage = req.messages && req.messages.length > 0 ? req.messages[req.messages.length - 1] : null;
        if (!lastMessage) return false;
        
        // ถ้าเป็น New Request จะถูกนับใน newRequestAlerts แล้ว
        if (req.status === 'New Request') return false; 

        // ข้อความล่าสุดต้องมาจาก Client (ไม่ใช่ Admin/System)
        const isFromClient = lastMessage.sender !== 'fezeaix' && lastMessage.sender !== 'System';
        
        if (!isFromClient) return false;
        
        // ตรวจสอบว่าข้อความล่าสุดใหม่กว่าเวลาที่ Admin เปิด Inbox ล่าสุด
        const lastViewedTimestamp = adminLastViewedMessages[req.id] || new Date(0).toISOString();
        
        return new Date(lastMessage.timestamp).getTime() > new Date(lastViewedTimestamp).getTime();
    });
    const adminNewMessageAlertCount = newMessageAlerts.length;


    // 🚨 รวมตัวนับทั้งหมดสำหรับ Header Bell และ Sidebar Link
    const totalAdminNotificationCount = adminNewRequestsCount + adminNewMessageAlertCount;
    
    // เลือกตัวนับที่เหมาะสมสำหรับ Header Bell
    const notificationCount = isAdmin ? totalAdminNotificationCount : clientNewMessagesCount;

    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    // 🚨 ฟังก์ชัน: สลับสถานะ Dropdown และเคลียร์แจ้งเตือน (Admin Only)
    const handleNotificationClick = () => {
        if (isAdmin) {
            setIsDropdownOpen(prev => {
                // ถ้ากำลังจะเปิด:
                if (!prev) {
                     // 1. เคลียร์ New Request IDs
                    const newRequestIds = newRequestAlerts.map(req => req.id);
                    setViewedRequests(prevViewed => 
                        [...new Set([...prevViewed, ...newRequestIds])] 
                    );
                    
                    // 2. เคลียร์ New Message Alerts โดยการอัปเดต timestamp ล่าสุด
                    const now = new Date().toISOString();
                    const updatedViewedMessages = { ...adminLastViewedMessages };
                    newMessageAlerts.forEach(req => {
                        updatedViewedMessages[req.id] = now;
                    });
                    setAdminLastViewedMessages(updatedViewedMessages);
                }
                return !prev;
            });
        } else {
             // Client: คลิก Bell นำไปหน้า Messages ทันที (ไม่เปิด Dropdown)
             navigate('/dashboard/messages');
        }
    };
    
    // 🚨 ฟังก์ชัน: ปิด Dropdown (ใช้เมื่อคลิกนอก Dropdown)
    const closeDropdown = () => {
        setIsDropdownOpen(false);
        // ทำการเคลียร์ Notifications เมื่อปิด Dropdown
        const now = new Date().toISOString();
        
        // 1. เคลียร์ New Request IDs
        const newRequestIds = newRequestAlerts.map(req => req.id);
        setViewedRequests(prevViewed => 
            [...new Set([...prevViewed, ...newRequestIds])]
        ); 
        
        // 2. เคลียร์ New Message Alerts
        const updatedViewedMessages = { ...adminLastViewedMessages };
        newMessageAlerts.forEach(req => {
            updatedViewedMessages[req.id] = now;
        });
        setAdminLastViewedMessages(updatedViewedMessages);
    };


    // 🚨 useEffect: ปิด Dropdown เมื่อคลิกที่อื่น
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        }
        if (isAdmin) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef, isAdmin, adminNewRequestsCount, adminNewMessageAlertCount]); // 🚨 Add dependencies


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
                    {/* 🚨🚨 Notification Status/Enable Button 🚨🚨 */}
                    {notificationStatus !== 'granted' && (
                        <button
                            onClick={handleEnableNotifications}
                            className="flex items-center p-3 text-yellow-200 bg-yellow-700 hover:bg-yellow-800 rounded-lg transition-colors duration-200 w-full mb-3"
                            title="Click to enable sound and desktop notifications for the chat."
                        >
                            <FaVolumeUp className="mr-3" />
                            Enable Notifications
                        </button>
                    )}
                    
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
                            
                            {/* Dropdown แสดงเฉพาะ Admin */}
                            {isAdmin && isDropdownOpen && (
                                <NotificationDropdown 
                                    requests={newRequestAlerts} // 🚨 ส่งแค่ New Request
                                    messageAlerts={newMessageAlerts} // 🚨 ส่ง New Message Alert
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