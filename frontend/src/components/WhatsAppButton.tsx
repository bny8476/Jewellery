import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
    const phoneNumber = "919876543210"; // Placeholder: User should replace with their actual shop number
    const message = encodeURIComponent("Hi RCB Jewelry! I'm interested in your collection. Can you help me?");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all active:scale-95 group"
            title="Chat with us on WhatsApp"
        >
            <div className="absolute right-full mr-3 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
                Ask a Question
            </div>
            <MessageCircle className="h-7 w-7 fill-current" />
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
        </a>
    );
};
