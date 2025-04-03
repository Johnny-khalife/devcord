// import { useState } from "react";
import {
  Briefcase,
  MessageSquare,
  Settings,
  Users2,
  Phone,
} from "lucide-react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useChatStore } from "../store/useChatStore";

const Sidebar = ({ activeNavItem, setActiveNavItem }) => {
  const { selectedWorkspace } = useWorkspaceStore();
  const { setSelectedFriend } = useChatStore();
  
  const workSpacePage = () => {
    // Reset the selected friend when switching to workspace view
    setSelectedFriend(null);
    setActiveNavItem("workSpace");
  };
  
  const userChatPage = () => {
    setActiveNavItem("users");
    // Don't reset selectedFriend here, let it be handled by the UserFriends component
  };

  return (
    <div className="w-16 bg-base-300 h-full flex flex-col items-center py-4">
      {/* App logo */}
      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-6">
        <MessageSquare className="w-6 h-6 text-primary-content" />
      </div>

      {/* Navigation icons */}
      <div className="flex flex-col items-center gap-6 mt-2">
        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            activeNavItem === "calls" ? "bg-primary/20" : "hover:bg-base-200"
          }`}
          onClick={() => {
            setSelectedFriend(null);
            setActiveNavItem("calls");
          }}
        >
          <Phone
            className={`w-5 h-5 ${
              activeNavItem === "calls" ? "text-primary" : ""
            }`}
          />
        </button>

        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            activeNavItem === "settings"
              ? "bg-primary/20"
              : "hover:bg-base-200"
          }`}
          onClick={() => {
            setSelectedFriend(null);
            setActiveNavItem("settings");
          }}
        >
          <Settings
            className={`w-5 h-5 ${
              activeNavItem === "settings" ? "text-primary" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;