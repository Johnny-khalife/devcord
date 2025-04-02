import { useState, useEffect } from "react";
import {
  Briefcase,
  MessageSquare,
  Settings,
  Users2,
  Phone,
} from "lucide-react";
import WorkSpace from "./WorkSpace";
import UsersChat from "./UsersChat";
import WorkspaceSettingsForm from "./WorkspaceSettingsForm";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import ErrorBoundary from './ErrorBoundary';

const Sidebar = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [invitedWorkspaces, setInvitedWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeNavItem, setActiveNavItem] = useState("users");
  const [showWorkspacesNav, setShowWorkspacesNav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  console.log("johnny khalife1",workspaces)
  // Settings modal state
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [selectedWorkspaceForSettings, setSelectedWorkspaceForSettings] =
    useState(null);

  // Get methods from store
  const { fetchUserWorkspaces, createWorkspace, getUserWorkspaces } = useWorkspaceStore();

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
            // This is the crucial part - make sure role is being extracted correctly
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

        // Log the final data for debugging
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

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const workSpacepage = () => {
    setActiveNavItem("workSpace");
  };
  
  const userChatPage = () => {
    setActiveNavItem("users");
  };

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
            isOwned: true
          };

          setWorkspaces([...workspaces, formattedWorkspace]);
          setActiveWorkspace(formattedWorkspace.id);
          setActiveNavItem("workSpace"); // Switch to workspace view after creation
        }
      } catch (error) {
        console.error("Failed to create workspace:", error);
      } finally {
        setIsLoading(false);
        setShowOptions(false);
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
    <div className="flex h-screen pt-16 bg-base-100">
      {/* Narrow navigation sidebar */}
      <div className="w-16 bg-base-300 h-full flex flex-col items-center py-4">
        {/* App logo */}
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-6">
          <MessageSquare className="w-6 h-6 text-primary-content" />
        </div>

        {/* Navigation icons */}
        <div className="flex flex-col items-center gap-6 mt-2">
          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeNavItem === "users" ? "bg-primary/20" : "hover:bg-base-200"
            }`}
            onClick={userChatPage}
          >
            <Users2
              className={`w-5 h-5 ${
                activeNavItem === "users" ? "text-primary" : ""
              }`}
            />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeNavItem === "workSpace"
                ? "bg-primary/20"
                : "hover:bg-base-200"
            }`}
            onClick={workSpacepage}
          >
            <Briefcase
              className={`w-5 h-5 ${
                activeNavItem === "workSpace" ? "text-primary" : ""
              }`}
            />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeNavItem === "calls" ? "bg-primary/20" : "hover:bg-base-200"
            }`}
            onClick={() => setActiveNavItem("calls")}
          >
            <Phone
              className={`w-5 h-5 ${
                activeNavItem === "calls" ? "text-primary" : ""
              }`}
            />
          </button>

          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeNavItem === "settings"
                ? "bg-primary/20"
                : "hover:bg-base-200"
            }`}
            onClick={() => setActiveNavItem("settings")}
          >
            <Settings
              className={`w-5 h-5 ${
                activeNavItem === "settings" ? "text-primary" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Display loading indicator */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}

      {/* Channels/workSpace sidebar */}
      {!isLoading && activeNavItem === "workSpace" && (
        <ErrorBoundary>
          <WorkSpace
            activeNavItem={activeNavItem}
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            workspaces={workspaces}
            setShowWorkspaceMenu={setShowWorkspaceMenu}
            showWorkspaceMenu={showWorkspaceMenu}
            setActiveChannel={setActiveChannel}
            activeChannel={activeChannel}
            handleCreateWorkspace={handleCreateWorkspace}
            handleOpenSettingsForm={handleOpenSettingsForm}
          />
        </ErrorBoundary>
      )}

      {!isLoading && activeNavItem === "users" && (<UsersChat/>)}

      {/* Settings form modal */}
      {showSettingsForm && selectedWorkspaceForSettings && (
        <WorkspaceSettingsForm
          workspaceId={selectedWorkspaceForSettings.id}
          workspace={selectedWorkspaceForSettings}
          onClose={() => setShowSettingsForm(false)}
          onWorkspaceUpdated={handleWorkspaceUpdated}
        />
      )}

      {/* Main content area for other sections */}
      {!isLoading && activeNavItem !== "workSpace" && activeNavItem !== "users" && (
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold">
            {activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}
          </h1>
          <p className="mt-4">
            Select a section from the sidebar to view content.
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;