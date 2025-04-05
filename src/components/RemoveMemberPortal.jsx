import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Shield, AlertTriangle } from "lucide-react";

const RemoveMemberPortal = ({
  isOpen,
  onClose,
  memberToRemove,
  isRemovingMember,
  confirmRemoveMember
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !memberToRemove) return null;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn" onClick={onClose}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div 
        className="bg-[#1E1F22]/90 backdrop-blur-md rounded-xl w-full max-w-md p-0 shadow-2xl border border-[#2F3136]/50 relative transition-all duration-300 animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red warning header bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 to-red-600"></div>
        
        {/* Header */}
        <div className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Remove Member</h2>
            </div>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Gradient border effect */}
          <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>
        
        <div className="px-6 py-4">
          <div className="p-4 bg-[#2F3136] rounded-lg mb-5 border border-[#40444B] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-gray-700">
              <img
                src={memberToRemove.avatar || "/avatar.png"}
                alt={memberToRemove.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-medium text-white">{memberToRemove.username}</div>
              <div className="text-sm text-gray-400 flex items-center mt-1">
                {memberToRemove.role === "admin" ? (
                  <div className="flex items-center bg-blue-900/30 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3 text-blue-500 mr-1" />
                    <span className="text-blue-400 text-xs">admin</span>
                  </div>
                ) : (
                  <span className="bg-gray-800/60 px-2 py-0.5 rounded-full text-xs">member</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-300">
              Are you sure you want to remove <span className="text-white font-medium">{memberToRemove.username}</span> from your workspace?
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This action cannot be undone. The user will no longer have access to this workspace.
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-700/50 bg-[#2B2D31]/70 flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-700/70 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            onClick={onClose}
            disabled={isRemovingMember}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center"
            onClick={confirmRemoveMember}
            disabled={isRemovingMember}
          >
            {isRemovingMember ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Removing...
              </>
            ) : (
              "Remove Member"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal outside of the component hierarchy
  return createPortal(
    <>
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
      {modalContent}
    </>,
    document.body
  );
};

export default RemoveMemberPortal; 