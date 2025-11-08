// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
// 🚨 Import Firestore Functions และ db
import { 
    db, 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    updateDoc, 
    query, 
    where, 
    onSnapshot,
    deleteDoc
} from '../firebaseConfig'; 

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Collections References
const usersCollectionRef = collection(db, "users");
const commissionsCollectionRef = collection(db, "commissions");

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // 🚨 States ใหม่สำหรับข้อมูลที่ดึงจาก Firestore
    const [commissionRequests, setCommissionRequests] = useState([]);
    const [allRegisteredUsers, setAllRegisteredUsers] = useState([]); // สำหรับตรวจสอบตอน Register/Login

    // -----------------------------------------------------------
    // 1. useEffect สำหรับ User State (ยังใช้ Local Storage สำหรับ Session)
    // -----------------------------------------------------------
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // -----------------------------------------------------------
    // 2. useEffect สำหรับ Fetch/Listen ข้อมูลผู้ใช้ทั้งหมด (สำหรับ Register/Login Logic)
    // -----------------------------------------------------------
    useEffect(() => {
        const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setAllRegisteredUsers(usersData);
        }, (error) => {
            console.error("Error fetching users:", error);
        });

        // Cleanup function
        return () => unsubscribe();
    }, []);

    // -----------------------------------------------------------
    // 3. useEffect สำหรับ Fetch/Listen Commission Requests (Realtime)
    // -----------------------------------------------------------
    useEffect(() => {
        const unsubscribe = onSnapshot(commissionsCollectionRef, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setCommissionRequests(requestsData);
        }, (error) => {
            console.error("Error fetching commissions:", error);
        });

        // Cleanup function
        return () => unsubscribe();
    }, []);


    // -----------------------------------------------------------
    // 4. Auth Logic (ใช้ Firestore)
    // -----------------------------------------------------------

    const register = async (username, password) => {
        try {
            const userExists = allRegisteredUsers.some(u => u.username === username);
            if (userExists) {
                return { success: false, message: 'Username already exists.' };
            }

            const newUser = {
                username,
                password, 
                role: username.toLowerCase() === 'fezeaix' ? 'admin' : 'user'
            };

            // 🚨 บันทึกผู้ใช้ใหม่ลงใน Firestore
            await setDoc(doc(db, "users", username), newUser); // ใช้ username เป็น Document ID

            return { success: true, message: 'Registration successful! Please login.' };
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, message: 'Registration failed due to server error.' };
        }
    };

    const login = async (username, password) => {
        try {
            // ไม่ต้อง Query, ใช้ข้อมูลที่ onSnapshot ดึงมาแล้ว
            const foundUser = allRegisteredUsers.find(
                u => u.username === username && u.password === password
            );

            if (foundUser) {
                setUser(foundUser);
                localStorage.setItem('currentUser', JSON.stringify(foundUser)); 
                return { success: true, message: 'Login successful!' };
            } else {
                return { success: false, message: 'Invalid username or password.' };
            }
        } catch (error) {
             console.error("Login error:", error);
             return { success: false, message: 'Login failed due to server error.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };
    
    // -----------------------------------------------------------
    // 5. Commission & Message Logic (ใช้ Firestore)
    // -----------------------------------------------------------

    const addCommissionRequest = async (requestDetails) => {
        try {
            const newRequest = {
                id: Date.now().toString(), // ใช้ string เป็น ID ชั่วคราว (Firestore จะสร้าง ID จริงให้)
                ...requestDetails,
                status: 'New Request',
                timestamp: new Date().toISOString(),
                messages: [{ 
                    id: Date.now() + 1,
                    sender: 'System',
                    text: `New Commission Request for ${requestDetails.commissionType} received. Price: $${requestDetails.price}. The artist will contact you via this chat to confirm details.`,
                    timestamp: new Date().toISOString(),
                }],
            };

            // 🚨 เพิ่ม Request ลงใน Firestore
            await setDoc(doc(commissionsCollectionRef), newRequest); 
            
            return { success: true, message: 'Commission request submitted successfully! Please check your Messages for updates from the artist.' };
        } catch (error) {
            console.error("Add commission error:", error);
            return { success: false, message: 'Failed to submit commission request.' };
        }
    };

    const deleteCommissionRequest = async (requestId) => {
        try {
            // 🚨 ลบ Document จาก Firestore
            await deleteDoc(doc(db, "commissions", requestId));
            return { success: true, message: 'Commission request deleted.' };
        } catch (error) {
            console.error("Delete commission error:", error);
            return { success: false, message: 'Failed to delete commission request.' };
        }
    };

    const updateCommissionStatus = async (requestId, newStatus) => {
        try {
            const requestDocRef = doc(db, "commissions", requestId);
            // 🚨 อัปเดต Status ใน Firestore
            await updateDoc(requestDocRef, {
                status: newStatus,
                timestamp: new Date().toISOString(),
            });
            return { success: true, message: 'Commission status updated.' };
        } catch (error) {
            console.error("Update status error:", error);
            return { success: false, message: 'Failed to update commission status.' };
        }
    };

    const addMessageToCommissionRequest = async (requestId, senderUsername, messageText) => {
        if (!messageText.trim()) return;

        try {
            const requestDocRef = doc(db, "commissions", requestId);
            const currentRequest = commissionRequests.find(req => req.id === requestId);

            if (!currentRequest) return { success: false };

            const newMessage = {
                id: Date.now() + Math.random(),
                sender: senderUsername,
                text: messageText,
                timestamp: new Date().toISOString(),
            };

            // 🚨 อัปเดต Messages และ Status ใน Firestore
            await updateDoc(requestDocRef, {
                messages: [...(currentRequest.messages || []), newMessage], 
                status: currentRequest.status === 'New Request' ? 'In Discussion' : currentRequest.status
            });

            return { success: true };

        } catch (error) {
            console.error("Add message error:", error);
            return { success: false };
        }
    };
    
    // 🚨 ฟังก์ชันใหม่สำหรับลบข้อความ (ใช้ Firestore)
    const deleteMessageFromCommissionRequest = async (requestId, messageId) => {
        try {
            const requestDocRef = doc(db, "commissions", requestId);
            const currentRequest = commissionRequests.find(req => req.id === requestId);

            if (!currentRequest) return { success: false, message: "Request not found." };

            // กรองข้อความที่ไม่ต้องการลบ
            const updatedMessages = currentRequest.messages.filter(msg => msg.id !== messageId);

            // 🚨 อัปเดต Messages ใน Firestore
            await updateDoc(requestDocRef, {
                messages: updatedMessages,
            });

            return { success: true };

        } catch (error) {
            console.error("Delete message error:", error);
            return { success: false, message: 'Failed to delete message.' };
        }
    };
    
    const changePassword = async (currentPassword, newPassword) => {
        if (!user) {
            return { success: false, message: 'User not logged in.' };
        }
        
        try {
             // 1. ตรวจสอบรหัสผ่านปัจจุบัน
            if (user.password !== currentPassword) {
                return { success: false, message: 'Current password is incorrect.' };
            }

            const userDocRef = doc(db, "users", user.username);
            
            // 🚨 อัปเดต Password ใน Firestore
            await updateDoc(userDocRef, {
                password: newPassword
            });

            // 3. อัปเดตใน currentUser state และ Local Storage
            const updatedUser = { ...user, password: newPassword };
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            return { success: true, message: 'Password updated successfully!' };
        } catch (error) {
             console.error("Change password error:", error);
             return { success: false, message: 'Failed to change password.' };
        }
    };


    const value = {
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user && user.role === 'admin', 
        commissionRequests, 
        addCommissionRequest,
        deleteCommissionRequest,
        addMessageToCommissionRequest,
        deleteMessageFromCommissionRequest, // 🚨 เพิ่มฟังก์ชันนี้
        updateCommissionStatus,
        changePassword, 
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;