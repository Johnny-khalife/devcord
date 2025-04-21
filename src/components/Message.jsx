import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, SmilePlus, MoreVertical, Maximize, Download } from "lucide-react";
import toast from "react-hot-toast";
import MessageSkeleton from "./skeletons/MessageSkeleton";

// Direct message component for friend chats
const DirectMessage = ({ message, firstInGroup }) => {
  const { deleteMessage, isMessagesLoading } = useChatStore();
  const [imageViewer, setImageViewer] = useState(false);

  // Use the isSentByMe property set in useChatStore processing
  // This ensures proper consistency with how messages are processed
  const isCurrentUser = message.isSentByMe === true;
  
  console.log("DirectMessage rendering:", {
    messageId: message._id,
    isCurrentUser,
    isSentByMe: message.isSentByMe,
    content: message.content,
    image:message.image,
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
  
  if (isMessagesLoading) {
    return <MessageSkeleton/>
  }

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
        {firstInGroup && (
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
            >
              {message.content}
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
  const { deleteMessage, reactToMessage, selectedWorkspace } = useChatStore();

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
  const isCurrentUser =
    message.userId?._id === authUser?._id || message.userId === authUser?._id;

  // Check if user is admin or owner of the workspace
  const isChannelAdminOrOwner = () => {
    if (!selectedWorkspace) return false;
    if (selectedWorkspace.createdBy === authUser._id) return true;
    if (
      selectedWorkspace.admins &&
      selectedWorkspace.admins.includes(authUser._id)
    )
      return true;
    return false;
  };

  // Handle message deletion
  const handleDeleteMessage = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      let workspaceId = selectedWorkspace?._id;
      if (!workspaceId && message.workspaceId) {
        workspaceId = message.workspaceId;
      }

      if (workspaceId) {
        await deleteMessage(message._id, workspaceId, false);
      } else if (message.channelId) {
        await deleteMessage(message._id, message.channelId, false);
      } else {
        toast.error("Cannot delete: Missing workspace information");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(
        "Failed to delete message: " + (error.message || "Unknown error")
      );
    }
  };

  // Handle emoji reaction
  const handleReaction = async (emoji) => {
    try {
      let workspaceId = selectedWorkspace?._id;
      if (!workspaceId && message.workspaceId) {
        workspaceId = message.workspaceId;
      }

      if (workspaceId) {
        await reactToMessage(message._id, emoji, workspaceId, authUser._id);
        setShowEmojiMenu(false);
      } else if (message.channelId) {
        await reactToMessage(
          message._id,
          emoji,
          message.channelId,
          authUser._id
        );
        setShowEmojiMenu(false);
      } else {
        toast.error("Cannot add reaction: Missing workspace information");
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error(
        "Failed to add reaction: " + (error.message || "Unknown error")
      );
      setShowEmojiMenu(false);
    }
  };

  // Check if user has reacted with a specific emoji
  const hasUserReacted = (reaction) => {
    return reaction.users?.some((user) => {
      const userId = typeof user === "object" ? user._id : user;
      return userId === authUser._id;
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
              src={
                message.userId?.avatar ||
                "https://ui-avatars.com/api/?name=User&background=random"
              }
              alt={message.userId?.username || "User"}
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
        {firstInGroup && (
          <div
            className={`flex items-center gap-2 mb-1 ${
              isCurrentUser ? "justify-end" : ""
            }`}
          >
            <span className="text-sm font-semibold">
              {isCurrentUser
                ? "You"
                : message.userId?.username || "Unknown User"}
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
              className={`rounded-2xl px-4 py-2 text-sm ${
                isCurrentUser
                  ? `bg-primary text-primary-content ${
                      firstInGroup ? "rounded-tr-none" : ""
                    } ${message.image ? "rounded-b-none" : ""}`
                  : `bg-base-300 ${firstInGroup ? "rounded-tl-none" : ""} ${message.image ? "rounded-b-none" : ""}`
              }`}
            >
              {message.content}
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
            {!isCurrentUser && (
              <div className="relative">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                >
                  <SmilePlus size={14} />
                </button>

                {showEmojiMenu && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-base-100 rounded-lg shadow-lg flex gap-1 flex-wrap w-48 z-20 touch-auto">
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
            )}

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
          <div className="flex gap-1 mt-1 flex-wrap">
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
      </div>
    </div>
  );
};

const Message = ({ message, activeNavItem, firstInGroup }) => {
  // Log message details to debug
  console.log("Message component rendering:", {
    id: message._id,
    content: message.content,
    sender: message.sender?.username || message.userId?.username,
    isSentByMe: message.isSentByMe,
    activeNavItem
  });
  
  return activeNavItem === "workSpace" ? (
    <ChannelMessage message={message} firstInGroup={firstInGroup} />
  ) : (
    <DirectMessage message={message} firstInGroup={firstInGroup} />
  );
};

export default Message;
