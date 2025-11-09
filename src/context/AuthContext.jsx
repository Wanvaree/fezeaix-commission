// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as bcrypt from 'bcryptjs'; // 🚨 IMPORT BCYPTJS
// 🚨 Import Firestore Functions และ db
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
            // 🚨 แก้ไข: เมื่อดึงจาก Local Storage, ไม่เก็บ password หรือ hash
            const parsedUser = JSON.parse(storedUser);
            // 🚨 ไม่เก็บ password หรือ hash ใน Local Storage เพื่อความปลอดภัย
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

        // Cleanup function
        return () => unsubscribe();
    }, []);

    // -----------------------------------------------------------
    // 3. useEffect สำหรับ Fetch/Listen Commission Requests (Realtime) & Notification Sound
    // -----------------------------------------------------------
    useEffect(() => {
        const unsubscribe = onSnapshot(commissionsCollectionRef, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            
            // 🚨🚨 Logic การแจ้งเตือน (ปรับปรุงการใช้เสียง) 🚨🚨
            if (user && user.role === 'admin' && requestsRef.current.length > 0 && requestsData.length > 0) {
                
                let shouldPlayRequestSound = false;
                let shouldPlayMessageSound = false;

                // 1. ตรวจสอบ New Request ใหม่ (ID ใหม่)
                const newRequests = requestsData.filter(
                    newReq => !requestsRef.current.some(oldReq => oldReq.id === newReq.id)
                );
                
                if (newRequests.length > 0) {
                    shouldPlayRequestSound = true;
                }

                // 2. ตรวจสอบข้อความใหม่ใน Request เดิม
                requestsData.forEach(newReq => {
                    const oldReq = requestsRef.current.find(r => r.id === newReq.id);
                    // ถ้าจำนวนข้อความเพิ่มขึ้น
                    if (oldReq && (newReq.messages?.length || 0) > (oldReq.messages?.length || 0)) {
                         const lastMessage = newReq.messages[newReq.messages.length - 1];
                         // 🚨 เล่นเสียงถ้าข้อความใหม่มาจาก Client (ไม่ใช่ System หรือ Admin เอง)
                         if (lastMessage.sender !== 'System' && lastMessage.sender !== user.username) {
                             shouldPlayMessageSound = true;
                         }
                    }
                });
                
                // 🚨 เล่นเสียงตามลำดับความสำคัญ
                if (shouldPlayRequestSound) {
                     // ใช้เสียง New Request
                     const audio = new Audio('/notification_request.mp3'); 
                     audio.play().catch(e => console.log("New Request Audio playback blocked", e));
                } else if (shouldPlayMessageSound) {
                    // ใช้เสียง New Message
                     const audio = new Audio('/notification.mp3'); 
                     audio.play().catch(e => console.log("New Message Audio playback blocked", e));
                }
            }
            
            requestsRef.current = requestsData; // 🚨 อัปเดต Ref
            setCommissionRequests(requestsData);

        }, (error) => {
            console.error("Error fetching commissions:", error);
        });

        // Cleanup function
        return () => unsubscribe();
    // 🚨 user ถูกเพิ่มเป็น Dependency
    }, [user]); 

    // -----------------------------------------------------------
    // 4. Auth Logic (ใช้ Firestore และ Hashing)
    // -----------------------------------------------------------

    const register = async (username, password) => {
        try {
            const userExists = allRegisteredUsers.some(u => u.username === username);
            if (userExists) {
                return { success: false, message: 'Username already exists.' };
            }

            // 🚨🚨 HASH PASSWORD 🚨🚨
            const hashedPassword = await bcrypt.hash(password, 10); 

            const newUser = {
                username,
                password: hashedPassword, // 🛡️ เก็บ Hash
                role: username.toLowerCase() === 'fezeaix' ? 'admin' : 'user'
            };

            // บันทึกผู้ใช้ใหม่ลงใน Firestore
            await setDoc(doc(db, "users", username), newUser); // ใช้ username เป็น Document ID

            return { success: true, message: 'Registration successful! Please login.' };
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, message: 'Registration failed due to server error.' };
        }
    };

    const login = async (username, password) => {
        try {
            const foundUser = allRegisteredUsers.find(u => u.username === username);

            if (foundUser) {
                 // 🚨🚨 เปรียบเทียบรหัสผ่านกับ Hash 🚨🚨
                const isMatch = await bcrypt.compare(password, foundUser.password);
                
                if (isMatch) {
                    // 🚨 เก็บเฉพาะข้อมูลที่จำเป็น (ไม่รวม Hash) ใน Local Storage
                    const { password: _, ...userSessionData } = foundUser;
                    setUser(userSessionData);
                    localStorage.setItem('currentUser', JSON.stringify(userSessionData)); 
                    return { success: true, message: 'Login successful!' };
                }
            } 
            
            return { success: false, message: 'Invalid username or password.' };
            
        } catch (error) {
             console.error("Login error:", error);
             return { success: false, message: 'Login failed due to server error.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };
    
    const changePassword = async (currentPassword, newPassword) => {
        if (!user) {
            return { success: false, message: 'User not logged in.' };
        }
        
        try {
             // 1. ดึงข้อมูลผู้ใช้จาก list ที่มี Hash
            const fullUser = allRegisteredUsers.find(u => u.username === user.username);
            if (!fullUser) {
                return { success: false, message: 'User data not found.' };
            }
            
            // 2. 🚨🚨 ตรวจสอบรหัสผ่านปัจจุบันกับ Hash 🚨🚨
            const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, fullUser.password);
            
            if (!isCurrentPasswordCorrect) {
                return { success: false, message: 'Current password is incorrect.' };
            }

            // 3. 🚨🚨 Hash รหัสผ่านใหม่ 🚨🚨
            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            
            const userDocRef = doc(db, "users", user.username);
            
            // 4. อัปเดต Password Hash ใน Firestore
            await updateDoc(userDocRef, {
                password: newHashedPassword
            });

            // 5. อัปเดตใน currentUser state และ Local Storage (ไม่ต้องเก็บ password)
            const updatedUser = { ...user, password: newHashedPassword };
            
            // 🚨 เก็บเฉพาะ session data
            const { password: _, ...userSessionData } = updatedUser;
            setUser(userSessionData);
            localStorage.setItem('currentUser', JSON.stringify(userSessionData));
            
            return { success: true, message: 'Password updated successfully!' };
        } catch (error) {
             console.error("Change password error:", error);
             return { success: false, message: 'Failed to change password.' };
        }
    };
    
    // -----------------------------------------------------------
    // 5. Commission & Message Logic (ใช้ Firestore)
    // -----------------------------------------------------------

    const addCommissionRequest = async (requestDetails) => {
        try {
            const newRequest = {
                id: Date.now().toString(), 
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

            await setDoc(doc(commissionsCollectionRef), newRequest); 
            
            return { success: true, message: 'Commission request submitted successfully! Please check your Messages for updates from the artist.' };
        } catch (error) {
            console.error("Add commission error:", error);
            return { success: false, message: 'Failed to submit commission request.' };
        }
    };

    const deleteCommissionRequest = async (requestId) => {
         try {
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

            // 🚨 แก้ไข: เปลี่ยนสถานะเริ่มต้นของ Discussion ให้เป็น 'Pending Payment'
            const newStatus = currentRequest.status === 'New Request' ? 'Pending Payment' : currentRequest.status;
            
            await updateDoc(requestDocRef, {
                messages: [...(currentRequest.messages || []), newMessage], 
                status: newStatus 
            });

            return { success: true };

        } catch (error) {
            console.error("Add message error:", error);
            return { success: false };
        }
    };
    
    const deleteMessageFromCommissionRequest = async (requestId, messageId) => {
        try {
            const requestDocRef = doc(db, "commissions", requestId);
            const currentRequest = commissionRequests.find(req => req.id === requestId);

            if (!currentRequest) return { success: false, message: "Request not found." };

            const updatedMessages = currentRequest.messages.filter(msg => msg.id !== messageId);

            await updateDoc(requestDocRef, {
                messages: updatedMessages,
            });

            return { success: true };

        } catch (error) {
            console.error("Delete message error:", error);
            return { success: false, message: 'Failed to delete message.' };
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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;