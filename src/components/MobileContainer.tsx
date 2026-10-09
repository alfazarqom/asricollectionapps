import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-200 flex justify-center items-start">
      {/* Strict Mobile Container: Max 480px, Centered on Tablet/Desktop, Full Width on Phone */}
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-2xl relative flex flex-col overflow-x-clip">
        {/* Subtle top device bar simulation for browser view */}
        

        {/* Content Area */}
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
