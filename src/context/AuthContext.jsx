// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. สร้าง Context สำหรับ Auth และ Commission (รวมกัน)
const AuthContext = createContext(null);

// 2. Custom Hook สำหรับเรียกใช้ Context
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Provider Component ที่จะห่อหุ้ม App ของเรา
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // State สำหรับผู้ใช้งานที่ลงทะเบียน
    const [registeredUsers, setRegisteredUsers] = useState(() => {
        const storedUsers = localStorage.getItem('registeredUsers');
        return storedUsers ? JSON.parse(storedUsers) : [];
    });

    // State สำหรับ Commission Requests
    const [commissionRequests, setCommissionRequests] = useState(() => {
        const storedRequests = localStorage.getItem('commissionRequests');
        return storedRequests ? JSON.parse(storedRequests) : [];
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            // โหลด user object (ต้องมี role ด้วย)
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    }, [registeredUsers]);

    // เพิ่ม useEffect สำหรับบันทึก commissionRequests ลง localStorage
    useEffect(() => {
        localStorage.setItem('commissionRequests', JSON.stringify(commissionRequests));
    }, [commissionRequests]);


    const register = (username, password) => {
        const userExists = registeredUsers.some(u => u.username === username);
        if (userExists) {
            return { success: false, message: 'Username already exists.' };
        }

        // กำหนด role: 'admin' ถ้า username เป็น 'Fezeaix'
        // ไม่งั้นเป็น 'user' ปกติ
        const newUser = {
            username,
            password,
            role: username.toLowerCase() === 'fezeaix' ? 'admin' : 'user'
        };
        setRegisteredUsers(prevUsers => [...prevUsers, newUser]);
        return { success: true, message: 'Registration successful! Please login.' };
    };

    const login = (username, password) => {
        const foundUser = registeredUsers.find(
            u => u.username === username && u.password === password
        );

        if (foundUser) {
            setUser(foundUser);
            // บันทึก User Object ที่มี role ลง Local Storage
            localStorage.setItem('currentUser', JSON.stringify(foundUser)); 
            return { success: true, message: 'Login successful!' };
        } else {
            return { success: false, message: 'Invalid username or password.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const addCommissionRequest = (requestDetails) => {
        const newRequest = {
            id: Date.now(),
            ...requestDetails,
            status: 'New Request',
            timestamp: new Date().toISOString(),
            messages: [{ // เพิ่ม messages array และใส่ข้อความเริ่มต้น
                id: Date.now() + 1,
                sender: 'System',
                text: `New Commission Request for ${requestDetails.commissionType} received. Price: $${requestDetails.price}. The artist will contact you via this chat to confirm details.`,
                timestamp: new Date().toISOString(),
            }],
        };
        setCommissionRequests(prevRequests => [...prevRequests, newRequest]);
        return { success: true, message: 'Commission request submitted successfully! Please check your Messages for updates from the artist.' };
    };

    const deleteCommissionRequest = (requestId) => {
        setCommissionRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
        return { success: true, message: 'Commission request deleted.' };
    };

    // ฟังก์ชันสำหรับ Admin ในการอัพเดทสถานะ
    const updateCommissionStatus = (requestId, newStatus) => {
        setCommissionRequests(prevRequests => prevRequests.map(req => {
            if (req.id === requestId) {
                return {
                    ...req,
                    status: newStatus,
                    timestamp: new Date().toISOString(), 
                };
            }
            return req;
        }));
        return { success: true, message: 'Commission status updated.' };
    };

    // ฟังก์ชันใหม่สำหรับเพิ่มข้อความแชท
    const addMessageToCommissionRequest = (requestId, senderUsername, messageText) => {
        if (!messageText.trim()) return;

        setCommissionRequests(prevRequests => prevRequests.map(req => {
            if (req.id === requestId) {
                const newMessage = {
                    id: Date.now() + Math.random(),
                    sender: senderUsername,
                    text: messageText,
                    timestamp: new Date().toISOString(),
                };
                return {
                    ...req,
                    messages: [...(req.messages || []), newMessage], 
                    status: req.status === 'New Request' ? 'In Discussion' : req.status
                };
            }
            return req;
        }));
        return { success: true };
    };
    
    // <--- ฟังก์ชันเปลี่ยนรหัสผ่านใหม่ --->
    const changePassword = (currentPassword, newPassword) => {
        if (!user) {
            return { success: false, message: 'User not logged in.' };
        }
        
        // 1. ตรวจสอบรหัสผ่านปัจจุบัน
        if (user.password !== currentPassword) {
            return { success: false, message: 'Current password is incorrect.' };
        }

        // 2. อัปเดตใน registeredUsers
        const updatedUsers = registeredUsers.map(u => {
            if (u.username === user.username) {
                return { ...u, password: newPassword };
            }
            return u;
        });
        setRegisteredUsers(updatedUsers);

        // 3. อัปเดตใน currentUser state และ Local Storage
        const updatedUser = { ...user, password: newPassword };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return { success: true, message: 'Password updated successfully!' };
    };
    // <--- สิ้นสุดฟังก์ชันเปลี่ยนรหัสผ่านใหม่ --->


    const value = {
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user && user.role === 'admin', // ตรวจสอบบทบาท
        commissionRequests,
        addCommissionRequest,
        deleteCommissionRequest,
        addMessageToCommissionRequest,
        updateCommissionStatus,
        changePassword, // <--- เพิ่มตัวนี้
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;