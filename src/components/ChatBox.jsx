// import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Loader2, X, Hash, Lock, MessageSquare } from "lucide-react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import MessageSearch from "./MessageSearch";
import DirectMessageSearch from "./DirectMessageSearch";
import NoChatSelected from "./NoChatSelected";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useAuthStore } from "../store/useAuthStore";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { markMessagesAsRead } from "../lib/socket";

// Common emoji reactions
const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "🎉", "👎", "🤔"];

const ChatBox = ({ activeNavItem, isMobile }) => {
  const messageEndRef = useRef(null);
  const chatAreaRef = useRef(null);
  const messageInputRef = useRef(null);
  const containerRef = useRef(null);
  const { authUser, socket } = useAuthStore();
  const [showChat, setShowChat] = useState(true);
  const [inputHeight, setInputHeight] = useState(0);
  const [userScrolled, setUserScrolled] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const {
    messages,
    directMessages,
    loading,
    error,
    getMessages,
    getDirectMessages,
    selectedFriend,
    setSelectedFriend,
    typingIndicators,
    isMessagesLoading
  } = useChatStore();
  const { selectedWorkspace } = useWorkspaceStore();
  
  // Calculate these values early
  const isWorkspaceSelected = activeNavItem === 'workSpace' && selectedWorkspace;
  const isFriendChatVisible = activeNavItem === 'users' && selectedFriend && showChat;
  const shouldShowChatContent = isFriendChatVisible || isWorkspaceSelected;
  
  // Check if socket is connected
  const isSocketConnected = socket?.dm && socket.dm.connected;

  const handleCloseChat = () => {
    if (activeNavItem === "users" && selectedFriend) {
      setShowChat(false);
      setSelectedFriend(null);
      
      // Dispatch a custom event that UserFriends component can listen for
      window.dispatchEvent(new CustomEvent("dm-chat-closed", { 
        detail: { friendId: selectedFriend.friendId }
      }));
    }
  };

  useEffect(() => {
    if (selectedFriend) {
      setShowChat(true);
    }
  }, [selectedFriend, activeNavItem]);

  // Track scroll position to determine if user has scrolled up
  useEffect(() => {
    const handleScroll = () => {
      if (!chatAreaRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
      // Consider user scrolled if they're not at the bottom (with a small threshold)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserScrolled(!isAtBottom);
    };
    
    const chatArea = chatAreaRef.current;
    if (chatArea) {
      chatArea.addEventListener('scroll', handleScroll);
      return () => chatArea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Track message count changes to determine when to scroll
  useEffect(() => {
    const currentMessages = activeNavItem === "workSpace" ? messages : directMessages;
    const newCount = currentMessages?.length || 0;
    
    // Only auto-scroll if message count increased (new message) and user hasn't scrolled up
    if (newCount > messageCount && !userScrolled) {
      scrollToBottom();
    }
    
    setMessageCount(newCount);
  }, [messages, directMessages, activeNavItem]);

  // Update layout on resize and orientation change
  useEffect(() => {
    const updateLayout = () => {
      if (messageInputRef.current) {
        setInputHeight(messageInputRef.current.offsetHeight);
      }
    };
    
    // Call initially and set up listeners
    updateLayout();
    
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, [shouldShowChatContent]);

  // Scroll to bottom when necessary
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
      
      messageEndRef.current?.scrollIntoView({ behavior: "auto" });
    });
    setUserScrolled(false);
  };

  // Load messages when channel or friend changes
  useEffect(() => {
    if (activeNavItem === "workSpace" && selectedWorkspace?._id) {
      getMessages(selectedWorkspace._id).then(() => {
        // Reset scroll position when changing channels
        setUserScrolled(false);
        scrollToBottom();
      });
    } else if (activeNavItem === "users" && selectedFriend?.friendId && showChat) {
      getDirectMessages(selectedFriend.friendId).then(() => {
        // Reset scroll position when changing direct message conversation
        setUserScrolled(false);
        scrollToBottom();
      });
      
      // Mark messages as read when we view a direct message conversation
      if (selectedFriend?.friendId && isSocketConnected) {
        markMessagesAsRead(selectedFriend.friendId);
      }
    }
  }, [
    selectedWorkspace?._id,
    selectedFriend?.friendId,
    activeNavItem,
    getMessages,
    getDirectMessages,
    showChat,
    isSocketConnected
  ]);

  const messagesToDisplaySource = activeNavItem === "workSpace" ? messages : directMessages;

  const sortedMessages = [...(messagesToDisplaySource || [])].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // Check if the selected friend is typing
  const isTyping = selectedFriend && 
    typingIndicators && 
    typingIndicators[selectedFriend.friendId] !== null && 
    typingIndicators[selectedFriend.friendId] !== undefined;

  const renderTitle = () => {
    if (activeNavItem === "workSpace") {
      if (!selectedWorkspace) return "Select a workspace";
      return selectedWorkspace.channelName || selectedWorkspace.name || selectedWorkspace.workspaceName || "Workspace";
    } else if (activeNavItem === "users") {
      return selectedFriend?.username || "Select a friend";
    }
    return "Chat";
  };

  const processDirectMessages = (processedMessages) => {
     if (!processedMessages || !Array.isArray(processedMessages) || !authUser) return [];
     
     return processedMessages.map((message) => {
       // Get the correct sender ID, handling different possible formats
       const messageSenderId = 
         message.senderId?._id || // If senderId is an object with _id
         message.senderId ||      // If senderId is already the ID string
         message.sender?.userId;  // If sender object contains userId
       
       // Determine if current user is the sender
       const isSender = messageSenderId === authUser._id;
       
       // Set user info based on sender
       const userId = isSender
         ? { 
             _id: authUser._id, 
             username: authUser.username || "You", 
             avatar: authUser.avatar 
           }
         : {
             _id: messageSenderId,
             username: message.sender?.username || selectedFriend?.username || "Friend",
             avatar: message.sender?.avatar || selectedFriend?.avatar,
           };
           
       return {
         ...message,
         userId,
         isSentByMe: isSender,
       };
     });
  };

  const messagesForDisplay = (
    activeNavItem === "workSpace"
      ? sortedMessages
      : processDirectMessages(sortedMessages)
  ).map((msg, idx, arr) => {
    const senderId = msg.userId?._id || msg.senderId?._id || msg.senderId;
    let prevSenderId = null;
    let prevMessageTime = null;
    
    if (idx > 0 && arr[idx - 1]) {
       const prevMsg = arr[idx - 1];
       prevSenderId = prevMsg.userId?._id || prevMsg.senderId?._id || prevMsg.senderId;
       prevMessageTime = new Date(prevMsg.createdAt || prevMsg.timestamp);
    }
    
    // Calculate time difference between current and previous message in minutes
    const currentMessageTime = new Date(msg.createdAt || msg.timestamp);
    const timeDiffMinutes = prevMessageTime 
      ? (currentMessageTime - prevMessageTime) / (1000 * 60) 
      : 0;
    
    // Show timestamp if first in group by sender OR if more than 5 minutes since last message
    const showTimestamp = !prevSenderId || senderId !== prevSenderId || timeDiffMinutes >= 5;
    
    return {
      ...msg,
      firstInGroup: !prevSenderId || senderId !== prevSenderId,
      showTimestamp: showTimestamp
    };
  });

  let mainContent;

  if ((activeNavItem === 'users' && !selectedFriend) || 
      (activeNavItem === 'workSpace' && (!selectedWorkspace || !selectedWorkspace._id))) {
      mainContent = <NoChatSelected activeNavItem={activeNavItem} />;
  } else if (loading) {
      mainContent = (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-base-content/50" />
          </div>
      );
  } else if (isMessagesLoading) {
      mainContent = <MessageSkeleton />;
  } else if (error) {
      mainContent = <div className="p-4 text-center text-error">{error}</div>;
  } else if (messagesForDisplay.length === 0 && shouldShowChatContent) {
      mainContent = (
          <div className="p-4 text-center text-base-content/60">
              No messages yet. Start the conversation!
          </div>
      );
  } else if (shouldShowChatContent) {
      mainContent = (
          <>
              {messagesForDisplay.map((message) => (
                  <Message
                      key={message._id}
                      message={message}
                      activeNavItem={activeNavItem}
                      firstInGroup={message.firstInGroup}
                  />
              ))}
              
              {/* Typing indicator */}
              {isTyping && activeNavItem === "users" && (
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-base-content/60 italic">
                  <span>typing</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "200ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "400ms" }}></div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} className="h-2" />
          </>
      );
  } else {
       mainContent = <NoChatSelected />;
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col bg-base-100 border-l border-base-300 ${
        isMobile ? "fixed inset-0 pt-16" : "h-screen pt-16"
      }`}
    >
      {/* Header Section */}
      <div className="flex-shrink-0 bg-base-200 p-3 border-b border-base-300 shadow-sm z-10">
        <div className="flex items-center justify-between">
          {/* Left side (Info/Title) */}
           <div className="flex items-center gap-3 min-w-0">
            {isFriendChatVisible ? (
              <div className="avatar flex-shrink-0">
                <div className="w-9 h-9 rounded-full ring-1 ring-base-300">
                  <img
                    src={
                      selectedFriend?.avatar ||
                      "https://ui-avatars.com/api/?name=" +
                        (selectedFriend?.username || 'User')
                    }
                    alt={selectedFriend?.username || 'User'}
                  />
                </div>
              </div>
            ) : isWorkspaceSelected && !selectedWorkspace.isPrivate ? <Hash/> : isWorkspaceSelected ? <Lock/> : null}
            <h2 className="text-lg font-semibold truncate">{renderTitle()}</h2>
          </div>

          {/* Right side (Actions) */}
          <div className="flex gap-2">
            {activeNavItem === "workSpace" ? (
              <MessageSearch channelId={selectedWorkspace?._id} />
            ) : activeNavItem === "users" && selectedFriend ? (
              <>
                <DirectMessageSearch friendId={selectedFriend?.friendId} />
                <button
                  onClick={handleCloseChat}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Flexible content container */}
      <div className="flex flex-col flex-1 relative overflow-hidden">
        {/* Messages Area (Scrollable) */}
        <div 
          ref={chatAreaRef} 
          className="flex-1 overflow-y-auto px-4 py-4 pb-4 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {mainContent}
        </div>
        
        {/* Scroll to bottom button (visible when user has scrolled up) */}
        {userScrolled && !loading && !isMessagesLoading && messagesForDisplay.length > 0 && (
          <button 
            className={`btn btn-circle btn-sm btn-primary absolute right-1/2 shadow-lg z-20 ${isMobile ? 'bottom-40' : 'bottom-28'}`} 
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
        
        {/* Input Area (Sticky at Bottom) */}
        {shouldShowChatContent && (
          <div 
            className="sticky bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-10"
            style={{
              boxShadow: '0 -2px 5px rgba(0,0,0,0.05)'
            }}
            ref={messageInputRef}
          >
            <MessageInput activeNavItem={activeNavItem} />
            
            {/* Extra space for mobile browsers */}
            {isMobile && <div className="h-14 bg-base-100" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;