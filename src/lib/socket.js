import { io } from 'socket.io-client';
import { BACKEND_URL } from '../constants/api';
import toast from 'react-hot-toast';

// Stores that need access to socket events
let authStore = null;
let chatStore = null;

// Socket instance - will be initialized in connectSockets
let dmSocket = null;

/**
 * Set the store references for socket event handlers to use
 */
export const setStoreRefs = (auth, chat) => {
  authStore = auth;
  chatStore = chat;
};

/**
 * Get token from cookies
 */
const getTokenFromCookies = () => {
  const cookies = document.cookie.split(';');
  
  // Debug cookie contents
  console.log("All cookies:", document.cookie);
  
  // Try to find either the jwt or auth_token cookie
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    
    if (cookie.startsWith('jwt=')) {
      console.log("Found JWT cookie");
      return cookie.substring(4);
    }
    
    if (cookie.startsWith('auth_token=')) {
      console.log("Found auth_token cookie");
      return cookie.substring(11);
    }
  }
  
  // Fallback: Try to get token from localStorage
  const localToken = localStorage.getItem('auth_token');
  if (localToken) {
    console.log("Found token in localStorage");
    return localToken;
  }
  
  console.log("No token found in cookies or localStorage");
  return null;
};

/**
 * Connect to all socket.io namespaces
 */
export const connectSockets = () => {
  console.log("Attempting to connect to sockets...");
  
  // Get JWT token from cookies
  const token = getTokenFromCookies();
  
  if (!token) {
    console.error('No token found in cookies for socket connection');
    return { dm: null };
  }

  // Create the socket connection for direct messages namespace
  try {
    console.log("Creating socket connection with token...");
    
    // Disconnect any existing socket first
    if (dmSocket) {
      console.log("Disconnecting existing socket before reconnecting...");
      dmSocket.disconnect();
      dmSocket = null;
    }
    
    // Create new connection with auth options
    dmSocket = io(`${BACKEND_URL}/dm`, {
      withCredentials: true,
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    });

    // Set up event listeners for DM socket
    setupDMSocketListeners();

    return {
      dm: dmSocket
    };
  } catch (error) {
    console.error('Error connecting to socket:', error);
    toast.error('Failed to connect to messaging service');
    return { dm: null };
  }
};

/**
 * Disconnect all socket connections
 */
export const disconnectSockets = () => {
  console.log("Disconnecting from sockets...");
  if (dmSocket) {
    dmSocket.disconnect();
    dmSocket = null;
  }
};

/**
 * Set up listeners for DM socket events
 */
const setupDMSocketListeners = () => {
  if (!dmSocket) return;

  // Connection events
  dmSocket.on('connect', () => {
    console.log('🟢 Connected to DM socket');
  });

  dmSocket.on('connect_error', (error) => {
    console.error('🔴 DM socket connection error:', error);
    toast.error('Could not connect to messaging service');
  });

  dmSocket.on('disconnect', (reason) => {
    console.log('🟠 Disconnected from DM socket:', reason);
  });

  // Add event for any socket errors
  dmSocket.on('error', (error) => {
    console.error('🔴 Socket error:', error);
    toast.error('Messaging service error. Please refresh the page.');
  });

  // Message events
  dmSocket.on('receiveDirectMessage', (data) => {
    console.log('📨 Received direct message:', data.image);
    try {
      if (chatStore) {
        // Add necessary info to the message before adding to store
        const authUser = authStore?.authUser;
        
        // Augment message data with receiver ID if not present
        const enhancedData = {
          ...data,
          // Message always comes from the other user to the current user
          receiverId: authUser?._id
        };
        
        console.log('Adding message to chat store with enhanced data:', enhancedData);
        chatStore.addDirectMessage(enhancedData);
        
        // Show notification if not from current user
        if (authStore && data.sender?.userId !== authStore.authUser?.id) {
          toast.success(`New message from ${data.sender?.username || 'someone'}`);
        }
      } else {
        console.error('❌ Chat store not available to receive message');
      }
    } catch (error) {
      console.error('❌ Error processing received message:', error);
    }
  });

  // Typing indicator
  dmSocket.on('typingIndicator', (data) => {
    console.log('⌨️ Typing indicator:', data);
    if (chatStore) {
      chatStore.setTypingIndicator(data);
    }
  });

  // Message read receipts
  dmSocket.on('messagesRead', (data) => {
    console.log('👁️ Messages read:', data);
    if (chatStore) {
      chatStore.updateReadStatus(data);
    }
  });

  // Handle deleted direct messages
  dmSocket.on('directMessageDeleted', (data) => {
    console.log('🗑️ Direct message deleted:', data);
    if (chatStore) {
      chatStore.removeDirectMessage(data.messageId);
    }
  });
};

/**
 * Send a direct message via socket
 * @param {Object} messageData - Message data to send
 */
export const sendDirectMessage = (receiverId, message) => {
  if (!dmSocket || !dmSocket.connected) {
    console.error('❌ Socket not connected for sending message');
    return false;
  }

  try {
    console.log(`📤 Emitting 'sendMessage' event to ${receiverId}:`, { receiverId, message });
    
    // Add event listeners for success/error acknowledgment
    dmSocket.emit('sendMessage', { receiverId, message }, (response) => {
      if (response && response.success) {
        console.log('✅ Socket message sent successfully:', response);
      } else {
        console.error('❌ Socket message send failed:', response);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error sending message via socket:', error);
    return false;
  }
};

/**
 * Send typing indicator for direct messages
 * @param {string} receiverId - ID of the message recipient
 * @param {boolean} isTyping - Whether the user is typing
 */
export const sendTypingIndicator = (receiverId, isTyping) => {
  if (!dmSocket || !dmSocket.connected) return false;
  
  try {
    dmSocket.emit('typing', { receiverId, isTyping });
    return true;
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    return false;
  }
};

/**
 * Mark messages as read
 * @param {string} senderId - ID of the message sender
 */
export const markMessagesAsRead = (senderId) => {
  if (!dmSocket || !dmSocket.connected) return false;
  
  try {
    dmSocket.emit('markAsRead', { senderId });
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
}; 