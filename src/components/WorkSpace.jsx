import { useState, useRef, useEffect } from "react";
import { createPortal } from 'react-dom';
import { Link } from "react-router-dom";
import {
  Plus,
  Briefcase,
  Hash,
  ChevronDown,
  Settings,
  UserPlus,
  Check,
  Lock,
  X,
  Users,
  Shield,
  ShieldCheck,
  UserMinus,
} from "lucide-react";
import { useFriendStore } from "../store/useFriendsStore"; // Import the friend store
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useChannelStore } from "../store/useChannelStore";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import WorkspaceMembersPortal from "./WorkspaceMembersPortal";
import RemoveMemberPortal from "./RemoveMemberPortal";
import InviteFriendsPortal from "./InviteFriendsPortal";
import { useChatStore } from "../store/useChatStore";

const ChannelCreationModal = ({ 
  isOpen, 
  onClose, 
  channelName, 
  setChannelName, 
  isPrivateChannel, 
  setIsPrivateChannel,
  selectedChannelUsers,
  workspaceMembers,
  isWorkspaceMembersLoading,
  toggleUserSelection,
  handleCreateChannel
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        className="bg-base-100 backdrop-blur-md rounded-xl w-full max-w-md shadow-2xl border border-base-300 relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Hash className="w-4 h-4 text-primary-content" />
              </div>
              <h2 className="text-xl font-bold">Create New Channel</h2>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-base-content/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Channel Name</label>
            <input
              type="text"
              placeholder="Enter channel name"
              className="w-full px-4 py-2.5 bg-base-200 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center justify-between cursor-pointer py-2">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-base-content/70" /> Private Channel
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isPrivateChannel}
                  onChange={() => setIsPrivateChannel(!isPrivateChannel)}
                />
                <div className={`w-10 h-5 ${isPrivateChannel ? 'bg-primary' : 'bg-base-300'} rounded-full transition-colors`} />
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isPrivateChannel ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>

          {isPrivateChannel && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Users for this Channel</label>
              {isWorkspaceMembersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner">
                    <div className="double-bounce1 bg-primary/60" />
                    <div className="double-bounce2 bg-primary/40" />
                  </div>
                  <p className="ml-3 text-base-content/70">Loading members...</p>
                </div>
              ) : workspaceMembers.length === 0 ? (
                <div className="text-center p-4 rounded-md bg-base-200">
                  <p className="text-sm">No members found in this workspace.</p>
                  <p className="text-xs text-base-content/70 mt-1">
                    Invite members using the invite button at the top.
                  </p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-md bg-base-200 custom-scrollbar">
                  {workspaceMembers
                    .filter((member) => !(member.role === "owner" || member.isOwned))
                    .map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 cursor-pointer border-b border-base-300 last:border-0 ${
                          selectedChannelUsers.includes(member.id)
                            ? "bg-primary/20"
                            : "hover:bg-base-300"
                        } transition-colors`}
                        onClick={() => toggleUserSelection(member.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center ring-2 ring-base-300">
                            <img
                              src={member.avatar || "/avatar.png"}
                              alt={member.username}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/avatar.png";
                              }}
                            />
                          </div>
                          <span>{member.username}</span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                            selectedChannelUsers.includes(member.id)
                              ? "bg-primary text-primary-content"
                              : "bg-base-300 text-base-content/50"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300 bg-base-200 rounded-b-xl flex justify-between items-center">
          <div className="text-sm text-base-content/70">
            {isPrivateChannel && (
              <span>
                <span className="text-primary font-medium">{selectedChannelUsers.length}</span> user
                {selectedChannelUsers.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-base-300 rounded-lg hover:bg-base-300/80 transition-colors text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
              onClick={handleCreateChannel}
              disabled={!channelName || (isPrivateChannel && selectedChannelUsers.length === 0)}
            >
              <Plus className="w-4 h-4" />
              Create Channel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const WorkSpace = ({
  activeNavItem,
  activeWorkspace,
  setActiveWorkspace,
  workspaces,
  setShowWorkspaceMenu,
  showWorkspaceMenu,
  setActiveChannel,
  activeChannel,
  handleCreateWorkspace,
  handleOpenSettingsForm,
}) => {
  // State for invite functionality
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const inviteMenuRef = useRef(null);
  const inviteButtonRef = useRef(null);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  // State for channels
  const [channelName, setChannelName] = useState("");
  const [channels, setChannels] = useState([]);
  const [isChannelsLoading, setIsChannelsLoading] = useState(false);
  const [isPrivateChannel, setIsPrivateChannel] = useState(false);
  const [selectedChannelUsers, setSelectedChannelUsers] = useState([]);
  const [showChannelUserSelector, setShowChannelUserSelector] = useState(false);

  // In your component:
  const { authUser } = useAuthStore();

  // Get workspace members
  const {
    getWorkspaceMembers,
    setSelectedWorkspace,
    toggleAdminRole,
    removeMember,
    workspaceMembersCache,
  } = useWorkspaceStore();
  const { friends, sendFriendRequest, removeFriend } = useFriendStore();
  const { user: currentUser } = useAuthStore();
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [isWorkspaceMembersLoading, setIsWorkspaceMembersLoading] =
  useState(false);
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  
  console.log("friends is jsdsd",friends);
  // State for responsive design
  const [isMobile, setIsMobile] = useState(false);
  const [isWorkspaceSidebarOpen, setIsWorkspaceSidebarOpen] = useState(true);

  // State for showing workspace members
  const [showMembersModal, setShowMembersModal] = useState(false);

  // State for admin promotion
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPromotingAdmin, setIsPromotingAdmin] = useState(false);

  // State for member removal
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsWorkspaceSidebarOpen(!mobile); // Close sidebar by default on mobile
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);
    
    // Listen for custom toggle event from ChatHeader
    const handleToggleSidebar = () => {
      setIsWorkspaceSidebarOpen((prev) => !prev);
    };
    
    window.addEventListener("toggle-workspace-sidebar", handleToggleSidebar);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
      window.removeEventListener(
        "toggle-workspace-sidebar",
        handleToggleSidebar
      );
    };
  }, []);

  // Toggle workspace sidebar for mobile view
  const toggleWorkspaceSidebar = () => {
    setIsWorkspaceSidebarOpen(!isWorkspaceSidebarOpen);
  };

  // Get friends data and methods from the friend store
  const { getFriendsList } = useFriendStore();
  const { sendWorkspaceInvite } = useWorkspaceStore();
  const { 
    fetchWorkspaceChannels, 
    createChannel, 
    deleteChannel,
    channelsCache 
  } = useChannelStore();

  // Add this at the beginning of your component
  console.log("Workspace component props:", {
    activeWorkspace,
    workspaces,
    activeChannel,
  });

  // Fetch friends list when component mounts or when activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace) {
      getFriendsList();
    }
  }, [activeWorkspace, getFriendsList]);

  // Handle clicks outside the invite menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        inviteMenuRef.current &&
        !inviteMenuRef.current.contains(event.target) &&
        inviteButtonRef.current &&
        !inviteButtonRef.current.contains(event.target)
      ) {
        setShowInviteMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch channels for the active workspace
  useEffect(() => {
    const loadWorkspaceChannels = async () => {
      // Only show loading if we don't have cached channels
      const hasChannelCache = channelsCache && channelsCache[activeWorkspace];
      if (!hasChannelCache) {
        setIsChannelsLoading(true);
      }
      
      try {
        // The fetchWorkspaceChannels function now handles caching internally
        const fetchedChannels = await fetchWorkspaceChannels(activeWorkspace);
        console.log("Fetched channels:", fetchedChannels);
        setChannels(fetchedChannels);
        
        // If there are no channels and there should be a default "general" channel, create it
        if (fetchedChannels.length === 0) {
          console.log("No channels found in workspace, creating general channel...");
          if (hasAdminPrivileges()) {
            try {
              await createDefaultChannel();
            } catch (error) {
              console.error("Error creating default channel:", error);
            }
          }
        }

        // Don't automatically set activeChannel - let the user click a channel first
        // This ensures the "No channel selected" state is shown
      } catch (error) {
        console.error("Failed to load workspace channels:", error);
        toast.error("Failed to load workspace channels");
      } finally {
        setIsChannelsLoading(false);
      }
    };

    if (activeWorkspace) {
      loadWorkspaceChannels();
    }
  }, [activeWorkspace, channelsCache]);

  useEffect(() => {
    console.log("Current user:", currentUser);
  }, [currentUser]);

  // Update the workspace members loading effect
  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      if (!activeWorkspace) return;
      
      // Only show loading if we don't have cached members
      const hasMembersCache = workspaceMembersCache && workspaceMembersCache[activeWorkspace];
      if (!hasMembersCache) {
        setIsWorkspaceMembersLoading(true);
      }
      
      try {
        // Let the store's caching handle this
        const members = await getWorkspaceMembers(activeWorkspace);
        setWorkspaceMembers(members);
      } catch (error) {
        console.error("Error fetching workspace members:", error);
      } finally {
        setIsWorkspaceMembersLoading(false);
      }
    };
    
    // Only fetch members when the active workspace changes
    if (activeWorkspace) {
      fetchWorkspaceMembers();
    }
  }, [activeWorkspace, workspaceMembersCache]);

///////////////////////////////////////////////////////////////

// In WorkSpace.jsx, update the selectedWorkspaceWhenClick function
const handleChannelClick = async (channel) => {
  console.log("Channel clicked:", channel);
  setActiveChannel(channel._id);
  
  // Create a properly structured selectedWorkspace object with all necessary IDs
  const enrichedChannel = {
    ...channel,
    channelId: channel._id,
    workspaceId: activeWorkspace,
    // Add these for backward compatibility
    id: channel._id, 
    _id: channel._id
  };
  
  console.log("Setting enriched channel as selected workspace:", enrichedChannel);
  setSelectedWorkspace(enrichedChannel);
  
  try {
    // Import the improved setSelectedChannel function from socket.js
    const { setSelectedChannel } = await import('../lib/socket');
    
    // Use the new function to properly handle socket rooms and channel switching
    await setSelectedChannel(channel._id, activeWorkspace);
    
    // Fetch messages for this channel
    useChatStore.getState().getMessages(channel._id);
  } catch (error) {
    console.error("Error switching channels:", error);
    
    // Fallback to old method
    useChatStore.getState().setSelectedChannel(enrichedChannel);
    useChatStore.getState().getMessages(channel._id);
  }
};

  // Create a new channel
  const handleCreateChannel = async () => {
    if (!activeWorkspace) {
      toast.error("Please select a workspace first");
      return;
    }

    if (!isWorkspaceOwner()) {
      toast.error("You don't have permission to create channels");
      return;
    }

    if (!channelName) {
      toast.error("Channel name is required");
      return;
    }

    try {
      // If it's a private channel, ensure some users are selected
      if (isPrivateChannel && selectedChannelUsers.length === 0) {
        toast.error("Please select at least one user for a private channel");
        return;
      }

      // Add logging to see what's being sent
      console.log("Creating channel with data:", {
        channelName,
        isPrivate: isPrivateChannel,
        allowedUsers: isPrivateChannel ? selectedChannelUsers : [],
      });

      const newChannel = await createChannel(activeWorkspace, {
        channelName,
        isPrivate: isPrivateChannel,
        allowedUsers: isPrivateChannel ? selectedChannelUsers : [],
      });

      // Add the new channel to the list
      setChannels([...channels, newChannel]);
      setActiveChannel(newChannel._id);
      
      // Create a properly structured channel object
      const enrichedChannel = {
        ...newChannel,
        channelId: newChannel._id,
        workspaceId: activeWorkspace,
        id: newChannel._id,
        _id: newChannel._id
      };
      
      // Set the selected workspace and channel in ChatStore
      setSelectedWorkspace(enrichedChannel);
      useChatStore.getState().setSelectedChannel(enrichedChannel);
      
      // Reinitialize socket connections to ensure proper setup
      const { reinitializeSocketConnections, joinChannel } = await import('../lib/socket');
      await reinitializeSocketConnections();
      
      // Wait a brief moment for socket reconnection
      setTimeout(async () => {
        // Join the socket room for this new channel
        joinChannel(newChannel._id);
        console.log(`Joined new channel socket room: ${newChannel._id}`);
        
        // Fetch empty messages for this new channel
        useChatStore.getState().getMessages(newChannel._id);
      }, 1000);

      // Reset channel creation states
      resetChannelCreation();
    } catch (error) {
      console.error("Failed to create channel:", error);
      toast.error("Failed to create channel");
    }
  };
  const toggleUserSelection = (userId) => {
    setSelectedChannelUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const resetChannelCreation = () => {
    console.log("Resetting channel creation");
    setShowChannelUserSelector(false);
    setChannelName("");
    setIsPrivateChannel(false);
    setSelectedChannelUsers([]);
  };

  // Add useEffect to monitor modal state
  useEffect(() => {
    console.log("Channel creation modal state:", showChannelUserSelector);
  }, [showChannelUserSelector]);

  // Delete a channel
  const handleDeleteChannel = async (channelId) => {
    if (!isWorkspaceOwner()) {
      toast.error("You don't have permission to delete channels");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this channel?"))
      return;

    try {
      await deleteChannel(channelId);

      // Remove the channel from the list
      const updatedChannels = channels.filter(
        (channel) => channel._id !== channelId
      );
      setChannels(updatedChannels);

      // Set a new active channel if possible
      if (updatedChannels.length > 0) {
        setActiveChannel(updatedChannels[0]._id);
      } else {
        setActiveChannel(null);
      }
    } catch (error) {
      console.error("Failed to delete channel:", error);
    }
  };

  // Move the channel creation modal outside of the channels.map section
  const renderChannelsList = () => {
    if (isChannelsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="spinner">
            <div className="double-bounce1 bg-primary/60"></div>
            <div className="double-bounce2 bg-primary/40"></div>
          </div>
          <p className="ml-3 text-base-content/70">Loading channels...</p>
        </div>
      );
    }

    if (channels.length === 0) {
      return (
        <div className="text-center py-8 px-3 ">
          <Hash className="w-12 h-16 mx-auto mb-3 text-primary/50" />
          <h3 className="font-medium mb-1">No Channels</h3>
          <p className="text-sm text-base-content/70 mb-4">
            {isWorkspaceOwner()
              ? "Create a channel to get started"
              : "No channels available for this workspace"}
          </p>
          {isWorkspaceOwner() && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Opening channel creation modal from empty state");
                setShowChannelUserSelector(true);
              }}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-content rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Channel
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1 mt-2">
        <div className="px-3 mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
            Channels
          </h3>
          {isWorkspaceOwner() && (
            <button
              className="p-1 hover:bg-base-300 rounded transition-colors text-base-content/70 hover:text-base-content"
              onClick={() => {
                console.log("Opening channel creation modal from header");
                setShowChannelUserSelector(true);
              }}
              title="Add Channel"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {channels.map((channel) => (
          <div
            key={channel._id}
            className="flex items-center px-3 group"
          >
            <button
              className={`flex flex-grow items-center gap-2 py-2 px-2 rounded-md ${
                activeChannel === channel._id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-300 text-base-content hover:text-base-content"
              } transition-colors`}
              onClick={() => handleChannelClick(channel)}
            >
              {channel.isPrivate ? (
                <Lock className="w-4 h-4 text-base-content/70" />
              ) : (
                <Hash className="w-4 h-4 text-base-content/70" />
              )}
              <span className="text-sm truncate">{channel.channelName}</span>
            </button>
            
            {/* Only show delete button for owners */}
            {isWorkspaceOwner() && (
              <button
                onClick={() => handleDeleteChannel(channel._id)}
                className="w-6 h-6 flex items-center justify-center bg-error/20 text-error hover:bg-error/30 hover:text-error-content rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Channel"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Toggle friend selection
  const toggleFriendSelection = (friendId) => {
    console.log("tony", friends);
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  // Send invites to backend
  const sendInvites = async () => {
    if (!hasAdminPrivileges()) {
      toast.error(
        "You don't have permission to invite users to this workspace"
      );
      return;
    }

    if (selectedFriends.length === 0) {
      toast.error("Please select at least one friend to invite");
      return;
    }

    setIsInviteLoading(true);
    sendWorkspaceInvite(activeWorkspace, selectedFriends, setIsInviteLoading);
  };

  const getActiveWorkspace = () => {
    // First try to find the workspace in the array
    const workspace = workspaces.find((ws) => ws?.id === activeWorkspace);

    // If not found, return a default object with null values to prevent undefined errors
    if (!workspace) {
      console.warn(
        "Active workspace not found in workspaces array:",
        activeWorkspace
      );
      return { id: null, name: "No Workspace", description: "", channels: [] };
    }

    // Make sure name property exists
    if (!workspace.name) {
      console.warn("Workspace missing name property:", workspace);
      return { ...workspace, name: "Unnamed Workspace" };
    }

    return workspace;
  };

  // Add at the beginning of your component
  useEffect(() => {
    console.log("Workspaces in WorkSpace component:", workspaces);
    // Check if all workspaces have a name property
    if (workspaces && workspaces.length > 0) {
      const missingNames = workspaces.filter((ws) => !ws || !ws.name);
      if (missingNames.length > 0) {
        console.warn(
          "Some workspaces are missing the name property:",
          missingNames
        );
      }
    }
  }, [workspaces]);

  // Add a function to check if the user has owner privileges
  const isWorkspaceOwner = () => {
    const currentWorkspace = workspaces.find((ws) => ws.id === activeWorkspace);
    return (
      currentWorkspace &&
      (currentWorkspace.role === "owner" || currentWorkspace.isOwned)
    );
  };

  // Function to handle showing workspace members
  const handleShowMembers = async () => {
    if (!activeWorkspace) return;

    setIsWorkspaceMembersLoading(true);
    try {
      const members = await getWorkspaceMembers(activeWorkspace);
      setWorkspaceMembers(members);
      setShowMembersModal(true);
    } catch (error) {
      console.error("Failed to fetch workspace members:", error);
      toast.error("Failed to load workspace members");
    } finally {
      setIsWorkspaceMembersLoading(false);
    }
  };

  // Function to handle admin promotion/demotion
  const handleToggleAdminRole = async () => {
    if (!activeWorkspace || selectedMembers.length === 0) return;

    setIsPromotingAdmin(true);
    try {
      const results = await toggleAdminRole(activeWorkspace, selectedMembers);

      // Update the local members list with new roles
      if (results.success.length > 0) {
        setWorkspaceMembers((prevMembers) =>
          prevMembers.map((member) => {
            const userResult = results.success.find(r => r.userId === member.id);
            if (userResult) {
              return {
                ...member,
                role: userResult.newRole
              };
            }
            return member;
          })
        );
      }

      // Clear selection
      setSelectedMembers([]);
    } catch (error) {
      console.error("Failed to toggle admin roles:", error);
    } finally {
      setIsPromotingAdmin(false);
    }
  };

  // Function to check if user has admin privileges
  const hasAdminPrivileges = () => {
    const currentWorkspace = workspaces.find((ws) => ws.id === activeWorkspace);
    return (
      currentWorkspace &&
      (currentWorkspace.role === "owner" || currentWorkspace.role === "admin")
    );
  };

  // Function to handle member removal
  const handleRemoveMember = async (member) => {
    if (!activeWorkspace || !member) return;

    // Only owners and admins can remove members
    if (!hasAdminPrivileges()) {
      toast.error("Only workspace owners and admins can remove members");
      return;
    }

    const currentWorkspace = workspaces.find((ws) => ws.id === activeWorkspace);

    // Check permissions
    if (member.role === "owner") {
      toast.error("Cannot remove the workspace owner");
      return;
    }

    // If current user is admin, they can only remove regular members
    if (currentWorkspace?.role === "admin" && member.role === "admin") {
      toast.error("Admins can only remove regular members");
      return;
    }

    setMemberToRemove(member);
  };

  // Function to confirm and execute member removal
  const confirmRemoveMember = async () => {
    if (!activeWorkspace || !memberToRemove) return;

    setIsRemovingMember(true);
    try {
      await removeMember(activeWorkspace, memberToRemove.id);

      // Update local state to remove the member
      setWorkspaceMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== memberToRemove.id)
      );

      setMemberToRemove(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Function to handle sending friend request
  const handleSendFriendRequest = async (member, e) => {
    e.stopPropagation();
    if (!member.id) return;

    setIsSendingFriendRequest(true);
    try {
      await sendFriendRequest(member.id);
      toast.success(`Friend request sent to ${member.username}`);
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setIsSendingFriendRequest(false);
    }
  };

  // Function to check if user is already a friend
  const isAlreadyFriend = (memberId) => {
    return friends.some((friend) => friend.friendId === memberId);
  };
  

  // Add this function near the top of the WorkSpace component where other imports and functions are defined
  const handleWorkspaceSwitch = async (workspaceId) => {
    console.log(`Switching to workspace: ${workspaceId}`);
    setActiveWorkspace(workspaceId);
    setShowWorkspaceMenu(false);
    
    // Reset active channel - this ensures the "No channel selected" state appears
    setActiveChannel(null);
    
    // Reset the chat store's selected channel
    useChatStore.getState().setSelectedChannel(null);
    
    // Reinitialize socket connections when switching workspaces
    try {
      const { reinitializeSocketConnections, joinAllWorkspaceChannels } = await import('../lib/socket');
      await reinitializeSocketConnections();
      console.log("Socket connections reinitialized for workspace switch");
      
      // Wait a moment for the socket connections to stabilize
      setTimeout(async () => {
        // Join all channels in this workspace
        await joinAllWorkspaceChannels(workspaceId);
        
        // Fetch channels for this workspace but don't select any
        try {
          const workspaceChannels = await fetchWorkspaceChannels(workspaceId);
          console.log(`Fetched ${workspaceChannels.length} channels for workspace ${workspaceId}`);
          
          // Join each channel specifically
          if (workspaceChannels && workspaceChannels.length > 0) {
            const { joinChannel } = await import('../lib/socket');
            
            // Join each channel
            workspaceChannels.forEach(channel => {
              joinChannel(channel._id);
              console.log(`Explicitly joined channel: ${channel._id}`);
            });
            
            // Don't automatically select any channel
            // This ensures the "No channel selected" state is shown
          }
        } catch (error) {
          console.error(`Error fetching channels for workspace ${workspaceId}:`, error);
        }
      }, 1000);
    } catch (error) {
      console.error("Error reinitializing sockets for workspace switch:", error);
    }
  };

  if (workspaces.length === 0) {
    return (
      <div
        className={`
          ${isMobile ? "fixed left-0 top-16 bottom-0 z-30" : "w-72"} 
          ${isMobile && !isWorkspaceSidebarOpen ? "translate-x-[-100%]" : "translate-x-0"}
          bg-base-200 h-screen border-r border-base-300 flex flex-col items-center justify-center p-4
          transition-transform duration-300 ease-in-out
        `}
      >
        <div className="text-center mb-4 w-60 ">
          <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <h3 className="font-medium text-lg ">No Workspaces</h3>
          <p className="text-sm opacity-70 mb-4">
            Create your first workspace
          </p>
          <button
            className="btn btn-primary"
            onClick={handleCreateWorkspace}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
     
      <div
        className={`
        ${isMobile ? "fixed left-0 top-16 bottom-0 z-30 w-56" : "h-[calc(100vh-4rem)] sticky top-16"} 
        ${
          isMobile && !isWorkspaceSidebarOpen
            ? "translate-x-[-100%]"
            : "translate-x-0"
        } 
        bg-base-200 border-r border-base-300 flex flex-col transition-transform duration-300 ease-in-out overflow-hidden
      `}
      >
        {/* Header section - modernized */}
        <div className="p-4 border-b border-base-300 flex-shrink-0">
          {/* Title and Create Workspace */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg ">
              {activeNavItem === "workspaces"
                ? "Workspaces"
                : activeNavItem === "workSpace"
                ? "workSpace"
                : activeNavItem.charAt(0).toUpperCase() +
                  activeNavItem.slice(1)}
            </h2>
            <div className="flex items-center relative">
              <button
                className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                onClick={handleCreateWorkspace}
                aria-label="Create Workspace"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action buttons row */}
          {activeNavItem === "workSpace" && activeWorkspace && (
            <div className="flex items-center justify-center gap-2 py-2">
              <button
                className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                onClick={handleShowMembers}
                aria-label="Show Workspace Members"
              >
                <Users className="w-5 h-5" />
              </button>

              {hasAdminPrivileges() && (
                <button
                  ref={inviteButtonRef}
                  className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                  onClick={() => setShowInviteMenu(!showInviteMenu)}
                  aria-label="Invite Friends"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              )}

              <button
                className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                onClick={() => handleOpenSettingsForm(activeWorkspace)}
                aria-label="Workspace Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Workspace section */}
          {activeNavItem === "workSpace" && (
            <div className="p-3">
              {/* Workspace header with dropdown */}
              <div className="relative mb-3">
                <button
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-base-300/60 hover:bg-base-300 transition-colors border border-base-300"
                  onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      {getActiveWorkspace()?.name?.charAt(0).toUpperCase() ||
                        "?"}
                    </div>
                    <span className="font-medium">
                      {getActiveWorkspace()?.name || "Select Workspace"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-base-content/70" />
                </button>

                {/* Modified Workspace dropdown menu */}
                {showWorkspaceMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 rounded-lg shadow-lg z-50 border border-base-300 animate-scaleIn">
                    <div className="py-2">
                      {/* Show owned workspaces section */}
                      <div className="px-3 py-1 text-xs font-semibold text-base-content/70">
                        YOUR WORKSPACES
                      </div>
                      {workspaces
                        // Filter to show each owned workspace only once
                        .filter(
                          (ws, index, self) =>
                            ws &&
                            (ws.isOwned || ws.role === "owner") &&
                            // Only keep the first occurrence of a workspace with the same ID
                            index === self.findIndex((w) => w?.id === ws?.id)
                        )
                        .map((workspace, index) => (
                          <button
                            key={workspace?.id || `owned-${index}`}
                            className={`w-full px-3 py-2 text-left flex items-center gap-3 rounded-md ${
                              activeWorkspace === workspace?.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-base-200"
                            } transition-colors`}
                            onClick={() => {
                              if (workspace?.id) {
                                handleWorkspaceSwitch(workspace.id);
                              }
                            }}
                          >
                            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                              {workspace?.name
                                ? workspace.name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <span className="text-sm">
                              {workspace?.name || "Unnamed Workspace"}
                            </span>
                          </button>
                        ))}

                      {/* Show joined workspaces section */}
                      <div className="border-t border-base-200 mt-2 pt-2">
                        <div className="px-3 py-1 text-xs font-semibold text-base-content/70">
                          JOINED WORKSPACES
                        </div>
                        {workspaces.filter(
                          (ws) =>
                          ws && 
                          ws.isInvited && 
                          ws.role !== "owner" && 
                            !ws.isOwned &&
                            // Only keep the first occurrence of a workspace with the same ID
                            workspaces.findIndex((w) => w?.id === ws?.id) ===
                              workspaces.indexOf(ws)
                        ).length === 0 ? (
                          <div className="px-3 py-2 text-xs text-base-content/50 italic">
                            No joined workspaces
                          </div>
                        ) : (
                          workspaces
                            .filter(
                              (ws) =>
                              ws && 
                              ws.isInvited && 
                              ws.role !== "owner" && 
                                !ws.isOwned &&
                                // Only keep the first occurrence of a workspace with the same ID
                                workspaces.findIndex(
                                  (w) => w?.id === ws?.id
                                ) === workspaces.indexOf(ws)
                            )
                            .map((workspace, index) => {
                              return (
                                <button
                                  key={workspace?.id || `invited-${index}`}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-3 rounded-md ${
                                    activeWorkspace === workspace?.id
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-base-200"
                                  } transition-colors`}
                                  onClick={() => {
                                    if (workspace?.id) {
                                      handleWorkspaceSwitch(workspace.id);
                                    }
                                  }}
                                >
                                  <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                                    {workspace?.name
                                      ? workspace.name.charAt(0).toUpperCase()
                                      : "?"}
                                  </div>
                                  <span className="text-sm">
                                    {workspace?.name || "Unnamed Workspace"}
                                  </span>
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Channel list */}
              {activeWorkspace && renderChannelsList()}
            </div>
          )}
        </div>

        {/* Use portals for modals */}
        <WorkspaceMembersPortal
          isOpen={showMembersModal}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedMembers([]);
          }}
          workspaceMembers={workspaceMembers}
          isLoading={isWorkspaceMembersLoading}
          currentUser={authUser}
          isAlreadyFriend={isAlreadyFriend}
          removeFriend={removeFriend}
          handleSendFriendRequest={handleSendFriendRequest}
          isSendingFriendRequest={isSendingFriendRequest}
          handleRemoveMember={handleRemoveMember}
          isWorkspaceOwner={isWorkspaceOwner()}
          hasAdminPrivileges={hasAdminPrivileges}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          isPromotingAdmin={isPromotingAdmin}
          handleToggleAdminRole={handleToggleAdminRole}
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
        />

        <RemoveMemberPortal
          isOpen={memberToRemove !== null}
          onClose={() => setMemberToRemove(null)}
          memberToRemove={memberToRemove}
          isRemovingMember={isRemovingMember}
          confirmRemoveMember={confirmRemoveMember}
        />
        
        <InviteFriendsPortal
          isOpen={showInviteMenu}
          onClose={() => setShowInviteMenu(false)}
          friends={friends}
          selectedFriends={selectedFriends}
          toggleFriendSelection={toggleFriendSelection}
          sendInvites={sendInvites}
          isLoading={isInviteLoading}
          workspaceName={getActiveWorkspace()?.name}
          workspaceMembers={workspaceMembers}
        />

        <ChannelCreationModal
          isOpen={showChannelUserSelector}
          onClose={resetChannelCreation}
          channelName={channelName}
          setChannelName={setChannelName}
          isPrivateChannel={isPrivateChannel}
          setIsPrivateChannel={setIsPrivateChannel}
          selectedChannelUsers={selectedChannelUsers}
          workspaceMembers={workspaceMembers}
          isWorkspaceMembersLoading={isWorkspaceMembersLoading}
          toggleUserSelection={toggleUserSelection}
          handleCreateChannel={handleCreateChannel}
        />
      </div>

      {/* Add global styles for animations and scrollbars */}
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4c4f57;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }
      `}</style>
    </>
  );
};

export default WorkSpace;
