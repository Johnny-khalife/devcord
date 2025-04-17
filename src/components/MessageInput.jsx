import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useAuthStore } from "../store/useAuthStore";
import { sendDirectMessage, sendTypingIndicator } from "../lib/socket";

const MessageInput = ({ activeNavItem }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  
  const { sendMessage, sendDirectMessage: sendDirectMessageAPI, selectedFriend } = useChatStore();
  const { selectedWorkspace } = useWorkspaceStore();
  const { authUser, socket } = useAuthStore();
  
  // Store previous selectedFriend ID to detect changes
  const prevFriendIdRef = useRef(selectedFriend?.friendId);
  const prevWorkspaceIdRef = useRef(selectedWorkspace?._id);
  
  // Check if socket is connected
  const isSocketConnected = socket?.dm && socket.dm.connected;
  
  // Clear input when selected friend or workspace changes
  useEffect(() => {
    const currentFriendId = selectedFriend?.friendId;
    const currentWorkspaceId = selectedWorkspace?._id;
    
    // Check if the friend or workspace has changed
    if (currentFriendId !== prevFriendIdRef.current || 
        currentWorkspaceId !== prevWorkspaceIdRef.current) {
      // Clear the input
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Stop typing indicator if active
      if (prevFriendIdRef.current && isTyping && isSocketConnected) {
        sendTypingIndicator(prevFriendIdRef.current, false);
        setIsTyping(false);
      }
      
      // Update refs with current values
      prevFriendIdRef.current = currentFriendId;
      prevWorkspaceIdRef.current = currentWorkspaceId;
    }
  }, [selectedFriend?.friendId, selectedWorkspace?._id, isTyping, isSocketConnected]);

  // Focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle typing indicator
  const handleTyping = (e) => {
    const { value } = e.target;
    setText(value);
    
    // Only send typing indicators for direct messages when socket is connected
    if (activeNavItem === "users" && selectedFriend?.friendId && isSocketConnected) {
      // Set typing state
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        sendTypingIndicator(selectedFriend.friendId, true);
      }
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          sendTypingIndicator(selectedFriend.friendId, false);
        }
      }, 2000);
    }
  };
  
  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Ensure typing indicator is set to false when component unmounts
      if (selectedFriend?.friendId && isTyping && isSocketConnected) {
        sendTypingIndicator(selectedFriend.friendId, false);
      }
    };
  }, [selectedFriend?.friendId, isTyping, isSocketConnected]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      // Determine if this is a channel message or direct message
      if (activeNavItem === "workSpace" && selectedWorkspace?._id) {
        // Send channel message
        const messageData = {
          message: text.trim(),
          image: imagePreview,
        };
        await sendMessage(messageData, selectedWorkspace._id);
      } else if (activeNavItem === "users" && selectedFriend?.friendId) {
        // First, log debugging information
        console.log("Sending direct message:");
        console.log("- To friend:", selectedFriend.friendId, selectedFriend.username);
        console.log("- Message content:", text.trim());
        console.log("- Socket connected:", isSocketConnected);
        console.log("- Socket object:", socket);
        
        // Always use the API first to ensure message persistence
        console.log("Sending via API...");
        const messageData = {
          message: text.trim(),
          isCode: false,
          language: "text",
          image: imagePreview,
        };
        
        // Wait for API message to be sent and stored
        await sendDirectMessageAPI(messageData, selectedFriend.friendId);
        console.log("API message sent successfully");
        
        // Then use the socket for real-time delivery
        if (isSocketConnected) {
          console.log("Sending via socket...");
          const success = sendDirectMessage(selectedFriend.friendId, text.trim());
          console.log("Socket message sent result:", success);
        } else {
          console.warn("Socket not connected, message sent only via API");
        }
        
        // Stop typing indicator
        if (isTyping && isSocketConnected) {
          setIsTyping(false);
          sendTypingIndicator(selectedFriend.friendId, false);
        }
      } else {
        toast.error("Cannot send message - no chat selected");
        return;
      }
      
      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Focus the input field after sending the message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } catch (error) {
      console.error("Failed to send message:", error);
      console.error("Error details:", error.message);
      if (error.response) {
        console.error("Server responded with:", error.response.data);
      }
      toast.error("Failed to send message. Please try again.");
    }
  };

  // Handle key press in the input field
  const handleKeyPress = (e) => {
    // Send message on Enter press, but not on Shift+Enter (which allows for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            ref={inputRef}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;