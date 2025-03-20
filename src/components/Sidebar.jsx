import { useState, useEffect } from "react";
import {
  Plus,
  Briefcase,
  Users,
  Hash,
  ChevronDown,
  MessageSquare,
  Settings,
  Users2,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import WorkSpace from "./WorkSpace";
import WorkspaceSettingsForm from "./WorkspaceSettingsForm";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

const Sidebar = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeNavItem, setActiveNavItem] = useState("workSpace");
  const [showWorkspacesNav, setShowWorkspacesNav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings modal state
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [selectedWorkspaceForSettings, setSelectedWorkspaceForSettings] = useState(null);

  // Get methods from store
  const { fetchUserWorkspaces, createWorkspace } = useWorkspaceStore();

  // Fetch workspaces on component mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      setIsLoading(true);
      try {
        const userWorkspaces = await fetchUserWorkspaces();
        
        if (userWorkspaces && userWorkspaces.length > 0) {
          // Map workspaces to the expected format for this component
          const formattedWorkspaces = userWorkspaces.map(ws => ({
            id: ws._id,
            name: ws.workspaceName,
            description: ws.description,
            channels: ws.channels || ["general"], // Default channel if none exist
            icon: "briefcase"
          }));
          
          setWorkspaces(formattedWorkspaces);
          
          // Set active workspace if none is selected
          if (!activeWorkspace && formattedWorkspaces.length > 0) {
            setActiveWorkspace(formattedWorkspaces[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkspaces();
  }, [fetchUserWorkspaces]);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const workSpacepage = () => {
    setActiveNavItem("workSpace");
  };

  const handleCreateWorkspace = async () => {
    const name = prompt("Enter workspace name:");
    console.log(name)
    if (name) {
      try {
        setIsLoading(true);
        const newWorkspace = await createWorkspace({
          workspaceName: name,
          description: ""
        });
        
        if (newWorkspace) {
          // Format the new workspace for state
          const formattedWorkspace = {
            id: newWorkspace._id,
            name: newWorkspace.workspaceName,
            description: newWorkspace.description,
            channels: ["general"],
            icon: "briefcase"
          };
          
          setWorkspaces([...workspaces, formattedWorkspace]);
          setActiveWorkspace(formattedWorkspace.id);
        }
      } catch (error) {
        console.error("Failed to create workspace:", error);
      } finally {
        setIsLoading(false);
        setShowOptions(false);
      }
    }
  };

  const handleCreateChannel = (workspaceId) => {
    const name = prompt("Enter channel name:");
    if (name) {
      // In a real app, this would call an API to create the channel
      // For now, we'll update the local state
      setWorkspaces(
        workspaces.map((ws) =>
          ws.id === workspaceId
            ? { ...ws, channels: [...ws.channels, name] }
            : ws
        )
      );
      setActiveChannel(name);
    }
  };

  // Open settings form for a workspace
  const handleOpenSettingsForm = (workspaceId) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    setSelectedWorkspaceForSettings(workspace);
    setShowSettingsForm(true);
  };

  // Handle workspace updates from settings form
  const handleWorkspaceUpdated = (workspaceId, updatedWorkspace, action) => {
    if (action === 'delete' || action === 'leave') {
      // Remove workspace from the list
      setWorkspaces(workspaces.filter(ws => ws.id !== workspaceId));
      
      // If the deleted workspace was active, switch to another one
      if (activeWorkspace === workspaceId) {
        const remainingWorkspace = workspaces.find(ws => ws.id !== workspaceId);
        if (remainingWorkspace) {
          setActiveWorkspace(remainingWorkspace.id);
          setActiveChannel(remainingWorkspace.channels[0] || "general");
        } else {
          setActiveWorkspace(null);
        }
      }
    } else if (updatedWorkspace) {
      // Update the workspace with new data
      setWorkspaces(workspaces.map(ws => 
        ws.id === workspaceId ? { 
          ...ws, 
          name: updatedWorkspace.name || ws.name,
          description: updatedWorkspace.description || ws.description
        } : ws
      ));
    }
  };

  return (
    <div className="flex h-screen mt-16 bg-base-100">
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
            onClick={() => setActiveNavItem("users")}
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
          handleCreateChannel={handleCreateChannel}
          handleOpenSettingsForm={handleOpenSettingsForm}
        />
      )}

      {/* Settings form modal */}
      {showSettingsForm && selectedWorkspaceForSettings && (
        <WorkspaceSettingsForm
          workspaceId={selectedWorkspaceForSettings.id}
          workspace={selectedWorkspaceForSettings}
          onClose={() => setShowSettingsForm(false)}
          onWorkspaceUpdated={handleWorkspaceUpdated}
        />
      )}

      {/* Main content area would go here */}
      {!isLoading && !activeNavItem === "workSpace" && (
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold">
            {activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}
          </h1>
          <p className="mt-4">Select a section from the sidebar to view content.</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;