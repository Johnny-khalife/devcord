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
  const { authUser, socket } = useAuthStore();
  const [showChat, setShowChat] = useState(true);
  const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
  const [inputHeight, setInputHeight] = useState(0);
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
    }
  };

  useEffect(() => {
    if (selectedFriend) {
      setShowChat(true);
    }
  }, [selectedFriend, activeNavItem]);

  // Measure and update input height to calculate proper message area height
  useEffect(() => {
    const updateInputHeight = () => {
      if (messageInputRef.current) {
        const height = messageInputRef.current.offsetHeight;
        setInputHeight(height);
      }
    };

    // Use ResizeObserver to detect changes in the input height
    const resizeObserver = new ResizeObserver(updateInputHeight);
    
    if (messageInputRef.current) {
      resizeObserver.observe(messageInputRef.current);
      updateInputHeight();
    }
    
    return () => {
      if (messageInputRef.current) {
        resizeObserver.unobserve(messageInputRef.current);
      }
    };
  }, [shouldShowChatContent]);

  // Handle viewport changes for mobile browsers
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        setVisualViewportHeight(window.visualViewport.height);
        
        // Scroll to ensure input is visible when keyboard opens
        if (window.visualViewport.height < window.innerHeight) {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  // Scroll to bottom when necessary
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatAreaRef.current) {
        const scrollHeight = chatAreaRef.current.scrollHeight;
        const height = chatAreaRef.current.clientHeight;
        const maxScrollTop = scrollHeight - height;
        
        chatAreaRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
      }
      
      messageEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 50);
  };

  // Load messages when channel or friend changes
  useEffect(() => {
    if (activeNavItem === "workSpace" && selectedWorkspace?._id) {
      getMessages(selectedWorkspace._id);
    } else if (activeNavItem === "users" && selectedFriend?.friendId && showChat) {
      getDirectMessages(selectedFriend.friendId);
      
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

  // Scroll to bottom on resize
  useEffect(() => {
    const handleResize = () => {
      if (showChat && ((activeNavItem === 'users' && selectedFriend) || (activeNavItem === 'workSpace' && selectedWorkspace))) {
        scrollToBottom();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedFriend, selectedWorkspace, activeNavItem, showChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (showChat && ((activeNavItem === 'users' && selectedFriend) || (activeNavItem === 'workSpace' && selectedWorkspace))) {
      scrollToBottom();
    }
  }, [messages, directMessages, selectedFriend, selectedWorkspace, activeNavItem, showChat]);

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

  if ((activeNavItem === 'users' && !selectedFriend) || (activeNavItem === 'workSpace' && !selectedWorkspace)) {
      mainContent = <NoChatSelected />;
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
                  <span>{selectedFriend?.username} is typing</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "200ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "400ms" }}></div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} className="h-4" />
          </>
      );
  } else {
       mainContent = <NoChatSelected />;
  }

  // Calculate safe bottom spacing for mobile input
  const safeBottomMargin = isMobile ? `${window.innerHeight - visualViewportHeight}px` : '0';
  
  // Calculate proper spacing for the message area to avoid content being hidden under the input
  const getMessageAreaPaddingBottom = () => {
    // Base padding plus any additional bottom spacing needed
    let padding = isMobile ? 16 : 0; // 16px base padding on mobile
    
    if (isMobile) {
      // Add additional padding to account for the input height and navigation
      return `${inputHeight + 70 + padding}px`;
    }
    
    return `${inputHeight + padding}px`;
  };

  return (
    <div className={`h-screen flex flex-col bg-base-100 border-l border-base-300 overflow-hidden pt-16 ${isMobile ? "fixed inset-0 max-h-screen" : ""}`}>
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
              <MessageSearch />
            ) : activeNavItem === "users" && selectedFriend ? (
              <>
                <DirectMessageSearch />
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

      {/* Messages Area (Scrollable) */}
      <div 
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto mobile-scroll px-4 py-4"
        style={{ 
          paddingBottom: getMessageAreaPaddingBottom(),
        }}
      >
        {mainContent}
      </div>

      {/* Input Area (Fixed at Bottom) */}
      {shouldShowChatContent && (
        <div 
          ref={messageInputRef}
          className={`flex-shrink-0 border-t border-base-300 bg-base-100 ${
            isMobile ? "fixed left-0 right-0 z-50" : ""
          }`} 
          style={{ 
            bottom: isMobile ? `calc(56px + ${safeBottomMargin})` : 0,
            borderBottomWidth: isMobile ? '1px' : 0,
            borderBottomStyle: isMobile ? 'solid' : 'none',
            borderBottomColor: isMobile ? 'var(--b3)' : 'transparent',
            boxShadow: isMobile ? '0 -1px 3px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          <MessageInput activeNavItem={activeNavItem} />
        </div>
      )}

      {/* Add mobile scroll and viewport styles */}
      {isMobile && (
        <style jsx="true">{`
          .mobile-scroll {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
          
          @supports (padding: env(safe-area-inset-bottom)) {
            .mobile-scroll {
              padding-bottom: calc(env(safe-area-inset-bottom) + ${inputHeight + 80}px);
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default ChatBox;