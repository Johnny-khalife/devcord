import React, { useState, useEffect } from 'react';
import { X, Settings, Link as LinkIcon, LogOut, Trash, Save, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { createPortal } from 'react-dom';

const WorkspaceSettingsForm = ({ workspaceId, workspace, onClose, onWorkspaceUpdated }) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [copySuccess, setCopySuccess] = useState(false);

  const { updateWorkspace, deleteWorkspace, getWorkspaceInviteUrl, leaveWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || '');
      setDescription(workspace.description || '');
    }
    
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [workspace]);

  // Check if user is owner
  const isOwner = workspace.role === "owner" || workspace.isOwned;

  // Check if user has admin privileges (owner or admin)
  const hasAdminPrivileges = workspace.role === "owner" || workspace.role === "admin" || workspace.isOwned || workspace.isAdmin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Allow both owners and admins to update workspace details
    if (!hasAdminPrivileges) {
      setError('Only workspace owners and admins can modify workspace details.');
      return;
    }
    
    try {
      setIsLoading(true);
      await updateWorkspace(
        workspaceId, 
        { workspaceName, description }, 
        setIsLoading,
        (updatedData) => {
          onWorkspaceUpdated(workspaceId, {
            name: updatedData.workspace.workspaceName,
            description: updatedData.workspace.description
          });
        },
        onClose
      );
    } catch (error) {
      console.error('Failed to update workspace:', error);
      setError('Failed to update workspace. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      setError('Only the workspace owner can delete this workspace.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      try {
        await deleteWorkspace(workspaceId, setIsLoading, onWorkspaceUpdated, onClose);
      } catch (error) {
        console.error('Failed to delete workspace:', error);
        setError('Failed to delete workspace. Please try again.');
      }
    }
  };

  const handleGetInviteUrl = async () => {
    try {
      const response = await getWorkspaceInviteUrl(workspaceId, setIsLoading, setError);
      
      if (response) {
        // Backend returns inviteUrl and inviteCode
        const fullInviteUrl = response.inviteUrl;
        setInviteUrl(fullInviteUrl);
      }
    } catch (error) {
      console.error('Failed to get invite URL:', error);
      setError('Failed to generate invite URL. Please try again.');
    }
  };

  const handleLeave = async () => {
    // Don't allow owners to leave their workspace (they should delete it instead)
    if (isOwner) {
      setError('As the owner, you cannot leave this workspace. You can delete it instead.');
      return;
    }
    
    if (window.confirm('Are you sure you want to leave this workspace?')) {
      try {
        await leaveWorkspace(workspaceId, setIsLoading, onWorkspaceUpdated, onClose);
      } catch (error) {
        console.error('Failed to leave workspace:', error);
        setError('Failed to leave workspace. Please try again.');
      }
    }
  };
  
  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn" onClick={onClose}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div 
        className="bg-[#1E1F22]/90 backdrop-blur-md rounded-xl w-full max-w-xl p-0 shadow-2xl border border-[#2F3136]/50 relative transition-all duration-300 animate-scaleIn"
        style={{ maxHeight: 'calc(100vh - 40px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient border */}
        <div className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Workspace Settings</h2>
            </div>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="mt-6 flex border-b border-gray-700">
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'general' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              General
              {activeTab === 'general' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></span>
              )}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'invites' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('invites')}
            >
              Invites
              {activeTab === 'invites' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></span>
              )}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'danger' 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('danger')}
            >
              Danger Zone
              {activeTab === 'danger' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></span>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mx-6 mb-4 flex gap-2 p-3 bg-red-900/30 border border-red-800/50 text-red-200 rounded-lg text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="p-6 pt-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {/* General Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className={`w-full p-2.5 bg-[#2B2D31] border border-[#40444B] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      !hasAdminPrivileges ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    required
                    disabled={!hasAdminPrivileges}
                    readOnly={!hasAdminPrivileges}
                  />
                  {!hasAdminPrivileges && (
                    <p className="mt-1 text-xs text-gray-500">
                      Only workspace owners and admins can modify the name.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full p-2.5 bg-[#2B2D31] border border-[#40444B] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] resize-y ${
                      !hasAdminPrivileges ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    disabled={!hasAdminPrivileges}
                    readOnly={!hasAdminPrivileges}
                  />
                  {!hasAdminPrivileges && (
                    <p className="mt-1 text-xs text-gray-500">
                      Only workspace owners and admins can modify the description.
                    </p>
                  )}
                </div>
                
                {hasAdminPrivileges && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
          
          {/* Invites Tab */}
          {activeTab === 'invites' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Generate an invite link to share with others. Anyone with this link can join your workspace.
              </p>
              
              {inviteUrl ? (
                <div className="bg-[#2F3136] p-4 rounded-lg border border-[#40444B]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Invite URL
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-grow p-2.5 bg-[#2B2D31] border border-[#40444B] rounded-l-lg text-gray-200 text-sm"
                    />
                    <button
                      type="button"
                      className={`px-3 flex items-center justify-center rounded-r-lg transition-colors ${
                        copySuccess 
                          ? 'bg-green-600 text-white' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                      onClick={handleCopyInviteUrl}
                    >
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This link will never expire. Generate a new one if you want to revoke access.
                  </p>
                </div>
              ) : hasAdminPrivileges && (
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                  onClick={handleGetInviteUrl}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Generate Invite URL
                    </>
                  )}
                </button>
              )}
              
              {!hasAdminPrivileges && (
                <p className="text-center text-sm text-gray-500 py-4">
                  Only workspace owners and admins can generate invite links.
                </p>
              )}
            </div>
          )}
          
          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-900/40 rounded-lg p-4">
                <h3 className="text-red-300 font-medium mb-2">Danger Zone</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Actions in this section can't be undone. Please proceed with caution.
                </p>
                
                {isOwner ? (
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash className="w-4 h-4" />
                        Delete Workspace
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors"
                    onClick={handleLeave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Leaving...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        Leave Workspace
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
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
      {modalContent}
    </>,
    document.body
  );
};

export default WorkspaceSettingsForm;