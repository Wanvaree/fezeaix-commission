import React, { useState } from 'react';

// Import รูปภาพทั้งหมด
import art1_1 from '../../assets/images/art1.1.png';
import art1_2 from '../../assets/images/art1.2.png';
import art1 from '../../assets/images/art1.png';
import art2 from '../../assets/images/art2.png';
import art3 from '../../assets/images/art3.png';
import art4_1 from '../../assets/images/art4.1.png';
import art4_2 from '../../assets/images/art4.2.png';
import art4 from '../../assets/images/art4.png';
import art5_1 from '../../assets/images/art5.1.png';
import art5 from '../../assets/images/art5.png';
import art6_1 from '../../assets/images/art6.1.png';
import art6 from '../../assets/images/art6.png';
import art7_1 from '../../assets/images/art7.1.png';
import art7_2 from '../../assets/images/art7.2.png';
import art7 from '../../assets/images/art7.png';
import art8 from '../../assets/images/art8.png';
import art9 from '../../assets/images/art9.jpg';
import art10_1 from '../../assets/images/art10.1.png';
import art10_2 from '../../assets/images/art10.2.png';
import art10_3 from '../../assets/images/art10.3.jpg';
import art10_4 from '../../assets/images/art10.4.jpg';
import art10 from '../../assets/images/art10.png';
import art11 from '../../assets/images/art11.png';
import art12 from '../../assets/images/art12.png';
import art13 from '../../assets/images/art13.png';
import art14 from '../../assets/images/art14.jpg';
import art15 from '../../assets/images/art15.png';
import art16_1 from '../../assets/images/art16.1.png';
import art16 from '../../assets/images/art16.png';
import art17 from '../../assets/images/art17.png';
import art18 from '../../assets/images/art18.png';

function GalleryPage() {
    const artworks = [
        { id: '1.1', src: art1_1, title: 'Mystical Forest' },
        { id: '1.2', src: art1_2, title: 'Mystical Forest' },
        { id: '1', src: art1, title: 'Dragon Rider' },
        { id: '2', src: art2, title: 'Starry Night Wanderer' },
        { id: '3', src: art3, title: 'Ancient Guardian' },
        { id: '4.1', src: art4_1, title: 'Mystical Forest' },
        { id: '4.2', src: art4_2, title: 'Mystical Forest' },
        { id: '4', src: art4, title: 'Desert Oasis' },
        { id: '5.1', src: art5_1, title: 'Mystical Forest' },
        { id: '5', src: art5, title: 'Frozen Peaks' },
        { id: '6.1', src: art6_1, title: 'Mystical Forest' },
        { id: '6', src: art6, title: 'City at Dusk' },
        { id: '7.1', src: art7_1, title: 'Mystical Forest' },
        { id: '7.2', src: art7_2, title: 'Mystical Forest' },
        { id: '7', src: art7, title: 'Oceanic Depths' },
        { id: '8', src: art8, title: 'Floating Islands' },
        { id: '9', src: art9, title: 'Mystical Forest' },
        { id: '10.1', src: art10_1, title: 'Mystical Forest' },
        { id: '10.2', src: art10_2, title: 'Mystical Forest' },
        { id: '10.3', src: art10_3, title: 'Mystical Forest' },
        { id: '10.4', src: art10_4, title: 'Mystical Forest' },
        { id: '10', src: art10, title: 'Mystical Forest' },
        { id: '11', src: art11, title: 'Mystical Forest' },
        { id: '12', src: art12, title: 'Mystical Forest' },
        { id: '13', src: art13, title: 'Mystical Forest' },
        { id: '14', src: art14, title: 'Mystical Forest' },
        { id: '15', src: art15, title: 'Mystical Forest' },
        { id: '16.1', src: art16_1, title: 'Mystical Forest' },
        { id: '16', src: art16, title: 'Mystical Forest' },
        { id: '17', src: art17, title: 'Mystical Forest' },
        { id: '18', src: art18, title: 'Mystical Forest' },
    ];

    const [selectedImage, setSelectedImage] = useState(null);

    const openModal = (artwork) => {
        setSelectedImage(artwork);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    return (
        // 🚨 แก้ไข: เปลี่ยน h-full เป็น min-h-full เพื่อให้ขยายตามเนื้อหาเสมอ
        <div className="bg-white rounded-xl shadow-lg min-h-full p-6"> 
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">My Art Gallery</h2>
            {/* 🚨 FIX: อัปเดตข้อความ */}
            <p className="text-gray-600 mb-6">
                This is where all your amazing artworks will be displayed! รวมตัวอย่างCommission จะมีการอัพเดทอยู่เรื่อยๆค่ะ💕
            </p>

            {/* 🚨 แก้ไข: ใช้ Responsive Grid และ Hover Effect */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4"> 
                {artworks.map((artwork) => (
                    <div
                        key={artwork.id}
                        // 🚨 เพิ่ม: Aspect Ratio, Overflow hidden, Rounded, Shadow, Hover Effect Group
                        className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md aspect-square" 
                        onClick={() => openModal(artwork)}
                    >
                        <img
                            src={artwork.src}
                            alt={artwork.title}
                            // 🚨 FIX: เพิ่ม loading="lazy" เพื่อแก้ปัญหา Initial Load/Lag
                            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" 
                            loading="lazy"
                        />
                        
                        {/* 🚨 เพิ่ม: Overlay สำหรับแสดงชื่อเมื่อ Hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-base font-semibold text-center p-2">{artwork.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal สำหรับแสดงรูปภาพขนาดเต็ม */}
            {selectedImage && (
                <div
                    // 🚨 ปรับปรุง Modal: ใช้ animation (animate-fade-in)
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 animate-fade-in" 
                    onClick={closeModal}
                >
                    <div
                        // 🚨 ปรับปรุง Modal: ใช้ animation (animate-scale-up) และปรับขนาดให้ใหญ่ขึ้น
                        className="relative bg-white rounded-lg shadow-2xl max-w-5xl lg:max-w-6xl max-h-[95vh] overflow-hidden animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            // 🚨 ปรับปรุง Modal: ปุ่มปิด
                            className="absolute top-4 right-4 text-white text-3xl font-bold bg-gray-800 bg-opacity-70 hover:bg-opacity-100 rounded-full w-10 h-10 flex items-center justify-center z-10 transition-colors"
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                        
                        <img
                            src={selectedImage.src}
                            alt={selectedImage.title}
                            // 🚨 ปรับปรุง Modal: รูปภาพ
                            className="max-w-full max-h-[85vh] object-contain mx-auto"
                        />
                        <div className="p-3 text-center bg-gray-100 border-t border-gray-200">
                            <p className="text-xl font-bold text-center text-gray-800">{selectedImage.title}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GalleryPage;