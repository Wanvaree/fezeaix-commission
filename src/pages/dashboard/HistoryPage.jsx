// src/pages/dashboard/HistoryPage.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaRedoAlt } from 'react-icons/fa';

// สถานะที่เป็นไปได้สำหรับงาน (ใช้ร่วมกับ QueuePage)
const getStatusClasses = (status) => {
    switch (status) {
        case 'New Request': return 'bg-red-100 text-red-800 border-red-300';
        case 'In Discussion': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'Pending Payment': return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'Sketch Sent': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
        case 'Revisions': return 'bg-purple-100 text-purple-800 border-purple-300';
        case 'Completed': return 'bg-green-100 text-green-800 border-green-300';
        case 'On Hold': return 'bg-gray-100 text-gray-800 border-gray-300';
        case 'Canceled': return 'bg-gray-200 text-gray-500 border-gray-400';
        default: return 'bg-gray-50 text-gray-700 border-gray-300';
    }
};

function HistoryPage() {
    const { user, commissionRequests } = useAuth();
    const navigate = useNavigate();

    // กรองเฉพาะ Request ของผู้ใช้ปัจจุบัน
    const userHistory = commissionRequests
        .filter(req => req.requesterUsername === user?.username)
        // เรียงลำดับจากล่าสุดไปเก่าสุด
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
    // เตรียมข้อมูลสำหรับ Start Request ซ้ำ (เป็นตัวอย่างเท่านั้น)
    const handleReRequest = (commissionType) => {
        alert(`Requesting: ${commissionType}. Please go to the Commission page to re-submit with new details.`);
        navigate('/dashboard/commission'); 
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg min-h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <FaHistory className="mr-3 text-gray-500" /> My Commission History
            </h2>
            <p className="text-gray-600 mb-6">ขอบคุณที่ไว้ใจอุดหนุนค่ะ ไว้กลับมาจ้างอีกนะคะ💖!</p>
            
            {userHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ขณะนี้ยังไม่มีประวัติการสั่งซื้อค่ะ😢</p>
            ) : (
                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Requested On
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Commission Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Re-Request
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {userHistory.map((request, index) => (
                                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {userHistory.length - index} {/* นับย้อนกลับเพื่อให้ล่าสุดเป็น #1 */}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(request.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {request.commissionType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                        ${request.price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusClasses(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <button 
                                            onClick={() => handleReRequest(request.commissionType)}
                                            className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center mx-auto space-x-1 text-xs font-semibold"
                                            title="Use this request as a new template"
                                        >
                                            <FaRedoAlt size={12} />
                                            <span>Re-Request</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default HistoryPage;