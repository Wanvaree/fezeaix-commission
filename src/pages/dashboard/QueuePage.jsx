// src/pages/dashboard/QueuePage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaEdit, FaTrash, FaCheckCircle, FaSpinner } from 'react-icons/fa'; 

// 🚨 แก้ไข: เรียงลำดับสถานะตามความต้องการ
const STATUS_OPTIONS = [
    'New Request',
    'Pending Payment',
    'In Progress',
    'Sketch Sent',
    'Completed',
    'Canceled',
    'On Hold',
    // 'In Discussion' ถูกลบออกตามคำขอ
    // 'Revisions' ถูกลบออกตามคำขอ
];

// ฟังก์ชันสำหรับกำหนดสีตามสถานะ (คงเดิม)
const getStatusClasses = (status) => {
    switch (status) {
        case 'New Request': return 'bg-red-100 text-red-800 border-red-300';
        // ... (โค้ดสีอื่นๆ คงเดิม)
        case 'Pending Payment': return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'Sketch Sent': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
        case 'Completed': return 'bg-green-100 text-green-800 border-green-300';
        case 'On Hold': return 'bg-gray-100 text-gray-800 border-gray-300';
        case 'Canceled': return 'bg-gray-200 text-gray-500 border-gray-400';
        default: return 'bg-gray-50 text-gray-700 border-gray-300';
    }
};

// Component สำหรับ Admin ในการแก้ไขสถานะ (ปรับปรุงให้แสดงปุ่มแยก)
function AdminEditStatus({ request, updateStatus, deleteRequest }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState(request.status);

    const handleUpdate = async () => {
        setIsUpdating(true);
        await updateStatus(request.id, newStatus); 
        setIsUpdating(false);
        setIsEditing(false);
    };
    
    // 🚨 ย้ายปุ่ม Edit/Delete ไปอยู่ใน Component แยกต่างหาก
    if (isUpdating) { 
        return (
            <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin text-blue-500" size={16} title="Updating..." />
            </div>
        );
    }
    
    if (isEditing) {
        return (
            <div className="flex items-center space-x-2">
                <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className={`p-1 text-sm border rounded ${getStatusClasses(newStatus)} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                    {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <button 
                    onClick={handleUpdate} 
                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                    title="Save Status"
                >
                    <FaCheckCircle size={14} />
                </button>
                <button 
                    onClick={() => setIsEditing(false)} 
                    className="p-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                    title="Cancel"
                >
                    &times;
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex items-center justify-center space-x-2">
            <button 
                onClick={() => setIsEditing(true)} 
                className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                title="Edit Status"
            >
                <FaEdit size={14} />
            </button>
            <button 
                onClick={deleteRequest} // ใช้ deleteRequest ที่ส่งมาเป็น prop
                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                title="Delete Request"
            >
                <FaTrash size={14} />
            </button>
        </div>
    );
}


function QueuePage() {
    const { commissionRequests, isAdmin, updateCommissionStatus, deleteCommissionRequest } = useAuth();
    
    // เรียงลำดับงานตามวันที่ (ใหม่สุดมาก่อน)
    const sortedRequests = commissionRequests.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 🚨 ฟังก์ชันสำหรับ Admin เพื่อ Delete
    const handleDeleteRequest = (requestId, requesterUsername) => {
        if (window.confirm(`Are you sure you want to permanently delete the commission from ${requesterUsername}?`)) {
            deleteCommissionRequest(requestId);
        }
    };


    return (
        <div className="p-6 bg-white rounded-xl shadow-lg min-h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Commission Queue</h2>
            <p className="text-gray-600 mb-6">
                {isAdmin ? 
                    null /* 🚨 FIX: ลบข้อความ Admin */ :
                    "สามรถเช็คคิว เช็คสถานะคิวของคุณได้ที่หน้านี้เลยค่ะ จะคอยอัพเดทให้อย่างสม่ำเสมอค่ะ💕"
                }
            </p>
            
            {sortedRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">คิวคอมมิชชันขณะนี้ยังว่างอยู่ค่ะ</p>
            ) : (
                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Requester
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Commission Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                {/* 🚨 Header Status (คงเดิม) */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> 
                                    Status
                                </th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedRequests.map((request, index) => (
                                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {request.requesterUsername}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {request.commissionType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                        ${request.price}
                                    </td>
                                    {/* 🚨 คอลัมน์ Status */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {/* 🚨 ถ้าไม่ใช่ Admin ให้แสดงแค่ Badge Status */}
                                        {!isAdmin && (
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusClasses(request.status)}`}>
                                                {request.status}
                                            </span>
                                        )}
                                        {/* 🚨 ถ้าเป็น Admin และอยู่ในโหมดแก้ไข ให้แสดง Select Box */}
                                        {isAdmin && request.status !== 'Editing' && ( // เพิ่มเงื่อนไขป้องกันการแสดงซ้ำซ้อน
                                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusClasses(request.status)}`}>
                                                {request.status}
                                            </span>
                                        )}
                                    </td>

                                    {/* 🚨 คอลัมน์ Actions */}
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <AdminEditStatus 
                                                request={request}
                                                updateStatus={updateCommissionStatus}
                                                // 🚨 ใช้ฟังก์ชัน handleDeleteRequest ที่รวมเอา confirm/delete ไว้แล้ว
                                                deleteRequest={() => handleDeleteRequest(request.id, request.requesterUsername)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default QueuePage;