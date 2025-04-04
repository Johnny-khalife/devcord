// import { useState } from "react";
import {
  Briefcase,
  MessageSquare,
  Settings,
  Users2,
  Phone,
  Menu,
} from "lucide-react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";

const Sidebar = ({ activeNavItem, setActiveNavItem }) => {
  const { selectedWorkspace } = useWorkspaceStore();
  const { setSelectedFriend } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
  
  const workSpacePage = () => {
    // Reset the selected friend when switching to workspace view
    setSelectedFriend(null);
    setActiveNavItem("workSpace");
    if (isMobile) setIsMenuOpen(false);
  };
  
  const userChatPage = () => {
    setActiveNavItem("users");
    // Don't reset selectedFriend here, let it be handled by the UserFriends component
    if (isMobile) setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // If on mobile and menu is closed, only show toggle button
  if (isMobile && !isMenuOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button 
          onClick={toggleMenu} 
          className="p-3 bg-primary rounded-full shadow-lg"
        >
          <Menu className="w-6 h-6 text-primary-content" />
        </button>
      </div>
    );
  }

  // Full sidebar for desktop or mobile with open menu
  return (
    <div className={`${isMobile ? 'fixed bottom-0 left-0 w-full z-40 flex items-center justify-around p-2 bg-base-300 shadow-lg' : 'w-16 bg-base-300 h-full flex flex-col items-center py-4'}`}>
      {/* App logo - only show on desktop */}
      {!isMobile && (
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-6">
          <MessageSquare className="w-6 h-6 text-primary-content" />
        </div>
      )}

      {/* Navigation icons */}
      <div className={`${isMobile ? 'flex justify-around w-full' : 'flex flex-col items-center gap-6 mt-2'}`}>
        <button
          className={`${isMobile ? 'p-2' : 'w-10 h-10 rounded-lg'} flex items-center justify-center ${
            activeNavItem === "users" ? "bg-primary/20" : "hover:bg-base-200"
          }`}
          onClick={userChatPage}
        >
          <Users2
            className={`w-5 h-5 ${
              activeNavItem === "users" ? "text-primary" : ""
            }`}
          />
        </button>

        <button
          className={`${isMobile ? 'p-2' : 'w-10 h-10 rounded-lg'} flex items-center justify-center ${
            activeNavItem === "workSpace"
              ? "bg-primary/20"
              : "hover:bg-base-200"
          }`}
          onClick={workSpacePage}
        >
          <Briefcase
            className={`w-5 h-5 ${
              activeNavItem === "workSpace" ? "text-primary" : ""
            }`}
          />
        </button>

        <button
          className={`${isMobile ? 'p-2' : 'w-10 h-10 rounded-lg'} flex items-center justify-center ${
            activeNavItem === "calls" ? "bg-primary/20" : "hover:bg-base-200"
          }`}
          onClick={() => {
            setSelectedFriend(null);
            setActiveNavItem("calls");
            if (isMobile) setIsMenuOpen(false);
          }}
        >
          <Phone
            className={`w-5 h-5 ${
              activeNavItem === "calls" ? "text-primary" : ""
            }`}
          />
        </button>

        <button
          className={`${isMobile ? 'p-2' : 'w-10 h-10 rounded-lg'} flex items-center justify-center ${
            activeNavItem === "settings"
              ? "bg-primary/20"
              : "hover:bg-base-200"
          }`}
          onClick={() => {
            setSelectedFriend(null);
            setActiveNavItem("settings");
            if (isMobile) setIsMenuOpen(false);
          }}
        >
          <Settings
            className={`w-5 h-5 ${
              activeNavItem === "settings" ? "text-primary" : ""
            }`}
          />
        </button>
        
        {/* Close menu button - only on mobile */}
        {isMobile && (
          <button
            className="p-2 flex items-center justify-center"
            onClick={toggleMenu}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;