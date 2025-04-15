// import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Loader2, X, ArrowLeft, MessageSquare } from "lucide-react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import MessageSearch from "./MessageSearch";
import DirectMessageSearch from "./DirectMessageSearch";
import NoChatSelected from "./NoChatSelected";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useAuthStore } from "../store/useAuthStore";
import MessageSkeleton from "./skeletons/MessageSkeleton";

// Common emoji reactions
const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "🎉", "👎", "🤔"];

// Modified NoChatSelected component with reopen functionality
const CustomNoChatSelected = ({ lastFriend, onReopen }) => {
  if (!lastFriend) {
    return <NoChatSelected />;
  }

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6 pt-28">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Chat Closed</h2>
        <p className="text-base-content/60 mb-6">
          You closed your conversation with {lastFriend.username}
        </p>
        
        <button 
          onClick={onReopen}
          className="btn btn-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Reopen Chat
        </button>
      </div>
    </div>
  );
};

const ChatBox = ({ activeNavItem }) => {
  const messageEndRef = useRef(null);
  const { authUser } = useAuthStore();
  const [showChat, setShowChat] = useState(true);
  const [lastClosedFriend, setLastClosedFriend] = useState(null);
  const { 
    messages, 
    directMessages, 
    loading, 
    error, 
    getMessages, 
    getDirectMessages, 
    selectedFriend
  } = useChatStore();
  const { selectedWorkspace } = useWorkspaceStore();

  // Handle closing the direct message chat
  const handleCloseChat = () => {
    if (activeNavItem === "users") {
      setLastClosedFriend(selectedFriend);
      setShowChat(false);
    }
  };

  // Handle reopening the direct message chat
  const handleReopenChat = () => {
    setShowChat(true);
  };

  // Reset showChat when selectedFriend changes
  useEffect(() => {
    if (selectedFriend) {
      setShowChat(true);
    }
  }, [selectedFriend]);

  console.log("what is the id of selectedworkspace", selectedWorkspace);

  console.log("messages is gfdstbsdfsjkbs,ds", messages);
  useEffect(() => {
    if (activeNavItem === "workSpace" && selectedWorkspace?._id) {
      getMessages(selectedWorkspace._id);
    } else if (activeNavItem === "users" && selectedFriend?.friendId) {
      getDirectMessages(selectedFriend.friendId);
    }
  }, [
    selectedWorkspace?._id, 
    selectedFriend?.friendId, 
    activeNavItem,
    getMessages,
    getDirectMessages
  ]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, directMessages]);

  // If chat is closed and in direct messages view, show NoChatSelected
  if (!showChat && activeNavItem === "users") {
    return <CustomNoChatSelected lastFriend={lastClosedFriend} onReopen={handleReopenChat} />;
  }

  // Determine which messages to display based on the active navigation
  const messagesToDisplay = activeNavItem === "workSpace" ? messages : directMessages;
  
  // Sort messages by creation date
  const sortedMessages = [...messagesToDisplay].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // Generate the appropriate title based on active navigation
  const renderTitle = () => {
    if (activeNavItem === "workSpace") {
      // Display channel name when in workspace view
      if (selectedWorkspace?.channelName) {
        return selectedWorkspace.channelName;
      } else if (selectedWorkspace?.name) {
        return selectedWorkspace.name;
      } else if (selectedWorkspace?.workspaceName) {
        return selectedWorkspace.workspaceName;
      } else {
        return "Select a workspace";
      }
    } else if (activeNavItem === "users") {
      return selectedFriend?.username || "Select a friend";
    }
    return "Chat";
  };

  // Process direct messages for UI rendering
  const processDirectMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) return [];
    
    return messages.map(message => {
      const isSender = message.senderId === authUser?._id;
      
      // Format sender info consistently for both sent and received messages
      const userId = isSender ? authUser : {
        _id: message.senderId,
        username: message.sender?.username || selectedFriend?.username || "Friend",
        avatar: message.sender?.avatar || selectedFriend?.avatar
      };
      console.log("selcted friendsa", selectedFriend);
      return {
        ...message,
        userId,
        isSentByMe: isSender
      };
    });
  };

  // Final messages to render
  const messagesForDisplay = activeNavItem === "workSpace" 
    ? sortedMessages 
    : processDirectMessages(sortedMessages);

  return (
    <div className="h-screen p-4 flex flex-col border-l border-l-zinc-800">
      {/* Fixed header */}
      <div className="bg-base-200 p-4 border-b border-b-zinc-800 sticky top-0 z-10">
        {activeNavItem === "users" && selectedFriend ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-8 h-8 rounded-full">
                  <img 
                    src={selectedFriend.avatar || "https://ui-avatars.com/api/?name=" + selectedFriend.username} 
                    alt={selectedFriend.username}
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold">{selectedFriend.username}</h2>
            </div>
            <div className="flex items-center gap-2">
              <DirectMessageSearch friendId={selectedFriend.friendId} />
              <button
                onClick={handleCloseChat}
                className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-md"
                style={{ 
                  width: '36px', 
                  height: '36px'
                }}
              >
                <X size={18} color="white" strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{renderTitle()}</h2>
            <div className="flex items-center gap-2">
              {/* Only show search in workspace view with a valid workspace */}
              {activeNavItem === "workSpace" && selectedWorkspace?._id && (
                <MessageSearch channelId={selectedWorkspace._id} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto p-4 pt-16 space-y-4">
        {loading ? (
          <div className="flex h-[200px] w-full items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : messagesForDisplay.length === 0 ? (
          <div className="p-4 text-center text-zinc-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messagesForDisplay.map((message) => (
            <Message 
              key={message._id} 
              message={message} 
              activeNavItem={activeNavItem}
            />
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Fixed message input at bottom */}
      <div className="sticky bottom-0 mt-5 bg-base-100 border-t border-zinc-800 z-10">
        <MessageInput activeNavItem={activeNavItem} />
      </div>
    </div>
  );
};

export default ChatBox;