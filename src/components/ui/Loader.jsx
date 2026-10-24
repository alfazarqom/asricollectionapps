import { Loader2 } from "lucide-react";

const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-white p-3 shadow-xl ring-1 ring-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </div>
    </div>
  );
};

export default FullPageLoader;
