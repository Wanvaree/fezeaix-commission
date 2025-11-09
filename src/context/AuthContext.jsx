// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as bcrypt from 'bcryptjs'; // 🚨 IMPORT BCYPTJS สำหรับ Hashing
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
                        return;
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

    // -----------------------------------------------------------
    // 4. Auth Logic (ใช้ Firestore และ Hashing)
    // -----------------------------------------------------------

    const register = async (username, password) => {
        try {
            const userExists = allRegisteredUsers.some(u => u.username === username);
            if (userExists) {
                return { success: false, message: 'Username already exists.' };
            }

            // 🚨 HASH PASSWORD (สำหรับผู้ใช้ใหม่) 🚨
            const hashedPassword = await bcrypt.hash(password, 10); 

            const newUser = {
                username,
                password: hashedPassword, // 🛡️ เก็บ Hash
                role: username.toLowerCase() === 'fezeaix' ? 'admin' : 'user'
            };

            await setDoc(doc(db, "users", username), newUser); 

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
                 const storedPassword = foundUser.password;
                 let isMatch = false;
                 let upgradedToHash = false; // Flag เพื่อตรวจสอบว่ามีการอัปเกรดหรือไม่

                 // 🚨🚨 Logic ใหม่: ตรวจสอบ Plain Text/Hash 🚨🚨
                 const isHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$') || storedPassword.length > 50;

                 if (isHashed) { 
                     // กรณีที่ 1: รหัสผ่านเป็น Hash (ผู้ใช้ใหม่/ที่เปลี่ยนรหัสผ่านแล้ว)
                     try {
                         isMatch = await bcrypt.compare(password, storedPassword);
                     } catch (e) {
                         // หาก bcrypt compare ล้มเหลว (เช่น storedPassword ไม่ใช่ Hash ที่ถูกต้อง) 
                         // ให้ลองเปรียบเทียบแบบ Plain Text ต่อไป
                         console.warn("Bcrypt compare failed, trying plain text match.", e);
                     }
                 }
                 
                 // ถ้ายังไม่ Match หรือไม่ใช่ Hash ที่ถูกต้อง ให้ลอง Plain Text
                 if (!isMatch) {
                     // กรณีที่ 2: รหัสผ่านเป็น Plain Text (ผู้ใช้เก่า)
                     if (password === storedPassword) {
                         isMatch = true;
                         upgradedToHash = true;
                     }
                 }


                if (isMatch) {
                    // หาก Login สำเร็จด้วย Plain Text Password
                    if (upgradedToHash) {
                         console.warn(`User ${username} logged in with plain text password. Upgrading to hash...`);
                         // 🚨 ทำการ Hash และ Update ทันทีเพื่อย้ายไปใช้ Hash
                         const newHashedPassword = await bcrypt.hash(password, 10);
                         const userDocRef = doc(db, "users", username);
                         await updateDoc(userDocRef, { password: newHashedPassword });
                         // อัปเดต user object ใน state ด้วย hash ใหม่เพื่อให้ Logic อื่นๆ (เช่น changePassword) ทำงานถูกต้อง
                         foundUser.password = newHashedPassword; 
                    }
                    
                    const { password: _, ...userSessionData } = foundUser;
                    setUser(userSessionData);
                    localStorage.setItem('currentUser', JSON.stringify(userSessionData)); 
                    return { success: true, message: 'Login successful!' };
                }
            } 
            
            return { success: false, message: 'Invalid username or password.' };
            
        } catch (error) {
             console.error("Login error:", error);
             return { success: false, message: 'Login failed due to server error. (This might be due to an unexpected non-string/null password field in DB)' };
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
            const fullUser = allRegisteredUsers.find(u => u.username === user.username);
            if (!fullUser) {
                return { success: false, message: 'User data not found.' };
            }
            
            const storedPassword = fullUser.password;
            let isCurrentPasswordCorrect = false;

            // 🚨🚨 FIX: ตรวจสอบรหัสผ่านปัจจุบัน รองรับทั้ง Plain Text และ Hash 🚨🚨
            const isHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$') || storedPassword.length > 50;
            
            if (isHashed) {
                // กรณี Hash
                isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, storedPassword);
            } else {
                // กรณี Plain Text
                isCurrentPasswordCorrect = currentPassword === storedPassword;
            }
            
            if (!isCurrentPasswordCorrect) {
                return { success: false, message: 'Current password is incorrect.' };
            }

            // 🚨 HASH รหัสผ่านใหม่ (ไม่ว่าจะเก่าเป็น Plain Text หรือ Hash) 🚨
            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            
            const userDocRef = doc(db, "users", user.username);
            
            await updateDoc(userDocRef, {
                password: newHashedPassword
            });

            // อัปเดต state/Local Storage ด้วยข้อมูลที่ไม่มีรหัสผ่าน
            const updatedUser = { ...user, password: newHashedPassword }; 
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

            // 🚨 แก้ไขบั๊ก: เปลี่ยนสถานะเริ่มต้นของ Discussion ให้เป็น 'Pending Payment'
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