import React from 'react';

export const EmptyChatState: React.FC = () => {
  return (
    <div className="m-auto text-center text-[#5E716F] p-6">
      <h2 className="text-[#10201F] text-[20px] font-bold font-['Bricolage_Grotesque',sans-serif] mb-1.5">
        Pick a chat to start
      </h2>
      <p className="text-[14px] m-0">
        Choose a customer or agent from the list.
      </p>
    </div>
  );
};
