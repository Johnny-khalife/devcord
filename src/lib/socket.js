import { io } from 'socket.io-client';
import { BACKEND_URL } from '../constants/api';
import toast from 'react-hot-toast';

// Stores that need access to socket events
let authStore = null;
let chatStore = null;
let workspaceStore = null;

// Socket instances - will be initialized in connectSockets
let dmSocket = null;
let channelSocket = null;

/**
 * Set the store references for socket event handlers to use
 */
export const setStoreRefs = (auth, chat, workspace) => {
  authStore = auth;
  chatStore = chat;
  workspaceStore = workspace;
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
    return { dm: null, channels: null };
  }

  // Create socket connection options
  const socketOptions = {
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
  };

  try {
    console.log("Creating socket connections with token...");
    
    // Disconnect any existing sockets first
    if (dmSocket) {
      console.log("Disconnecting existing DM socket before reconnecting...");
      dmSocket.disconnect();
      dmSocket = null;
    }
    
    if (channelSocket) {
      console.log("Disconnecting existing channel socket before reconnecting...");
      channelSocket.disconnect();
      channelSocket = null;
    }
    
    // Create DM socket connection
    dmSocket = io(`${BACKEND_URL}/dm`, socketOptions);
    
    // Create channel socket connection
    channelSocket = io(`${BACKEND_URL}/channels`, socketOptions);

    // Set up event listeners
    setupDMSocketListeners();
    setupChannelSocketListeners();

    return {
      dm: dmSocket,
      channels: channelSocket
    };
  } catch (error) {
    console.error('Error connecting to socket:', error);
    toast.error('Failed to connect to messaging service');
    return { dm: null, channels: null };
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
  
  if (channelSocket) {
    channelSocket.disconnect();
    channelSocket = null;
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
        
        // Check if the message is from the current user
        const isFromCurrentUser = data.senderId === authUser?._id;
        
        // Augment message data with receiver ID if not present
        const enhancedData = {
          ...data,
          // Message always comes from the other user to the current user
          receiverId: authUser?._id,
          // Explicitly set isSentByMe flag based on sender
          isSentByMe: isFromCurrentUser
        };
        
        console.log('Adding message to chat store with enhanced data:', enhancedData);
        chatStore.addDirectMessage(enhancedData);
        
        // Show notification if not from current user
        if (authStore && !isFromCurrentUser) {
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
 * Set up listeners for Channel socket events
 */
const setupChannelSocketListeners = () => {
  if (!channelSocket) return;

  // Connection events
  channelSocket.on('connect', () => {
    console.log('🟢 Connected to Channels socket');
    
    // Auto-join current workspace channels if available
    if (workspaceStore && workspaceStore.selectedWorkspace) {
      const workspaceId = workspaceStore.selectedWorkspace._id;
      console.log(`Auto-joining workspace ${workspaceId} channels`);
    }
  });

  channelSocket.on('connect_error', (error) => {
    console.error('🔴 Channels socket connection error:', error);
    toast.error('Could not connect to channel service');
  });

  channelSocket.on('disconnect', (reason) => {
    console.log('🟠 Disconnected from Channels socket:', reason);
  });

  // Add event for any socket errors
  channelSocket.on('error', (error) => {
    console.error('🔴 Channel socket error:', error);
    toast.error('Channel service error. Please refresh the page.');
  });

  // Channel user events
  channelSocket.on('userChannels', (data) => {
    console.log('📢 Received user channels:', data);
  });

  channelSocket.on('channelUsers', (data) => {
    console.log('👥 Channel users:', data);
  });

  channelSocket.on('userJoinedChannel', (data) => {
    console.log('👋 User joined channel:', data);
  });

  channelSocket.on('userLeftChannel', (data) => {
    console.log('👋 User left channel:', data);
  });

  // Channel message events
  channelSocket.on('receiveMessage', (data) => {
    console.log('📨 Received channel message:', data);
    try {
      if (chatStore) {
        // Add necessary info to the message before adding to store
        const authUser = authStore?.authUser;
        
        // Check if the message is from the current user
        const isFromCurrentUser = data.sender?.userId === authUser?._id;
        
        // Format the message for the store
        const messageData = {
          _id: data._id || `socket-${Date.now()}`,
          content: data.message,
          senderId: data.sender?.userId,
          sender: data.sender,
          userId: data.sender?.userId,
          channelId: data.channelId,
          workspaceId: data.workspaceId,
          createdAt: data.timestamp || new Date().toISOString(),
          isSentByMe: isFromCurrentUser
        };
        
        console.log('Adding message to chat store with enhanced data:', messageData);
        chatStore.addChannelMessage(messageData);
      } else {
        console.error('❌ Chat store not available to receive channel message');
      }
    } catch (error) {
      console.error('❌ Error processing channel message:', error);
    }
  });

  // Typing indicator for channels
  channelSocket.on('userTyping', (data) => {
    console.log('⌨️ User typing in channel:', data);
    if (chatStore) {
      chatStore.setChannelTypingIndicator(data);
    }
  });
};

/**
 * Send a direct message via socket
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
 * Send a channel message via socket
 */
export const sendChannelMessage = (channelId, messageData, workspaceId) => {
  if (!channelSocket || !channelSocket.connected) {
    console.error('❌ Channel socket not connected for sending message');
    return false;
  }

  try {
    // Get auth user info to include with the message
    const authUser = authStore?.authUser;
    
    console.log(`📤 Emitting 'sendMessage' event to channel ${channelId}:`, { 
      channelId, 
      workspaceId, 
      message: messageData.message, 
      hasImage: !!messageData.image 
    });
    
    // Send the message with timestamp and sender info
    channelSocket.emit('sendMessage', { 
      channelId, 
      workspaceId, // Include workspaceId in socket message
      message: messageData.message,
      image: messageData.image, // Include image data if available
      timestamp: new Date().toISOString(),
      sender: {
        userId: authUser?._id,
        username: authUser?.username,
        avatar: authUser?.avatar
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error sending channel message via socket:', error);
    return false;
  }
};

/**
 * Join a specific channel
 */
export const joinChannel = (channelId) => {
  if (!channelSocket || !channelSocket.connected) {
    console.error('❌ Channel socket not connected for joining channel');
    return false;
  }

  try {
    console.log(`📤 Joining channel ${channelId}`);
    channelSocket.emit('joinChannel', { channelId });
    return true;
  } catch (error) {
    console.error('❌ Error joining channel:', error);
    return false;
  }
};

/**
 * Leave a specific channel
 */
export const leaveChannel = (channelId) => {
  if (!channelSocket || !channelSocket.connected) {
    console.error('❌ Channel socket not connected for leaving channel');
    return false;
  }

  try {
    console.log(`📤 Leaving channel ${channelId}`);
    channelSocket.emit('leaveChannel', { channelId });
    return true;
  } catch (error) {
    console.error('❌ Error leaving channel:', error);
    return false;
  }
};

/**
 * Send typing indicator for direct messages
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
 * Send typing indicator for channels
 */
export const sendChannelTypingIndicator = (channelId, isTyping) => {
  if (!channelSocket || !channelSocket.connected) return false;
  
  try {
    channelSocket.emit('typing', { channelId, isTyping });
    return true;
  } catch (error) {
    console.error('Error sending channel typing indicator:', error);
    return false;
  }
};

/**
 * Mark messages as read
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