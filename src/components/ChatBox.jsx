// import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useState, useEffect } from "react";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const ChatBox = ({
  activeNavItem,
  activeWorkspace,
  activeChannel,
  selectedWorkspace,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  console.log("waht is the id of selectedworkspace", selectedWorkspace);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const { messages, getMessages, isMessagesLoading, selectedFriend } =
    useChatStore();
    useEffect(() => {
      if (selectedWorkspace && selectedWorkspace._id) {
      getMessages(selectedWorkspace._id);
    }
  }, [getMessages, selectedWorkspace]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader
          activeNavItem={activeNavItem}
          activeChannel={activeChannel}
          selectedWorkspace={selectedWorkspace}
        />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        activeNavItem={activeNavItem}
        activeChannel={activeChannel}
        selectedWorkspace={selectedWorkspace}
      />

      <div className="flex-1 p-4 overflow-y-auto">
        <p
          className={`${
            isMobile ? "text-sm" : "text-base"
          } text-center text-gray-500`}
        >
          messages ....
        </p>
      </div>

      <div
        className={`p-4 ${isMobile ? "pb-20" : ""} border-t border-base-300`}
      >
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatBox;
