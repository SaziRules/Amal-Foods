"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  category: string;
  priceDurban: number | null;
  priceJoburg: number | null;
}

function prettyCategory(cat: string) {
  return cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // ⭐ ALL HOOKS MUST COME FIRST (React strict rule)
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();

      if (profile?.role === "admin") return "admin";
      if (profile?.role === "manager") return "manager";

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
          title, "slug": slug.current, category,
          "priceDurban": pricing.durban,
          "priceJoburg": pricing.joburg
        }`,
        { q: query }
      );
      setResults(data);
    };
    const timeout = setTimeout(fetchResults, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  // Close menus on outside click
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

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/");
    } catch {
      window.location.href = "/";
    }
  };

  const getDashboardRoute = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "manager") return "/dashboard/dashboard";
    return "/customer/dashboard";
  };

  const toggleUserMenu = () => {
    if (menuOpen) setMenuOpen(false);
    setUserMenuOpen((v) => !v);
  };

  const toggleMainMenu = () => {
    if (userMenuOpen) setUserMenuOpen(false);
    setMenuOpen((v) => !v);
  };

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

  // ⭐ ONLY NOW WE CHECK visibility (AFTER hooks)
  const hideNavbar =
    pathname?.startsWith("/studio") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard");

  if (hideNavbar) return null;

  // ⭐ FROM HERE DOWN — your original JSX unchanged
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

            <Link href="/" className="inline-flex items-center">
              <Image
                src="/images/logo-dark.png"
                alt="Amal Foods"
                width={160}
                height={45}
                priority
                style={{ width: 'auto' }}
                className="h-10 md:h-14"
              />
            </Link>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Search */}
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
                    {results.map((item, index) => {
                      const price = item.priceDurban ?? item.priceJoburg;
                      return (
                        <button
                          key={item.slug || `${item.title}-${index}`}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#B80013]/15 transition-colors border-b border-white/[0.05] last:border-0"
                          onClick={() => {
                            setQuery("");
                            setResults([]);
                            router.push(`/products?q=${encodeURIComponent(item.title)}`);
                          }}
                        >
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.title}</p>
                            <p className="text-white/35 text-[10px] uppercase tracking-[0.25em] mt-0.5">
                              {prettyCategory(item.category)}
                            </p>
                          </div>
                          {price != null && (
                            <span className="text-[#B80013] text-sm font-bold ml-4 flex-shrink-0">
                              R{price}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* User Icon */}
              <button onClick={toggleUserMenu} className="relative">
                <Image
                  src="/images/user.svg"
                  alt="User"
                  width={46}
                  height={46}
                  priority
                  className="h-11 w-11 md:h-14 md:w-14"
                />
              </button>

              {/* Cart Icon */}
              <button onClick={() => setCartOpen(true)} className="relative">
                <Image
                  src="/images/cart.svg"
                  alt="Cart"
                  width={46}
                  height={46}
                  className="h-11 w-11 md:h-14 md:w-14"
                />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-red-700 text-[10px] font-bold px-1.5 py-[3px] rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu */}
              <button
                onClick={toggleMainMenu}
                className="relative inline-flex items-center justify-center"
              >
                {!menuOpen ? (
                  <Image
                    src="/images/menu.svg"
                    alt="Menu"
                    width={46}
                    height={46}
                    className="h-11 w-11 md:h-14 md:w-14"
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

        {/* User menu */}
        <div
          ref={userMenuRef}
          className={`absolute right-32 md:right-44 mt-3 ${
            userMenuOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          } transition-all duration-200 origin-top-right`}
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

        {/* Mobile menu */}
        <div
          ref={mainMenuRef}
          className={`absolute right-6 md:right-10 mt-3 ${
            menuOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          } transition-all duration-200 origin-top-right`}
        >
          <nav className="min-w-[190px] rounded-xl bg-[#111] text-white border border-white/10 shadow-xl px-6 py-4">
            {[
              { href: "/", label: "Home" },
              { href: "/products", label: "Products" },
              { href: "/gallery", label: "Gallery" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((l) => {
              const isActive = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full shrink-0 transition-colors ${isActive ? "bg-[#B80013]" : "bg-transparent"}`} />
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Staff PIN modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-[90%] max-w-md text-center shadow-[0_0_35px_rgba(255,0,0,0.3)]">
            <h2 className="text-xl font-semibold mb-4 text-white">
              {targetLogin === "manager" ? "Manager Access" : "Admin Access"}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Please enter your staff access key to continue.
            </p>

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
                  <X className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
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

      {/* Cart Drawer */}
      {typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            onCheckout={() => {
              setCartOpen(false);
              router.push("/checkout");
            }}
          />,
          document.body
        )}
    </>
  );
}
