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
  
  
  // Get JWT token from localStorage or cookies
  const token = getTokenFromStorage();
  
  if (!token) {
    
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
    
  } catch (error) {
    
    dmSocket = null;
  }
  
  // Connect to channels namespace
  try {
    channelSocket = io(`${BACKEND_URL}/channels`, socketOptions);
    setupChannelSocketListeners();
    
  } catch (error) {
    
    channelSocket = null;
  }
  
  // Connect to friends namespace
  try {
    friendsSocket = io(`${BACKEND_URL}/friends`, socketOptions);
    setupFriendsSocketListeners();
    
  } catch (error) {
    
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
    
  });

  dmSocket.on('connect_error', (error) => {
    
    toast.error('Could not connect to messaging service');
  });

  dmSocket.on('disconnect', (reason) => {
    
  });

  // Add event for any socket errors
  dmSocket.on('error', (error) => {
    
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error('Messaging service error. Please refresh the page.');
    }
  });

  // Listen for workspace updates
  dmSocket.on('workspaceJoined', (workspaceData) => {
    
    
    if (workspaceStore) {
      // Force refresh the workspaces list
      
      workspaceStore.getUserWorkspaces(true) // true = force refresh
        .then(workspaces => {
          
          
          // Show a notification to the user
          toast.success(`You joined the workspace: ${workspaceData.workspaceName || 'New workspace'}`);
          
          // Auto-join the workspace's channels
          if (workspaceData._id) {
            joinAllWorkspaceChannels(workspaceData._id).catch(err => {
              
            });
          }
        })
        .catch(error => {
          
        });
    } else {
      
    }
  });

  // Listen for workspace deletion
  dmSocket.on('workspaceDeleted', (data) => {
    
    
    if (workspaceStore) {
      // Force refresh the workspaces list to remove the deleted workspace
      
      workspaceStore.getUserWorkspaces(true)
        .then(() => {
          
          
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
          
        });
    } else {
      
    }
  });

  // Message events
  dmSocket.on('receiveDirectMessage', (data) => {
    
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
        
        
        chatStore.addDirectMessage(enhancedData);
        
        // Show notification if not from current user
        if (authStore && !isFromCurrentUser) {
          toast.success(`New message from ${data.sender?.username || 'someone'}`);
        }
      } else {
        
      }
    } catch (error) {
      
    }
  });

  // Typing indicator
  dmSocket.on('typingIndicator', (data) => {
    
    if (chatStore) {
      chatStore.setTypingIndicator(data);
    }
  });

  // Message read receipts
  dmSocket.on('messagesRead', (data) => {
    
    if (chatStore) {
      chatStore.updateReadStatus(data);
    }
  });

  // Handle deleted direct messages
  dmSocket.on('directMessageDeleted', (data) => {
    
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
    
    
    // If auth store and workspace store are available, join the current workspace's channels
    if (authStore && workspaceStore) {
      const selectedWorkspace = workspaceStore.selectedWorkspace;
      if (selectedWorkspace) {
        const workspaceId = selectedWorkspace._id || selectedWorkspace.id;
        
        
        // Join all channels in this workspace
        if (workspaceStore.channels && workspaceStore.channels.length > 0) {
          
          workspaceStore.channels.forEach(channel => {
            if (channel && channel._id) {
              joinChannel(channel._id);
              
            } else {
              
            }
          });
        } else {
          
        }
      } else {
        
      }
    } else {
      
    }
  });

  channelSocket.on('connect_error', (error) => {
    
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error('Could not connect to channel service');
    }
  });

  channelSocket.on('disconnect', (reason) => {
    
  });

  // Optionally, add a general error listener if not present
  channelSocket.on('error', (error) => {
    
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error('Channel service error. Please refresh the page.');
    }
  });

  // Channel user events
  channelSocket.on('userChannels', (data) => {
    
    
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
    
  });

  channelSocket.on('userJoinedChannel', (data) => {
    
  });

  channelSocket.on('userLeftChannel', (data) => {
    
  });

  // Channel creation events
  channelSocket.on('channelCreated', (channelData) => {
    
    
    // Use the channelStore reference directly
    if (channelStore) {
      // Clear channel cache for this workspace to force a refresh
      const workspaceId = channelData.workspaceId;
      
      channelStore.clearChannelCache(workspaceId);
      
      // Always fetch the updated channel list for the workspace where the channel was created
      // This ensures all users will see the new channel without needing to refresh
      channelStore.fetchWorkspaceChannels(workspaceId, true)
        .then(updatedChannels => {
          
          
          // If this is the current workspace, also join the new channel
          if (workspaceStore && workspaceStore.selectedWorkspace) {
            const currentWorkspaceId = workspaceStore.selectedWorkspace._id || 
                                      workspaceStore.selectedWorkspace.id || 
                                      workspaceStore.selectedWorkspace.workspaceId;
            
            if (currentWorkspaceId === workspaceId) {
              // If user is currently viewing this workspace, join the channel
              joinChannel(channelData._id).catch(error => {
                
              });
            }
          }
          
          // Show notification to all users in the workspace
          toast.success(`New channel available: ${channelData.channelName}`);
        })
        .catch(error => {
          
        });
    } else {
      
    }
  });

  // Message sent acknowledgment (for sender only)
  channelSocket.on('messageSent', (data) => {
    
    
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
    
    try {
      if (chatStore) {
        // Get auth user for comparison
        const authUser = authStore?.authUser ||
                        window.authUser ||
                        JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser;
        
        if (!authUser) {
          
          return;
        }
        
        // Check if the message is from the current user (should not happen with socket.to())
        const isFromCurrentUser = data.sender?.userId === authUser._id;
        if (isFromCurrentUser) {
          
          return;
        }
        
        // Get the current channel ID - much more reliable check
        const currentChannelId = chatStore.getCurrentChannelId?.() || 
                               workspaceStore?.selectedChannel?._id;
        
        // Add channel ID validation logging
        if (!data.channelId) {
          
          return;
        }
        
        
                                
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
        
        chatStore.addChannelMessage(messageData);
        
        // Only show notification if we're not currently viewing this channel
        if (currentChannelId && data.channelId !== currentChannelId) {
          
          // Show notification for unread message in another channel
          toast.success(`New message in ${data.channelName || 'another channel'} from ${data.sender?.username || 'someone'}`);
        }
      } else {
        
      }
    } catch (error) {
      
    }
  });
  
  // Handle message reactions
  channelSocket.on('messageReaction', (data) => {
    
    try {
      if (chatStore && chatStore.updateMessageReactions) {
        // Check for valid data structure
        if (!data.messageId || !data.reactions) {
          
          return;
        }
        
        // Add additional logging to help with debugging
        if (data.reactions.length > 0) {
          
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
        
        
        chatStore.updateMessageReactions(data.messageId, formattedReactions);
      } else {
        
      }
    } catch (error) {
      
    }
  });

  // Handle message deletion
  channelSocket.on('messageDeleted', (data) => {
    
    try {
      if (chatStore && chatStore.removeChannelMessage) {
        chatStore.removeChannelMessage(data.messageId);
      } else {
        
      }
    } catch (error) {
      
    }
  });

  // Typing indicator for channels
  channelSocket.on('userTyping', (data) => {
    
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
    
    
    if (friendStore) {
      // Update sent requests
      friendStore.getSentFriendRequests();
    }
  });

  // Friend status changed
  friendsSocket.on('friendStatusChanged', (data) => {
    
    
    if (authStore && authStore.setUserOnlineStatus) {
      authStore.setUserOnlineStatus(data.userId, data.isOnline);
    }
  });

  // Friend removed
  friendsSocket.on('friendRemoved', (data) => {
    
    
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
    
    
    if (friendStore) {
      // Force refresh blocked users list
      friendStore.getBlockedUsers();
      
      // Show toast notification
      toast.success(`Blocked ${data.username}`, {
        duration: 4000,
        icon: '🚫'
      });
      
      // Dispatch custom event for components to respond to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("user-blocked", { detail: data }));
      }
    }
  });

  // Someone blocked you
  friendsSocket.on('userBlockedYou', (data) => {
    
    
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
    
    
    if (friendStore) {
      // Force refresh blocked users list
      friendStore.getBlockedUsers();
      
      // Show toast notification
      toast.success(`Unblocked ${data.username}`, {
        duration: 4000,
        icon: '✅'
      });
      
      // Dispatch custom event for components to respond to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("user-unblocked", { detail: data }));
      }
    }
  });

  // Someone unblocked you
  friendsSocket.on('userUnblockedYou', (data) => {
    
    
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
    
    if (error && error.message && error.message.toLowerCase().includes('auth')) {
      handleUnauthorized();
    } else {
      toast.error(error.message || 'An error occurred with friend connections');
    }
  });

  // Reconnection handling
  friendsSocket.on('reconnect', (attemptNumber) => {
    
    
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
    
    return false;
  }

  try {
    
    
    // Add event listeners for success/error acknowledgment
    dmSocket.emit('sendMessage', { receiverId, message }, (response) => {
      if (response && response.success) {
        
      } else {
        
      }
    });
    
    return true;
  } catch (error) {
    
    return false;
  }
};

/**
 * Send a channel message via socket
 */
export const sendChannelMessage = (channelId, messageData, workspaceId) => {
  if (!channelSocket || !channelSocket.connected) {
    
    return false;
  }
  
  // Validate required fields
  if (!channelId) {
    
    return false;
  }
  
  if (!messageData) {
    
    return false;
  }

  try {
    // Get auth user info to include with the message
    const authUser = authStore?.authUser || 
                     window.authUser || 
                     JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser;
    
    if (!authUser) {
      
      return false;
    }
    
    // Extract message content, handling different possible formats
    const message = messageData.message || messageData.content || '';
    const image = messageData.image; // Include image if present
    const isCode = messageData.isCode || false; // Extract isCode flag
    const language = messageData.language || null; // Extract language
    

    
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
    
    return false;
  }
};

/**
 * Join a specific channel
 */
export const joinChannel = (channelId) => {
  if (!channelId) {
    
    return false;
  }
  
  try {
    // If the socket is not connected, try to reconnect first
    if (!channelSocket || !channelSocket.connected) {
      
      
      // Check if authStore is available for reference
      const authToken = localStorage.getItem('auth_token') || getTokenFromStorage();
      
      if (!authToken) {
        
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
          
          channelSocket.emit('joinChannel', { channelId });
          
          // Set the current channel ID in chat store for message filtering
          if (chatStore) {
            const currentChannel = chatStore.selectedChannel;
            if (!currentChannel || currentChannel._id !== channelId) {
              
              chatStore.setSelectedChannel({ _id: channelId });
            }
          }
          
          // Announce presence to server
          channelSocket.emit('userPresence', { channelId, status: 'active' });
        } else {
          
        }
      }, 1000);
      
      return true;
    }
    
    // Socket is already connected, just join the channel
    
    channelSocket.emit('joinChannel', { channelId });
    
    // Set the current channel ID in chat store for message filtering
    if (chatStore) {
      const currentChannel = chatStore.selectedChannel;
      if (!currentChannel || currentChannel._id !== channelId) {
        
        chatStore.setSelectedChannel({ _id: channelId });
      }
    }
    
    // Announce presence to server
    channelSocket.emit('userPresence', { channelId, status: 'active' });
    
    return true;
  } catch (error) {
    
    return false;
  }
};

/**
 * Leave a specific channel
 */
export const leaveChannel = (channelId) => {
  if (!channelSocket || !channelSocket.connected) {
    
    return false;
  }

  try {
    
    channelSocket.emit('leaveChannel', { channelId });
    return true;
  } catch (error) {
    
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
    
    return false;
  }
};

/**
 * Reinitialize socket connections 
 * Useful when creating new workspaces/channels
 */
export const reinitializeSocketConnections = () => {
  
  
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
    
    return false;
  }
  
  try {
    
    
    // Ensure socket is connected
    if (!channelSocket || !channelSocket.connected) {
      // Attempt to reconnect socket
      const socketResult = await reinitializeSocketConnections();
      if (!socketResult.channels || !socketResult.channels.connected) {
        
        return false;
      }
    }
    
    // Tell the server we're interested in this workspace's channels
    channelSocket.emit('joinWorkspace', { workspaceId });
    
    
    return true;
  } catch (error) {
    
    return false;
  }
};

/**
 * Add a reaction to a message
 */
export const addMessageReaction = (messageId, channelId, reaction) => {
  if (!channelSocket || !channelSocket.connected) {
    
    return false;
  }
  
  try {
    
    
    channelSocket.emit('addReaction', {
      messageId,
      channelId,
      reaction
    }, (response) => {
      // Handle acknowledgment if the server sends one
      if (response) {
        
      }
    });
    
    return true;
  } catch (error) {
    
    return false;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = (messageId, channelId) => {
  if (!channelSocket || !channelSocket.connected) {
    
    return false;
  }
  
  try {
    
    
    channelSocket.emit('deleteMessage', {
      messageId,
      channelId
    });
    
    return true;
  } catch (error) {
    
    return false;
  }
};

/**
 * Delete a direct message
 */
export const deleteDirectMessage = (messageId) => {
  if (!dmSocket || !dmSocket.connected) {
    
    return false;
  }
  
  try {
    
    
    dmSocket.emit('deleteMessage', {
      messageId
    });
    
    return true;
  } catch (error) {
    
    return false;
  }
};

/**
 * Set the selected channel and join the corresponding socket room
 */
export const setSelectedChannel = async (channelId, workspaceId) => {
  if (!channelId) {
    
    return false;
  }
  
  
  
  try {
    // First check if the channelSocket is already connected
    if (!channelSocket || !channelSocket.connected) {
      
      
      // Try to reconnect the socket
      await reinitializeSocketConnections();
      
      // If still not connected, return error
      if (!channelSocket || !channelSocket.connected) {
        
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
      
      
      chatStore.setSelectedChannel(channelObject);
      
      // Clear message cache for the previous channel to avoid confusion
      
      // Set an empty array rather than null to avoid UI flash
      chatStore.setEmptyMessages?.() || chatStore.setMessages?.([]);
    }
    
    return true;
  } catch (error) {
    
    return false;
  }
}; 