// import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useState, useEffect } from "react";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const ChatBox = ({ activeNavItem, selectedWorkspace }) => {
  const [isMobile, setIsMobile] = useState(false);
  const { authUser } = useAuthStore();

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

  const { getMessages, isMessagesLoading, messages, deleteMessage, isDeletingMessage } = useChatStore();
  console.log("messages is gfdstbsdfsjkbs,ds", messages);
  useEffect(() => {
    if (selectedWorkspace && selectedWorkspace._id) {
      getMessages(selectedWorkspace._id);
    }
  }, [getMessages, selectedWorkspace]);

  const handleDeleteMessage = async (messageId) => {
    if (!selectedWorkspace?._id) {
      toast.error("Workspace not found");
      return;
    }
    
    // Add confirmation dialog
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }
    
    try {
      await deleteMessage(messageId, selectedWorkspace._id);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <ChatHeader
          activeNavItem={activeNavItem}
          selectedWorkspace={selectedWorkspace}
        />
        <div className="flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>
        <div className="sticky bottom-0 bg-base-100 p-4 border-t border-base-300">
          <MessageInput />
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        activeNavItem={activeNavItem}
        selectedWorkspace={selectedWorkspace}
      />

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {sortedMessages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.userId && message.userId._id === authUser._id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.userId && message.userId._id === authUser._id
                      ? authUser.avatar || "/avatar.png"
                      : message.userId.avatar
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1 flex items-center gap-2">
              <span className="font-semibold text-sm">
                {message.userId && message.userId._id === authUser._id 
                  ? "" 
                  : message.userId.username}
              </span>
              <time className="text-xs opacity-50">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.content && <p>{message.content}</p>}
                </div>
                
                {message.userId && message.userId._id === authUser._id && (
                  <button 
                    className="opacity-50 hover:opacity-100 transition-opacity ml-2 -mt-1" 
                    onClick={() => handleDeleteMessage(message._id)}
                    disabled={isDeletingMessage}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`sticky bottom-0 bg-base-100 p-4 ${isMobile ? "pb-20" : ""} border-t border-base-300`}
      >
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatBox;