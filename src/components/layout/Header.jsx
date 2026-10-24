import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import CartButton from "../cart/CartButton";

const navigation = [
  { label: "Home", to: "/", end: true },
  { label: "Shop", to: "/products" },
  { label: "About", to: "/about" },
];

const Header = ({ cartCount, onCartClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinkClass =
    (mobile) =>
    ({ isActive }) =>
      `relative font-semibold transition-colors ${
        mobile
          ? isActive
            ? "block border-l border-slate-900 bg-slate-100 px-4 py-3 text-slate-950 text-base"
            : "block border-l border-transparent px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-950 text-base"
          : isActive
            ? "py-2 text-base text-amber-500 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-amber-500"
            : "py-2 text-base text-black hover:text-amber-500 leading-snug"
      }`;

  const renderNavigation = (mobile = false) =>
    navigation.map(({ label, to, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={navLinkClass(mobile)}
        onClick={mobile ? () => setMenuOpen(false) : undefined}
      >
        {label}
      </NavLink>
    ));

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ease-out ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md shadow-lg py-1 border-b border-gray-200 translate-y-0"
            : "bg-white/90 backdrop-blur-md shadow-none border-transparent translate-y-0"
        }`}
        aria-label="Header"
      >
        <div className="flex items-center justify-between py-4 sm:py-6 lg:py-4  container">
          <Link
            to="/"
            className="text-3xl font-extrabold text-slate-900"
            aria-label="Shop.co home"
          >
            <span className="text-slate-900">SHOP.</span>
            <span className="text-amber-500">CO.</span>
          </Link>

          <div className="ml-auto hidden items-center gap-8 md:flex">
            <nav
              className="flex items-center gap-12"
              aria-label="Primary navigation"
            >
              {renderNavigation()}
            </nav>
            {/* {cartButton} */}
            <CartButton count={cartCount} onClick={onCartClick} />
          </div>

          <div className="ml-auto flex items-center gap-4 md:hidden">
            {/* {cartButton} */}
            <CartButton count={cartCount} onClick={onCartClick} />
            <button
              type="button"
              onClick={() => setMenuOpen((isOpen) => !isOpen)}
              className="p-1 text-slate-700 transition-colors hover:text-slate-950"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              {menuOpen ? (
                <X className="h-7 w-7" />
              ) : (
                <Menu className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </header>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
      />

      <aside
        id="mobile-navigation"
        className={`fixed inset-y-0 right-0 z-50 flex w-[72%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-1/2 md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex py-4 items-center justify-between border-b border-slate-200 px-3">
          <span className="text-base font-bold text-slate-900">Menu</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="text-slate-700 transition-colors hover:text-slate-950"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="space-y-1 py-2" aria-label="Mobile navigation">
          {renderNavigation(true)}
        </nav>
      </aside>
    </>
  );
};

export default Header;
