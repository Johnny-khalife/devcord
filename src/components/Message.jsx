import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, SmilePlus, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

// Direct message component for friend chats
const DirectMessage = ({ message, firstInGroup }) => {
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
      await deleteMessage(message._id, null, true);
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(
        "Failed to delete message: " + (error.message || "Unknown error")
      );
    }
  };

  return (
    <div
      id={`message-${message._id}`}
      className="group flex items-start gap-2 px-4 py-1 hover:bg-base-200/50 transition-colors flex-row"
    >
      <div
        className={`flex flex-col max-w-[75%] ${
          isCurrentUser ? "ml-auto" : ""
        }`}
      >
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

        {/* Bubble */}
        <div className="relative group">
          <div
            className={`rounded-2xl px-4 py-2 text-sm ${
              isCurrentUser
                ? `bg-primary text-primary-content ${
                    firstInGroup ? "rounded-tr-none" : ""
                  }`
                : `bg-base-300 ${firstInGroup ? "rounded-tl-none" : ""}`
            }`}
          >
            {message.content}
          </div>

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
      </div>
    </div>
  );
};

// Channel message component
const ChannelMessage = ({ message, firstInGroup }) => {
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
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

        <div className="relative group">
          <div
            className={`rounded-2xl px-4 py-2 text-sm ${
              isCurrentUser
                ? `bg-primary text-primary-content ${
                    firstInGroup ? "rounded-tr-none" : ""
                  }`
                : `bg-base-300 ${firstInGroup ? "rounded-tl-none" : ""}`
            }`}
          >
            {message.content}
            {message.image && (
              <img
                src={message.image}
                alt="Message attachment"
                className="mt-2 rounded-lg max-h-64 object-contain"
              />
            )}
          </div>

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
  return activeNavItem === "workSpace" ? (
    <ChannelMessage message={message} firstInGroup={firstInGroup} />
  ) : (
    <DirectMessage message={message} firstInGroup={firstInGroup} />
  );
};

export default Message;
