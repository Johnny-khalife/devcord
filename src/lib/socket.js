import { io } from 'socket.io-client';
import { BACKEND_URL } from '../constants/api';
import toast from 'react-hot-toast';

// Stores that need access to socket events
let authStore = null;
let chatStore = null;
let workspaceStore = null;
let channelStore = null;
let friendStore = null;

// Socket instances - will be initialized in connectSockets
let dmSocket = null;
let channelSocket = null;
let friendsSocket = null;

// Add a global flag to prevent multiple unauthorized toasts/logouts
let unauthorizedToastShown = false;

function handleUnauthorized() {
  if (!unauthorizedToastShown) {
    unauthorizedToastShown = true;
    toast.error("Unauthorized. Please log in again.");
    if (authStore && typeof authStore.logout === 'function') {
      authStore.logout();
    }
  }
}

/**
 * Set the store references for socket event handlers to use
 */
export const setStoreRefs = (auth, chat, workspace, channel, friend) => {
  authStore = auth;
  chatStore = chat;
  workspaceStore = workspace;
  channelStore = channel;
  friendStore = friend;
  
  // Also make channelStore available on window for components that need it
  if (typeof window !== 'undefined') {
    window.channelStore = channel;
  }
};

/**
 * Get token from localStorage or cookies
 */
const getTokenFromStorage = () => {
  // Prefer localStorage for mobile compatibility
  const localToken = localStorage.getItem('auth_token');
  if (localToken) {
    return localToken;
  }
  // Fallback to cookies for desktop
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('jwt=')) {
      return cookie.substring(4);
    }
    if (cookie.startsWith('auth_token=')) {
      return cookie.substring(11);
    }
  }
  return null;
};

/**
 * Connect to all socket.io namespaces
 */
export const connectSockets = () => {
  console.log("Attempting to connect to sockets...");
  
  // Get JWT token from localStorage or cookies
  const token = getTokenFromStorage();
  
  if (!token) {
    console.error('No token found in localStorage or cookies for socket connection');
    return { dm: null, channels: null, friends: null };
  }

  // Get socket connection options
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

  // Connect to DM namespace
  try {
    dmSocket = io(`${BACKEND_URL}/dm`, socketOptions);
    setupDMSocketListeners();
    console.log("DM socket connected successfully");
  } catch (error) {
    console.error("Failed to connect to DM socket:", error);
    dmSocket = null;
  }
  
  // Connect to channels namespace
  try {
    channelSocket = io(`${BACKEND_URL}/channels`, socketOptions);
    setupChannelSocketListeners();
    console.log("Channel socket connected successfully");
  } catch (error) {
    console.error("Failed to connect to channels socket:", error);
    channelSocket = null;
  }
  
  // Connect to friends namespace
  try {
    friendsSocket = io(`${BACKEND_URL}/friends`, socketOptions);
    setupFriendsSocketListeners();
    console.log("Friends socket connected successfully");
  } catch (error) {
    console.error("Failed to connect to friends socket:", error);
    friendsSocket = null;
  }
  
  // Store socket connections in window object for components to access
  if (typeof window !== 'undefined') {
    window.socket = {
      dm: dmSocket,
      channels: channelSocket,
      friends: friendsSocket
    };
  }
  
  return { 
    dm: dmSocket, 
    channels: channelSocket,
    friends: friendsSocket
  };
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
  
  if (friendsSocket) {
    friendsSocket.disconnect();
    friendsSocket = null;
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
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error('Messaging service error. Please refresh the page.');
    }
  });

  // Listen for workspace updates
  dmSocket.on('workspaceJoined', (workspaceData) => {
    console.log('🏢 Joined workspace:', workspaceData);
    
    if (workspaceStore) {
      // Force refresh the workspaces list
      console.log('Refreshing workspaces after joining a new workspace');
      workspaceStore.getUserWorkspaces(true) // true = force refresh
        .then(workspaces => {
          console.log('Workspaces refreshed after joining:', workspaces);
          
          // Show a notification to the user
          toast.success(`You joined the workspace: ${workspaceData.workspaceName || 'New workspace'}`);
          
          // Auto-join the workspace's channels
          if (workspaceData._id) {
            joinAllWorkspaceChannels(workspaceData._id).catch(err => {
              console.error('Error joining workspace channels after workspaceJoined event:', err);
            });
          }
        })
        .catch(error => {
          console.error('Error refreshing workspaces after joining:', error);
        });
    } else {
      console.error('Workspace store not available to handle workspaceJoined event');
    }
  });

  // Listen for workspace deletion
  dmSocket.on('workspaceDeleted', (data) => {
    console.log('🏢 Workspace deleted:', data);
    
    if (workspaceStore) {
      // Force refresh the workspaces list to remove the deleted workspace
      console.log(`Refreshing workspaces after deletion of workspace ${data.workspaceId}`);
      workspaceStore.getUserWorkspaces(true)
        .then(() => {
          console.log('Workspaces refreshed after deletion');
          
          // Check if the currently selected workspace was deleted
          const currentWorkspace = workspaceStore.selectedWorkspace;
          if (currentWorkspace && currentWorkspace._id === data.workspaceId) {
            // Reset selected workspace since it was deleted
            workspaceStore.setSelectedWorkspace(null);
            
            // Also reset selected channel
            if (chatStore) {
              chatStore.setSelectedChannel(null);
            }
            
            // Navigate to workspace selection view if possible
            if (typeof window !== 'undefined' && window.location.pathname.includes(data.workspaceId)) {
              window.location.href = '/workspaces';
            }
          }
          
          // Show a notification to the user
          toast.info(data.message || 'A workspace has been deleted');
        })
        .catch(error => {
          console.error('Error refreshing workspaces after deletion:', error);
        });
    } else {
      console.error('Workspace store not available to handle workspaceDeleted event');
    }
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
    
    // If auth store and workspace store are available, join the current workspace's channels
    if (authStore && workspaceStore) {
      const selectedWorkspace = workspaceStore.selectedWorkspace;
      if (selectedWorkspace) {
        const workspaceId = selectedWorkspace._id || selectedWorkspace.id;
        console.log(`Auto-joining workspace ${workspaceId} channels`);
        
        // Join all channels in this workspace
        if (workspaceStore.channels && workspaceStore.channels.length > 0) {
          console.log(`Found ${workspaceStore.channels.length} channels to join`);
          workspaceStore.channels.forEach(channel => {
            if (channel && channel._id) {
              joinChannel(channel._id);
              console.log(`Joined channel: ${channel._id}`);
            } else {
              console.error("Invalid channel object:", channel);
            }
          });
        } else {
          console.log("No channels found in workspace store to join");
        }
      } else {
        console.log("No selected workspace found for auto-joining channels");
      }
    } else {
      console.log("Auth store or workspace store not available for auto-joining channels");
    }
  });

  channelSocket.on('connect_error', (error) => {
    console.error('🔴 Channels socket connection error:', error);
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error('Could not connect to channel service');
    }
  });

  channelSocket.on('disconnect', (reason) => {
    console.log('🟠 Disconnected from Channels socket:', reason);
  });

  // Optionally, add a general error listener if not present
  channelSocket.on('error', (error) => {
    console.error('🔴 Channel socket error:', error);
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error('Channel service error. Please refresh the page.');
    }
  });

  // Channel user events
  channelSocket.on('userChannels', (data) => {
    console.log('📢 Received user channels:', data);
    
    // Join all available channels
    if (data.publicChannels && data.publicChannels.length > 0) {
      data.publicChannels.forEach(channelId => {
        joinChannel(channelId);
      });
    }
    
    if (data.privateChannels && data.privateChannels.length > 0) {
      data.privateChannels.forEach(channelId => {
        joinChannel(channelId);
      });
    }
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

  // Channel creation events
  channelSocket.on('channelCreated', (channelData) => {
    console.log('📢 New channel created:', channelData);
    
    // Use the channelStore reference directly
    if (channelStore) {
      // Clear channel cache for this workspace to force a refresh
      const workspaceId = channelData.workspaceId;
      console.log(`Clearing channel cache for workspace ${workspaceId} due to new channel creation`);
      channelStore.clearChannelCache(workspaceId);
      
      // Always fetch the updated channel list for the workspace where the channel was created
      // This ensures all users will see the new channel without needing to refresh
      channelStore.fetchWorkspaceChannels(workspaceId, true)
        .then(updatedChannels => {
          console.log(`Channel list updated for workspace ${workspaceId}, now has ${updatedChannels.length} channels`);
          
          // If this is the current workspace, also join the new channel
          if (workspaceStore && workspaceStore.selectedWorkspace) {
            const currentWorkspaceId = workspaceStore.selectedWorkspace._id || 
                                      workspaceStore.selectedWorkspace.id || 
                                      workspaceStore.selectedWorkspace.workspaceId;
            
            if (currentWorkspaceId === workspaceId) {
              // If user is currently viewing this workspace, join the channel
              joinChannel(channelData._id).catch(error => {
                console.error(`Error joining channel ${channelData._id}:`, error);
              });
            }
          }
          
          // Show notification to all users in the workspace
          toast.success(`New channel available: ${channelData.channelName}`);
        })
        .catch(error => {
          console.error('Error refreshing channel list after channel creation:', error);
        });
    } else {
      console.error('Channel store not available to handle channelCreated event');
    }
  });

  // Message sent acknowledgment (for sender only)
  channelSocket.on('messageSent', (data) => {
    console.log('✅ Message sent acknowledgment:', data);
    
    // If the message data is included, add it directly to the store
    if (data.message && chatStore) {
      // Mark message as sent (not pending)
      const enhancedMessage = {
        ...data.message,
        isSentByMe: true,
        isPending: false
      };
      
      // Update any temporary message or add this one
      if (chatStore.updateSentMessage) {
        chatStore.updateSentMessage(data.messageId, enhancedMessage);
      }
    }
  });

  // Channel message events - this is from other users
  channelSocket.on('receiveMessage', (data) => {
    console.log('📨 Received channel message:', data);
    try {
      if (chatStore) {
        // Get auth user for comparison
        const authUser = authStore?.authUser ||
                        window.authUser ||
                        JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser;
        
        if (!authUser) {
          console.error('Cannot process channel message: No auth user found');
          return;
        }
        
        // Check if the message is from the current user (should not happen with socket.to())
        const isFromCurrentUser = data.sender?.userId === authUser._id;
        if (isFromCurrentUser) {
          console.log('Ignoring message from self (already handled by messageSent)');
          return;
        }
        
        // Get the current channel ID - much more reliable check
        const currentChannelId = chatStore.getCurrentChannelId?.() || 
                               workspaceStore?.selectedChannel?._id;
        
        // Add channel ID validation logging
        if (!data.channelId) {
          console.error('Received message without channel ID, cannot process:', data);
          return;
        }
        
        console.log(`Processing message for channel ${data.channelId}, current channel: ${currentChannelId}`);
                                
        // Always store the message even if we're not currently viewing the channel
        // This ensures we don't miss messages when switching channels
        const messageData = {
          _id: data._id || `socket-${Date.now()}`,
          content: data.content || data.message,
          image: data.image,
          senderId: data.sender?.userId,
          userId: data.sender?.userId,
          sender: data.sender,
          channelId: data.channelId,
          workspaceId: data.workspaceId,
          createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
          isSentByMe: false
        };
        
        // Always add the message to the store
        console.log('Adding message to chat store:', messageData);
        chatStore.addChannelMessage(messageData);
        
        // Only show notification if we're not currently viewing this channel
        if (currentChannelId && data.channelId !== currentChannelId) {
          console.log(`Message is for channel ${data.channelId} but we're viewing ${currentChannelId}`);
          // Show notification for unread message in another channel
          toast.success(`New message in ${data.channelName || 'another channel'} from ${data.sender?.username || 'someone'}`);
        }
      } else {
        console.error('❌ Chat store not available to receive channel message');
      }
    } catch (error) {
      console.error('❌ Error processing channel message:', error);
    }
  });
  
  // Handle message reactions
  channelSocket.on('messageReaction', (data) => {
    console.log('👍 Message reaction update received:', data);
    try {
      if (chatStore && chatStore.updateMessageReactions) {
        // Check for valid data structure
        if (!data.messageId || !data.reactions) {
          console.error('Invalid reaction data received:', data);
          return;
        }
        
        // Add additional logging to help with debugging
        if (data.reactions.length > 0) {
          console.log('Sample reaction format:', data.reactions[0]);
        }
        
        // Ensure reactions are properly formatted before passing to the store
        const formattedReactions = data.reactions.map(r => {
          // Make sure emoji property exists
          if (!r.emoji && r.reaction) {
            r.emoji = r.reaction;
          }
          
          // Make sure count is a number
          if (r.count === undefined) {
            if (r.users && Array.isArray(r.users)) {
              r.count = r.users.length;
            } else {
              r.count = 1; // Default count
            }
          }
          
          return r;
        });
        
        console.log(`Updating ${formattedReactions.length} reactions for message ${data.messageId}`);
        chatStore.updateMessageReactions(data.messageId, formattedReactions);
      } else {
        console.error('❌ Chat store not available to update reactions');
      }
    } catch (error) {
      console.error('❌ Error processing message reaction:', error);
    }
  });

  // Handle message deletion
  channelSocket.on('messageDeleted', (data) => {
    console.log('🗑️ Message deleted:', data);
    try {
      if (chatStore && chatStore.removeChannelMessage) {
        chatStore.removeChannelMessage(data.messageId);
      } else {
        console.error('❌ Chat store not available to remove message');
      }
    } catch (error) {
      console.error('❌ Error processing message deletion:', error);
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
 * Set up listeners for friends socket events
 */
const setupFriendsSocketListeners = () => {
  if (!friendsSocket) return;

  // Friend request received
  friendsSocket.on('newFriendRequest', (data) => {
    console.log('📨 New friend request received:', data);
    
    if (friendStore) {
      // Use the new function to add the friend request to the store
      friendStore.addFriendRequest(data);
      
      // Show toast notification
      toast.success(`${data.sender.username} sent you a friend request`, {
        duration: 4000,
        icon: '👋'
      });
      
      // Dispatch custom event for components to respond to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("new-friend-request", { detail: data }));
      }
    }
  });

  // Friend request accepted
  friendsSocket.on('friendRequestAccepted', (data) => {
    console.log('✅ Friend request accepted:', data);
    
    if (friendStore) {
      // Update friends list
      friendStore.getFriendsList(true);
      
      // Update sent requests
      friendStore.getSentFriendRequests();
      
      // Show toast notification
      toast.success(`${data.receiver.username} accepted your friend request`, {
        duration: 4000,
        icon: '🎉'
      });
    }
  });

  // Friend request rejected
  friendsSocket.on('friendRequestRejected', (data) => {
    console.log('❌ Friend request rejected:', data);
    
    if (friendStore) {
      // Update sent requests
      friendStore.getSentFriendRequests();
    }
  });

  // Friend status changed
  friendsSocket.on('friendStatusChanged', (data) => {
    console.log('👤 Friend status changed:', data);
    
    if (authStore && authStore.setUserOnlineStatus) {
      authStore.setUserOnlineStatus(data.userId, data.isOnline);
    }
  });

  // Friend removed
  friendsSocket.on('friendRemoved', (data) => {
    console.log('🔄 Friend removed:', data);
    
    if (friendStore) {
      // Force refresh friends list
      friendStore.getFriendsList(true);
      
      // Show toast notification
      toast.info(`${data.username} removed you from their friends list`, {
        duration: 4000,
        icon: '❌'
      });
      
      // Dispatch custom event for components to respond to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("friend-removed", { detail: data }));
      }
    }
  });

  // User blocked
  friendsSocket.on('userBlocked', (data) => {
    console.log('🚫 User blocked:', data);
    
    if (friendStore) {
      // Force refresh blocked users list
      friendStore.getBlockedUsers();
      
      // Dispatch custom event for components to respond to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("user-blocked", { detail: data }));
      }
    }
  });

  // Someone blocked you
  friendsSocket.on('userBlockedYou', (data) => {
    console.log('🚫 You were blocked by:', data);
    
    if (friendStore) {
      // Force refresh friends list as you'll be removed from their list
      friendStore.getFriendsList(true);
      
      // Show toast notification
      toast.info(`${data.username} has blocked you`, {
        duration: 4000,
        icon: '🚫'
      });
      
      // Dispatch custom event for components to respond to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("user-blocked-you", { detail: data }));
      }
    }
  });

  // User unblocked
  friendsSocket.on('userUnblocked', (data) => {
    console.log('✅ User unblocked:', data);
    
    if (friendStore) {
      // Force refresh blocked users list
      friendStore.getBlockedUsers();
      
      // Dispatch custom event for components to respond to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("user-unblocked", { detail: data }));
      }
    }
  });

  // Someone unblocked you
  friendsSocket.on('userUnblockedYou', (data) => {
    console.log('✅ You were unblocked by:', data);
    
    // Show toast notification
    toast.info(`${data.username} has unblocked you`, {
      duration: 4000,
      icon: '✅'
    });
    
    // Dispatch custom event for components to respond to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent("user-unblocked-you", { detail: data }));
    }
  });

  // Error handling
  friendsSocket.on('error', (error) => {
    console.error('❌ Friends socket error:', error);
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error(error.message || 'An error occurred with friend connections');
    }
  });

  // Reconnection handling
  friendsSocket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Friends socket reconnected after ${attemptNumber} attempts`);
    
    // Refresh data after reconnection
    if (friendStore) {
      friendStore.forceRefresh();
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
  
  // Validate required fields
  if (!channelId) {
    console.error('❌ Cannot send channel message: Missing channelId');
    return false;
  }
  
  if (!messageData) {
    console.error('❌ Cannot send channel message: Missing message data');
    return false;
  }

  try {
    // Get auth user info to include with the message
    const authUser = authStore?.authUser || 
                     window.authUser || 
                     JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser;
    
    if (!authUser) {
      console.error('❌ Cannot send channel message: No authenticated user found');
      return false;
    }
    
    // Extract message content, handling different possible formats
    const message = messageData.message || messageData.content || '';
    const image = messageData.image; // Include image if present
    const isCode = messageData.isCode || false; // Extract isCode flag
    const language = messageData.language || null; // Extract language
    
    console.log(`📤 Emitting 'sendMessage' event to channel ${channelId}:`, { 
      channelId, 
      workspaceId, 
      messageLength: message.length,
      hasImage: !!image,
      isCode,
      language
    });
    
    // Send the message with all required fields
    channelSocket.emit('sendMessage', { 
      channelId, 
      workspaceId, // Include workspaceId
      message,
      image, // Include image data if available
      timestamp: new Date().toISOString(),
      isCode, // Include isCode flag
      language // Include language
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
  if (!channelId) {
    console.error('❌ Cannot join channel: Missing channelId');
    return false;
  }
  
  try {
    // If the socket is not connected, try to reconnect first
    if (!channelSocket || !channelSocket.connected) {
      console.log(`📡 Channel socket not connected, attempting to reconnect before joining channel ${channelId}`);
      
      // Check if authStore is available for reference
      const authToken = localStorage.getItem('auth_token') || getTokenFromStorage();
      
      if (!authToken) {
        console.error('❌ No auth token found for socket connection');
        return false;
      }
      
      // Always create a new socket connection to ensure proper state
      if (channelSocket) {
        // Properly clean up existing socket before creating a new one
        channelSocket.disconnect();
      }
      
      const socketOptions = {
        withCredentials: true,
        auth: { token: authToken },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true
      };
      
      channelSocket = io(`${BACKEND_URL}/channels`, socketOptions);
      
      // Set up basic listeners
      setupChannelSocketListeners();
      
      // Wait a bit for connection before trying to join
      setTimeout(() => {
        if (channelSocket.connected) {
          console.log(`📤 Now joining channel ${channelId} after reconnection`);
          channelSocket.emit('joinChannel', { channelId });
          
          // Set the current channel ID in chat store for message filtering
          if (chatStore) {
            const currentChannel = chatStore.selectedChannel;
            if (!currentChannel || currentChannel._id !== channelId) {
              console.log(`Updating current channel in chat store to ${channelId}`);
              chatStore.setSelectedChannel({ _id: channelId });
            }
          }
          
          // Announce presence to server
          channelSocket.emit('userPresence', { channelId, status: 'active' });
        } else {
          console.error('❌ Failed to reconnect channel socket for joining');
        }
      }, 1000);
      
      return true;
    }
    
    // Socket is already connected, just join the channel
    console.log(`📤 Joining channel ${channelId}`);
    channelSocket.emit('joinChannel', { channelId });
    
    // Set the current channel ID in chat store for message filtering
    if (chatStore) {
      const currentChannel = chatStore.selectedChannel;
      if (!currentChannel || currentChannel._id !== channelId) {
        console.log(`Updating current channel in chat store to ${channelId}`);
        chatStore.setSelectedChannel({ _id: channelId });
      }
    }
    
    // Announce presence to server
    channelSocket.emit('userPresence', { channelId, status: 'active' });
    
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

/**
 * Reinitialize socket connections 
 * Useful when creating new workspaces/channels
 */
export const reinitializeSocketConnections = () => {
  console.log("📡 Reinitializing socket connections");
  
  // Disconnect existing sockets
  if (dmSocket) {
    dmSocket.disconnect();
    dmSocket = null;
  }
  
  if (channelSocket) {
    channelSocket.disconnect();
    channelSocket = null;
  }
  
  if (friendsSocket) {
    friendsSocket.disconnect(); 
    friendsSocket = null;
  }
  
  // Reconnect with fresh connections
  return connectSockets();
};

/**
 * Join all channels in a workspace
 */
export const joinAllWorkspaceChannels = async (workspaceId) => {
  if (!workspaceId) {
    console.error('❌ Cannot join workspace channels: Missing workspaceId');
    return false;
  }
  
  try {
    console.log(`📤 Attempting to join all channels for workspace ${workspaceId}`);
    
    // Ensure socket is connected
    if (!channelSocket || !channelSocket.connected) {
      // Attempt to reconnect socket
      const socketResult = await reinitializeSocketConnections();
      if (!socketResult.channels || !socketResult.channels.connected) {
        console.error('❌ Failed to connect channel socket for joining workspace channels');
        return false;
      }
    }
    
    // Tell the server we're interested in this workspace's channels
    channelSocket.emit('joinWorkspace', { workspaceId });
    console.log(`📤 Sent joinWorkspace event for ${workspaceId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error joining workspace channels:', error);
    return false;
  }
};

/**
 * Add a reaction to a message
 */
export const addMessageReaction = (messageId, channelId, reaction) => {
  if (!channelSocket || !channelSocket.connected) {
    console.error('❌ Channel socket not connected for adding reaction');
    return false;
  }
  
  try {
    console.log(`👍 Adding reaction "${reaction}" to message ${messageId} in channel ${channelId}`);
    
    channelSocket.emit('addReaction', {
      messageId,
      channelId,
      reaction
    }, (response) => {
      // Handle acknowledgment if the server sends one
      if (response) {
        console.log('Reaction acknowledged by server:', response);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error adding reaction via socket:', error);
    return false;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = (messageId, channelId) => {
  if (!channelSocket || !channelSocket.connected) {
    console.error('❌ Channel socket not connected for deleting message');
    return false;
  }
  
  try {
    console.log(`🗑️ Deleting message ${messageId} from channel ${channelId}`);
    
    channelSocket.emit('deleteMessage', {
      messageId,
      channelId
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting message via socket:', error);
    return false;
  }
};

/**
 * Delete a direct message
 */
export const deleteDirectMessage = (messageId) => {
  if (!dmSocket || !dmSocket.connected) {
    console.error('❌ DM socket not connected for deleting message');
    return false;
  }
  
  try {
    console.log(`🗑️ Deleting direct message ${messageId}`);
    
    dmSocket.emit('deleteMessage', {
      messageId
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting direct message via socket:', error);
    return false;
  }
};

/**
 * Set the selected channel and join the corresponding socket room
 */
export const setSelectedChannel = async (channelId, workspaceId) => {
  if (!channelId) {
    console.error('❌ Cannot set selected channel: Missing channelId');
    return false;
  }
  
  console.log(`Setting selected channel to ${channelId}`);
  
  try {
    // First check if the channelSocket is already connected
    if (!channelSocket || !channelSocket.connected) {
      console.log('Channel socket not connected, reconnecting first');
      
      // Try to reconnect the socket
      await reinitializeSocketConnections();
      
      // If still not connected, return error
      if (!channelSocket || !channelSocket.connected) {
        console.error('Failed to establish channel socket connection');
        return false;
      }
    }
    
    // Actually join the channel
    joinChannel(channelId);
    
    // Update the selected channel in the chat store - this is critical for filtering messages
    if (chatStore) {
      // Create a channel object with all necessary properties
      const channelObject = {
        _id: channelId,
        id: channelId,
        channelId: channelId,
        workspaceId: workspaceId
      };
      
      console.log('Updating selected channel in store:', channelObject);
      chatStore.setSelectedChannel(channelObject);
      
      // Clear message cache for the previous channel to avoid confusion
      console.log('Clearing messages in store to prepare for new channel data');
      // Set an empty array rather than null to avoid UI flash
      chatStore.setEmptyMessages?.() || chatStore.setMessages?.([]);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting selected channel:', error);
    return false;
  }
}; 