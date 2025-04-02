import React from 'react'

const ChatBox = ({ activeNavItem, activeWorkspace, activeChannel }) => {
  return (
    <div className='flex flex-col h-full'>
      {/* Header showing current context */}
      <div className="p-4 border-b border-base-300">
        <h2 className="font-semibold">
          {activeNavItem === "workSpace" 
            ? `Workspace Channel: ${activeChannel}` 
            : activeNavItem === "users" 
              ? "User Messages" 
              : activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1)}
        </h2>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages would go here */}
        <div className="text-center text-base-content/50 mt-10">
          {activeNavItem === "workSpace" 
            ? "Workspace messages will appear here" 
            : activeNavItem === "users" 
              ? "User messages will appear here" 
              : "Select a section to see content"}
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t border-base-300">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="input input-bordered w-full"
          />
          <button className="btn btn-primary">Send</button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox
