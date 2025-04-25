const MessageSkeleton = () => {
    // Create an array of 6 items for skeleton messages
    const skeletonMessages = Array(6).fill(null);
  
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {skeletonMessages.map((_, idx) => (
          <div key={idx} className={`flex items-start gap-2 px-4 py-1 ${idx % 2 === 0 ? "flex-row" : "flex-row-reverse justify-start"}`}>
            <div className="skeleton size-10 rounded-full" />
            
            <div className={`flex flex-col max-w-[75%]`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="skeleton h-4 w-16 mb-1" />
              </div>
              
              <div className={`rounded-2xl px-4 py-2 text-sm ${idx % 2 === 0 ? 'bg-base-300/50' : 'bg-primary/30'}`}>
                <div className="skeleton h-4 w-[180px] mb-2" />
                <div className="skeleton h-4 w-[120px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default MessageSkeleton;