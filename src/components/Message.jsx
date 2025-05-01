import { useState, memo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime, convertUrlsToLinks } from "../lib/utils.jsx";
import { Trash2, SmilePlus, MoreVertical, Maximize, Download } from "lucide-react";
import toast from "react-hot-toast";
import MessageSkeleton from "./skeletons/MessageSkeleton";

// Direct message component for friend chats
const DirectMessage = ({ message, firstInGroup }) => {
  const { deleteMessage } = useChatStore();
  const [imageViewer, setImageViewer] = useState(false);
  const { authUser } = useAuthStore();

  // Use the isSentByMe property set in useChatStore processing
  // If isSentByMe is not explicitly set, check if the message is from the current user
  const isSentByMe = message.isSentByMe === true;
  const senderId = message.senderId || message.sender?.userId;
  const isCurrentUser = isSentByMe || (authUser && senderId === authUser._id);
  
  console.log("DirectMessage rendering:", {
    messageId: message._id,
    isCurrentUser,
    isSentByMe: message.isSentByMe,
    senderId,
    authUserId: authUser?._id,
    content: message.content,
    image: message.image,
    isDeleted: message.isDeleted
  });

  // Handle delete direct message
  const handleDeleteMessage = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      await deleteMessage(message._id, null, true);
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(
        "Failed to delete message: " + (error.message || "Unknown error")
      );
    }
  };
  
  if (message.isDeleted) {
    return (
      <div
        id={`message-${message._id}`}
        className={`group flex items-start gap-2 px-4 py-1 hover:bg-base-200/50 transition-colors ${
          isCurrentUser ? "flex-row-reverse justify-start" : "flex-row"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500 italic">
            Message deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message._id}`}
      className={`group flex items-start gap-2 px-4 py-1 hover:bg-base-200/50 transition-colors ${
        isCurrentUser ? "flex-row-reverse justify-start" : "flex-row"
      }`}
    >
     

      <div className={`flex flex-col max-w-[75%] `}>
        {/* Timestamp for messages */}
        {message.showTimestamp && (
          <div
            className={`flex items-center gap-2 mb-1 ${
              isCurrentUser ? "justify-end" : ""
            }`}
          >
          
            <time className="text-xs text-base-content/50">
              {formatMessageTime(message.createdAt)}
            </time>
          </div>
        )}

        {/* Combined message container for text and/or image */}
        <div className={`relative group flex flex-col ${message.content && message.image ? "gap-[1px]" : ""}`}>
          {/* Content Bubble */}
          {message.content && (
            <div 
              className={`rounded-2xl px-4 py-2 text-sm break-words w-full ${
                isCurrentUser
                  ? `bg-primary text-primary-content ${
                      firstInGroup ? "rounded-tr-none" : ""
                    } ${message.image ? "rounded-b-none" : ""}`
                  : `bg-base-300 ${firstInGroup ? "rounded-tl-none" : ""} ${message.image ? "rounded-b-none" : ""}`
              }`}
              data-message-id={message._id}
            >
              <div className="whitespace-pre-wrap break-words">
                {convertUrlsToLinks(message.content,isCurrentUser)}
              </div>
              {message.isPending && (
                <div className="absolute -bottom-1 right-1">
                  <div className="w-1 h-1 border-1 border-white border-t-transparent rounded-full animate-spin opacity-50"></div>
                </div>
              )}
            </div>
          )}

          {/* Image (connected to text bubble if both exist) */}
          {message.image && (
            <div 
              className={`relative group/image ${!message.content ? "mt-0" : ""}`}
              style={{ marginTop: message.content ? "-1px" : "0" }}
            >
              <div 
                className={`overflow-hidden shadow-md border-x border-b ${
                  message.content 
                    ? isCurrentUser 
                      ? "border-primary/70 bg-primary/5 rounded-b-lg" 
                      : "border-base-300/70 bg-base-300/5 rounded-b-lg" 
                    : "border-t rounded-lg border-base-200 bg-transparent"
                }`}
              >
                <img
                  src={message.image}
                  alt="Message attachment"
                  className={`w-full max-h-64 object-cover hover:scale-[1.02] transition-transform cursor-pointer ${
                    message.content ? "rounded-b-lg" : "rounded-lg"
                  }`}
                  onClick={() => setImageViewer(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <button 
                    className="btn btn-circle btn-xs bg-black/50 text-white hover:bg-black/70 border-none"
                    onClick={() => setImageViewer(true)}
                  >
                    <Maximize size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCurrentUser && (
            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={handleDeleteMessage}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        
        {/* Full screen image viewer */}
        {imageViewer && message.image && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImageViewer(false)}>
            <div className="relative max-w-4xl max-h-[90vh]">
              <img 
                src={message.image} 
                alt="Message attachment" 
                className="max-h-[90vh] max-w-full object-contain rounded-md" 
              />
              <button 
                className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/50 text-white hover:bg-black/70 border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageViewer(false);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Channel message component
const ChannelMessage = ({ message, firstInGroup }) => {
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [imageViewer, setImageViewer] = useState(false);
  const { authUser } = useAuthStore();
  const { deleteMessage, addReaction, selectedChannel } = useChatStore();

  // Common emoji reactions
  const COMMON_EMOJIS = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "👏",
    "🔥",
    "🎉",
    "👎",
    "🤔",
  ];

  // Check if current user is the sender
  // First use isSentByMe if explicitly set, otherwise compare IDs
  let isCurrentUser = message.isSentByMe === true;
  
  if (!isCurrentUser) {
    // Extract user ID, which might be nested
    const messageUserId = message.userId?._id || message.userId;
    const messageSenderId = message.senderId?._id || message.senderId;
    
    // Check all possible ID locations
    isCurrentUser = 
      (messageUserId && messageUserId === authUser?._id) ||
      (messageSenderId && messageSenderId === authUser?._id);
  }
  
  // Get sender information (username and avatar)
  const getSenderInfo = () => {
    if (isCurrentUser) {
      return {
        username: "You",
        avatar: authUser?.avatar || "https://ui-avatars.com/api/?name=You&background=random"
      };
    }
    
    // Try to get sender info from various possible locations
    const username = message.sender?.username || 
                    (message.userId?.username) ||
                    (typeof message.userId === 'object' ? message.userId.username : null) ||
                    (typeof message.senderId === 'object' ? message.senderId.username : null);
                    
    const avatar = message.sender?.avatar || 
                  (message.userId?.avatar) ||
                  (typeof message.userId === 'object' ? message.userId.avatar : null) ||
                  (typeof message.senderId === 'object' ? message.senderId.avatar : null) ||
                  "https://ui-avatars.com/api/?name=User&background=random";
    
    return {
      username: username || "Unknown User",
      avatar: avatar
    };
  };
  
  const senderInfo = getSenderInfo();
  
  console.log("ChannelMessage rendering:", {
    messageId: message._id,
    userId: message.userId,
    senderId: message.senderId,
    sender: message.sender,
    authUserId: authUser?._id,
    isCurrentUser,
    senderInfo,
    content: message.content
  });

  // Check if the user is an admin or owner - needed for permission checks
  const isChannelAdminOrOwner = () => {
    // Implementation depends on how your permissions are structured
    return true; // Placeholder - replace with actual logic
  };

  // Handle message deletion using real-time socket function
  const handleDeleteMessage = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      // Get the channel ID from the message or selected channel
      const channelId = message.channelId || selectedChannel?._id;
      
      if (!channelId) {
        toast.error("Cannot delete message: Channel ID not found");
        return;
      }
      
      // Call the delete function with the right parameters for channel messages
      await deleteMessage(message._id, channelId, false);
      
      // No need for toast notification as the UI will update via socket event
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Handle adding reaction using real-time socket function
  const handleReaction = async (emoji) => {
    if (!emoji) return;
    
    try {
      // Get the channel ID from the message or selected channel
      const channelId = message.channelId || selectedChannel?._id;
      
      if (!channelId) {
        toast.error("Cannot add reaction: Channel ID not found");
        return;
      }
      
      // Hide emoji menu
      setShowEmojiMenu(false);
      
      // Call the reaction function
      await addReaction(message._id, channelId, emoji);
      
      // No need for toast or local state update as the UI will update via socket event
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  // Check if current user has already used this reaction
  const hasUserReacted = (reaction) => {
    if (!message.reactions || !Array.isArray(message.reactions)) return false;
    
    return message.reactions.some(r => {
      // Check the new reaction format
      if (r.userId === authUser?._id && (r.reaction === reaction || r.emoji === reaction)) {
        return true;
      }
      
      // Check the old format where reactions had a users array
      if (r.emoji === reaction && r.users && Array.isArray(r.users)) {
        return r.users.some(userId => 
          userId === authUser?._id || 
          (typeof userId === 'object' && userId._id === authUser?._id)
        );
      }
      
      return false;
    });
  };

  return (
    <div
      id={`message-${message._id}`}
      className="group flex items-start gap-2 px-4 py-1 hover:bg-base-200/50 transition-colors flex-row"
    >
      {firstInGroup && !isCurrentUser && (
        <div className="avatar mt-1">
          <div className="w-8 h-8 rounded-full ring-1 ring-base-300">
            <img
              src={senderInfo.avatar}
              alt={senderInfo.username}
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[75%] ${!firstInGroup ? "ml-10" : ""} ${
          isCurrentUser ? "ml-auto" : ""
        }`}
      >
        {message.showTimestamp && (
          <div
            className={`flex items-center gap-2 mb-1 ${
              isCurrentUser ? "justify-end" : ""
            }`}
          >
            <span className="text-sm font-semibold">
              {senderInfo.username}
            </span>
            <time className="text-xs text-base-content/50">
              {formatMessageTime(message.createdAt)}
            </time>
          </div>
        )}

        {/* Combined message container for text and/or image */}
        <div className={`relative group flex flex-col ${message.content && message.image ? "gap-[1px]" : ""}`}>
          {/* Content Bubble */}
          {message.content && (
            <div 
              className={`rounded-2xl px-4 py-2 text-sm break-words w-full ${
                isCurrentUser
                  ? `bg-primary text-primary-content ${
                      firstInGroup ? "rounded-tr-none" : ""
                    } ${message.image ? "rounded-b-none" : ""}`
                  : `bg-base-300 ${firstInGroup ? "rounded-tl-none" : ""} ${message.image ? "rounded-b-none" : ""}`
              }`}
              data-message-id={message._id}
            >
              <div className="whitespace-pre-wrap break-words">
                {convertUrlsToLinks(message.content)}
              </div>
              {message.isPending && (
                <div className="absolute -bottom-1 right-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin opacity-50"></div>
                </div>
              )}
            </div>
          )}

          {/* Image (connected to text bubble if both exist) */}
          {message.image && (
            <div 
              className={`relative group/image ${!message.content ? "mt-0" : ""}`}
              style={{ marginTop: message.content ? "-1px" : "0" }}
            >
              <div 
                className={`overflow-hidden shadow-md border-x border-b ${
                  message.content 
                    ? isCurrentUser 
                      ? "border-primary/70 bg-primary/5 rounded-b-lg" 
                      : "border-base-300/70 bg-base-300/5 rounded-b-lg" 
                    : "border-t rounded-lg border-base-200 bg-transparent"
                }`}
              >
                <img
                  src={message.image}
                  alt="Message attachment"
                  className={`w-full max-h-64 object-cover hover:scale-[1.02] transition-transform cursor-pointer ${
                    message.content ? "rounded-b-lg" : "rounded-lg"
                  }`}
                  onClick={() => setImageViewer(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <button 
                    className="btn btn-circle btn-xs bg-black/50 text-white hover:bg-black/70 border-none"
                    onClick={() => setImageViewer(true)}
                  >
                    <Maximize size={12} />
                  </button>
                  <a 
                    href={message.image} 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-circle btn-xs bg-black/50 text-white hover:bg-black/70 border-none"
                  >
                    <Download size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Message actions */}
          <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <div className="relative">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setShowEmojiMenu(!showEmojiMenu)}
              >
                <SmilePlus size={14} />
              </button>

              {/* Emoji menu */}
              {showEmojiMenu && (
                <div
                  className="absolute top-0 right-0 mt-8 bg-base-200 rounded-md shadow-lg p-2 z-10 border border-base-300"
                  onMouseLeave={() => setShowEmojiMenu(false)}
                >
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className={`btn btn-xs hover:bg-primary/20 ${hasUserReacted(emoji) ? "bg-primary/20" : "btn-ghost"}`}
                        onClick={() => handleReaction(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Only show delete button for the user's own messages */}
            {isCurrentUser && (
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={handleDeleteMessage}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Full screen image viewer */}
        {imageViewer && message.image && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImageViewer(false)}>
            <div className="relative max-w-4xl max-h-[90vh]">
              <img 
                src={message.image} 
                alt="Message attachment" 
                className="max-h-[90vh] max-w-full object-contain rounded-md" 
              />
              <button 
                className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/50 text-white hover:bg-black/70 border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageViewer(false);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction, index) => {
              // Get the emoji and count
              const emoji = reaction.reaction || reaction.emoji;
              let count = 0;
              
              // Calculate count based on reaction format
              if (reaction.users && Array.isArray(reaction.users)) {
                count = reaction.users.length;
              } else if (reaction.count) {
                count = reaction.count;
              } else {
                count = 1; // Default count if no structure is available
              }
              
              return (
                <button
                  key={`${emoji}-${index}`}
                  className={`btn btn-xs ${
                    hasUserReacted(emoji) ? "btn-accent" : "btn-ghost"
                  }`}
                  onClick={() => handleReaction(emoji)}
                  title={`${count} reaction${count !== 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="ml-1">{count}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Message component
const Message = ({ message, activeNavItem, firstInGroup }) => {
  // Get auth user to determine if message is sent by current user
  const { authUser } = useAuthStore();
  
  // Get senderId - could be an object or string depending on message source
  let senderId = message.senderId;
  if (senderId && typeof senderId === 'object' && senderId._id) {
    senderId = senderId._id;
  } else if (message.sender?.userId) {
    senderId = message.sender.userId;
  } else if (message.userId) {
    senderId = message.userId;
  }
  
  // Get username
  const senderName = message.sender?.username || 
                     (message.senderId && typeof message.senderId === 'object' ? message.senderId.username : null) ||
                     message.userId?.username;
  
  // Log message details to debug
  console.log("Message component rendering:", {
    id: message._id,
    content: message.content || message.message,
    sender: senderName,
    senderId,
    authUserId: authUser?._id,
    isSentByMe: message.isSentByMe,
    activeNavItem
  });
  
  // If message is optimistic and lacks proper ID structure, use default values
  const processedMessage = {
    ...message,
    _id: message._id || `temp-${Date.now()}`,
    content: message.content || message.message || "",
    // Set isSentByMe flag if it's not already set
    isSentByMe: message.isSentByMe !== undefined 
      ? message.isSentByMe 
      : (senderId && authUser && senderId === authUser._id)
  };
  
  return activeNavItem === "workSpace" ? (
    <ChannelMessage message={processedMessage} firstInGroup={firstInGroup} />
  ) : (
    <DirectMessage message={processedMessage} firstInGroup={firstInGroup} />
  );
};

// Memoize the components
const MemoizedDirectMessage = memo(DirectMessage);
const MemoizedChannelMessage = memo(ChannelMessage);
const MemoizedMessage = memo(Message);

export default MemoizedMessage;
