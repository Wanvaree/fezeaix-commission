// src/pages/dashboard/InboxPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaPaperPlane, FaUserCircle } from 'react-icons/fa';

// Component ย่อยสำหรับหน้าต่างแชท (Admin Side)
function CommissionChat({ request, currentUser, addMessage, deleteMessage }) { 
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
    
    // ฟังก์ชันลบข้อความ
    const handleDeleteMessage = (messageId) => {
        if (window.confirm('Are you sure you want to delete this message? It will be removed for both the client and the artist.')) {
            deleteMessage(request.id, messageId);
        }
    };


    // ใช้ custom-scroll ที่กำหนดใน index.css
    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-md">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                <FaUserCircle size={24} className="mr-3 text-blue-500" />
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Chat with: {request.requesterUsername}</h3>
                    <p className="text-sm text-gray-500">Commission: {request.commissionType} | Price: ${request.price}</p>
                </div>
            </div>
            
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                {request.messages && request.messages.map((msg) => {
                    const isCurrentUser = msg.sender === currentUser.username;
                    const isSystem = msg.sender === 'System';
                    
                    if (isSystem) {
                         // 🚨 แก้ไข: เพิ่ม div ครอบเพื่อให้จัดกึ่งกลางและจำกัดความกว้าง
                         return (
                            <div key={msg.id} className="flex justify-center w-full"> 
                                <div className="text-center text-xs text-gray-400 italic max-w-lg p-2 rounded-lg bg-gray-50 border border-gray-200">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {msg.text}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div 
                            key={msg.id} 
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* 🚨 โค้ดที่แก้ไข: div ครอบปุ่มลบและ Bubble ข้อความ */}
                            <div className={`flex items-end max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                
                                {/* 1. ปุ่มลบ (แสดงเฉพาะเมื่อเป็นข้อความของ Admin/CurrentUser) */}
                                {isCurrentUser && (
                                    <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="mb-1 p-1 text-red-400 hover:text-red-600 transition-colors flex-shrink-0" 
                                        title="Delete Message"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                )}
                                
                                {/* 2. Bubble ข้อความ */}
                                <div className={`px-4 py-2 rounded-xl shadow-md ${
                                    isCurrentUser 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
                                }`}>
                                    <p className="font-semibold text-xs mb-1 opacity-80">
                                        {isCurrentUser ? 'Me (Artist)' : msg.sender}
                                    </p>
                                    <p className="text-sm break-words">{msg.text}</p>
                                    <span className={`block text-right mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} text-xs`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} /> {/* สำหรับ auto scroll */}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message to the client..."
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={!request.id} 
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors duration-200 disabled:bg-gray-400"
                        disabled={!messageInput.trim()}
                    >
                        <FaPaperPlane size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}


function InboxPage() {
    // 🚨 แก้ไข: เพิ่ม deleteMessageFromCommissionRequest
    const { commissionRequests, deleteCommissionRequest, user, addMessageToCommissionRequest, deleteMessageFromCommissionRequest } = useAuth();
    
    // เรียงลำดับ Requests ก่อนเพื่อเลือกอันล่าสุด
    const sortedRequests = commissionRequests.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // ตั้งค่า selectedRequest ให้เป็น Request ล่าสุด (ถ้ามี)
    const [selectedRequest, setSelectedRequest] = useState(sortedRequests.length > 0 ? sortedRequests[0] : null); 

    // อัพเดท selectedRequest เมื่อ commissionRequests ถูกอัพเดท
    useEffect(() => {
        const latestRequest = commissionRequests.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (selectedRequest) {
            const updatedRequest = commissionRequests.find(req => req.id === selectedRequest.id);
            setSelectedRequest(updatedRequest || null);
        } else if (latestRequest) {
            // แก้ไข: ตรวจสอบและเลือกอันล่าสุดเมื่อไม่มีการเลือก
             setSelectedRequest(latestRequest);
        }
    }, [commissionRequests, user]);


    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this commission request? This action is permanent.')) {
            deleteCommissionRequest(id);
            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest(null); 
            }
        }
    };
    
    // 🚨 แก้ไข: เปลี่ยน handleAddMessage ให้เป็น async/await
    const handleAddMessage = async (requestId, senderUsername, messageText) => {
        await addMessageToCommissionRequest(requestId, senderUsername, messageText);
    };

    // 🚨 ฟังก์ชันสำหรับลบข้อความ
    const handleDeleteMessage = async (requestId, messageId) => {
        await deleteMessageFromCommissionRequest(requestId, messageId);
    };


    return (
        <div className="p-6 h-full bg-white rounded-xl shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Commission Inbox</h2>
            <p className="text-gray-600 mb-6">Here you can manage incoming commission requests and communicate directly with the clients.</p>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {/* Panel ซ้าย: รายการ Commission Request */}
                <div className="overflow-y-auto custom-scroll md:col-span-1">
                    {commissionRequests.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No new commission requests in your inbox.</p>
                    ) : (
                        <div className="space-y-3">
                            {sortedRequests
                                .map((request) => { // ใช้ sortedRequests
                                const isSelected = selectedRequest && selectedRequest.id === request.id;
                                // แก้ไข: เพิ่มการตรวจสอบว่า messages มีอยู่จริง
                                const lastMessage = 
                                    request.messages && request.messages.length > 0
                                        ? request.messages[request.messages.length - 1] 
                                        : null;

                                return (
                                    <div 
                                        key={request.id} 
                                        onClick={() => setSelectedRequest(request)}
                                        className={`p-4 rounded-lg shadow-sm border transition-all duration-200 cursor-pointer ${
                                            isSelected ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        } flex items-center justify-between`}
                                    >
                                        <div className="flex-1 mr-4">
                                            <p className="font-semibold text-gray-800 text-lg">
                                                <span className="text-blue-600">{request.requesterUsername}</span> requested <span className="text-purple-600">{request.commissionType}</span>
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                Price: <span className="font-medium">${request.price}</span> | Status: <span className="font-medium text-green-700">{request.status}</span>
                                            </p>
                                            {lastMessage && (
                                                <p className="text-gray-500 text-xs mt-1 truncate">
                                                    <span className="font-medium">{lastMessage.sender === user.username ? 'You' : lastMessage.sender}:</span> {lastMessage.text}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(request.id); }}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors duration-200 flex-shrink-0"
                                            title="Delete Request"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Panel ขวา: หน้าต่างแชท (แสดงเฉพาะเมื่อมีการเลือก Request) */}
                {selectedRequest ? (
                    <div className="md:col-span-2 h-full min-h-[400px] md:min-h-0">
                        <CommissionChat 
                            request={selectedRequest} 
                            currentUser={user}
                            addMessage={handleAddMessage}
                            deleteMessage={handleDeleteMessage} // 🚨 ส่งฟังก์ชันลบข้อความ
                        />
                    </div>
                ) : (
                    <div className="md:col-span-2 flex items-center justify-center text-gray-500 text-lg">
                        Select a commission request to start chatting.
                    </div>
                )}
            </div>
        </div>
    );
}
export default InboxPage;