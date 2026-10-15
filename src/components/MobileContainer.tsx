import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="min-h-full h-full bg-slate-200 flex justify-center items-start">
      {/* Strict Mobile Container: Max 480px, Centered on Tablet/Desktop, Full Width on Phone */}
      <div className="w-full max-w-[480px] min-h-full h-full bg-white shadow-2xl relative flex flex-col overflow-x-clip">
        {/* Content Area */}
        <main className="min-h-[90vh] flex-1 flex flex-col w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
