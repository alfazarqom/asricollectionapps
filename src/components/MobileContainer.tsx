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
        <div className="hidden sm:flex items-center justify-between px-4 py-1.5 bg-slate-900 text-slate-300 text-[11px] font-mono select-none">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Asri Collection Mobile</span>
          </div>
          <span className="text-[10px] text-slate-400">320px - 480px Smartphone Layout</span>
        </div>

        {/* Content Area */}
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
