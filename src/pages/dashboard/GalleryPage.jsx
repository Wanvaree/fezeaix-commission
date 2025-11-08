// src/pages/dashboard/GalleryPage.jsx
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
        <div className="bg-white rounded-xl shadow-lg h-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">My Art Gallery</h2>
            <p className="text-gray-600 mb-6">This is where all your amazing artworks will be displayed!</p>

            <div className="flex flex-wrap justify-center gap-6 mt-4">
                {artworks.map((artwork) => (
                    // ลบ bg-gray-100, rounded-lg, shadow-md, overflow-hidden, group ออก
                    <div
                        key={artwork.id}
                        className="w-64 h-64 cursor-pointer flex-shrink-0 flex items-center justify-center" // เพิ่ม flex items-center justify-center เพื่อจัดรูปภาพให้อยู่ตรงกลาง
                        onClick={() => openModal(artwork)}
                    >
                        <img
                            src={artwork.src}
                            alt={artwork.title}
                            // ลบ transform, transition-transform, group-hover:scale-105 ออก
                            // ปรับให้รูปภาพอาจจะมี max-width/max-height เพื่อไม่ให้มันใหญ่เกินไปใน container ที่เล็ก
                            className="max-w-full max-h-full object-contain"
                        />
                        {/* ลบ Overlay สำหรับแสดงชื่อรูปภาพเมื่อ hover ออกไปทั้งหมด */}
                    </div>
                ))}
            </div>

            {/* Modal สำหรับแสดงรูปภาพขนาดเต็ม (ยังคงเหมือนเดิม) */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                    onClick={closeModal}
                >
                    <div
                        className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-2 right-2 text-white text-3xl font-bold bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center"
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                        <img
                            src={selectedImage.src}
                            alt={selectedImage.title}
                            className="max-w-full max-h-[85vh] object-contain mx-auto my-auto"
                        />
                        <div className="p-4 text-center bg-gray-100 border-t">
                            <p className="text-lg font-semibold text-center text-gray-800">{selectedImage.title}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GalleryPage;