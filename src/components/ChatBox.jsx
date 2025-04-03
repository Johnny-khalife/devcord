// import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useState, useEffect } from "react";

const ChatBox = ({ activeNavItem, activeWorkspace, activeChannel, selectedWorkspace }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const { messages, getMessages, isMessagesLoading, selectedFriend } =
    useChatStore();

  // useEffect(()=>{
  //   getMessages(selectedFriend.friendId)
  // },[selectedFriend.friendId,getMessages])

  if (isMessagesLoading) return <div className="flex items-center justify-center h-full">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader activeNavItem={activeNavItem} activeChannel={activeChannel} selectedWorkspace={selectedWorkspace}/>

      <div className="flex-1 p-4 overflow-y-auto">
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-center text-gray-500`}>messages ....</p>
      </div>

      <div className={`p-4 ${isMobile ? 'pb-20' : ''} border-t border-base-300`}>
        <MessageInput />
      </div>
    </div>
  );

  // return (
  //   <div className="flex flex-col h-full">
  //     {/* Header showing current context */}
      // <div className="p-4 border-b border-base-300">
      //   {activeNavItem === "users" && selectedFriend ? (
      //     <div className="flex items-center gap-3">
      //       <div className="avatar">
      //         <div className="w-7 h-7 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
      //           <img
      //             src={selectedFriend.avatar}
      //             alt={`${selectedFriend.username}'s avatar`}
      //             className="w-full h-full object-cover"
      //           />
      //         </div>
      //       </div>
      //       <div>
      //         <h2 className="font-semibold text-lg">{selectedFriend.username}</h2>

      //       </div>
      //     </div>
      //   ) : (
      //     <h2 className="font-semibold">
      //       {activeNavItem === "workSpace"
      //         ? `Workspace Channel: ${activeChannel}`
      //         : activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}
      //     </h2>
      //   )}
      // </div>

  //     {/* Messages area */}
  //     <div className="flex-1 overflow-y-auto p-4">
  //       {/* Messages would go here */}
  //       <div className="text-center text-base-content/50 mt-10">
  //         {activeNavItem === "workSpace"
  //           ? "Workspace messages will appear here"
  //           : activeNavItem === "users"
  //           ? "User messages will appear here"
  //           : "Select a section to see content"}
  //       </div>
  //     </div>

  //     {/* Message input */}
  //     <div className="p-4 border-t border-base-300">
  //       <div className="flex gap-2">
  //         <input
  //           type="text"
  //           placeholder="Type a message..."
  //           className="input input-bordered w-full"
  //         />
  //         <button className="btn btn-primary">Send</button>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default ChatBox;
