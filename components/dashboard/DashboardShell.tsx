"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart2,
  Users,
  FileText,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

interface DashboardShellProps {
  role: "manager" | "admin";
  userEmail: string;
  pageTitle: string;
  topBarActions?: ReactNode;
  sidebarActions?: ReactNode;
  onLogout: () => void;
  onRefresh: () => void;
  onStaff?: () => void;
  onAnalytics?: () => void;
  onReports?: () => void;
  children: ReactNode;
}

export default function DashboardShell({
  role,
  userEmail,
  pageTitle,
  topBarActions,
  sidebarActions,
  onLogout,
  onRefresh,
  onStaff,
  onAnalytics,
  onReports,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const truncatedEmail =
    userEmail.length > 22 ? userEmail.slice(0, 22) + "…" : userEmail;

  const dashHref = role === "admin" ? "/admin/dashboard" : "/dashboard/dashboard";
  const ordersHref = role === "admin" ? "/admin/orders" : "/dashboard/orders";

  const go = (href: string) => { router.push(href); setMobileOpen(false); };

  const navItems = [
    {
      label: "Dashboard",
      Icon: LayoutDashboard,
      active: pathname === dashHref,
      action: () => go(dashHref),
    },
    {
      label: "Orders",
      Icon: ShoppingBag,
      active: pathname === ordersHref,
      action: () => go(ordersHref),
    },
    ...(role === "admin"
      ? [
          {
            label: "Reports",
            Icon: FileText,
            active: false,
            action: () => { onReports ? onReports() : go(dashHref); setMobileOpen(false); },
          },
          {
            label: "Staff",
            Icon: Users,
            active: false,
            action: () => { onStaff ? onStaff() : go(dashHref); setMobileOpen(false); },
          },
          {
            label: "Analytics",
            Icon: BarChart2,
            active: false,
            action: () => { onAnalytics ? onAnalytics() : go(dashHref); setMobileOpen(false); },
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">

      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#111111] border-r border-white/[0.07] flex flex-col z-40 overflow-hidden transition-all duration-300 ease-in-out w-60 ${collapsed ? "md:w-[60px]" : "md:w-60"} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header: logo + toggle */}
        <div className="h-14 border-b border-white/[0.07] flex items-center justify-between shrink-0 px-3">
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${collapsed ? "md:w-0 md:opacity-0 w-36 opacity-100" : "w-36 opacity-100"}`}
          >
            <Image
              src="/images/logo-dark.png"
              alt="Amal Foods"
              width={100}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </div>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-[6px] text-white/25 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-[6px] text-white/25 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* User block */}
        <div
          className={`border-b border-white/[0.07] shrink-0 overflow-hidden transition-all duration-200 ease-in-out ${collapsed ? "md:max-h-0 md:py-0 md:px-0 max-h-24 py-4 px-4" : "max-h-24 py-4 px-4"}`}
        >
          <p className="text-[12px] text-white/40 truncate mb-1.5 whitespace-nowrap">
            {truncatedEmail}
          </p>
          <span
            className="text-[10px] font-medium tracking-[0.12em] uppercase px-2 py-0.5 rounded-[4px] whitespace-nowrap"
            style={{
              color: "#B80013",
              backgroundColor: "rgba(184,0,19,0.12)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {role === "admin" ? "Owner" : "Manager"}
          </span>
        </div>

        {/* Nav */}
        <nav className="py-3 overflow-x-hidden shrink-0">
          <div
            className={`overflow-hidden transition-all duration-150 ease-in-out ${collapsed ? "md:max-h-0 md:opacity-0 max-h-8 opacity-100 px-4 mb-2" : "max-h-8 opacity-100 px-4 mb-2"}`}
          >
            <p
              className="text-[9px] tracking-[0.16em] uppercase text-white/20 whitespace-nowrap"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Navigation
            </p>
          </div>

          <div className="space-y-0.5 px-2">
            {navItems.map(({ label, Icon, active, action }) => (
              <button
                key={label}
                onClick={action}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center py-2.5 rounded-[6px] text-[13px] transition-all whitespace-nowrap cursor-pointer gap-3 px-3
                  ${collapsed ? "md:justify-center md:px-0" : ""}
                  ${active
                    ? "bg-[#B80013]/10 text-[#B80013]"
                    : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                  }`}
              >
                <Icon size={15} className="shrink-0" />
                <span
                  className={`overflow-hidden transition-all duration-150 ease-in-out ${collapsed ? "md:w-0 md:opacity-0 opacity-100" : "opacity-100"}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Sidebar actions */}
        {sidebarActions && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div
              className={`overflow-hidden transition-all duration-150 ease-in-out ${collapsed ? "md:max-h-0 md:opacity-0 max-h-8 opacity-100 px-4 mb-2 pt-3" : "max-h-8 opacity-100 px-4 mb-2 pt-3"}`}
            >
              <p
                className="text-[9px] tracking-[0.16em] uppercase text-white/20 whitespace-nowrap"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Actions
              </p>
            </div>
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${collapsed ? "md:max-h-0 md:py-0 md:px-0 max-h-[400px] pb-3 px-2" : "max-h-[400px] pb-3 px-2"}`}
            >
              <div className="flex flex-col gap-0.5">
                {sidebarActions}
              </div>
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="px-2 pb-4 border-t border-white/[0.07] pt-3 space-y-0.5 shrink-0">
          <button
            onClick={onRefresh}
            title={collapsed ? "Refresh" : undefined}
            className={`w-full flex items-center py-2.5 rounded-[6px] text-[13px] text-white/40 hover:text-white hover:bg-white/[0.05] transition cursor-pointer whitespace-nowrap gap-3 px-3 ${collapsed ? "md:justify-center md:px-0" : ""}`}
          >
            <RefreshCw size={15} className="shrink-0" />
            <span className={`overflow-hidden transition-all duration-150 ease-in-out ${collapsed ? "md:w-0 md:opacity-0 opacity-100" : "opacity-100"}`}>
              Refresh
            </span>
          </button>
          <button
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={`w-full flex items-center py-2.5 rounded-[6px] text-[13px] text-[#B80013] hover:text-[#ff3344] hover:bg-[#B80013]/[0.08] transition cursor-pointer whitespace-nowrap gap-3 px-3 ${collapsed ? "md:justify-center md:px-0" : ""}`}
          >
            <LogOut size={15} className="shrink-0" />
            <span className={`overflow-hidden transition-all duration-150 ease-in-out ${collapsed ? "md:w-0 md:opacity-0 opacity-100" : "opacity-100"}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ── CONTENT AREA ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ml-0 ${collapsed ? "md:ml-[60px]" : "md:ml-60"}`}
      >
        <header className="h-14 border-b border-white/[0.07] px-4 sm:px-6 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-30 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-[6px] text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer shrink-0"
            >
              <Menu size={16} />
            </button>
            <span
              className="text-[11px] font-medium tracking-[0.12em] uppercase text-white/50 truncate"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {pageTitle}
            </span>
          </div>
          {topBarActions && (
            <div className="flex items-center gap-2 shrink-0">{topBarActions}</div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
