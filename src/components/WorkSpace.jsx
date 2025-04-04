import { useState, useRef, useEffect } from "react";
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
  } = useWorkspaceStore();
  const { friends, sendFriendRequest, removeFriend } = useFriendStore();
  const { user: currentUser } = useAuthStore();
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [isWorkspaceMembersLoading, setIsWorkspaceMembersLoading] =
    useState(false);
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);

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
  const { fetchWorkspaceChannels, createChannel, deleteChannel } =
    useChannelStore();

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
      if (!activeWorkspace) return;

      setIsChannelsLoading(true);
      try {
        const workspaceChannels = await fetchWorkspaceChannels(activeWorkspace);
        setChannels(workspaceChannels);

        // If there are channels, set one as active
        if (workspaceChannels.length > 0) {
          const defaultChannel = workspaceChannels[0];

          // Check if activeChannel exists in the list of channels
          const currentChannel = workspaceChannels.find(
            (channel) => channel._id === activeChannel
          );

          if (currentChannel) {
            // Set the current channel as selected
            setActiveChannel(currentChannel._id);
            setSelectedWorkspace(currentChannel);
          } else {
            // Set the first channel as active
            setActiveChannel(defaultChannel._id);
            setSelectedWorkspace(defaultChannel);
          }
        } else {
          // If there are no channels, clear the active channel and selected workspace
          setActiveChannel(null);
          setSelectedWorkspace(null);
          console.log("No channels found for workspace:", activeWorkspace);
        }
      } catch (error) {
        console.error("Failed to fetch workspace channels:", error);
        // On error, reset the active channel and selected workspace
        setActiveChannel(null);
        setSelectedWorkspace(null);
      } finally {
        setIsChannelsLoading(false);
      }
    };

    loadWorkspaceChannels();
  }, [
    activeWorkspace,
    fetchWorkspaceChannels,
    activeChannel,
    setSelectedWorkspace,
  ]);

  useEffect(() => {
    console.log("Current user:", currentUser);
  }, [currentUser]);

  // And inside useEffect that depends on activeWorkspace
  useEffect(() => {
    console.log("Active workspace changed:", activeWorkspace);
    console.log("Current workspaces:", workspaces);

    const fetchWorkspaceMembers = async () => {
      if (!activeWorkspace) {
        console.log("No active workspace, skipping member fetch");
        return;
      }

      setIsWorkspaceMembersLoading(true);
      try {
        console.log("Fetching members for workspace:", activeWorkspace);
        const members = await getWorkspaceMembers(activeWorkspace);

        if (Array.isArray(members)) {
          // Map members to include both id and _id and role
          const formattedMembers = members.map((member) => ({
            ...member,
            id: member.id || member._id || member.userId,
            // Make sure role is included
            role: member.role || "member",
            isOwned: member.role === "owner",
            isAdmin: member.role === "admin",
          }));

          setWorkspaceMembers(formattedMembers);
          console.log("Members loaded successfully:", formattedMembers);
        } else {
          console.error("Received invalid members data:", members);
          setWorkspaceMembers([]);
        }
      } catch (error) {
        console.error("Error in fetchWorkspaceMembers:", error);
        toast.error(
          error.response?.data?.message || "Could not load workspace members"
        );
        setWorkspaceMembers([]);
      } finally {
        setIsWorkspaceMembersLoading(false);
      }
    };

    fetchWorkspaceMembers();
  }, [activeWorkspace, getWorkspaceMembers]);

  ///////////////////////////////////////////////////////////////

  // In WorkSpace.jsx, update the selectedWorkspaceWhenClick function
  const selectedWorkspaceWhenClick = ({ id, channel }) => {
    setActiveChannel(id);
    setSelectedWorkspace(channel); // This should be the channel object
    console.log("Channel selected:", channel); // Add debug log
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
    setShowChannelUserSelector(false);
    setChannelName("");
    setIsPrivateChannel(false);
    setSelectedChannelUsers([]);
  };

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

  // Render channels list with private channel indicator
  const renderChannelsList = () => {
    if (isChannelsLoading) {
      return (
        <div className="flex justify-center items-center py-4">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      );
    }

    return (
      <div className="space-y-1 mt-4">
        <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
          CHANNELS
        </div>
        {channels.map((channel) => (
          <div key={channel._id} className="flex items-center justify-between">
            <button
              className={`flex-grow flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300 ${
                activeChannel === channel._id
                  ? "bg-primary/10 text-primary font-medium"
                  : ""
              }`}
              onClick={() =>
                selectedWorkspaceWhenClick({
                  id: channel._id,
                  channel: channel,
                })
              }
            >
              {channel.isPrivate ? (
                <Lock className="w-4 h-4 text-warning" />
              ) : (
                <Hash className="w-4 h-4" />
              )}
              <span>{channel.channelName}</span>
            </button>
            {/* Only show delete button for owners */}
            {isWorkspaceOwner() && (
              <button
                onClick={() => handleDeleteChannel(channel._id)}
                className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 rounded-full"
                title="Delete Channel"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {isWorkspaceOwner() && (
          <div className="flex items-center gap-2 px-2 py-2">
            <button
              className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300 text-base-content/70 w-full text-left"
              onClick={() => setShowChannelUserSelector(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Add Channel</span>
            </button>
          </div>
        )}

        {/* Channel Creation Modal */}
        {showChannelUserSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Create New Channel</h3>

              {/* Channel Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  placeholder="Enter channel name"
                  className="input input-bordered w-full"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                />
              </div>

              {/* Private Channel Toggle */}
              <div className="form-control mb-4">
                <label className="cursor-pointer label">
                  <span className="label-text flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Private Channel
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={isPrivateChannel}
                    onChange={() => setIsPrivateChannel(!isPrivateChannel)}
                  />
                </label>
              </div>

              {/* User Selection for Private Channels */}
              {isPrivateChannel && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Users for this Channel
                  </label>
                  {isWorkspaceMembersLoading ? (
                    <div className="text-center">
                      <span className="loading loading-spinner loading-sm"></span>
                    </div>
                  ) : workspaceMembers.length === 0 ? (
                    <div className="text-center p-4 border rounded-md bg-base-200">
                      <p className="text-sm">
                        No members found in this workspace.
                      </p>
                      <p className="text-xs text-base-content/70 mt-1">
                        Invite members using the invite button at the top.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                      {workspaceMembers
                        // Only filter out the current owner, not all users
                        .filter(
                          (member) =>
                            !(member.role === "owner" || member.isOwned)
                        )
                        .map((member) => (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-2 hover:bg-base-200 cursor-pointer ${
                              selectedChannelUsers.includes(member.id)
                                ? "bg-primary/10"
                                : ""
                            }`}
                            onClick={() => toggleUserSelection(member.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                {member.username
                                  ? member.username.charAt(0).toUpperCase()
                                  : "?"}
                              </div>
                              <span>{member.username}</span>
                            </div>
                            {selectedChannelUsers.includes(member.id) && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end mt-4 gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={resetChannelCreation}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateChannel}
                  disabled={
                    !channelName ||
                    (isPrivateChannel && selectedChannelUsers.length === 0)
                  }
                >
                  Create Channel
                </button>
              </div>
            </div>
          </div>
        )}
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

  if (workspaces.length === 0) {
    return (
      <div
        className={`${
          isMobile ? "w-full" : "w-72"
        } bg-base-200 h-full border-r border-base-300 flex flex-col items-center justify-center p-4`}
      >
        <div className="text-center mb-4">
          <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <h3 className="font-medium text-lg">No Workspaces</h3>
          <p className="text-sm opacity-70 mb-4">
            Create your first workspace to get started
          </p>
          <button className="btn btn-primary" onClick={handleCreateWorkspace}>
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </button>
        </div>
      </div>
    );
  }

  // Mobile view toggle for workspace sidebar
  const MobileWorkspaceToggle = () => {
    if (!isMobile) return null;

    return (
      <button
        onClick={toggleWorkspaceSidebar}
        className="fixed top-20 left-4 z-40 p-2 bg-primary text-primary-content rounded-md shadow-md"
      >
        {isWorkspaceSidebarOpen ? <ChevronDown /> : <Hash />}
      </button>
    );
  };

  return (
    <>
      <MobileWorkspaceToggle />
      <div
        className={`
        ${isMobile ? "fixed left-0 top-16 bottom-0 z-30" : "w-72"} 
        ${
          isMobile && !isWorkspaceSidebarOpen
            ? "translate-x-[-100%]"
            : "translate-x-0"
        } 
        bg-base-200 h-full border-r border-base-300 flex flex-col transition-transform duration-300 ease-in-out
      `}
      >
        {/* Header section */}
        <div className="p-4 border-b border-base-300 flex-shrink-0">
          {/* Title and Create Workspace */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">
              {activeNavItem === "workspaces"
                ? "Workspaces"
                : activeNavItem === "workSpace"
                ? "workSpace"
                : activeNavItem.charAt(0).toUpperCase() +
                  activeNavItem.slice(1)}
            </h2>
            <div className="flex items-center relative">
              <button
                className="p-2 hover:bg-base-300 rounded-md"
                onClick={handleCreateWorkspace}
                aria-label="Create Workspace"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action buttons row */}
          {activeNavItem === "workSpace" && activeWorkspace && (
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                className="p-2 hover:bg-base-300 rounded-md"
                onClick={handleShowMembers}
                aria-label="Show Workspace Members"
              >
                <Users className="w-5 h-5" />
              </button>

              {hasAdminPrivileges() && (
                <button
                  ref={inviteButtonRef}
                  className="p-2 hover:bg-base-300 rounded-md"
                  onClick={() => setShowInviteMenu(!showInviteMenu)}
                  aria-label="Invite Friends"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              )}

              <button
                className="p-2 hover:bg-base-300 rounded-md"
                onClick={() => handleOpenSettingsForm(activeWorkspace)}
                aria-label="Workspace Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-grow">
          {/* Workspace management section */}
          {/* Workspace section for workSpace view */}
          {activeNavItem === "workSpace" && (
            <div className="p-2">
              {/* Workspace header with dropdown */}
              <div className="relative mb-2">
                <button
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-base-300"
                  onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                      {getActiveWorkspace()?.name?.charAt(0).toUpperCase() ||
                        "?"}
                    </div>
                    <span className="font-medium">
                      {getActiveWorkspace()?.name || "Select Workspace"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* Modified Workspace dropdown menu */}
                {showWorkspaceMenu && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 rounded-md shadow-lg z-50 border border-base-300">
                    <div className="py-1">
                      {/* Show owned workspaces section */}
                      <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
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
                            className={`w-full px-2 py-1 mt-1 text-left flex items-center gap-2 rounded-md ${
                              activeWorkspace === workspace?.id
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-base-200"
                            }`}
                            onClick={() => {
                              if (workspace?.id) {
                                setActiveWorkspace(workspace.id);
                                setShowWorkspaceMenu(false);
                                if (
                                  workspace.channels &&
                                  workspace.channels.length > 0
                                ) {
                                  setActiveChannel(workspace.channels[0]);
                                }
                              }
                            }}
                          >
                            <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center">
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
                      <div className="border-t border-base-200 pt-1 mt-1">
                        <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
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
                          <div className="px-2 py-1 text-xs text-base-content/50 italic">
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
                                  className={`w-full px-2 py-1 mt-1 text-left flex items-center gap-2 rounded-md ${
                                    activeWorkspace === workspace?.id
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-base-200"
                                  }`}
                                  onClick={() => {
                                    if (workspace?.id) {
                                      setActiveWorkspace(workspace.id);
                                      setShowWorkspaceMenu(false);
                                      // Reset active channel when switching workspaces
                                      setActiveChannel(null);
                                    }
                                  }}
                                >
                                  <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center">
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

          {/* Replace the Invite Friends Menu with portal implementation */}
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
      </div>
    </>
  );
};

export default WorkSpace;
