import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Search, Check, User, Users, Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFriendStore } from '../store/useFriendsStore';
import { toast } from 'react-hot-toast';

const SearchFriendsPortal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'pending'
  const [actionLoading, setActionLoading] = useState({}); // { [userId]: true/false }
  const navigate = useNavigate();

  const { 
    getUsers, 
    user: currentUser, 
  } = useAuthStore();

  const { 
    friends, 
    friendRequests,
    sentRequests,
    blockedUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getFriendRequests,
    getBlockedUsers,
    isLoading: friendLoading
  } = useFriendStore();

  // Load blocked users when component mounts
  useEffect(() => {
    if (isOpen) {
      getBlockedUsers();
    }
  }, [isOpen, getBlockedUsers]);

  // Check if a user is blocked
  const isUserBlocked = useCallback((userId) => {
    return blockedUsers.some(user => user.id === userId);
  }, [blockedUsers]);

  // Handle view profile navigation with block check
  const handleViewProfile = (userId) => {
    onClose(); // Close the search portal
    
    // Check if the user is blocked before navigating
    if (isUserBlocked(userId)) {
      toast.error("You cannot view this profile because you have blocked this user");
      return;
    }
    
    navigate(`/profile/${userId}`, { state: { fromSearchPortal: true } });
  };

  // Determine if a user already has a relationship with the current user
  const getUserRelationship = useCallback((userId) => {
    // Check if user is already a friend
    const isAlreadyFriend = friends.some(
      friend => friend.friendId === userId || friend.id === userId
    );
    if (isAlreadyFriend) return 'friend';
    
    // Check if we've sent a request to this user
    const hasSentPendingRequest = sentRequests.some(
      request => request.receiverId === userId
    );
    if (hasSentPendingRequest) return 'sent';
    
    // Check if we've received a request from this user
    const hasReceivedPendingRequest = friendRequests.some(
      request => request.senderId === userId || (request.user && request.user.id === userId)
    );
    if (hasReceivedPendingRequest) return 'received';
    
    // No relationship
    return 'none';
  }, [friends, sentRequests, friendRequests]);

  // Load friend requests when tab changes
  useEffect(() => {
    if (activeTab === 'pending' && isOpen) {
      getFriendRequests();
    }
  }, [activeTab, isOpen, getFriendRequests]);

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Only search if query is at least 2 characters
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Set a new timeout
    const newTimeoutId = setTimeout(async () => {
      try {
        const result = await getUsers({ username: query, limit: 10 });
        
        if (result && result.users) {
          // Filter and enrich results with relationship status
          const enrichedResults = result.users
            .filter(user => {
              // Filter out current user
              if (currentUser && user._id === currentUser._id) {
                return false;
              }
              return true;
            })
            .map(user => ({
              ...user,
              relationshipStatus: getUserRelationship(user._id),
              isBlocked: isUserBlocked(user._id)
            }));
          
          setSearchResults(enrichedResults);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce delay

    setTimeoutId(newTimeoutId);
  }, [timeoutId, getUsers, currentUser, getUserRelationship, isUserBlocked]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle sending friend request
  const handleSendFriendRequest = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await sendFriendRequest(userId);
      // Update the user's relationship status in the results
      setSearchResults(prevResults => 
        prevResults.map(user => 
          user._id === userId 
            ? { ...user, relationshipStatus: 'sent' } 
            : user
        )
      );
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent("friend-added"));
    } catch (error) {
      // Optionally handle error
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Handle accepting friend request
  const handleAcceptRequest = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [request.senderId]: true }));
    try {
      await acceptFriendRequest(requestId);
      // Refresh the requests after accepting
      await getFriendRequests();
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent("friend-request-accepted"));
    } catch (error) {
      
    } finally {
      setActionLoading(prev => ({ ...prev, [request.senderId]: false }));
    }
  };

  // Handle declining friend request
  const handleDeclineRequest = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [request.senderId]: true }));
    try {
      await declineFriendRequest(requestId);
      // Refresh the requests after declining
      await getFriendRequests();
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent("friend-request-declined"));
    } catch (error) {
      
    } finally {
      setActionLoading(prev => ({ ...prev, [request.senderId]: false }));
    }
  };

  // Clear search on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setActiveTab('search');
    }
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      // Clear timeout on unmount
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, timeoutId]);

  // Don't render anything if not open
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
                {activeTab === 'search' ? (
                  <UserPlus className="w-4 h-4 text-white" />
                ) : (
                  <Users className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {activeTab === 'search' ? 'Find Friends' : 'Friend Requests'}
                </h2>
                <p className="text-sm text-gray-400">
                  {activeTab === 'search' 
                    ? 'Search for users to add as friends' 
                    : `Manage your pending requests (${friendRequests.length})`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-4 bg-[#2B2D31] rounded-lg p-1 mb-2">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'search' 
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('search')}
            >
              Search
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'pending' 
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
              {friendRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Search input - only show in search tab */}
          {activeTab === 'search' && (
            <div className="mt-4 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-4 py-2.5 bg-[#2B2D31] border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-300 placeholder-gray-500"
                  placeholder="Search by username..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  autoFocus
                />
                {searchTerm && (
                  <button 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Gradient border effect */}
          <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>
        
        {/* Content area */}
        <div className="px-6 pb-4">
          <div className="overflow-y-auto max-h-[50vh] custom-scrollbar">
            {/* Search Tab Content */}
            {activeTab === 'search' && (
              <>
                {/* Loading state */}
                {isSearching && (
                  <div className="flex items-center justify-center py-12">
                    <div className="spinner">
                      <div className="double-bounce1 bg-indigo-500/60"></div>
                      <div className="double-bounce2 bg-indigo-400/40"></div>
                    </div>
                    <p className="ml-3 text-gray-400">Searching users...</p>
                  </div>
                )}
                
                {/* Empty search term message */}
                {!isSearching && !searchTerm && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="flex justify-center mb-4">
                      <Search className="w-16 h-16 opacity-30 text-indigo-400" />
                    </div>
                    <p className="font-medium text-lg text-gray-300">Search for Friends</p>
                    <p className="text-gray-500 mt-2">Enter a username to find people</p>
                  </div>
                )}
                
                {/* No results message */}
                {!isSearching && searchTerm && searchResults.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="flex justify-center mb-4">
                      <User className="w-16 h-16 opacity-30 text-indigo-400" />
                    </div>
                    <p className="font-medium text-lg text-gray-300">No users found</p>
                    <p className="text-gray-500 mt-2">Try a different search term</p>
                  </div>
                )}
                
                {/* Search results list */}
                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#2B2D31]/60 hover:bg-[#2F3136] transition-all duration-200"
                      >
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-grow"
                          onClick={() => {
                            if (user.isBlocked) {
                              toast.error("You cannot view this profile because you have blocked this user");
                              return;
                            }
                            handleViewProfile(user._id);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-gray-700">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.username}
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span className="font-bold text-gray-300">
                                {user.username ? user.username.charAt(0).toUpperCase() : "?"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white hover:text-indigo-400 transition-colors">
                              {user.username || `User #${user._id}`}
                            </div>
                            <div className="text-sm text-gray-400">
                              {user.status || "Status unknown"}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action button based on relationship status */}
                        {user.isBlocked ? (
                          <div 
                            className="px-3 py-1.5 bg-red-700 text-white rounded-md text-sm flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Blocked</span>
                          </div>
                        ) : user.relationshipStatus === 'none' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendFriendRequest(user._id);
                            }}
                            disabled={!!actionLoading[user._id]}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[user._id] ? (
                              <div className="flex items-center gap-1">
                                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Adding...</span>
                              </div>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Add Friend</span>
                              </>
                            )}
                          </button>
                        ) : user.relationshipStatus === 'sent' ? (
                          <div 
                            className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-md text-sm flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Request Sent</span>
                          </div>
                        ) : user.relationshipStatus === 'received' ? (
                          <div 
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Request</span>
                          </div>
                        ) : (
                          <div 
                            className="px-3 py-1.5 bg-purple-700 text-white rounded-md text-sm flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Friends</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Results count and search tips */}
                {!isSearching && searchResults.length > 0 && (
                  <div className="py-2 mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Found {searchResults.length} {searchResults.length === 1 ? 'user' : 'users'}
                    </span>
                    <button 
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Pending Requests Tab Content */}
            {activeTab === 'pending' && (
              <>
                {friendLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="spinner">
                      <div className="double-bounce1 bg-indigo-500/60"></div>
                      <div className="double-bounce2 bg-indigo-400/40"></div>
                    </div>
                    <p className="ml-3 text-gray-400">Loading requests...</p>
                  </div>
                ) : friendRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center justify-center mb-4">
                      <CheckCircle className="w-16 h-16 opacity-30 text-indigo-400" />
                      <p className="font-medium text-lg text-gray-300 mt-4">No pending requests</p>
                      <p className="text-gray-500 mt-2">
                        When someone sends you a friend request, it will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs text-gray-400 uppercase font-semibold px-1">
                      {friendRequests.length} Pending {friendRequests.length === 1 ? 'Request' : 'Requests'}
                    </p>
                    
                    {friendRequests.map((request) => {
                      const isRequesterBlocked = isUserBlocked(request.senderId);
                      
                      return (
                        <div
                          key={request.requestId}
                          className="p-3 rounded-lg bg-[#2B2D31]/60 hover:bg-[#2F3136] transition-all duration-200"
                        >
                          <div 
                            className="flex items-center gap-3 mb-3 cursor-pointer"
                            onClick={() => {
                              if (isRequesterBlocked) {
                                toast.error("You cannot view this profile because you have blocked this user");
                                return;
                              }
                              handleViewProfile(request.senderId);
                            }}
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-gray-700">
                              {request.user?.avatar ? (
                                <img 
                                  src={request.user.avatar} 
                                  alt={request.user.username}
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <span className="font-bold text-gray-300">
                                  {request.user?.username ? request.user.username.charAt(0).toUpperCase() : "?"}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white hover:text-indigo-400 transition-colors">
                                {request.user?.username || `User #${request.senderId}`}
                              </div>
                              <div className="flex items-center text-xs text-gray-400">
                                {isRequesterBlocked ? (
                                  <>
                                    <ShieldAlert className="w-3 h-3 mr-1 text-red-400" />
                                    Blocked user
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Sent you a friend request
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {!isRequesterBlocked && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptRequest(request.requestId);
                                  }}
                                  disabled={!!actionLoading[request.senderId]}
                                  className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                  {actionLoading[request.senderId] ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <>Accept</>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeclineRequest(request.requestId);
                                  }}
                                  disabled={!!actionLoading[request.senderId]}
                                  className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                  {actionLoading[request.senderId] ? (
                                    <svg className="animate-spin h-4 w-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <>Decline</>
                                  )}
                                </button>
                              </>
                            )}
                            {isRequesterBlocked && (
                              <div className="flex-1 py-1.5 bg-red-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Blocked User</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
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

export default SearchFriendsPortal; 