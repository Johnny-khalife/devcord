import { useState, useEffect } from "react";
import ChatBox from "../components/ChatBox";
import Sidebar from "../components/Sidebar";
import WorkSpace from "../components/WorkSpace";
import UserFriends from "../components/UserFriends";
import WorkspaceSettingsForm from "../components/WorkspaceSettingsForm";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useChatStore } from "../store/useChatStore";
import NoChatSelected from "../components/NoChatSelected";
import { useChannelStore } from "../store/useChannelStore";


const HomePage = () => {
  const [showOptions, setShowOptions] = useState(false);
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
    const [workspaces, setWorkspaces] = useState([]);
    const [invitedWorkspaces, setInvitedWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [activeChannel, setActiveChannel] = useState("general");
    const [activeNavItem, setActiveNavItem] = useState("users");
    const [showWorkspacesNav, setShowWorkspacesNav] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Settings modal state
    const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [selectedWorkspaceForSettings, setSelectedWorkspaceForSettings] = useState(null);

  // Get methods from store
  const { fetchUserWorkspaces, createWorkspace, getUserWorkspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
  const { selectedFriend, setSelectedFriend } = useChatStore();
  const { fetchWorkspaceChannels } = useChannelStore();

  // Fetch workspaces on component mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      setIsLoading(true);
      try {
        // Fetch both owned and invited workspaces
        const ownedWorkspaces = await fetchUserWorkspaces();
        console.log("Raw owned workspaces data:", ownedWorkspaces);
        
        const joinedWorkspaces = await getUserWorkspaces();
        console.log("Raw joined workspaces data:", joinedWorkspaces);
        
        // Combine workspaces from both sources
        let allWorkspaces = [];
        
        // Process owned workspaces
        if (ownedWorkspaces && ownedWorkspaces.length > 0) {
          const formattedOwnedWorkspaces = ownedWorkspaces.map((ws) => ({
            id: ws._id,
            name: ws.workspaceName || ws.name || "Unnamed Workspace",
            description: ws.description,
            channels: ws.channels || ["general"],
            icon: "briefcase",
            isOwned: true,
            isInvited: false,
            role: "owner"  // Explicitly set role for owned workspaces
          }));
          allWorkspaces = [...allWorkspaces, ...formattedOwnedWorkspaces];
        }
        
        // Process joined workspaces
        if (joinedWorkspaces && joinedWorkspaces.length > 0) {
          const formattedJoinedWorkspaces = joinedWorkspaces.map((ws, index) => {
            console.log(`Processing joined workspace #${index}:`, ws);
            
            // Extract role information directly from the API response
            const role = ws.role || "member";
            console.log(`Role for workspace #${index}:`, role);
            
            return {
              id: ws._id || ws.id,
              name: ws.workspaceName || ws.name || "Unnamed Workspace",
              description: ws.description || "No description available",
              channels: ws.channels || ["general"],
              icon: "briefcase",
              isOwned: role === "owner",  // Set isOwned based on role
              isInvited: role !== "owner", // Set isInvited as the opposite of isOwned
              role: role  // Store the role
            };
          });
          
          console.log("Formatted joined workspaces:", formattedJoinedWorkspaces);
          allWorkspaces = [...allWorkspaces, ...formattedJoinedWorkspaces];
        }

        console.log("All workspaces after formatting:", allWorkspaces.map(ws => ({
          id: ws.id,
          name: ws.name,
          role: ws.role,
          isOwned: ws.isOwned,
          isInvited: ws.isInvited
        })));
        
        setWorkspaces(allWorkspaces);

        // Set active workspace if none is selected
        if (!activeWorkspace && allWorkspaces.length > 0) {
          setActiveWorkspace(allWorkspaces[0].id);
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, [fetchUserWorkspaces, getUserWorkspaces]);

  // Add a new effect to handle nav item changes
  useEffect(() => {
    // When switching to workspace view, make sure the selectedWorkspace is in sync with activeChannel
    const syncSelectedWorkspace = async () => {
      if (activeNavItem === "workSpace" && activeWorkspace) {
        try {
          // Fetch the channels for this workspace
          const workspaceChannels = await fetchWorkspaceChannels(activeWorkspace);
          
          if (workspaceChannels.length === 0) {
            // If the workspace has no channels, reset both active channel and selected workspace
            setActiveChannel(null);
            setSelectedWorkspace(null);
            return;
          }
          
          // If activeChannel is set, try to find it
          if (activeChannel) {
            const currentChannel = workspaceChannels.find(channel => channel._id === activeChannel);
            
            if (currentChannel) {
              // Update the selected workspace with the current channel
              setSelectedWorkspace(currentChannel);
            } else if (workspaceChannels.length > 0) {
              // If active channel not found, set the first channel as active
              setActiveChannel(workspaceChannels[0]._id);
              setSelectedWorkspace(workspaceChannels[0]);
            }
          } else if (workspaceChannels.length > 0) {
            // If no active channel set but workspace has channels, set the first one
            setActiveChannel(workspaceChannels[0]._id);
            setSelectedWorkspace(workspaceChannels[0]);
          }
        } catch (error) {
          console.error("Failed to sync selected workspace:", error);
          // In case of error, reset selected workspace
          setSelectedWorkspace(null);
        }
      }
    };

    syncSelectedWorkspace();
  }, [activeNavItem, activeWorkspace, activeChannel, fetchWorkspaceChannels, setSelectedWorkspace]);

  // Add an effect to clear selectedFriend when switching between navigation items
  useEffect(() => {
    // When switching to a non-users tab, reset the selectedFriend
    if (activeNavItem !== "users") {
      setSelectedFriend(null);
    }
  }, [activeNavItem, setSelectedFriend]);

  const handleCreateWorkspace = async () => {
    const name = prompt("Enter workspace name:");
    if (name) {
      try {
        setIsLoading(true);
        const newWorkspace = await createWorkspace({
          workspaceName: name,
          description: "",
        });

        if (newWorkspace) {
          // Format the new workspace for state
          const formattedWorkspace = {
            id: newWorkspace._id,
            name: newWorkspace.workspaceName,
            description: newWorkspace.description,
            channels: ["general"],
            icon: "briefcase",
            isOwned: true,
            role: "owner"
          };

          setWorkspaces([...workspaces, formattedWorkspace]);
          setActiveWorkspace(formattedWorkspace.id);
          setActiveNavItem("workSpace"); // Switch to workspace view after creation
        }
      } catch (error) {
        console.error("Failed to create workspace:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open settings form for a workspace
  const handleOpenSettingsForm = (workspaceId) => {
    const workspace = workspaces.find((ws) => ws.id === workspaceId);
    setSelectedWorkspaceForSettings(workspace);
    setShowSettingsForm(true);
  };

  // Handle workspace updates from settings form
  const handleWorkspaceUpdated = (workspaceId, updatedWorkspace, action) => {
    if (action === "delete" || action === "leave") {
      // Remove workspace from the list
      setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));

      // If the deleted workspace was active, switch to another one
      if (activeWorkspace === workspaceId) {
        const remainingWorkspace = workspaces.find(
          (ws) => ws.id !== workspaceId
        );
        if (remainingWorkspace) {
          setActiveWorkspace(remainingWorkspace.id);
          setActiveChannel(remainingWorkspace.channels[0] || "general");
        } else {
          setActiveWorkspace(null);
        }
      }
    } else if (updatedWorkspace) {
      // Update the workspace with new data
      setWorkspaces(
        workspaces.map((ws) =>
          ws.id === workspaceId
            ? {
                ...ws,
                name: updatedWorkspace.name || ws.name,
                description: updatedWorkspace.description || ws.description,
              }
            : ws
        )
      );
    }
  };

  return (
    <div className="flex h-screen pt-16">
      {/* Left sidebar with nav icons */}
      <Sidebar 
        activeNavItem={activeNavItem}
        setActiveNavItem={setActiveNavItem}
      />
      
      {/* Mid section - varies based on activeNavItem */}
      <div className="flex flex-1">
        {/* Secondary sidebar - either workspace or user friends */}
        <div className="w-72 border-r border-base-300">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
          ) : (
            <>
              {activeNavItem === "workSpace" && (
                <WorkSpace
      activeNavItem={activeNavItem}
      activeWorkspace={activeWorkspace}
      setActiveWorkspace={setActiveWorkspace}
      workspaces={workspaces}
      setWorkspaces={setWorkspaces}
      setShowWorkspaceMenu={setShowWorkspaceMenu}
      showWorkspaceMenu={showWorkspaceMenu}
      setActiveChannel={setActiveChannel}
      activeChannel={activeChannel}
      handleCreateWorkspace={handleCreateWorkspace}
      handleOpenSettingsForm={handleOpenSettingsForm}
      />
              )}
              
              {activeNavItem === "users" && (
                <UserFriends />
              )}
            </>
          )}
      </div>
        
        {/* Main content area - ChatBox */}
        <div className="flex-1">
        {
          // Show NoChatSelected when:
          // 1. In users view with no selected friend
          // 2. In workspace view with no selected workspace (no channels)
          // 3. Any other view
          (activeNavItem === "users" && !selectedFriend) || 
          (activeNavItem === "workSpace" && !selectedWorkspace) || 
          (activeNavItem !== "users" && activeNavItem !== "workSpace") 
          ? 
          <NoChatSelected /> 
          : 
          <ChatBox 
            activeNavItem={activeNavItem}
            activeWorkspace={activeWorkspace}
            activeChannel={activeChannel}
            selectedWorkspace={selectedWorkspace}
          />
        }
        </div>
      </div>
      
      {/* Add the settings form modal */}
      {showSettingsForm && selectedWorkspaceForSettings && (
        <WorkspaceSettingsForm
          workspaceId={selectedWorkspaceForSettings.id}
          workspace={selectedWorkspaceForSettings}
          onClose={() => setShowSettingsForm(false)}
          onWorkspaceUpdated={handleWorkspaceUpdated}
        />
      )}
    </div>
  );
};

export default HomePage;