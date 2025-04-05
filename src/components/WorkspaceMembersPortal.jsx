import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShieldCheck,
  Shield,
  UserPlus,
  UserMinus,
  Users,
  Search
} from "lucide-react";

const WorkspaceMembersPortal = ({
  isOpen,
  onClose,
  workspaceMembers,
  isLoading,
  currentUser,
  isAlreadyFriend,
  removeFriend,
  handleSendFriendRequest,
  isSendingFriendRequest,
  handleRemoveMember,
  isWorkspaceOwner,
  hasAdminPrivileges,
  selectedMembers,
  setSelectedMembers,
  isPromotingAdmin,
  handleToggleAdminRole,
  workspaces,
  activeWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);

  // Helper function to sort members by role priority and then alphabetically
  const sortMembers = (members) => {
    if (!members) return [];
    
    // Define role priority (higher number = higher priority)
    const rolePriority = {
      'owner': 3,
      'admin': 2,
      'member': 1
    };
    
    return [...members].sort((a, b) => {
      // First sort by role priority (descending)
      const rolePriorityA = rolePriority[a.role] || 0;
      const rolePriorityB = rolePriority[b.role] || 0;
      
      if (rolePriorityB !== rolePriorityA) {
        return rolePriorityB - rolePriorityA;
      }
      
      // Then sort alphabetically by username
      const usernameA = (a.username || '').toLowerCase();
      const usernameB = (b.username || '').toLowerCase();
      return usernameA.localeCompare(usernameB);
    });
  };

  // Filter and sort members when search term or workspace members change
  useEffect(() => {
    if (!workspaceMembers) {
      setFilteredMembers([]);
      return;
    }
    
    let filtered = [...workspaceMembers];
    
    // Apply search filter if there's a search term
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = workspaceMembers.filter(member => {
        const username = member.username ? member.username.toLowerCase() : "";
        const displayName = member.displayName ? member.displayName.toLowerCase() : "";
        const email = member.email ? member.email.toLowerCase() : "";
        
        return username.includes(lowerSearchTerm) || 
               displayName.includes(lowerSearchTerm) || 
               email.includes(lowerSearchTerm);
      });
    }
    
    // Sort the filtered members
    setFilteredMembers(sortMembers(filtered));
  }, [searchTerm, workspaceMembers]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

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
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Workspace Members</h2>
            </div>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search input - now functional */}
          <div className="mt-6 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-10 pr-4 py-2.5 bg-[#2B2D31] border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-300 placeholder-gray-500"
                placeholder="Search members..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Gradient border effect */}
          <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner">
              <div className="double-bounce1 bg-indigo-500/60"></div>
              <div className="double-bounce2 bg-indigo-400/40"></div>
            </div>
            <p className="ml-3 text-gray-400">Loading members...</p>
          </div>
        ) : (
          <div className="overflow-y-auto p-4 max-h-[60vh] custom-scrollbar">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {workspaceMembers.length === 0 ? (
                  <>
                    <div className="flex justify-center mb-4">
                      <Users className="w-16 h-16 opacity-30 text-indigo-400" />
                    </div>
                    <p className="font-medium text-lg text-gray-300">No members found</p>
                    <p className="text-gray-500 mt-2">This workspace has no members yet</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <Search className="w-16 h-16 opacity-30 text-indigo-400" />
                    </div>
                    <p className="font-medium text-lg text-gray-300">No matching members</p>
                    <p className="text-gray-500 mt-2">Try a different search term</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id || member._id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:translate-x-1 ${
                      isWorkspaceOwner && member.role !== "owner"
                        ? "cursor-pointer hover:bg-[#2F3136]"
                        : "bg-[#2F3136]/60"
                    } ${
                      selectedMembers.includes(member.id)
                        ? "bg-[#2F3136] border-l-4 border-indigo-500"
                        : ""
                    }`}
                    onClick={() => {
                      if (
                        isWorkspaceOwner &&
                        member.role !== "owner" &&
                        (member.role === "member" || member.role === "admin")
                      ) {
                        setSelectedMembers(prev =>
                          prev.includes(member.id)
                            ? prev.filter(id => id !== member.id)
                            : [...prev, member.id]
                        );
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3 ring-2 ring-gray-700">
                        <img
                          src={member.avatar || "/avatar.png"}
                          alt={member.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center">
                          {member.username}
                          {member.id === currentUser?._id && (
                            <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center mt-0.5">
                          {member.role === "owner" ? (
                            <div className="flex items-center bg-green-900/30 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-green-500 mr-1" />
                              <span className="text-green-400 text-xs">owner</span>
                            </div>
                          ) : member.role === "admin" ? (
                            <div className="flex items-center bg-blue-900/30 px-2 py-0.5 rounded-full">
                              <Shield className="w-3 h-3 text-blue-500 mr-1" />
                              <span className="text-blue-400 text-xs">admin</span>
                            </div>
                          ) : (
                            <span className="bg-gray-800/60 px-2 py-0.5 rounded-full text-xs">member</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(() => {
                        // Don't show buttons for yourself
                        if (!currentUser || member.id === currentUser._id) return null;

                        // If already friends, show Remove Friend button
                        if (isAlreadyFriend(member.id)) {
                          return (
                            <button
                              className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-full transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFriend(member.id);
                              }}
                              title="Remove Friend"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          );
                        }

                        // Show Add Friend button for non-friends
                        return (
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendFriendRequest(member, e);
                            }}
                            title="Send Friend Request"
                            disabled={isSendingFriendRequest}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        );
                      })()}
                      
                      {/* Remove Member Button */}
                      {hasAdminPrivileges() &&
                        member.role !== "owner" &&
                        (workspaces.find(
                          (ws) => ws.id === activeWorkspace
                        )?.role === "owner" ||
                          member.role === "member") && (
                          <button
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(member);
                            }}
                            title="Remove member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Admin Promotion/Demotion Action */}
            {isWorkspaceOwner && selectedMembers.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-700/70 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  onClick={() => setSelectedMembers([])}
                  disabled={isPromotingAdmin}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                  onClick={handleToggleAdminRole}
                  disabled={isPromotingAdmin}
                >
                  {isPromotingAdmin ? (
                    <>
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      {filteredMembers.find(m => m.id === selectedMembers[0])?.role === "admin" 
                        ? "Demote to Member" 
                        : "Promote to Admin"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Results count and clear filter button */}
        {!isLoading && workspaceMembers.length > 0 && searchTerm && (
          <div className="py-2 px-6 border-t border-gray-700/50 flex justify-between items-center bg-[#2B2D31]/70">
            <span className="text-xs text-gray-400">
              Showing {filteredMembers.length} of {workspaceMembers.length} members
            </span>
            <button 
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              onClick={() => setSearchTerm("")}
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Use createPortal to render the modal outside of the component hierarchy
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
        
        .spinner {
          width: 30px;
          height: 30px;
          position: relative;
        }
        
        .double-bounce1, .double-bounce2 {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 0;
          animation: bounce 2s infinite ease-in-out;
        }
        
        .double-bounce2 {
          animation-delay: -1.0s;
        }
        
        @keyframes bounce {
          0%, 100% { transform: scale(0); }
          50% { transform: scale(1.0); }
        }
      `}</style>
      {modalContent}
    </>,
    document.body
  );
};

export default WorkspaceMembersPortal; 