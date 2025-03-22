import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Briefcase, Hash, ChevronDown, Settings, UserPlus, Check } from "lucide-react";

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
  handleCreateChannel,
  handleOpenSettingsForm,
}) => {
  // State for invite functionality
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const inviteMenuRef = useRef(null);
  const inviteButtonRef = useRef(null);
  
  // Mock friends data - in production would come from props or context
  const [friends, setFriends] = useState([
    { id: "friend1", username: "AlexSmith", status: "online" },
    { id: "friend2", username: "JaneDoe", status: "offline" },
    { id: "friend3", username: "MikeJohnson", status: "online" },
    { id: "friend4", username: "SarahWilliams", status: "online" },
    { id: "friend5", username: "DavidBrown", status: "offline" }
  ]);

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

  // Toggle friend selection
  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  // Send invites to backend
  const sendInvites = () => {
    if (selectedFriends.length === 0) {
      alert("Please select at least one friend to invite");
      return;
    }
    
    // In a real app, this would be an API call
    console.log(`Inviting friends to workspace ${activeWorkspace}:`, selectedFriends);
    alert(`Invites sent to ${selectedFriends.length} friend(s)`);
    
    // Reset state after sending invites
    setSelectedFriends([]);
    setShowInviteMenu(false);
  };

  const getActiveWorkspace = () => {
    return workspaces.find((ws) => ws.id === activeWorkspace) || workspaces[0];
  };
  
  if (workspaces.length === 0) {
    return (
      <div className="w-72 bg-base-200 h-full border-r border-base-300 flex flex-col items-center justify-center p-4">
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
  return (
    <div className="w-72 bg-base-200 h-full border-r border-base-300 flex flex-col">
      {/* Header with title and search */}
      <div className="p-4 border-b border-base-300 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">
            {activeNavItem === "workspaces"
              ? "Workspaces"
              : activeNavItem === "workSpace"
              ? "workSpace"
              : activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}
          </h2>
          <div className="flex items-center relative">
            <button
              className="p-2 hover:bg-base-300 rounded-md"
              onClick={handleCreateWorkspace}
              aria-label="Create Workspace"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            {/* Invite button */}
            {activeNavItem === "workSpace" && activeWorkspace && (
              <button
                ref={inviteButtonRef}
                className="p-2 hover:bg-base-300 rounded-md"
                onClick={() => setShowInviteMenu(!showInviteMenu)}
                aria-label="Invite Friends"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
            
            {/* Settings button */}
            {activeNavItem === "workSpace" && activeWorkspace && (
              <button
                className="p-2 hover:bg-base-300 rounded-md"
                onClick={() => handleOpenSettingsForm(activeWorkspace)}
                aria-label="Workspace Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            {/* Invite Friends Menu */}
            {showInviteMenu && (
              <div 
                ref={inviteMenuRef}
                className="absolute top-10 right-0 w-64 bg-base-100 rounded-md shadow-lg border border-base-300 z-50"
              >
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-3">Invite Friends to Workspace</h3>
                  
                  {/* Search friends */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search friends..."
                      className="w-full px-3 py-2 rounded-md bg-base-200 text-sm"
                    />
                  </div>
                  
                  {/* Friends list for selection */}
                  <div className="max-h-60 overflow-y-auto">
                    {friends.length === 0 ? (
                      <p className="text-sm text-base-content/70 text-center py-2">No friends found</p>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <div
                            key={friend.id}
                            className={`flex items-center justify-between p-2 rounded-md hover:bg-base-200 cursor-pointer ${
                              selectedFriends.includes(friend.id) ? "bg-primary/10" : ""
                            }`}
                            onClick={() => toggleFriendSelection(friend.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                {friend.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{friend.username}</div>
                                <div className="text-xs text-base-content/70">
                                  {friend.status === "online" ? "Online" : "Offline"}
                                </div>
                              </div>
                            </div>
                            
                            {/* Checkmark for selected friends */}
                            {selectedFriends.includes(friend.id) && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-3 flex justify-between">
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => setShowInviteMenu(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={sendInvites}
                      disabled={selectedFriends.length === 0}
                    >
                      Invite ({selectedFriends.length})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-8 pr-4 py-2 rounded-md bg-base-100 text-sm"
          />
          <svg
            className="w-4 h-4 absolute left-2 top-2.5 text-base-content/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
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
                    {getActiveWorkspace()?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className="font-medium">
                    {getActiveWorkspace()?.name || "Select Workspace"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Modified Workspace dropdown menu */}
              {showWorkspaceMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 rounded-md shadow-lg z-50 border border-base-300">
                  <div className="py-1">
                    <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
                      YOUR WORKSPACES
                    </div>

                    <div className="border-t border-base-200 pt-1">
                      <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
                        ALL WORKSPACES
                      </div>
                      {workspaces.map((workspace) => (
                        <button
                          key={workspace.id}
                          className={`w-full px-2 py-1 mt-1 text-left flex items-center gap-2 rounded-md ${
                            activeWorkspace === workspace.id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-base-200"
                          }`}
                          onClick={() => {
                            setActiveWorkspace(workspace.id);
                            setShowWorkspaceMenu(false);
                            if (
                              workspace.channels &&
                              workspace.channels.length > 0
                            ) {
                              setActiveChannel(workspace.channels[0]);
                            }
                          }}
                        >
                          <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center">
                            {workspace.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{workspace.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Channel list */}
            {activeWorkspace && getActiveWorkspace() && (
              <div className="space-y-1 mt-4">
                <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
                  CHANNELS
                </div>
                {getActiveWorkspace().channels &&
                  getActiveWorkspace().channels.map((channel) => (
                    <Link
                      key={channel}
                      to={`/workspace/${activeWorkspace}/channel/${channel}`}
                      className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300 ${
                        activeChannel === channel
                          ? "bg-primary/10 text-primary font-medium"
                          : ""
                      }`}
                      onClick={() => setActiveChannel(channel)}
                    >
                      <Hash className="w-4 h-4" />
                      <span>{channel}</span>
                    </Link>
                  ))}
                <button
                  className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300 text-base-content/70 w-full text-left"
                  onClick={() => handleCreateChannel(activeWorkspace)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Channel</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkSpace;