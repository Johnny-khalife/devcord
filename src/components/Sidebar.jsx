// import { useState } from "react";
import {
  Briefcase,
  MessageSquare,
  Users2,
  Menu,
  Newspaper,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";

const Sidebar = ({ activeNavItem, setActiveNavItem }) => {
  const { setSelectedFriend } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  
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
    if (isMobile && activeNavItem === "workSpace") {
      // If already on workspace page, toggle the workspace sidebar
      window.dispatchEvent(new CustomEvent('toggle-workspace-sidebar'));
    } else {
      // Reset the selected friend when switching to workspace view
      setSelectedFriend(null);
      setActiveNavItem("workSpace");
    }
  };
  
  const userChatPage = () => {
    if (isMobile && activeNavItem === "users") {
      // If already on users page, toggle the user friends sidebar
      window.dispatchEvent(new CustomEvent('toggle-user-friends-sidebar'));
    } else {
      setActiveNavItem("users");
      // Don't reset selectedFriend here, let it be handled by the UserFriends component
    }
  };

  const jobsPage = () => {
    if (isMobile && activeNavItem === "jobs") {
      // If already on jobs page, toggle any relevant sidebar
      // Add jobs toggle event if needed
    } else {
      setSelectedFriend(null);
      setActiveNavItem("jobs");
    }
  };

  // Always show the navigation bar
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
            activeNavItem === "jobs" ? "bg-primary/20" : "hover:bg-base-200"
          }`}
          onClick={jobsPage}
        >
          <Newspaper
            className={`w-5 h-5 ${
              activeNavItem === "jobs" ? "text-primary" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;