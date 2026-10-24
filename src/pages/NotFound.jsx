import { Link } from "react-router-dom";
import { Home, ShoppingBag } from "lucide-react";

const NotFound = () => {
  return (
    <main className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl text-center">
        {/* 404 */}
        <div className="relative">
          <h1 className="text-[120px] font-black leading-none tracking-tight text-slate-100 sm:text-[180px]">
            404
          </h1>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-extrabold text-slate-900 sm:text-7xl">
              404
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <ShoppingBag className="h-7 w-7 text-amber-600" />
          </div>

          <h2 className="mt-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Page Not Found
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            Sorry, we couldn't find the page you're looking for. It may have
            been moved, removed, or the URL might be incorrect.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 mt-6 rounded-xl bg-black px-5 py-3 cursor-pointer text-white text-sm font-semibold hover:bg-amber-500 transition"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
