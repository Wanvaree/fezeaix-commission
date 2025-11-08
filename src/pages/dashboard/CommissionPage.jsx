// src/pages/dashboard/CommissionPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaChevronLeft, FaChevronRight, FaHeart, FaTimes } from 'react-icons/fa'; // Import icons

// กำหนดข้อมูล Commission Types
const commissionTypes = [
    {
        id: 'basic-sketch',
        title: 'Basic Sketch',
        description: 'A simple black and white line art piece.',
        price: 20,
        buttonColor: 'blue',
        // ใช้ Array of Images สำหรับ Carousel
        images: [
            'https://via.placeholder.com/400x300/60A5FA/FFFFFF?text=Sketch+Example+1',
            'https://via.placeholder.com/400x300/60A5FA/FFFFFF?text=Sketch+Example+2',
            'https://via.placeholder.com/400x300/60A5FA/FFFFFF?text=Sketch+Example+3',
        ],
    },
    {
        id: 'full-color-bust',
        title: 'Full Color Bust',
        description: 'A detailed, fully colored character bust.',
        price: 80,
        buttonColor: 'purple',
        images: [
            'https://via.placeholder.com/400x300/A78BFA/FFFFFF?text=Full+Color+Example+1',
            'https://via.placeholder.com/400x300/A78BFA/FFFFFF?text=Full+Color+Example+2',
        ],
    },
    // คุณสามารถเพิ่ม Commission Type อื่นๆ ได้ที่นี่
];

// ข้อความ Terms of Service แบบยาว (คุณสามารถมาแก้ไขเองได้ภายหลัง)
const TERMS_OF_SERVICE = `
❎งานที่ไม่รับ
• คนแก่ เด็กทารก
• งานเร่ง
• หุ่นยนต์ / กันพลา
• สัตว์ เคโมะ

⌚️ระยะเวลาทำงาน
► 4-7วันต่อคิว หรืออาจจะนานกว่านั้นหากติดธุระจะแจ้งค่ะ🙏

//ช่องทางการโอน//
ทรูวอลเล็ต (+15)
ธ.กสิกร

//ช่องทางการส่งงาน//
gmail
google drive
ฯลฯ แจ้งได้ค่ะ

❕ข้อตกลงอ่านให้จบก่อนสั่งเท่านั้น❕
• 1 คิวสั่งได้ไม่เกิน 3 งาน
• มัดจำครึ่งนึงของงาน
• นับคิวจากลำดับโอนเงิน
• เริ่มงานหลังโอนมัดจำ กรณียกเลิกหลังเริ่มงานขออนุญาตสงวนสิทธิ์ไม่คืนค่ามัดจำทุกกรณีค่ะ
• เชิงพาณิชย์ x2.5
• ขอนำทุกงานเป็นตัวอย่างคอมมิชชั่นในครั้งถัดไป //หากไม่ได้กรุณาแจ้งนะคะ
• แก้ไขได้ตามต้องการถ้าหากทางนักวาดวาดผิด หากลูกค้าบรีพพลาดสั่งแก้ได้2รอบ เกินกว่านี้ขออนุญาติ+20ทุกการสั่งแก้ค่ะ
• บรีฟงานให้ชัดเจนรายละเอียด สีหน้า ท่าทาง เสื้อผ้า (หากreferenceให้เห็นภาพได้จะดีมากค่ะ)
**ต้องการตัวอย่างงานเพิ่มทักขอผ่านDMได้เสมอค่ะ**
`;

// Component Modal สำหรับ Start Request
function RequestModal({ commission, onClose, onSubmit, requesterUsername }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [submissionSuccess, setSubmissionSuccess] = useState('');

    const handleImageNav = (direction) => {
        const totalImages = commission.images.length;
        let newIndex = currentImageIndex + direction;
        if (newIndex < 0) newIndex = totalImages - 1;
        if (newIndex >= totalImages) newIndex = 0;
        setCurrentImageIndex(newIndex);
    };

    // 🚨 แก้ไข: เพิ่ม async
    const handleSubmit = async () => {
        if (!termsAccepted) {
            setSubmissionError('You must accept the Terms of Service to proceed.');
            return;
        }

        setIsSubmitting(true);
        setSubmissionError('');
        setSubmissionSuccess('');

        const requestDetails = {
            commissionType: commission.title,
            price: commission.price,
            requesterUsername: requesterUsername,
        };

        // 🚨 แก้ไข: เพิ่ม await เพื่อรอให้ Firebase บันทึกข้อมูลเสร็จ
        const result = await onSubmit(requestDetails); 

        setIsSubmitting(false);

        if (result.success) {
            setSubmissionSuccess(result.message); // 🚨 จะแสดงข้อความสำเร็จที่เป็นสีเขียว
            // ปิด Modal หลังจากส่งสำเร็จ 2 วินาที
            setTimeout(onClose, 2000);
        } else {
            // 🚨 จะแสดงข้อความ Error จาก Firebase (ถ้ามี)
            setSubmissionError(result.message || 'Failed to submit request.'); 
        }
    };

    // ใช้คลาส animate-scale-up ที่กำหนดใน index.css
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-scale-up"
                onClick={(e) => e.stopPropagation()} // ป้องกันการปิด Modal เมื่อคลิกใน Modal
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Request: {commission.title} (${commission.price})</h2>
                    <button
                        className="text-gray-400 hover:text-gray-700 transition-colors"
                        onClick={onClose}
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Content: Left (Image) and Right (Terms/Form) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                    {/* Left Side: Image Carousel */}
                    <div className="relative flex items-center justify-center bg-gray-100 p-4">
                        <img
                            src={commission.images[currentImageIndex]}
                            alt={`${commission.title} Example ${currentImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                        />
                        {/* Navigation Arrows */}
                        {commission.images.length > 1 && (
                            <>
                                <button
                                    onClick={() => handleImageNav(-1)}
                                    className="absolute left-4 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                                >
                                    <FaChevronLeft />
                                </button>
                                <button
                                    onClick={() => handleImageNav(1)}
                                    className="absolute right-4 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                                >
                                    <FaChevronRight />
                                </button>
                            </>
                        )}
                        {/* Image Index Indicator */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {commission.images.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white scale-125' : 'bg-gray-400'}`}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Description and Terms */}
                    <div className="p-6 flex flex-col overflow-y-auto custom-scroll">
                        <div className="mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Commission Details</h3>
                            <p className="text-gray-600 mb-2">{commission.description}</p>
                            <p className="text-2xl font-bold text-purple-600">${commission.price}</p>
                        </div>
                        
                        {/* ลบส่วน Your Request Description / Reference Links ออก */}
                        
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 border-t pt-4">Terms of Service</h3>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 max-h-40 overflow-y-auto custom-scroll mb-4">
                            {TERMS_OF_SERVICE.split('\n').filter(line => line.trim() !== '').map((line, index) => (
                                <p key={index} className="mb-1">{line}</p>
                            ))}
                        </div>

                        {submissionError && <p className="text-red-500 text-sm mb-3">{submissionError}</p>}
                        {submissionSuccess && <p className="text-green-500 text-sm mb-3">{submissionSuccess}</p>}
                    </div>
                </div>

                {/* Footer: Terms Acceptance and Submit Button (Based on image) */}
                <div className="p-5 border-t border-gray-200 flex flex-col space-y-3">
                    <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg">
                        <input
                            type="checkbox"
                            id="accept-terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <label htmlFor="accept-terms" className="text-gray-500 font-semibold cursor-pointer select-none">
                            I accept Fezeaix <FaHeart className="inline text-purple-500 mx-1" />'s Terms of Service
                        </label>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!termsAccepted || isSubmitting}
                        className={`py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${!termsAccepted || isSubmitting ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        {isSubmitting ? 'Submitting Request...' : 'Accept terms to start request'}
                    </button>
                </div>

            </div>
        </div>
    );
}


// CommissionPage Component หลัก
function CommissionPage() {
    const { addCommissionRequest, user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCommission, setSelectedCommission] = useState(null);

    const openRequestModal = (commission) => {
        setIsModalOpen(true);
        setSelectedCommission(commission);
    };

    const closeRequestModal = () => {
        setSelectedCommission(null);
        setIsModalOpen(false);
    };
    
    // ฟังก์ชันส่ง request ไปยัง AuthContext
    const handleCommissionSubmit = (requestDetails) => {
        // เนื่องจากไม่มี description ให้ส่ง description: '' ไปแทน (หรือจะให้ Context จัดการ)
        // เพื่อให้เข้ากันกับโครงสร้างเดิมใน AuthContext ที่อาจคาดหวัง field นี้
        return addCommissionRequest({ ...requestDetails, description: `[Commission request for ${requestDetails.commissionType}. Client will contact artist via inbox for details.]` });
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Commission Information</h2>
            <p className="text-gray-600 mb-6">Here you can define your commission scales, show examples, and outline terms for your clients.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {commissionTypes.map((commission) => (
                    <div 
                        key={commission.id}
                        // ใช้ Tailwind CSS classes แบบไม่ Dynamic เพื่อป้องกันการ Purge
                        className={`bg-${commission.buttonColor}-50 p-6 rounded-xl shadow-md border ${commission.buttonColor === 'blue' ? 'border-blue-200' : 'border-purple-200'} flex flex-col`}
                    >
                        <h3 className={`font-bold ${commission.buttonColor === 'blue' ? 'text-blue-800' : 'text-purple-800'} text-xl mb-2`}>{commission.title}</h3>
                        <p className={`${commission.buttonColor === 'blue' ? 'text-blue-700' : 'text-purple-700'} text-sm mb-4 flex-grow`}>{commission.description}</p>
                        
                        {/* แสดงรูปแรกของ Array เป็นตัวอย่าง */}
                        <div className={`relative w-full h-40 mb-4 rounded-lg overflow-hidden ${commission.buttonColor === 'blue' ? 'bg-blue-100' : 'bg-purple-100'} flex items-center justify-center`}>
                            <img src={commission.images[0]} alt={`${commission.title} Example`} className="w-full h-full object-cover" />
                            <span className={`absolute bottom-2 right-2 ${commission.buttonColor === 'blue' ? 'bg-blue-600' : 'bg-purple-600'} text-white text-xs px-2 py-1 rounded-full`}>
                                {commission.title.toUpperCase()}
                            </span>
                        </div>
                        
                        <p className={`${commission.buttonColor === 'blue' ? 'text-blue-900' : 'text-purple-900'} font-bold text-xl mb-4`}>Price: ${commission.price}</p>
                        <button 
                            onClick={() => openRequestModal(commission)}
                            className={`mt-auto ${commission.buttonColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md`}
                        >
                            Start Request
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && selectedCommission && (
                <RequestModal 
                    commission={selectedCommission} 
                    onClose={closeRequestModal} 
                    onSubmit={handleCommissionSubmit}
                    requesterUsername={user?.username} // ส่ง username ของผู้ใช้งานปัจจุบัน
                />
            )}
        </div>
    );
}

export default CommissionPage;