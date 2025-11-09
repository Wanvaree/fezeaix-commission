// src/pages/dashboard/MessagesPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaPaperPlane, FaPaintBrush } from 'react-icons/fa';

// Component ย่อยสำหรับหน้าต่างแชท (Client Side)
function ClientCommissionChat({ request, currentUser, addMessage }) {
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef(null);

    // Scroll ไปด้านล่างเมื่อข้อความมีการเปลี่ยนแปลง
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [request.messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (messageInput.trim()) {
            await addMessage(request.id, currentUser.username, messageInput.trim());
            setMessageInput('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-md">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                <FaPaintBrush size={24} className="mr-3 text-purple-500" />
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Chat for: {request.commissionType}</h3>
                    <p className="text-sm text-gray-500">Artist: Fezeaix | Status: {request.status}</p>
                </div>
            </div>
            
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                {/* แก้ไข: ตรวจสอบว่ามี messages ก่อน map */}
                {request.messages && request.messages.map((msg) => {
                    const isCurrentUser = msg.sender === currentUser.username;
                    const isSystem = msg.sender === 'System';
                    
                    if (isSystem) {
                         return (
                            <div key={msg.id} className="text-center text-xs text-gray-400 italic">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {msg.text}
                            </div>
                        );
                    }

                    return (
                        <div 
                            key={msg.id} 
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] px-4 py-2 rounded-xl shadow-md ${
                                isCurrentUser 
                                ? 'bg-purple-600 text-white rounded-br-none' 
                                : 'bg-gray-200 text-gray-800 rounded-tl-none'
                            }`}>
                                <p className="font-semibold text-xs mb-1 opacity-80">
                                    {isCurrentUser ? 'Me' : msg.sender}
                                </p>
                                <p className="text-sm break-words">{msg.text}</p>
                                <span className={`block text-right mt-1 ${isCurrentUser ? 'text-purple-100' : 'text-gray-500'} text-xs`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message to the artist..."
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                    <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-colors duration-200 disabled:bg-gray-400"
                        disabled={!messageInput.trim()}
                    >
                        <FaPaperPlane size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}

function MessagesPage() {
    const { commissionRequests, user, addMessageToCommissionRequest, setClientMessagesViewed } = useAuth();
    // กรองเฉพาะ Commission Request ของผู้ใช้งานปัจจุบัน
    const userRequests = commissionRequests.filter(req => req.requesterUsername === user?.username);
    const [selectedRequest, setSelectedRequest] = useState(userRequests.length > 0 ? userRequests[0] : null);

    // อัพเดท selectedRequest เมื่อ commissionRequests ถูกอัพเดท
    useEffect(() => {
        const sortedUserRequests = commissionRequests
            .filter(req => req.requesterUsername === user?.username)
            .slice()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
        if (selectedRequest) {
            const updatedRequest = commissionRequests.find(req => req.id === selectedRequest.id);
            setSelectedRequest(updatedRequest || null);
        } else if (sortedUserRequests.length > 0) {
            // เลือกอันล่าสุดเมื่อไม่มีการเลือก
            setSelectedRequest(sortedUserRequests[0]);
        }
    }, [commissionRequests, user?.username, selectedRequest]); 
    
    // 🚨 Logic การเคลียร์แจ้งเตือนของ Client
    useEffect(() => {
        if (selectedRequest && selectedRequest.messages && selectedRequest.messages.length > 0) {
            const lastMessage = selectedRequest.messages[selectedRequest.messages.length - 1];
            // เคลียร์เฉพาะเมื่อข้อความล่าสุดมาจาก Admin
            if (lastMessage.sender === 'fezeaix') {
                // ส่ง Timestamp ของข้อความล่าสุดไปบันทึกว่า "Client ดูถึงเวลานี้แล้ว"
                setClientMessagesViewed(selectedRequest.id, lastMessage.timestamp);
            }
        }
    }, [selectedRequest, setClientMessagesViewed]);


    // 🚨 แก้ไข: เปลี่ยน handleAddMessage ให้เป็น async/await
    const handleAddMessage = async (requestId, senderUsername, messageText) => {
        await addMessageToCommissionRequest(requestId, senderUsername, messageText);
    };

    const sortedUserRequests = userRequests.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (userRequests.length === 0) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">My Commission Messages</h2>
                <p className="text-gray-500 text-center py-8">You have no active commission requests yet. Please visit the Commission page to start one.</p>
            </div>
        );
    }
    
    // 🚨 Logic สำหรับแสดงวงกลมแดงในรายการ Request Panel
    const hasUnreadMessage = (request) => {
        if (!request.messages || request.messages.length === 0) return false;
        
        const lastMessage = request.messages[request.messages.length - 1];
        if (lastMessage.sender !== 'fezeaix') return false; // ไม่ใช่ข้อความจาก Admin
        
        const lastViewedTimestamp = request.lastViewedByClient?.[user.username] || new Date(0).toISOString();
        
        return new Date(lastMessage.timestamp).getTime() > new Date(lastViewedTimestamp).getTime();
    };

    return (
        <div className="p-6 h-full bg-white rounded-xl shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">My Commission Messages</h2>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {/* Panel ซ้าย: รายการ Commission Request */}
                <div className="overflow-y-auto custom-scroll md:col-span-1">
                    <div className="space-y-3">
                        {sortedUserRequests.map((request) => {
                            const isSelected = selectedRequest && selectedRequest.id === request.id;
                            const unread = hasUnreadMessage(request); // ตรวจสอบสถานะยังไม่อ่าน
                            const lastMessage = 
                                request.messages && request.messages.length > 0
                                    ? request.messages[request.messages.length - 1] 
                                    : null;

                            return (
                                <div 
                                    key={request.id} 
                                    onClick={() => setSelectedRequest(request)}
                                    className={`p-4 rounded-lg shadow-sm border transition-all duration-200 cursor-pointer ${
                                        isSelected ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    } flex flex-col relative`} // 🚨 เพิ่ม relative
                                >
                                    <p className="font-semibold text-gray-800 text-lg">
                                        Request: <span className="text-purple-600">{request.commissionType}</span>
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        Status: <span className="font-medium text-green-700">{request.status}</span>
                                    </p>
                                    {lastMessage && (
                                        <p className="text-gray-500 text-xs mt-1 truncate">
                                            <span className="font-medium">{lastMessage.sender === user.username ? 'You' : lastMessage.sender}:</span> {lastMessage.text}
                                        </p>
                                    )}
                                    {/* 🚨 วงกลมแดงสำหรับ Unread Message ในรายการ */}
                                    {unread && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-3 h-3 flex items-center justify-center rounded-full" title="New Message">
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Panel ขวา: หน้าต่างแชท */}
                {selectedRequest ? (
                    <div className="md:col-span-2 h-full min-h-[400px]">
                        <ClientCommissionChat 
                            request={selectedRequest} 
                            currentUser={user}
                            addMessage={handleAddMessage}
                        />
                    </div>
                ) : (
                    <div className="md:col-span-2 flex items-center justify-center text-gray-500 text-lg">
                        Select a commission request to view the chat.
                    </div>
                )}
            </div>
        </div>
    );
}
export default MessagesPage;