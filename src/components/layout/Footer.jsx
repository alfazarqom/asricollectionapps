const Footer = () => {
  return (
    <footer className="bg-[#f5f5f3]  md:mx-8 mx-4 rounded-2xl mb-4">
      <div className="container md:py-8 py-4">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <a
            className="text-3xl font-extrabold text-slate-900"
            aria-label="Shop.co home"
            href="/"
            data-discover="true"
          >
            <span className="text-slate-900">SHOP.</span>
            <span className="text-amber-500">CO.</span>
          </a>

          {/* Copyright */}
          <p className="md:mt-4 mt-2 text-sm text-gray-600">
            © 2026 SHOP.CO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
