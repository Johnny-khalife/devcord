import React from "react";
import { useChatStore } from "../store/useChatStore";
import { X } from "lucide-react";

const ChatHeader = ({ activeNavItem, activeChannel }) => {
  const { selectedFriend, setSelectedFriend } = useChatStore();

  const handleClose = () => {
    if (activeNavItem === "users" && selectedFriend) {
      setSelectedFriend(null);
    }
    // You could add additional close functionality for workspaces here if needed
  };

  return (
    <div className="p-3 border-b border-base-300 flex justify-between items-center bg-base-100 sticky top-0 z-10">
      {/* Left section with user/workspace info */}
      <div className="flex items-center gap-3">
        {activeNavItem === "users" && selectedFriend ? (
          <>
            <div className="avatar">
              <div className="w-8 h-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1 overflow-hidden">
                <img
                  src={selectedFriend.avatar}
                  alt={`${selectedFriend.username}'s avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h2 className="font-semibold text-base">{selectedFriend.username}</h2>
          </>
        ) : (
          <h2 className="font-semibold">
            {activeNavItem === "workSpace"
              ? `# ${activeChannel}`
              : activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}
          </h2>
        )}
      </div>

      {/* Right section with X button */}
      <button 
        onClick={handleClose}
        className={`p-2 hover:bg-base-200 rounded-full transition-colors ${
          activeNavItem === "users" && selectedFriend ? "visible" : "invisible"
        }`}
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default ChatHeader;