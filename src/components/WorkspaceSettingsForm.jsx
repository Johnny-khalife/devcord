import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

const WorkspaceSettingsForm = ({ workspaceId, workspace, onClose, onWorkspaceUpdated }) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateWorkspace, deleteWorkspace, getWorkspaceInviteUrl, leaveWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || '');
      setDescription(workspace.description || '');
    }
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
        setInviteCode(response.inviteCode);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Workspace Settings</h2>
          <button onClick={onClose} className="hover:bg-base-200 p-1 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Workspace Name</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className={`w-full p-2 border border-base-300 rounded-md bg-base-200 ${!hasAdminPrivileges ? 'opacity-70 cursor-not-allowed' : ''}`}
              required
              disabled={!hasAdminPrivileges}
              readOnly={!hasAdminPrivileges}
            />
            {!hasAdminPrivileges && (
              <p className="text-xs text-base-content/60 mt-1">Only workspace owners and admins can modify the name.</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2 border border-base-300 rounded-md bg-base-200 min-h-24 ${!hasAdminPrivileges ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={!hasAdminPrivileges}
              readOnly={!hasAdminPrivileges}
            />
            {!hasAdminPrivileges && (
              <p className="text-xs text-base-content/60 mt-1">Only workspace owners and admins can modify the description.</p>
            )}
          </div>
          
          {inviteUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Invite URL</label>
              <div className="flex">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="w-full p-2 border border-base-300 rounded-l-md bg-base-200"
                />
                <button
                  type="button"
                  className="bg-primary text-white px-3 rounded-r-md"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    alert('Invite URL copied to clipboard!');
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2 mt-6">
            {/* Show Save Changes button for owners and admins */}
            {hasAdminPrivileges && (
              <button
                type="submit"
                className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            
            {/* Generate Invite URL - available to owners and admins */}
            {hasAdminPrivileges && (
              <button
                type="button"
                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={handleGetInviteUrl}
                disabled={isLoading}
              >
                Generate Invite URL
              </button>
            )}
            
            {/* Leave button - only for non-owners */}
            {!isOwner && (
              <button
                type="button"
                className="w-full py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                onClick={handleLeave}
                disabled={isLoading}
              >
                Leave Workspace
              </button>
            )}
            
            {/* Delete button - only for owners */}
            {isOwner && (
              <button
                type="button"
                className="w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Delete Workspace
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSettingsForm;