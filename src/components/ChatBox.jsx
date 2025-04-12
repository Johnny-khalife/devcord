// import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useState, useEffect, useRef } from "react";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, SmilePlus, Pin, PinOff, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

// Common emoji reactions
const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "🎉", "👎", "🤔"];

const ChatBox = ({ activeNavItem, selectedWorkspace }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(true);
  const emojiPickerRef = useRef(null);
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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setActiveEmojiPicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { 
    getMessages, 
    isMessagesLoading, 
    messages, 
    pinnedMessages,
    deleteMessage, 
    isDeletingMessage,
    reactToMessage,
    isReacting,
    pinMessage,
    isPinningMessage
  } = useChatStore();
  
  console.log("messages is gfdstbsdfsjkbs,ds", messages);
  useEffect(() => {
    if (selectedWorkspace && selectedWorkspace._id) {
      // No need to pass userId anymore
      getMessages(selectedWorkspace._id);
    }
  }, [getMessages, selectedWorkspace]);

  // Restore the check for admin or owner permissions
  const isChannelAdminOrOwner = () => {
    // This is a simplified example. You might need to adapt this to your actual permission model
    if (!selectedWorkspace) return false;
    
    // Check if user is the creator of the workspace
    if (selectedWorkspace.createdBy === authUser._id) return true;
    
    // Check if user is in the admins list
    if (selectedWorkspace.admins && selectedWorkspace.admins.includes(authUser._id)) return true;
    
    return false;
  };

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

  const toggleEmojiPicker = (messageId) => {
    setActiveEmojiPicker(activeEmojiPicker === messageId ? null : messageId);
  };

  const handleReaction = async (messageId, emoji) => {
    if (!selectedWorkspace?._id) {
      toast.error("Workspace not found");
      return;
    }

    try {
      await reactToMessage(messageId, emoji, selectedWorkspace._id, authUser._id);
      setActiveEmojiPicker(null);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handlePinMessage = async (messageId) => {
    if (!selectedWorkspace?._id) {
      toast.error("Workspace not found");
      return;
    }

    if (!authUser?._id) {
      toast.error("You must be logged in to pin messages");
      return;
    }

    // Check if user is admin or owner
    if (!isChannelAdminOrOwner()) {
      toast.error("Only channel admins and owners can pin messages");
      return;
    }

    try {
      // Removed userId parameter since pins are now admin-controlled
      await pinMessage(messageId, selectedWorkspace._id);
    } catch (error) {
      console.error("Error pinning message:", error);
    }
  };

  // Check if current user has reacted with a specific emoji
  const hasUserReacted = (reaction) => {
    return reaction.users?.some(user => {
      const userId = typeof user === 'object' ? user._id : user;
      return userId === authUser._id;
    });
  };

  // Helper function to scroll to a message by ID
  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the message temporarily
      messageElement.classList.add("bg-primary", "bg-opacity-10");
      setTimeout(() => {
        messageElement.classList.remove("bg-primary", "bg-opacity-10");
      }, 2000);
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

      {/* Pinned Messages Section - Now shows only pins by admins */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="bg-base-200 border-b border-base-300">
          <div 
            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-base-300"
            onClick={() => setShowPinnedMessages(!showPinnedMessages)}
          >
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-warning" />
              <span className="font-semibold text-sm">
                Pinned Messages ({pinnedMessages.length})
              </span>
            </div>
            {showPinnedMessages ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          
          {showPinnedMessages && (
            <div className="p-2 max-h-[200px] overflow-y-auto">
              {pinnedMessages.map((message) => (
                <div 
                  key={`pinned-${message._id}`} 
                  className="bg-base-100 p-2 rounded-md mb-2 flex items-start gap-2 hover:bg-base-300 cursor-pointer"
                  onClick={() => scrollToMessage(message._id)}
                >
                  <div className="avatar">
                    <div className="size-6 rounded-full">
                      <img 
                        src={message.userId.avatar || "/avatar.png"} 
                        alt={message.userId.username} 
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs">{message.userId.username}</span>
                      <time className="text-xs opacity-50">{formatMessageTime(message.createdAt)}</time>
                    </div>
                    <p className="text-sm truncate">{message.content}</p>
                  </div>
                  {isChannelAdminOrOwner() && (
                    <button
                      className="btn btn-xs btn-ghost btn-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinMessage(message._id);
                      }}
                      disabled={isPinningMessage}
                    >
                      <PinOff size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {sortedMessages.map((message) => (
          <div
            key={message._id}
            id={`message-${message._id}`}
            className={`chat ${
              message.userId && message.userId._id === authUser._id ? "chat-end" : "chat-start"
            } ${message.isPinnedByCurrentUser ? 'border-l-4 border-warning pl-2' : ''} transition-colors duration-300`}
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
              {message.isPinnedByCurrentUser && (
                <Pin size={12} className="text-warning" />
              )}
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
                
                <div className="flex items-center gap-2">
                  <button 
                    className="opacity-50 hover:opacity-100 transition-opacity" 
                    onClick={() => toggleEmojiPicker(message._id)}
                    disabled={isReacting}
                  >
                    <SmilePlus size={16} />
                  </button>
                  
                  {isChannelAdminOrOwner() && (
                    <button 
                      className="opacity-50 hover:opacity-100 transition-opacity" 
                      onClick={() => handlePinMessage(message._id)}
                      disabled={isPinningMessage}
                      title={message.isPinnedByCurrentUser ? "Unpin message" : "Pin message"}
                    >
                      {message.isPinnedByCurrentUser ? (
                        <PinOff size={16} className="text-warning" />
                      ) : (
                        <Pin size={16} />
                      )}
                    </button>
                  )}
                  
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
              
              {/* Emoji Picker */}
              {activeEmojiPicker === message._id && (
                <div 
                  ref={emojiPickerRef}
                  className="mt-2 p-2 bg-base-200 rounded-lg shadow-md flex flex-wrap gap-2 max-w-xs"
                >
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className="hover:bg-base-300 p-1 rounded-md transition-colors"
                      onClick={() => handleReaction(message._id, emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Display Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.reactions.map((reaction, index) => (
                    <button
                      key={`${reaction.emoji}-${index}`}
                      className={`px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1 border border-base-300 transition-colors ${
                        hasUserReacted(reaction) ? 'bg-primary bg-opacity-20' : 'bg-base-200'
                      }`}
                      onClick={() => handleReaction(message._id, reaction.emoji)}
                      disabled={isReacting}
                    >
                      <span>{reaction.emoji}</span>
                      <span className="font-semibold">{reaction.users?.length || 0}</span>
                    </button>
                  ))}
                </div>
              )}
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