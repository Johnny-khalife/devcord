import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import Sidebar from "../components/Sidebar";
import WorkSpace from "../components/WorkSpace";
import UserFriends from "../components/UserFriends";
import JobsView from "../components/JobsView";
import WorkspaceSettingsForm from "../components/WorkspaceSettingsForm";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useChatStore } from "../store/useChatStore";
import NoChatSelected from "../components/NoChatSelected";
import { useChannelStore } from "../store/useChannelStore";
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';

const HomePage = () => {
  const location = useLocation();
  // State for mobile view
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle openSearchPortal state from location
  useEffect(() => {
    if (location.state?.openSearchPortal) {
      // Dispatch a custom event to open the search portal
      window.dispatchEvent(new CustomEvent('open-search-portal'));
      // Clean up the location state
      window.history.replaceState({ ...location.state, openSearchPortal: false }, '');
    }
  }, [location.state]);

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
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

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
            useChatStore.getState().setSelectedChannel(null);
            return;
          }
          
          // If activeChannel is set, try to find it
          if (activeChannel) {
            const currentChannel = workspaceChannels.find(channel => channel._id === activeChannel);
            
            if (currentChannel) {
              // Create a properly structured object with all IDs
              const enrichedChannel = {
                ...currentChannel,
                channelId: currentChannel._id,
                workspaceId: activeWorkspace,
                id: currentChannel._id,
                _id: currentChannel._id
              };
              
              console.log("Setting enriched channel from sync:", enrichedChannel);
              setSelectedWorkspace(enrichedChannel);
              
              // Set selected channel in the chat store for proper message filtering
              useChatStore.getState().setSelectedChannel(enrichedChannel);
            } else if (workspaceChannels.length > 0) {
              // If active channel not found, set the first channel as active
              setActiveChannel(workspaceChannels[0]._id);
              
              // Create a properly structured object with all IDs
              const enrichedChannel = {
                ...workspaceChannels[0],
                channelId: workspaceChannels[0]._id,
                workspaceId: activeWorkspace,
                id: workspaceChannels[0]._id,
                _id: workspaceChannels[0]._id
              };
              
              setSelectedWorkspace(enrichedChannel);
              
              // Set selected channel in the chat store for proper message filtering
              useChatStore.getState().setSelectedChannel(enrichedChannel);
            }
          } else if (workspaceChannels.length > 0) {
            // If no active channel set but workspace has channels, set the first one
            setActiveChannel(workspaceChannels[0]._id);
            
            // Create a properly structured object with all IDs
            const enrichedChannel = {
              ...workspaceChannels[0],
              channelId: workspaceChannels[0]._id,
              workspaceId: activeWorkspace,
              id: workspaceChannels[0]._id,
              _id: workspaceChannels[0]._id
            };
            
            setSelectedWorkspace(enrichedChannel);
            
            // Set selected channel in the chat store for proper message filtering
            useChatStore.getState().setSelectedChannel(enrichedChannel);
          }
        } catch (error) {
          console.error("Error syncing selected workspace:", error);
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

  // Add this useEffect to handle workspace access
  useEffect(() => {
    // Reset workspace and channel state when switching to workspace view
    if (activeNavItem === "workSpace") {
      // Check if current active workspace is accessible
      const hasAccess = workspaces.some(ws => 
        ws?.id === activeWorkspace && (ws.isOwned || ws.isInvited || ws.role === "member" || ws.role === "admin")
      );

      if (!hasAccess) {
        setActiveWorkspace(null);
        setActiveChannel(null);
        setSelectedWorkspace(null);
      }
    }
  }, [activeNavItem, workspaces, activeWorkspace, setSelectedWorkspace]);

  const handleCreateWorkspace = () => {
    setNewWorkspaceName('');
    setShowCreateWorkspaceModal(true);
  };

  const handleSubmitWorkspace = async (e) => {
    e.preventDefault();
    if (newWorkspaceName) {
      try {
        setIsLoading(true);
        const newWorkspace = await createWorkspace({
          workspaceName: newWorkspaceName,
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
          setShowCreateWorkspaceModal(false);
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
      <div className="flex flex-1 relative overflow-hidden">
        {/* Secondary sidebar - either workspace or user friends */}
        {(activeNavItem === "workSpace" || activeNavItem === "users") && (
          <div className={`${isMobile ? 'absolute inset-0 -z-5' : 'relative min-w-[200px] max-w-[320px] w-[240px] resize-x overflow-hidden'} ${(activeNavItem === "workSpace" || activeNavItem === "users") && isMobile ? 'pointer-events-none' : ''}`}>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="loading loading-spinner loading-lg text-primary"></div>
              </div>
            ) : (
              <>
                {activeNavItem === "workSpace" && (
                  <div className={`${isMobile ? 'pointer-events-auto' : ''}`}>
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
                  </div>
                )}
                
                {activeNavItem === "users" && (
                  <div className={`h-full ${isMobile ? 'pointer-events-auto' : ''}`}>
                    <UserFriends />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Main content area - ChatBox or JobsView */}
        <div className={`flex-1 overflow-hidden ${isMobile ? 'z-5' : ''}`}>
          {activeNavItem === "jobs" ? (
            <JobsView />
          ) : (
            <>
              {((activeNavItem === "users" && !selectedFriend) || 
                (activeNavItem === "workSpace" && (!selectedWorkspace || !workspaces.some(ws => 
                  ws?.id === activeWorkspace && (ws.isOwned || ws.isInvited || ws.role === "member" || ws.role === "admin")
                )))) ? (
                <NoChatSelected />
              ) : (
                <ChatBox 
                  activeNavItem={activeNavItem}
                  activeWorkspace={activeWorkspace}
                  activeChannel={activeChannel}
                  selectedWorkspace={selectedWorkspace}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showCreateWorkspaceModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspaceModal(false)}
          workspaceName={newWorkspaceName}
          setWorkspaceName={setNewWorkspaceName}
          onSubmit={handleSubmitWorkspace}
          isLoading={isLoading}
        />
      )}
      
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

// Create Workspace Modal Component
const CreateWorkspaceModal = ({ onClose, workspaceName, setWorkspaceName, onSubmit, isLoading }) => {
  const [preventDialog, setPreventDialog] = useState(false);
  
  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn" onClick={onClose}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div 
        className="bg-[#1E1F22]/90 backdrop-blur-md rounded-xl w-full max-w-md p-0 shadow-2xl border border-[#2F3136]/50 relative transition-all duration-300 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon and title */}
        <div className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Create Workspace</h2>
            </div>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Gradient border */}
          <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="p-6 pt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter workspace name:
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-3 bg-[#2B2D31] border border-[#40444B] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="My Awesome Workspace"
                required
                autoFocus
              />
            </div>
            
            <div className="flex items-center mb-4">
              <input
                id="prevent-dialog"
                type="checkbox"
                checked={preventDialog}
                onChange={() => setPreventDialog(!preventDialog)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded bg-[#2B2D31]"
              />
              <label htmlFor="prevent-dialog" className="ml-2 block text-sm text-gray-400">
                Prevent this page from creating additional dialogs
              </label>
            </div>
          </div>
          
          <div className="border-t border-gray-700 p-4 bg-[#2B2D31]/70 flex justify-end space-x-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2"
              disabled={isLoading || !workspaceName.trim()}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : 'OK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(
    <>
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
      {modalContent}
    </>,
    document.body
  );
};

export default HomePage;