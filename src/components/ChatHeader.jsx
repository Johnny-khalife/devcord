import React, { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Lock, Hash, Menu } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const ChatHeader = ({ activeNavItem, selectedWorkspace }) => {
  const { selectedFriend, setSelectedFriend } = useChatStore();
  const { getUserById } = useAuthStore();
  const [friendProfile, setFriendProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Fetch friend profile when selectedFriend changes
  useEffect(() => {
    const fetchFriendProfile = async () => {
      if (selectedFriend?.friendId) {
        const profile = await getUserById(selectedFriend.friendId);
        setFriendProfile(profile);
      }
    };
    
    fetchFriendProfile();
  }, [selectedFriend, getUserById]);
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleClose = () => {
    console.log("Close button clicked!");
    if (activeNavItem === "users" && selectedFriend) {
      setSelectedFriend(null);
      setFriendProfile(null);
    }
    // You could add additional close functionality for workspaces here if needed
  };
  
  // Function to trigger sidebar toggles via custom events
  const toggleSidebar = () => {
    if (activeNavItem === "users") {
      // Dispatch custom event for user friends sidebar
      window.dispatchEvent(new CustomEvent('toggle-user-friends-sidebar'));
    } else if (activeNavItem === "workSpace") {
      // Dispatch custom event for workspace sidebar
      window.dispatchEvent(new CustomEvent('toggle-workspace-sidebar'));
    }
  };

  return (
    <div className="p-3 border-b border-base-300 flex justify-between items-center bg-base-100 sticky top-0 z-10">
      {/* Mobile menu toggle */}
      {isMobile && (
        <button 
          className="p-2 hover:bg-base-200 rounded-md mr-2"
          onClick={toggleSidebar}
        >
          <Menu size={18} />
        </button>
      )}
      
      {/* Left section with user/workspace info */}
      <div className="flex items-center gap-3 flex-1">
        {activeNavItem === "users" && friendProfile ? (
          <>
            <div className="avatar">
              <div className="w-8 h-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1 overflow-hidden">
                <img
                  src={friendProfile.avatar || "/avatar.png"}
                  alt={`${friendProfile.username}'s avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h2 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} truncate`}>
                {friendProfile.username}
              </h2>
              <p className="text-xs text-base-content/70">
                {friendProfile.status || "Online"}
              </p>
            </div>
          </>
        ) : activeNavItem === "workSpace" && selectedWorkspace ? (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-base-200">
              {selectedWorkspace.isPrivate ? (
                <Lock className="w-4 h-4 text-warning" />
              ) : (
                <Hash className="w-4 h-4" />
              )}
            </div>
            <h2 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} truncate`}>
              {selectedWorkspace.channelName}
            </h2>
          </>
        ) : (
          <h2 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
            {activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}
          </h2>
        )}
      </div>

      {/* Right section with buttons */}
      {activeNavItem === "users" && selectedFriend && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-md"
            style={{ 
              width: '30px', 
              height: '30px',
              touchAction: 'manipulation',
              position: 'relative',
              zIndex: 9999
            }}
            type="button"
            aria-label="Close"
          >
            <X size={20} color="white" strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;