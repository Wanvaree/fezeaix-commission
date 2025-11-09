// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as bcrypt from 'bcryptjs';
import { 
    db, 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
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
    const [commissionRequests, setCommissionRequests] = useState([]);
    const [allRegisteredUsers, setAllRegisteredUsers] = useState([]); 
    const requestsRef = useRef([]); 
    
    // -----------------------------------------------------------
    // 1. useEffect สำหรับ User State (ยังใช้ Local Storage สำหรับ Session)
    // -----------------------------------------------------------
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const { password: _, ...userWithoutPassword } = parsedUser;
            setUser(userWithoutPassword);
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

        return () => unsubscribe();
    }, []);

    // -----------------------------------------------------------
    // 3. useEffect สำหรับ Fetch/Listen Commission Requests (Realtime) & Notification Sound (Updated)
    // -----------------------------------------------------------
    useEffect(() => {
        const unsubscribe = onSnapshot(commissionsCollectionRef, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            
            // 🚨🚨 Logic การแจ้งเตือน (รวม Admin และ Client) 🚨🚨
            if (user && requestsRef.current.length > 0 && requestsData.length > 0) {
                
                let shouldPlayRequestSound = false; // สำหรับ Admin
                let shouldPlayMessageSound = false; // สำหรับ Admin/Client

                requestsData.forEach(newReq => {
                    const oldReq = requestsRef.current.find(r => r.id === newReq.id);
                    const isNewRequest = !oldReq && user.role === 'admin';
                    const hasNewMessage = oldReq && (newReq.messages?.length || 0) > (oldReq.messages?.length || 0);

                    if (isNewRequest) {
                        shouldPlayRequestSound = true;
                        return; // ออกจาก forEach เพื่อให้เล่นแค่เสียง New Request
                    }
                    
                    if (hasNewMessage) {
                        const lastMessage = newReq.messages[newReq.messages.length - 1];
                        
                        // 1. Logic สำหรับ Admin: มีข้อความใหม่จาก Client
                        if (user.role === 'admin' && newReq.requesterUsername !== lastMessage.sender) {
                             shouldPlayMessageSound = true;
                             return;
                        }
                        
                        // 2. Logic สำหรับ Client: มีข้อความใหม่จาก Admin
                        if (user.role !== 'admin' && newReq.requesterUsername === user.username && lastMessage.sender === 'fezeaix') {
                            shouldPlayMessageSound = true;
                            return;
                        }
                    }
                });
                
                // 🚨 เล่นเสียงตามลำดับความสำคัญ
                if (shouldPlayRequestSound) {
                     const audio = new Audio('/notification_request.mp3'); 
                     audio.play().catch(e => console.log("New Request Audio playback blocked", e));
                } else if (shouldPlayMessageSound) {
                    const audio = new Audio('/notification.mp3'); 
                     audio.play().catch(e => console.log("New Message Audio playback blocked", e));
                }
            }
            
            requestsRef.current = requestsData;
            setCommissionRequests(requestsData);

        }, (error) => {
            console.error("Error fetching commissions:", error);
        });

        return () => unsubscribe();
    }, [user]); 
    
    // ... (ส่วน register, login, logout, changePassword, deleteCommissionRequest, updateCommissionStatus เหมือนเดิม)

    // 🚨 ฟังก์ชันใหม่: อัปเดตสถานะการดูข้อความของ Client 🚨
    const setClientMessagesViewed = async (requestId, lastMessageTimestamp) => {
         if (!user || user.role === 'admin') return;

         try {
             const requestDocRef = doc(db, "commissions", requestId);
             await updateDoc(requestDocRef, {
                 [`lastViewedByClient.${user.username}`]: lastMessageTimestamp
             });
         } catch (error) {
             console.error("Error setting client viewed timestamp:", error);
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
        deleteMessageFromCommissionRequest, 
        updateCommissionStatus,
        changePassword, 
        setClientMessagesViewed, // 🚨 Export ฟังก์ชันใหม่
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
export default AuthProvider;