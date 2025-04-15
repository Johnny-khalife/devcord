// import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
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

const ChatBox = ({ activeNavItem }) => {
  const messageEndRef = useRef(null);
  const { authUser } = useAuthStore();
  const [showChat, setShowChat] = useState(true);
  const {
    messages,
    directMessages,
    loading,
    error,
    getMessages,
    getDirectMessages,
    selectedFriend,
    setSelectedFriend,
  } = useChatStore();
  const { selectedWorkspace } = useWorkspaceStore();

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

  useEffect(() => {
    if (activeNavItem === "workSpace" && selectedWorkspace?._id) {
      getMessages(selectedWorkspace._id);
    } else if (activeNavItem === "users" && selectedFriend?.friendId && showChat) {
      getDirectMessages(selectedFriend.friendId);
    }
  }, [
    selectedWorkspace?._id,
    selectedFriend?.friendId,
    activeNavItem,
    getMessages,
    getDirectMessages,
    showChat
  ]);

  useEffect(() => {
    setTimeout(() => {
      if (showChat && ((activeNavItem === 'users' && selectedFriend) || (activeNavItem === 'workSpace' && selectedWorkspace))) {
         messageEndRef.current?.scrollIntoView({ behavior: "auto" });
      }
    }, 50);
  }, [messages, directMessages, selectedFriend, selectedWorkspace, activeNavItem, showChat]);

  const isWorkspaceSelected = activeNavItem === 'workSpace' && selectedWorkspace;
  const isFriendChatVisible = activeNavItem === 'users' && selectedFriend && showChat;

  const messagesToDisplaySource = activeNavItem === "workSpace" ? messages : directMessages;

  const sortedMessages = [...(messagesToDisplaySource || [])].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

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
       const isSender = message.senderId === authUser._id || message.senderId?._id === authUser._id;
       const userId = isSender
         ? { _id: authUser._id, username: "You", avatar: authUser.avatar }
         : {
             _id: message.senderId?._id || message.senderId,
             username:
               message.sender?.username || selectedFriend?.username || "Friend",
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
    if (idx > 0 && arr[idx - 1]) {
       const prevMsg = arr[idx - 1];
       prevSenderId = prevMsg.userId?._id || prevMsg.senderId?._id || prevMsg.senderId;
    }
    return {
      ...msg,
      firstInGroup: !prevSenderId || senderId !== prevSenderId,
    };
  });

  let mainContent;
  const shouldShowChatContent = isFriendChatVisible || isWorkspaceSelected;

  if ((activeNavItem === 'users' && !selectedFriend) || (activeNavItem === 'workSpace' && !selectedWorkspace)) {
      mainContent = <NoChatSelected />;
  } else if (loading) {
      mainContent = (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-base-content/50" />
          </div>
      );
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
              <div ref={messageEndRef} />
          </>
      );
  } else {
       mainContent = <NoChatSelected />;
  }

  const showInput = shouldShowChatContent;

  return (
    <div className="h-screen flex flex-col bg-base-100 border-l border-base-300 overflow-hidden pt-16">
      {/* Header Section (Not Sticky) */}
      <div className="flex-shrink-0 bg-base-200 p-3 border-b border-base-300 shadow-sm">
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
            ) : null}
            <h2 className="text-lg font-semibold truncate">{renderTitle()}</h2>
          </div>
          {/* Right side (Actions) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isWorkspaceSelected && selectedWorkspace?._id && (
              <MessageSearch channelId={selectedWorkspace._id} />
            )}
            {isFriendChatVisible && (
                <>
                  <DirectMessageSearch friendId={selectedFriend.friendId} />
                  <button
                    onClick={handleCloseChat}
                    className="btn btn-ghost btn-sm btn-circle"
                    aria-label="Close chat"
                  >
                    <X size={20} />
                  </button>
                </>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Messages Area or Placeholder */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-base-100">
        {mainContent}
      </div>

      {/* Message Input Section (Sticky Bottom) - Render conditionally */}
      {showInput && (
        <div className="flex-shrink-0 p-3 bg-base-200 border-t border-base-300 sticky bottom-0 z-10">
          <MessageInput activeNavItem={activeNavItem} />
        </div>
      )}
    </div>
  );
};

export default ChatBox;