import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Users, MessageSquare } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendsStore";

const UsersChat = () => {
  // State management
  const [activeFriend, setActiveFriend] = useState(null);
  const [showFriendRequestForm, setShowFriendRequestForm] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Get auth store functions and state
  const { getUsers, isLoading: authLoading, user: currentUser } = useAuthStore();
  
  // Get friend store functions and state
  const { 
    friendRequests, 
    friends, 
    getFriendRequests, 
    getFriendsList,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    isLoading: friendLoading 
  } = useFriendStore();

  // Refs for positioning and click outside detection
  const friendRequestFormRef = useRef(null);
  const addFriendButtonRef = useRef(null);
  
  // Initialize data on component mount
  useEffect(() => {
    const loadData = async () => {
      await getFriendsList();
      await getFriendRequests();
    };
    
    loadData();
  }, [getFriendsList, getFriendRequests]);

  // Handler for clicking outside of friend request form
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        friendRequestFormRef.current && 
        !friendRequestFormRef.current.contains(event.target) &&
        addFriendButtonRef.current && 
        !addFriendButtonRef.current.contains(event.target)
      ) {
        setShowFriendRequestForm(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handler functions
  const handleAddFriend = () => {
    setShowFriendRequestForm(!showFriendRequestForm);
    // Reset search results when toggling the form
    setSearchResults([]);
    setFriendUsername("");
  };

  // Search for users by username
  const handleSearchUsers = async (query) => {
    setFriendUsername(query);
    
    if (query.trim().length >= 2) {
      setIsSearching(true);
      try {
        // Make sure getUsers is imported and available
        if (typeof getUsers !== 'function') {
          console.error("getUsers function is not available");
          setIsSearching(false);
          return;
        }
        
        const result = await getUsers({ username: query, limit: 10 });
        console.log("Search results:", result); // Debug log
        
        if (result && result.users) {
          // Filter out current user and existing friends
          const filteredResults = result.users.filter(user => {
            // Filter out current user
            if (currentUser && user._id === currentUser._id) {
              return false;
            }
            
            // Filter out users who are already friends
            const isAlreadyFriend = friends.some(friend => friend.friendId === user._id);
            
            // Filter out users who already have pending requests
            const hasPendingRequest = friendRequests.some(
              request => request.user.id === user._id
            );
            
            return !isAlreadyFriend && !hasPendingRequest;
          });
          
          setSearchResults(filteredResults);
        } else {
          console.warn("No users found or invalid response format", result);
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSubmitFriendRequest = async (e) => {
    e.preventDefault();
    if (friendUsername.trim()) {
      // Check if username is not current user
      if (currentUser && currentUser.username === friendUsername) {
        alert("You cannot send a friend request to yourself");
        return;
      }
      
      // Find the user ID from search results
      const user = searchResults.find(user => user.username === friendUsername);
      if (user) {
        await sendFriendRequest(user._id);
        setFriendUsername("");
        setShowFriendRequestForm(false);
        setSearchResults([]);
      } else {
        alert("User not found");
      }
    }
  };

  const handleSendFriendRequest = async (userId) => {
    await sendFriendRequest(userId);
    setSearchResults(searchResults.filter(user => user._id !== userId));
  };

  const handleAcceptFriendRequest = async (requestId) => {
    await acceptFriendRequest(requestId);
    // Friend list will be refreshed by the store action
  };

  const handleDeclineFriendRequest = async (requestId) => {
    await declineFriendRequest(requestId);
  };

  const handleRemoveFriend = async (userId) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      await removeFriend(userId);
    }
  };

  // Search friends in the sidebar
  const handleSearchFriends = (e) => {
    setSearchQuery(e.target.value);
    // Filter the friends list based on search query
    // This would be implemented in a real app
  };

  // Loading state
  const isLoadingData = authLoading || friendLoading;

  // Empty state if no friends and no friend requests
  if (friends.length === 0 && friendRequests.length === 0 && !isLoadingData) {
    return (
      <div className="w-72 bg-base-200 h-full border-r border-base-300 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-4">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <h3 className="font-medium text-lg">No Friends Yet</h3>
          <p className="text-sm opacity-70 mb-4">
            Add friends to start chatting
          </p>
          <button 
            className="btn btn-primary" 
            onClick={handleAddFriend}
            ref={addFriendButtonRef}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </button>
          
          {/* Friend Request Form for Empty State */}
          {showFriendRequestForm && (
            <div 
              ref={friendRequestFormRef}
              className="mt-4 w-full bg-base-100 rounded-md shadow-lg border border-base-300 z-50"
            >
              <div className="p-3">
                <h3 className="font-medium text-sm mb-2">Add Friend</h3>
                <form onSubmit={handleSubmitFriendRequest}>
                  <input
                    type="text"
                    placeholder="Enter username"
                    className="w-full px-3 py-2 rounded-md bg-base-200 text-sm mb-2"
                    value={friendUsername}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                  />
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 mb-3 max-h-40 overflow-y-auto border border-base-300 rounded-md">
                      {searchResults.map((user) => (
                        <div 
                          key={user._id} 
                          className="flex items-center justify-between p-2 hover:bg-base-200 border-b border-base-300 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium">{user.username}</span>
                          </div>
                          <button 
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => handleSendFriendRequest(user._id)}
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isSearching && (
                    <div className="text-center py-2 text-xs">Searching...</div>
                  )}
                  
                  {!isSearching && searchResults.length === 0 && friendUsername.length >= 2 && (
                    <div className="text-center py-2 text-xs">No users found</div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm w-full"
                    disabled={!friendUsername.trim() || (currentUser && currentUser.username === friendUsername)}
                  >
                    Send Request
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-base-200 h-full border-r border-base-300 flex flex-col">
      {/* Header with title and search - fixed at top */}
      <div className="p-4 border-b border-base-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Friends</h2>
          <div className="flex items-center relative">
            <div className="relative">
              <button
                ref={addFriendButtonRef}
                className="p-2 hover:bg-base-300 rounded-md"
                onClick={handleAddFriend}
                aria-label="Add Friend"
              >
                <UserPlus className="w-5 h-5" />
                {/* Friend request notification indicator */}
                {friendRequests.length > 0 && (
                  <div className="absolute -top-0 -right-0 flex justify-center items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {friendRequests.length > 9 ? (
                      <span className="absolute text-xs text-white font-bold">9+</span>
                    ) : friendRequests.length > 1 ? (
                      <span className="absolute text-xs text-white font-bold">{friendRequests.length}</span>
                    ) : null}
                  </div>
                )}
              </button>
            </div>
            
            {/* Friend Request Form */}
            {showFriendRequestForm && (
              <div 
                ref={friendRequestFormRef}
                className="absolute top-10 right-0 w-56 bg-base-100 rounded-md shadow-lg border border-base-300 z-50"
                style={{ visibility: "visible", opacity: 1 }}  // Force visibility
              >
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-2">Add Friend</h3>
                  <form onSubmit={handleSubmitFriendRequest}>
                    <input
                      type="text"
                      placeholder="Enter username"
                      className="w-full px-3 py-2 rounded-md bg-base-200 text-sm mb-2"
                      value={friendUsername}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      autoFocus  // Auto focus the input when form appears
                    />
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 mb-3 max-h-40 overflow-y-auto border border-base-300 rounded-md">
                        {searchResults.map((user) => (
                          <div 
                            key={user._id} 
                            className="flex items-center justify-between p-2 hover:bg-base-200 border-b border-base-300 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium">{user.username}</span>
                            </div>
                            <button 
                              type="button"
                              className="text-xs text-primary hover:underline"
                              onClick={() => handleSendFriendRequest(user._id)}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {isSearching && (
                      <div className="text-center py-2 text-xs">Searching...</div>
                    )}
                    
                    {!isSearching && searchResults.length === 0 && friendUsername.length >= 2 && (
                      <div className="text-center py-2 text-xs">No users found</div>
                    )}
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm w-full"
                      disabled={!friendUsername.trim() || (currentUser && currentUser.username === friendUsername)}
                    >
                      Send Request
                    </button>
                  </form>
                </div>
                
                {/* Friend Requests Section in Dropdown */}
                {friendRequests.length > 0 && (
                  <div className="border-t border-base-300 p-3">
                    <h3 className="font-medium text-sm mb-2">Friend Requests ({friendRequests.length})</h3>
                    <div className="space-y-2">
                      {friendRequests.map((request) => (
                        <div 
                          key={request.requestId} 
                          className="flex flex-col p-2 rounded-md bg-base-200"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              {request.user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{request.user.username}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <button 
                              className="btn btn-xs btn-primary"
                              onClick={() => handleAcceptFriendRequest(request.requestId)}
                            >
                              Accept
                            </button>
                            <button 
                              className="btn btn-xs btn-ghost"
                              onClick={() => handleDeclineFriendRequest(request.requestId)}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full pl-8 pr-4 py-2 rounded-md bg-base-100 text-sm"
            value={searchQuery}
            onChange={handleSearchFriends}
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

      {/* Loading state */}
      {isLoadingData && (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Scrollable content area */}
      {!isLoadingData && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {/* Friends list */}
            <div className="space-y-1 mt-4">
              <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
                FRIENDS
              </div>
              {friends.map((friend) => (
                <div key={friend.friendId} className="flex items-center">
                  <Link
                    to={`/chat/friend/${friend.friendId}`}
                    className={`flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300 flex-grow ${
                      activeFriend === friend.friendId
                        ? "bg-primary/10 text-primary font-medium"
                        : ""
                    }`}
                    onClick={() => setActiveFriend(friend.friendId)}
                  >
                    <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">
                      {friend.username}
                    </span>
                    <div className={`ml-auto w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-success' : 'bg-base-300'}`}></div>
                  </Link>
                  <button 
                    className="p-2 text-sm text-red-500 hover:bg-base-300 rounded-md"
                    onClick={() => handleRemoveFriend(friend.friendId)}
                    title="Remove Friend"
                  >
                    ×
                  </button>
                </div>
              ))}
             
            </div>
            
            {/* Direct Messages section */}
            {friends.length > 0 && (
              <div className="space-y-1 mt-4 border-t border-base-300 pt-4 pb-4">
                <div className="px-2 py-1 text-xs font-semibold text-base-content/70">
                  DIRECT MESSAGES
                </div>
                {friends.map((friend) => (
                  <Link
                    key={`dm-${friend.friendId}`}
                    to={`/direct-messages/${friend.friendId}`}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-300"
                  >
                    <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{friend.username}</span>
                    <MessageSquare className="ml-auto w-4 h-4 text-base-content/50" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersChat;