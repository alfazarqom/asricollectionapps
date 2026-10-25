import { useEffect, useState, useRef } from "react";
import { Menu, X, Search, ChevronRight } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import CartButton from "../cart/CartButton";

const navigation = [
  { label: "Beranda", to: "/", end: true },
  { label: "Katalog Belanja", to: "/products" },
  { label: "Koleksi Gaun", to: "/products?category=womens-dresses" },
  { label: "Tas & Aksesoris", to: "/products?category=womens-bags" },
  { label: "Tentang Kami", to: "/about" },
];

const Header = ({ cartCount, onCartClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const navLinkClass = (mobile) => ({ isActive }) =>
    `transition-colors duration-200 tracking-wide font-medium ${
      mobile
        ? isActive
          ? "block py-3 px-4 text-stone-900 bg-stone-100/80 rounded-xl font-bold border-l-2 border-stone-900 text-sm"
          : "block py-3 px-4 text-stone-600 hover:text-stone-950 hover:bg-stone-50 rounded-xl text-sm"
        : isActive
        ? "text-stone-950 font-bold border-b-2 border-stone-900 pb-1"
        : "text-stone-600 hover:text-stone-950 pb-1"
    }`;

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-out ${
          isScrolled
            ? "bg-[#FAF8F5]/95 backdrop-blur-md shadow-xs border-b border-stone-200/80 py-2.5"
            : "bg-[#FAF8F5] border-b border-stone-200/60 py-3.5"
        }`}
        aria-label="Header Asri Collection"
      >
        <div className="container flex items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl text-stone-800 hover:bg-stone-100 transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand Wordmark & Tagline */}
          <Link
            to="/"
            className="flex flex-col items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800 rounded-sm"
            aria-label="Asri Collection Beranda"
          >
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 leading-none">
              ASRI COLLECTION
            </span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-stone-500 font-medium mt-1">
              Contemporary Fashion
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-xs uppercase tracking-wider"
            aria-label="Navigasi Utama"
          >
            {navigation.map(({ label, to, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass(false)}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Utility Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
              aria-label="Cari produk"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Shopping Bag Button */}
            <CartButton count={cartCount} onClick={onCartClick} />
          </div>
        </div>

        {/* Expandable Search Bar Drawer */}
        {searchOpen && (
          <div className="border-t border-stone-200 bg-white py-3 px-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="container max-w-2xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari gaun, blouse, tas, heels, parfum..."
                  className="w-full h-11 pl-10 pr-24 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-800 focus:bg-white transition-all"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cari
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
                    aria-label="Tutup pencarian"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <nav
            aria-label="Navigasi Menu Mobile"
            className="relative flex flex-col w-4/5 max-w-xs bg-[#FAF8F5] h-full shadow-2xl p-5 z-10 overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <p className="font-serif text-xl font-bold text-stone-900">ASRI COLLECTION</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500">
                  Fashion Store
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200 transition-colors"
                aria-label="Tutup menu navigasi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 pb-1">
                Kategori Menu
              </p>
              {navigation.map(({ label, to, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={navLinkClass(true)}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-stone-200 space-y-2">
              <Link
                to="/products"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold"
              >
                <span>Lihat Semua Produk</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <div className="px-2 pt-2 text-center text-[10px] text-stone-500">
                Layanan Pelanggan: Senin–Sabtu 09.00–17.00 WITA
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
