import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Search, Check, UserCheck, Users, UserMinus } from 'lucide-react';

const InviteFriendsPortal = ({
  isOpen,
  onClose,
  friends,
  selectedFriends,
  toggleFriendSelection,
  sendInvites,
  isLoading,
  workspaceName,
  workspaceMembers = [] // Provide a default empty array
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [availableFriends, setAvailableFriends] = useState([]);
  
  // Filter out friends who are already in the workspace
  useEffect(() => {
    if (!friends || !workspaceMembers) {
      setAvailableFriends([]);
      return;
    }
    
    // Create a Set of member IDs for faster lookup
    const memberIds = new Set();
    workspaceMembers.forEach(member => {
      if (member.id) memberIds.add(member.id);
      if (member._id) memberIds.add(member._id);
      if (member.userId) memberIds.add(member.userId);
      if (member.friendId) memberIds.add(member.friendId);
    });
    
    // Filter friends to only include those not in the workspace
    const nonMemberFriends = friends.filter(friend => {
      const friendId = friend.friendId || friend.id || friend._id;
      return !memberIds.has(friendId);
    });
    
    setAvailableFriends(nonMemberFriends);
  }, [friends, workspaceMembers]);
  
  // Filter friends when search term changes
  useEffect(() => {
    if (!availableFriends) {
      setFilteredFriends([]);
      return;
    }
    
    if (!searchTerm.trim()) {
      setFilteredFriends(availableFriends);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = availableFriends.filter(friend => {
      const username = friend.username ? friend.username.toLowerCase() : '';
      const displayName = friend.displayName ? friend.displayName.toLowerCase() : '';
      
      return username.includes(lowerSearchTerm) || displayName.includes(lowerSearchTerm);
    });
    
    setFilteredFriends(filtered);
  }, [searchTerm, availableFriends]);
  
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
        className="bg-[#1E1F22]/90 backdrop-blur-md rounded-xl w-full max-w-md p-0 shadow-2xl border border-[#2F3136]/50 relative transition-all duration-300 animate-scaleIn"
        style={{ maxHeight: 'calc(100vh - 40px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient border */}
        <div className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite Friends</h2>
                {workspaceName && (
                  <p className="text-sm text-gray-400">to {workspaceName}</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search input */}
          <div className="mt-6 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-10 pr-4 py-2.5 bg-[#2B2D31] border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-300 placeholder-gray-500"
                placeholder="Search friends..." 
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
        
        {/* Friends list */}
        <div className="px-6 pb-4">
          <div className="overflow-y-auto max-h-[50vh] custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner">
                  <div className="double-bounce1 bg-indigo-500/60"></div>
                  <div className="double-bounce2 bg-indigo-400/40"></div>
                </div>
                <p className="ml-3 text-gray-400">Loading friends...</p>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {availableFriends.length === 0 ? (
                  <>
                    <div className="flex justify-center mb-4">
                      {friends && friends.length > 0 ? (
                        <>
                          <UserMinus className="w-16 h-16 opacity-30 text-indigo-400" />
                          <div className="flex flex-col">
                            <p className="font-medium text-lg text-gray-300">All friends invited</p>
                            <p className="text-gray-500 mt-2">Everyone is already in the workspace</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Users className="w-16 h-16 opacity-30 text-indigo-400" />
                          <div className="flex flex-col">
                            <p className="font-medium text-lg text-gray-300">No friends found</p>
                            <p className="text-gray-500 mt-2">Add friends to invite them to your workspace</p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <Search className="w-16 h-16 opacity-30 text-indigo-400" />
                    </div>
                    <p className="font-medium text-lg text-gray-300">No matching friends</p>
                    <p className="text-gray-500 mt-2">Try a different search term</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.friendId}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-[#2F3136] cursor-pointer transition-all duration-200 ${
                      selectedFriends.includes(friend.friendId)
                        ? "bg-[#2F3136] border-l-4 border-indigo-500 pl-2"
                        : "bg-[#2B2D31]/60"
                    }`}
                    onClick={() => toggleFriendSelection(friend.friendId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-gray-700">
                        {friend.avatar ? (
                          <img 
                            src={friend.avatar} 
                            alt={friend.username || friend.displayName}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="font-bold text-gray-300">
                            {friend.username
                              ? friend.username.charAt(0).toUpperCase()
                              : friend.displayName
                              ? friend.displayName.charAt(0).toUpperCase()
                              : "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {friend.username || friend.displayName || `Friend #${friend.friendId}`}
                        </div>
                        <div className="text-sm text-gray-400">
                          {friend.status || "Status unknown"}
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      selectedFriends.includes(friend.friendId)
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-700 text-gray-500"
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Results count and clear filter button */}
          {!isLoading && availableFriends.length > 0 && searchTerm && (
            <div className="py-2 mt-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                Showing {filteredFriends.length} of {availableFriends.length} friends
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
        
        {/* Footer with action buttons */}
        <div className="p-4 border-t border-gray-700/50 bg-[#2B2D31]/70 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedFriends.length > 0 ? (
              <span>
                <span className="text-indigo-400 font-medium">{selectedFriends.length}</span> friend{selectedFriends.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>Select friends to invite</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-gray-700/70 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
              onClick={sendInvites}
              disabled={selectedFriends.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inviting...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Send {selectedFriends.length > 0 ? `(${selectedFriends.length})` : 'Invites'}
                </>
              )}
            </button>
          </div>
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

export default InviteFriendsPortal; 