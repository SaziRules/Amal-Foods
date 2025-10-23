"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import Image from "next/image";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { client } from "@/sanity/lib/client";

interface SearchResult {
  title: string;
  slug: string;
  image: string;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  // 🔐 Staff access modal state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [targetLogin, setTargetLogin] = useState<"manager" | "admin" | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);


  const userMenuRef = useRef<HTMLDivElement>(null);
  const mainMenuRef = useRef<HTMLDivElement>(null);

  // 🧭 Scroll fade logic
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 80) setVisible(false);
      else setVisible(true);
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // 👤 Fetch user + resolve role robustly
useEffect(() => {
  const resolveRole = async (uid: string, email: string | null) => {
    // Try profiles.role first
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();

    if (profile?.role === "admin") return "admin";
    if (profile?.role === "manager") return "manager";

    // Fallback: check managers table by email
    if (email) {
      const { data: mgr } = await supabase
        .from("managers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (mgr) return "manager";
    }

    return "customer";
  };

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user ?? null);

    if (user) {
      const resolved = await resolveRole(user.id, user.email ?? null);
      setRole(resolved);
    } else {
      setRole(null);
    }
  };

  fetchUser();
  const { data: listener } = supabase.auth.onAuthStateChange(() => fetchUser());
  return () => listener.subscription.unsubscribe();
}, []);


  // 🔍 Live Sanity search
  useEffect(() => {
    if (!query.trim()) return setResults([]);
    const fetchResults = async () => {
      const data = await client.fetch(
        `*[_type == "product" && title match $q + "*"][0...6]{
          title, "slug": slug.current, "image": image.asset->url
        }`,
        { q: query }
      );
      setResults(data);
    };
    const timeout = setTimeout(fetchResults, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  // 🚪 Universal Logout with hard navigation to Home
const handleLogout = async () => {
  try {
    await supabase.auth.signOut().catch(() => {});
    localStorage.clear();
    sessionStorage.clear();

    // Close any open menus for immediate visual feedback
    setUserMenuOpen(false);
    setMenuOpen(false);

    // Hard replace to Home (fresh load, no SPA cache)
    window.location.replace("/");

    // Fallback in case replace is intercepted
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }, 150);
  } catch (error) {
    console.error("Logout error:", error);
    // Last-resort escape hatch
    window.location.href = "/";
  }
};



  // 🎯 Dashboard route per role (matches your actual pages)
const getDashboardRoute = () => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "manager") return "/dashboard/dashboard"; // your manager page
  return "/customer/dashboard";
};


  // ❌ Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node) &&
        mainMenuRef.current &&
        !mainMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🧩 Toggle menus (never both)
  const toggleUserMenu = () => {
    if (menuOpen) setMenuOpen(false);
    setUserMenuOpen((v) => !v);
  };
  const toggleMainMenu = () => {
    if (userMenuOpen) setUserMenuOpen(false);
    setMenuOpen((v) => !v);
  };

  // 🔐 Staff modal open/verify
  const handleProtectedClick = (type: "manager" | "admin") => {
    setTargetLogin(type);
    setPinInput("");
    setPinError("");
    setPinModalOpen(true);
  };

  const verifyPin = () => {
    const managerKey = process.env.NEXT_PUBLIC_STAFF_ACCESS_KEY;
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY;

    if (
      (targetLogin === "manager" && pinInput === managerKey) ||
      (targetLogin === "admin" && pinInput === adminKey)
    ) {
      setPinModalOpen(false);
      window.location.href =
        targetLogin === "manager" ? "/dashboard/login" : "/admin/login";
    } else {
      setPinError("Invalid access key. Please try again.");
    }
  };

  return (
    <>
      <header
        className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 w-[96%] md:max-w-[1630px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-5 pointer-events-none"
        }`}
      >
        <div className="rounded-full bg-black/75 backdrop-blur-sm shadow-lg transition-all duration-300">
          <div className="px-3 md:px-4 py-2.5 flex items-center justify-between gap-4">
            {/* 🍴 Logo */}
            <Link href="/" className="inline-flex items-center" aria-label="Amal Foods Home">
              <Image
                src="/images/logo-dark.png"
                alt="Amal Foods"
                width={160}
                height={45}
                priority
                className="h-10 w-auto md:h-14"
              />
            </Link>

            {/* 🔘 Right-side section */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* 🔍 Search Bar */}
              <div className="hidden md:flex flex-col relative w-95">
                <div className="flex items-center bg-transparent border border-white/20 rounded-full px-1 py-0.5 focus-within:border-red-600 transition-all">
                  <input
                    type="text"
                    placeholder="Find Product..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-gray-400 pl-3 text-sm outline-none"
                  />
                  <button className="flex items-center justify-center">
                    <Image
                      src="/images/search.svg"
                      alt="Search"
                      width={40}
                      height={40}
                      className="w-11 h-11"
                    />
                  </button>
                </div>

                {results.length > 0 && (
                  <div className="absolute top-[110%] left-0 w-full bg-[#111] rounded-xl shadow-lg border border-white/10 overflow-hidden z-50">
                    {results.map((item, index) => (
                      <Link
                        key={item.slug || `${item.title}-${index}`}
                        href={`/products/${item.slug || ""}`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-red-700/20 transition-colors"
                        onClick={() => {
                          setQuery("");
                          setResults([]);
                        }}
                      >
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={32}
                          height={32}
                          className="rounded-md object-cover"
                        />
                        {item.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 👤 User */}
              <button
                onClick={toggleUserMenu}
                aria-label="User menu"
                className="relative inline-flex items-center justify-center"
              >
                <Image
                  src="/images/user.svg"
                  alt="User"
                  width={46}
                  height={46}
                  className="h-11 w-11 md:h-14 md:w-14 transition-transform duration-150 hover:scale-[1.04]"
                />
              </button>

              {/* 🛒 Cart */}
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Open cart"
                className="relative inline-flex items-center justify-center"
              >
                <Image
                  src="/images/cart.svg"
                  alt="Cart"
                  width={46}
                  height={46}
                  className="h-11 w-11 md:h-14 md:w-14 transition-transform duration-150 hover:scale-[1.04]"
                />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-red-700 text-[10px] font-bold leading-none px-1.5 py-[3px] rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* 🍔 Menu */}
              <button
                onClick={toggleMainMenu}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="relative inline-flex items-center justify-center"
              >
                {!menuOpen ? (
                  <Image
                    src="/images/menu.svg"
                    alt="Menu"
                    width={46}
                    height={46}
                    className="h-11 w-11 md:h-14 md:w-14 transition-transform duration-150 hover:scale-[1.04]"
                  />
                ) : (
                  <span className="grid place-items-center h-11 w-11 md:h-14 md:w-14">
                    <X size={24} className="text-white" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 👤 User Dropdown */}
        <div
          ref={userMenuRef}
          className={`absolute right-32 md:right-44 mt-3 transition-all duration-200 origin-top-right ${
            userMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <nav className="min-w-[200px] rounded-xl bg-[#111] text-white border border-white/10 shadow-xl px-6 py-4">
            {!user ? (
              <>
                <Link
                  href="/customer/login"
                  className="flex items-center gap-2 py-2 text-sm text-gray-200 hover:text-red-500"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LogIn size={16} /> Login
                </Link>
                <Link
                  href="/customer/login"
                  className="flex items-center gap-2 py-2 text-sm text-gray-200 hover:text-red-500"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <UserPlus size={16} /> Signup
                </Link>

                <hr className="my-2 border-white/10" />
                <p className="text-xs text-gray-400 mb-1">Staff Portal</p>
                <button
                  onClick={() => handleProtectedClick("manager")}
                  className="flex items-center gap-2 py-2 text-sm text-gray-200 hover:text-red-500 w-full text-left"
                >
                  <KeyRound size={16} /> Manager Login
                </button>
                <button
                  onClick={() => handleProtectedClick("admin")}
                  className="flex items-center gap-2 py-2 text-sm text-gray-200 hover:text-red-500 w-full text-left"
                >
                  <KeyRound size={16} /> Admin Login
                </button>
              </>
            ) : (
              <>
                <Link
                  href={getDashboardRoute()}
                  className="flex items-center gap-2 py-2 text-sm text-gray-200 hover:text-red-500"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 text-sm text-gray-200 hover:text-red-500 w-full text-left"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            )}
          </nav>
        </div>

        {/* 📱 Mobile Menu */}
        <div
          ref={mainMenuRef}
          className={[
            "absolute right-6 md:right-10 mt-3",
            "transition-all duration-200 origin-top-right",
            menuOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none",
          ].join(" ")}
        >
          <nav className="min-w-[190px] rounded-xl bg-[#111] text-white border border-white/10 shadow-xl px-6 py-4">
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
              { href: "/products", label: "Products" },
              { href: "/seasons", label: "Seasons" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-gray-200 hover:text-red-500 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

            {/* 🔐 Staff PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-[90%] max-w-md text-center shadow-[0_0_35px_rgba(255,0,0,0.3)]">
            <h2 className="text-xl font-semibold mb-4 text-white">
              {targetLogin === "manager" ? "Manager Access" : "Admin Access"}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Please enter your staff access key to continue.
            </p>

            {/* Input with show/hide toggle */}
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                placeholder="Enter Access Key"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white focus:border-red-600 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPin ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-10.875-7.5a10.05 10.05 0 011.64-2.915M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.875.5a10.05 10.05 0 01-1.64 2.915m-1.64-2.915A10.05 10.05 0 0012 5c-1.425 0-2.79.3-4.005.825M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.875.5c-1.605 4.39-5.875 7.5-10.875 7.5S2.73 16.89 1.125 12.5A10.05 10.05 0 0112 5c5 0 9.27 3.11 10.875 7.5z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {pinError && <p className="text-red-500 text-sm mt-2">{pinError}</p>}

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setPinModalOpen(false)}
                className="px-6 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={verifyPin}
                className="px-6 py-2 rounded-full bg-red-700 hover:bg-red-800 text-white text-sm font-semibold shadow-[0_0_15px_rgba(255,0,0,0.3)]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 🧺 Cart Drawer */}
      {typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            onCheckout={() => {
              setCartOpen(false);
              window.location.href = "/checkout";
            }}
          />,
          document.body
        )}
    </>
  );
}
