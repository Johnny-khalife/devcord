import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, SmilePlus, Pin, PinOff } from "lucide-react";
import toast from "react-hot-toast";

// Direct message component for friend chats
const DirectMessage = ({ message }) => {
  const { authUser } = useAuthStore();
  const { deleteMessage } = useChatStore();

  // Check if current user is the sender
  const isCurrentUser = 
  message.senderId === authUser?._id || 
  message.senderId?._id === authUser?._id ||
  message.senderId === authUser?.id ||
  message.senderId?._id === authUser?.id;

  // Handle delete direct message
  const handleDeleteMessage = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      // Use true for isDirect parameter to indicate this is a direct message
      await deleteMessage(message._id, null, true);
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message: " + (error.message || "Unknown error"));
    }
  };

  // Get avatar URL
  // Get avatar URL
const getAvatarUrl = () => {
  if (isCurrentUser) {
    return authUser.avatar || "https://ui-avatars.com/api/?name=User&background=random";
  } else {
    // For messages you receive, show the sender's avatar
    return message.senderId?.avatar || "https://ui-avatars.com/api/?name=User&background=random";
  }
};

// Get username
const getUsername = () => {
  if (isCurrentUser) {
    return authUser.username || "You";
  } else {
    // For messages you receive, show the sender's username
    return message.senderId?.username || "Friend";
  }
};

  return (
    <div 
      id={`message-${message._id}`}
      className={`chat group ${isCurrentUser ? "chat-end" : "chat-start"}`}
    >
      <div className="chat-image avatar">
        <div className="w-10 h-10 rounded-full">
          <img 
            src={getAvatarUrl()}
            alt={getUsername()} 
          />
        </div>
      </div>
      
      <div className="chat-header mb-1 flex items-center gap-2 ">
        <span className="font-bold">
          {getUsername()}
        </span>
        <time className="text-xs opacity-50">
          {formatMessageTime(message.createdAt)}
        </time>
      </div>
      
      <div className={`chat-bubble ${isCurrentUser ? "bg-primary text-primary-content" : ""}`}>
        {message.content}
      </div>
      
      {/* Delete button - only for own messages */}
      <div className="chat-footer opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
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
  );
};

// Channel message component
const ChannelMessage = ({ message }) => {
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const { authUser } = useAuthStore();
  const { 
    deleteMessage, 
    reactToMessage, 
    pinMessage,
    selectedWorkspace,
  } = useChatStore();

  // Common emoji reactions
  const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "🎉", "👎", "🤔"];

  // Check if current user is the sender of this message
  const isCurrentUser = message.userId?._id === authUser?._id 
    || message.userId === authUser?._id;

  // Check if user is admin or owner of the workspace
  const isChannelAdminOrOwner = () => {
    if (!selectedWorkspace) return false;
    
    // Check if user is the creator of the workspace
    if (selectedWorkspace.createdBy === authUser._id) return true;
    
    // Check if user is in the admins list
    if (selectedWorkspace.admins && selectedWorkspace.admins.includes(authUser._id)) return true;
    
    return false;
  };

  // Handle message deletion for channel messages
  const handleDeleteMessage = async () => {
    // Add confirmation dialog
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }
    
    try {
      // Try to determine workspace ID - first check selectedWorkspace
      let workspaceId = selectedWorkspace?._id;
      
      // If selectedWorkspace doesn't have _id, try to get it from the message
      if (!workspaceId && message.workspaceId) {
        workspaceId = message.workspaceId;
      }
      
      // If we have a workspaceId, proceed with deletion
      if (workspaceId) {
        // Use false for isDirect parameter to indicate this is a channel message
        await deleteMessage(message._id, workspaceId, false);
      } else {
        // As a last resort, try to use the channel._id if it exists
        if (message.channelId) {
          await deleteMessage(message._id, message.channelId, false);
        } else {
          toast.error("Cannot delete: Missing workspace information");
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message: " + (error.message || "Unknown error"));
    }
  };

  // Handle emoji reaction
  const handleReaction = async (emoji) => {
    try {
      // Try to determine workspace ID - first check selectedWorkspace
      let workspaceId = selectedWorkspace?._id;
      
      // If selectedWorkspace doesn't have _id, try to get it from the message
      if (!workspaceId && message.workspaceId) {
        workspaceId = message.workspaceId;
      }
      
      // If we have a workspaceId, proceed with reaction
      if (workspaceId) {
        await reactToMessage(message._id, emoji, workspaceId, authUser._id);
        setShowEmojiMenu(false);
      } else {
        // As a last resort, try to use the channel._id if it exists
        if (message.channelId) {
          await reactToMessage(message._id, emoji, message.channelId, authUser._id);
          setShowEmojiMenu(false);
        } else {
          toast.error("Cannot add reaction: Missing workspace information");
        }
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction: " + (error.message || "Unknown error"));
      setShowEmojiMenu(false);
    }
  };

  // Handle pinning message
  const handlePinMessage = async () => {
    if (!authUser?._id) {
      toast.error("You must be logged in to pin messages");
      return;
    }

    // Try to determine workspace ID from various sources
    let workspaceId = selectedWorkspace?._id || message.workspaceId || message.channelId;
    
    if (!workspaceId) {
      toast.error("Cannot pin message: Missing workspace information");
      return;
    }

    // Check if user is admin or owner
    if (!isChannelAdminOrOwner()) {
      toast.error("Only channel admins and owners can pin messages");
      return;
    }

    try {
      await pinMessage(message._id, workspaceId);
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message: " + (error.message || "Unknown error"));
    }
  };

  // Check if user has reacted with a specific emoji
  const hasUserReacted = (reaction) => {
    return reaction.users?.some(user => {
      const userId = typeof user === 'object' ? user._id : user;
      return userId === authUser._id;
    });
  };

  return (
    <div 
      id={`message-${message._id}`}
      className={`chat group ${isCurrentUser ? "chat-end" : "chat-start"}`}
    >
      <div className="chat-image avatar">
        <div className="w-10 h-10 rounded-full">
          <img 
            src={
              message.userId?.avatar || 
              "https://ui-avatars.com/api/?name=User&background=random"
            } 
            alt={message.userId?.username || "User"} 
          />
        </div>
      </div>
      
      <div className="chat-header mb-1 flex items-center gap-2">
        <span className="font-bold">
          {message.userId?.username || "Unknown User"}
        </span>
        <time className="text-xs opacity-50">
          {formatMessageTime(message.createdAt)}
        </time>
        
        {message.isPinned && (
          <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
            Pinned
          </span>
        )}
      </div>
      
      <div className={`chat-bubble ${isCurrentUser ? "bg-primary text-primary-content" : ""}`}>
        {message.content}
        {message.image && (
          <img 
            src={message.image} 
            alt="Message attachment" 
            className="max-w-full rounded mt-2 max-h-64 object-contain"
          />
        )}
      </div>
      
      {/* Reactions display */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="chat-footer flex gap-1 mt-1 flex-wrap">
          {message.reactions.map((reaction, index) => (
            <button
              key={`${reaction.emoji}-${index}`}
              className={`btn btn-xs ${
                hasUserReacted(reaction) ? "btn-accent" : "btn-ghost"
              }`}
              onClick={() => handleReaction(reaction.emoji)}
            >
              {reaction.emoji} {reaction.users?.length || 0}
            </button>
          ))}
        </div>
      )}
      
      {/* Message actions */}
      <div className="chat-footer opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
        {/* Emoji reaction button */}
        <div className="relative">
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setShowEmojiMenu(!showEmojiMenu)}
          >
            <SmilePlus size={14} />
          </button>
          
          {showEmojiMenu && (
            <div className="absolute bottom-full mb-2 p-2 bg-base-200 rounded-lg shadow-lg z-10 flex gap-1 flex-wrap max-w-[200px]">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Pin/Unpin button - Only for admins/owners in workspace chats */}
        {isChannelAdminOrOwner() && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={handlePinMessage}
          >
            {message.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        )}
        
        {/* Delete button - only for own messages or admins */}
        {(isCurrentUser || isChannelAdminOrOwner()) && (
          <button
            className="btn btn-ghost btn-xs text-error"
            onClick={handleDeleteMessage}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// Main Message component that decides which one to render
const Message = ({ message, activeNavItem }) => {
  // Render DirectMessage or ChannelMessage based on activeNavItem
  if (activeNavItem === "users") {
    return <DirectMessage message={message} />;
  } else {
    return <ChannelMessage message={message} />;
  }
};

export default Message; 