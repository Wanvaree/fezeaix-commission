// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as bcrypt from 'bcryptjs'; 
// 🚨🚨 FIX: Import getDocs และ writeBatch จาก firebaseConfig
import { 
    db, 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    updateDoc, 
    onSnapshot,
    deleteDoc,
    writeBatch 
} from '../firebaseConfig'; 

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Collections References
const usersCollectionRef = collection(db, "users");
const commissionsCollectionRef = collection(db, "commissions");

// 🚨 ฟังก์ชัน Global สำหรับขออนุญาตแจ้งเตือน 🚨
const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
            }
        });
    }
};

// 🚨 ฟังก์ชัน Global สำหรับแสดง Web Notification 🚨
const showWebNotification = (title, body) => {
    if (Notification.permission === "granted") {
        new Notification(title, { body: body, icon: '/pwa-192x192-v2.png' }); 
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commissionRequests, setCommissionRequests] = useState([]);
    const [allRegisteredUsers, setAllRegisteredUsers] = useState([]); 
    const requestsRef = useRef([]); 
    
    // -----------------------------------------------------------
    // 1. useEffect สำหรับ User State (Local Storage Session)
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
    // 2. useEffect สำหรับ Fetch/Listen ข้อมูลผู้ใช้ทั้งหมด
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
                
                let shouldPlayRequestSound = false; 
                let shouldPlayMessageSound = false; 
                let notificationTitle = '';
                let notificationBody = '';

                requestsData.forEach(newReq => {
                    const oldReq = requestsRef.current.find(r => r.id === newReq.id);
                    const isNewRequest = !oldReq; // New Request on DB
                    const hasNewMessage = oldReq && (newReq.messages?.length || 0) > (oldReq.messages?.length || 0);

                    // --- 1. New Request Logic (Admin Only) ---
                    if (isNewRequest && user.role === 'admin') {
                        shouldPlayRequestSound = true;
                        notificationTitle = 'New Commission Request!';
                        notificationBody = `${newReq.requesterUsername} requested ${newReq.commissionType}.`;
                        return; 
                    }
                    
                    // --- 2. New Message Logic (Admin & Client) ---
                    if (hasNewMessage) {
                        const lastMessage = newReq.messages[newReq.messages.length - 1];
                        
                        // 2a. Admin: มีข้อความใหม่จาก Client
                        if (user.role === 'admin' && newReq.requesterUsername !== lastMessage.sender) {
                             shouldPlayMessageSound = true;
                             notificationTitle = `New Message from ${newReq.requesterUsername}`;
                             notificationBody = `${newReq.commissionType}: ${lastMessage.text}`;
                             return;
                        }
                        
                        // 2b. Client: มีข้อความใหม่จาก Admin
                        if (user.role !== 'admin' && newReq.requesterUsername === user.username && lastMessage.sender === 'fezeaix') {
                            shouldPlayMessageSound = true;
                            notificationTitle = 'Message from Artist (Fezeaix)';
                            notificationBody = `${newReq.commissionType}: ${lastMessage.text}`;
                            return;
                        }
                    }
                });
                
                // 🚨 เล่นเสียงและแสดง Web Notification
                if (shouldPlayRequestSound) {
                     const audio = new Audio('/notification_request.mp3'); 
                     audio.play().catch(e => console.log("New Request Audio playback blocked", e));
                     showWebNotification(notificationTitle, notificationBody);
                } else if (shouldPlayMessageSound) {
                    const audio = new Audio('/notification.mp3'); 
                     audio.play().catch(e => console.log("New Message Audio playback blocked", e));
                     showWebNotification(notificationTitle, notificationBody);
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
                 let upgradedToHash = false; 

                 // 🚨🚨 FIX: Logic ตรวจสอบ Plain Text/Hash 🚨🚨
                 const isHashed = storedPassword?.startsWith('$2a$') || storedPassword?.startsWith('$2b$') || storedPassword?.startsWith('$2y$') || (storedPassword?.length || 0) > 50;

                 if (isHashed) { 
                     try {
                         isMatch = await bcrypt.compare(password, storedPassword);
                     } catch (e) {
                         console.warn("Bcrypt compare failed, trying plain text match.", e);
                     }
                 }
                 
                 if (!isMatch) {
                     if (password === storedPassword) {
                         isMatch = true;
                         upgradedToHash = true;
                     }
                 }


                if (isMatch) {
                    if (upgradedToHash) {
                         console.warn(`User ${username} logged in with plain text password. Upgrading to hash...`);
                         const newHashedPassword = await bcrypt.hash(password, 10);
                         const userDocRef = doc(db, "users", username);
                         await updateDoc(userDocRef, { password: newHashedPassword });
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
            const fullUser = allRegisteredUsers.find(u => u.username === user.username);
            if (!fullUser) {
                return { success: false, message: 'User data not found.' };
            }
            
            const storedPassword = fullUser.password;
            let isCurrentPasswordCorrect = false;

            const isHashed = storedPassword?.startsWith('$2a$') || storedPassword?.startsWith('$2b$') || storedPassword?.startsWith('$2y$') || (storedPassword?.length || 0) > 50;
            
            if (isHashed) {
                isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, storedPassword);
            } else {
                isCurrentPasswordCorrect = currentPassword === storedPassword;
            }
            
            if (!isCurrentPasswordCorrect) {
                return { success: false, message: 'Current password is incorrect.' };
            }

            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            
            const userDocRef = doc(db, "users", user.username);
            
            await updateDoc(userDocRef, {
                password: newHashedPassword
            });

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
    
    // ... (Commission CRUDs)
    
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
    
    // 🚨 ฟังก์ชันใหม่: เคลียร์ข้อความทั้งหมดของ Client 🚨
    const clearClientNotifications = async () => {
         if (!user || user.role === 'admin') return { success: false, message: 'Not a client user.' };

         try {
            const commissionsSnapshot = await getDocs(commissionsCollectionRef);
            const batch = writeBatch(db); 
            const now = new Date().toISOString();
            
            commissionsSnapshot.docs.forEach(docSnapshot => {
                 const req = docSnapshot.data();
                 if (req.requesterUsername === user.username) {
                     const reqRef = doc(db, "commissions", docSnapshot.id);
                     batch.update(reqRef, {
                         [`lastViewedByClient.${user.username}`]: now
                     });
                 }
            });
            await batch.commit();
            return { success: true, message: 'Client notifications cleared.' };
         } catch (error) {
             console.error("Error clearing client notifications:", error);
             return { success: false, message: 'Failed to clear client notifications.' };
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
        setClientMessagesViewed, 
        requestNotificationPermission, 
        clearClientNotifications, 
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
export default AuthProvider;