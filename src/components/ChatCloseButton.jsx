import React from 'react';
import { X } from 'lucide-react';

const ChatCloseButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-md"
      style={{ 
        width: '40px', 
        height: '40px', 
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        zIndex: 9999
      }}
      type="button"
      aria-label="Close"
    >
      <X size={20} color="white" strokeWidth={3} />
    </button>
  );
};

export default ChatCloseButton;
