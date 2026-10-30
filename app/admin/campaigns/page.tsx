"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { buildEmailHTML } from "@/lib/emailTemplates";
import {
  Mail, Plus, Search, MoreHorizontal, Send, Clock, FileEdit,
  AlertCircle, CheckCircle2, X, Copy, Trash2, BarChart2,
  Users, MousePointerClick, Eye, Calendar, Zap,
  AlignLeft, ImageIcon, Layout, Megaphone, Newspaper, Tag,
  Monitor, Smartphone, Upload,
} from "lucide-react";

/* ── Static config ──────────────────────────────────────────────────── */

const GALLERY_IMAGES: string[] = [
  "P64A2808.JPG","P64A2817.JPG","P64A2820.JPG","P64A2823.JPG","P64A2824.JPG",
  "P64A2825.JPG","P64A2835.JPG","P64A2837.JPG","P64A2840.JPG","P64A2848.JPG",
  "P64A2850.JPG","P64A2853.JPG","P64A2858.JPG","P64A2867.JPG","P64A2868.JPG",
  "P64A2869.JPG","P64A2870.JPG","P64A2887.JPG","P64A2890.JPG","P64A2897.JPG",
  "P64A2899.JPG","P64A2900.jpg","P64A2903.JPG","P64A2907.JPG","P64A2910.JPG",
  "P64A2912.jpg","P64A2914.JPG","P64A2916.JPG","P64A2933.jpg","P64A2934.JPG",
  "P64A2938.JPG","P64A2955.JPG","P64A2965.JPG","P64A2977.JPG","P64A2980.JPG",
  "P64A2990.JPG","P64A2992.JPG","P64A2996.JPG","P64A2999.JPG","P64A3002.JPG",
  "P64A3005.JPG","P64A3007.JPG","P64A3011.JPG","P64A3012.JPG","P64A3015.JPG",
  "P64A3018.JPG","P64A3020.JPG","P64A3021.JPG","P64A3025.JPG","P64A3026.jpg",
  "P64A3029.JPG","P64A3032.JPG","P64A3033.JPG","P64A3043.JPG","P64A3045.jpg",
  "P64A3050.JPG","P64A3054.JPG","P64A3059.JPG","P64A3064.JPG","P64A3066.JPG",
  "P64A3074.JPG","P64A3076.JPG","P64A3080.JPG","P64A3083.JPG","P64A3085.JPG",
  "P64A3087.JPG","P64A3097.JPG","P64A3099.JPG","P64A3105.JPG","P64A3107.JPG",
  "P64A3110.JPG","P64A3118.JPG","P64A3119.JPG","P64A3128.JPG","P64A3131.JPG",
  "P64A3136.JPG","P64A3137.JPG","P64A3138.JPG","P64A3141.JPG","P64A3147.JPG",
  "P64A3148.JPG","P64A3153.JPG","P64A3154.JPG","P64A3157.JPG","P64A3165.JPG",
  "P64A3172.JPG","P64A3174.JPG","P64A3176.JPG","P64A3177.JPG","P64A3180.JPG",
  "P64A3181.JPG",
];

const TEMPLATES = [
  { key:"promotional",  label:"Promotional",  Icon:Tag,       desc:"Sales, discounts & offers"   },
  { key:"newsletter",   label:"Newsletter",   Icon:Newspaper, desc:"Updates & curated content"   },
  { key:"announcement", label:"Announcement", Icon:Megaphone, desc:"New products & news"         },
];

const STATUS_CFG: Record<string,{ label:string; color:string; Icon:React.ElementType }> = {
  draft:     { label:"Draft",     color:"bg-white/[0.06] text-white/40 border-white/[0.08]",               Icon:FileEdit     },
  scheduled: { label:"Scheduled", color:"bg-blue-500/[0.12] text-blue-300/80 border-blue-500/[0.2]",      Icon:Clock        },
  sending:   { label:"Sending",   color:"bg-yellow-500/[0.12] text-yellow-300/80 border-yellow-500/[0.2]", Icon:Send         },
  sent:      { label:"Sent",      color:"bg-green-500/[0.12] text-green-300/80 border-green-500/[0.2]",   Icon:CheckCircle2 },
  failed:    { label:"Failed",    color:"bg-red-500/[0.12] text-red-300/80 border-red-500/[0.2]",         Icon:AlertCircle  },
};

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cfg.color}`}>
      <cfg.Icon size={10} />
      {cfg.label}
    </span>
  );
}

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width:`${Math.min((value/max)*100,100)}%` }} />
      </div>
      <span className="text-[12px] text-white/60 tabular-nums">{value>0?`${value.toFixed(1)}%`:"—"}</span>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function CampaignsPage() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [campaigns, setCampaigns]     = useState<any[]>([]);
  const [customers, setCustomers]     = useState<any[]>([]);
  const [orders, setOrders]           = useState<any[]>([]);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeMenu, setActiveMenu]   = useState<string|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  /* Composer */
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [drawerAnim, setDrawerAnim]   = useState(false);
  const [mobileTab, setMobileTab]     = useState<"form"|"preview">("form");
  const [previewDevice, setPreviewDevice] = useState<"desktop"|"mobile">("desktop");
  const [cName, setCName]             = useState("");
  const [cSubject, setCSubject]       = useState("");
  const [cPreview, setCPreview]       = useState("");
  const [cSegment, setCSegment]       = useState("all");
  const [cTemplate, setCTemplate]     = useState("promotional");
  const [cBody, setCBody]             = useState("");
  const [cScheduleMode, setCScheduleMode] = useState<"now"|"schedule">("now");
  const [cScheduleDate, setCScheduleDate] = useState("");
  const [cSending, setCSending]       = useState(false);
  const [csvEmails, setCsvEmails]     = useState<{ email: string; name: string }[]>([]);
  const [baseUrl, setBaseUrl]         = useState("");
  /* Hero image picker */
  const [cHeroImage, setCHeroImage]         = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen]       = useState(false);
  const [galleryPending, setGalleryPending] = useState<string | null>(null);
  const [uploadError, setUploadError]       = useState("");
  const [uploadLoading, setUploadLoading]   = useState(false);
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const csvInputRef  = useRef<HTMLInputElement>(null);
  const heroUploadRef = useRef<HTMLInputElement>(null);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const header = lines[0]?.toLowerCase() || "";
    const hasHeader = header.includes("email");
    const cols0 = lines[0].split(",").map(c => c.trim().replace(/"/g, "").toLowerCase());
    const emailCol = hasHeader ? Math.max(cols0.findIndex(c => c.includes("email")), 0) : 0;
    const nameCol  = hasHeader ? cols0.findIndex(c => c.includes("name") || c.includes("first")) : -1;
    const results: { email: string; name: string }[] = [];
    for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
      const parts = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
      const email = parts[emailCol]?.trim();
      if (email && emailRe.test(email)) results.push({ email, name: nameCol >= 0 ? parts[nameCol]?.trim() || "" : "" });
    }
    setCsvEmails(results);
  };

  const handleHeroUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, or WebP files are accepted.");
      return;
    }
    if (file.size > 500 * 1024) {
      setUploadError(`File is ${(file.size / 1024).toFixed(0)} KB — max 500 KB.`);
      return;
    }
    /* Dimension check in browser */
    const dimError = await new Promise<string | null>(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width < 600)        resolve(`Image is ${img.width} px wide — must be at least 600 px.`);
        else if (img.height < 200)  resolve(`Image is ${img.height} px tall — must be at least 200 px.`);
        else if (img.height > 450)  resolve(`Image is ${img.height} px tall — must be 450 px or shorter.`);
        else                        resolve(null);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve("Could not read image dimensions."); };
      img.src = url;
    });
    if (dimError) { setUploadError(dimError); return; }

    setUploadError("");
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/admin/campaigns/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || "Upload failed."); return; }
      setCHeroImage(data.url);
    } catch {
      setUploadError("Upload failed. Check your connection.");
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => { setBaseUrl(window.location.origin); }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/admin/login"); };
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/admin/login"); return; }
      setUser(data.user);
      const [custJson, ordRes] = await Promise.all([
        fetch("/api/admin/customers").then(r => r.json()),
        supabase.from("orders").select("cell_number, region, payment_status, created_at"),
      ]);
      if (Array.isArray(custJson)) setCustomers(custJson);
      if (ordRes.data) setOrders(ordRes.data);
    });
  }, [router]);

  /* Compute segments from real data */
  const SEGMENTS = useMemo(() => {
    const SIXTY_AGO = Date.now() - 60 * 24 * 60 * 60 * 1000;
    type OrdEntry = { region: string; payment_status: string; ts: number };
    const byPhone: Record<string, OrdEntry[]> = {};
    orders.forEach(o => {
      const k = o.cell_number || "__anon__";
      if (!byPhone[k]) byPhone[k] = [];
      byPhone[k].push({ region: (o.region || "").toLowerCase(), payment_status: o.payment_status || "", ts: new Date(o.created_at).getTime() });
    });
    const phones = Object.keys(byPhone).filter(p => p !== "__anon__");
    const has = (p: string, test: (r: string) => boolean) => byPhone[p].some(o => test(o.region));
    return [
      { key:"all",      label:"All Customers",        count: phones.length },
      { key:"kzn",      label:"KZN",                  count: phones.filter(p => has(p, r => r.includes("kzn") || r.includes("kwazulu") || r.includes("durban"))).length },
      { key:"cpt",      label:"Cape Town",             count: phones.filter(p => has(p, r => r.includes("cape"))).length },
      { key:"jhb",      label:"Johannesburg",          count: phones.filter(p => has(p, r => r.includes("johannesburg") || r.includes("jhb") || r.includes("joburg"))).length },
      { key:"inactive", label:"Inactive (60d+)",       count: phones.filter(p => Math.max(...byPhone[p].map(o => o.ts)) < SIXTY_AGO).length },
      { key:"paid",     label:"Paid Customers",        count: phones.filter(p => byPhone[p].some(o => o.payment_status === "paid")).length },
      { key:"unpaid",   label:"Unpaid / Outstanding",  count: phones.filter(p => byPhone[p].some(o => o.payment_status !== "paid")).length },
    ];
  }, [customers, orders]);

  /* Build email HTML whenever inputs change */
  const emailHTML = useMemo(() => {
    if (!baseUrl) return "";
    return buildEmailHTML(cTemplate, cSubject, cBody, baseUrl, cHeroImage ?? undefined);
  }, [cTemplate, cSubject, cBody, baseUrl, cHeroImage]);

  /* Write into iframe */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !emailHTML) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(emailHTML); doc.close();
    const resize = () => {
      if (iframe.contentDocument?.body) iframe.style.height = iframe.contentDocument.body.scrollHeight + "px";
    };
    iframe.onload = resize;
    setTimeout(resize, 120);
  }, [emailHTML]);

  const openDrawer  = () => { setDrawerOpen(true); requestAnimationFrame(() => setDrawerAnim(true)); };
  const closeDrawer = () => {
    setDrawerAnim(false);
    setTimeout(() => {
      setDrawerOpen(false); setCName(""); setCSubject(""); setCPreview(""); setCBody("");
      setCSegment("all"); setCTemplate("promotional"); setCScheduleMode("now");
      setCScheduleDate(""); setCSending(false); setCsvEmails([]);
      setCHeroImage(null); setGalleryPending(null); setUploadError("");
    }, 300);
  };

  const handleSend = async () => {
    if (!cName || !cSubject || !cBody) return;
    setCSending(true);
    try {
      /* Build recipient list */
      let recipients: { email: string; name: string }[];
      if (csvEmails.length > 0) {
        recipients = csvEmails;
      } else {
        const res  = await fetch("/api/admin/customers");
        const all  = await res.json() as any[];
        recipients = all.map(c => ({ email: c.email || "", name: c.name || "" })).filter(r => r.email);
      }

      if (recipients.length === 0) {
        alert("No valid email addresses found for this audience.");
        return;
      }

      const res  = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignName: cName, subject: cSubject, htmlContent: emailHTML, recipients }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`Send failed: ${data.error}`);
        return;
      }

      const parts = [`Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}.`];
      if (data.failed > 0)  parts.push(`${data.failed} failed.`);
      if (data.wasCapped)   parts.push(`Capped at daily limit (${data.cappedAt}/day).`);
      if (data.remaining === 0) parts.push("Daily campaign limit reached.");
      else parts.push(`${data.remaining} sends remaining today.`);
      alert(parts.join(" "));
      closeDrawer();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setCSending(false);
    }
  };

  const sent = campaigns.filter(c => c.status === "sent");
  const avgOpen  = sent.length ? sent.reduce((a,b) => a + b.openRate,  0) / sent.length : 0;
  const avgClick = sent.length ? sent.reduce((a,b) => a + b.clickRate, 0) / sent.length : 0;
  const totalDelivered = sent.reduce((a,b) => a + b.recipients, 0);
  const selectedSeg   = SEGMENTS.find(s => s.key === cSegment);
  const recipientCount = csvEmails.length > 0 ? csvEmails.length : (selectedSeg?.count ?? 0);

  const filtered = campaigns.filter(c => {
    const ms = statusFilter === "all" || c.status === statusFilter;
    const mq = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase());
    return ms && mq;
  });

  if (!user) return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white text-sm tracking-widest uppercase">Loading…</div>;

  /* Shared form field classes */
  const inputCls = "w-full h-10 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.13] focus:border-[#B80013] rounded-[8px] outline-none text-[13px] text-white placeholder-white/20 px-3.5 transition-colors";
  const labelCls = "block text-[11px] text-white/35 mb-1.5 tracking-wide";
  const sectionLabel = "text-[9px] uppercase tracking-[0.18em] text-white/25 mb-3 block";

  return (
    <DashboardShell
      role="admin"
      userEmail={user.email || ""}
      pageTitle="Campaigns"
      onLogout={handleLogout}
      onRefresh={() => {}}
      topBarActions={
        <button
          onClick={openDrawer}
          className="flex items-center gap-2 h-8 px-4 bg-[#B80013] hover:bg-[#c8001a] text-white text-[12px] font-semibold rounded-[8px] transition cursor-pointer active:scale-[0.97]"
        >
          <Plus size={13} /> New Campaign
        </button>
      }
    >
      <div onClick={() => setActiveMenu(null)}>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-white/[0.07] rounded-[8px] overflow-hidden mb-6">
          {[
            { label:"Total Campaigns",  value:campaigns.length,             Icon:Mail,              sub:`${campaigns.filter(c=>c.status==="draft").length} drafts` },
            { label:"Avg. Open Rate",   value:`${avgOpen.toFixed(1)}%`,           Icon:Eye,               sub:"across sent campaigns" },
            { label:"Avg. Click Rate",  value:`${avgClick.toFixed(1)}%`,          Icon:MousePointerClick, sub:"of openers clicked"    },
            { label:"Total Delivered",  value:totalDelivered.toLocaleString(),    Icon:Users,             sub:"emails delivered"       },
          ].map(({ label, value, Icon, sub }, i) => (
            <div key={label} className={`px-5 py-4 border-white/[0.07] ${["border-r border-b sm:border-b-0","border-b sm:border-b-0 sm:border-r","border-r",""][i]||""}`}>
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-[22px] font-bold text-white leading-none" style={{ fontFamily:"var(--font-heading)" }}>{value}</p>
                <Icon size={13} className="text-white/20 mt-1 shrink-0" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-white/40" style={{ fontFamily:"var(--font-heading)" }}>{label}</p>
              <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Search campaigns…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 bg-white/[0.04] border border-white/[0.07] focus:border-[#B80013] rounded-[8px] outline-none text-[13px] text-white/70 placeholder-white/25 pl-9 pr-3 transition-colors" />
          </div>
          <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-[8px] p-1 gap-0.5 self-start overflow-x-auto [&::-webkit-scrollbar]:hidden shrink-0">
            {["all","draft","scheduled","sent","failed"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-[11px] rounded-[6px] transition whitespace-nowrap cursor-pointer capitalize ${statusFilter===s?"bg-[#1a1a1a] text-white font-medium":"text-white/40 hover:text-white/70"}`}>
                {s==="all" ? `All · ${campaigns.length}` : s}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block border border-white/[0.07] rounded-[8px] overflow-hidden mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#111111]">
                {["Campaign","Audience","Status","Recipients","Open Rate","Click Rate","Date",""].map((h,i) => (
                  <th key={i} className={`px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-white/30 font-medium ${i>=3&&i<7?"text-right":i===7?"text-center":"text-left"}`} style={{ fontFamily:"var(--font-heading)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.015] transition last:border-0">
                  <td className="px-4 py-3.5 max-w-[210px]">
                    <p className="text-[13px] font-medium text-white truncate">{c.name}</p>
                    <p className="text-[11px] text-white/35 truncate mt-0.5">{c.subject}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-white/45">{c.audience}</td>
                  <td className="px-4 py-3.5"><StatusChip status={c.status} /></td>
                  <td className="px-4 py-3.5 text-right text-[13px] text-white/60">{c.recipients.toLocaleString()}</td>
                  <td className="px-4 py-3.5"><div className="flex justify-end"><MiniBar value={c.openRate}  max={60} color="bg-blue-400" /></div></td>
                  <td className="px-4 py-3.5"><div className="flex justify-end"><MiniBar value={c.clickRate} max={25} color="bg-[#B80013]" /></div></td>
                  <td className="px-4 py-3.5 text-right text-[12px] text-white/35 whitespace-nowrap">
                    {c.sentAt ? new Date(c.sentAt).toLocaleDateString("en-ZA",{ day:"numeric", month:"short", year:"numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="relative flex justify-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setActiveMenu(activeMenu===c.id?null:c.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-white/25 hover:text-white hover:bg-white/[0.06] transition cursor-pointer">
                        <MoreHorizontal size={14} />
                      </button>
                      {activeMenu===c.id && (
                        <div className="absolute right-0 top-8 z-20 bg-[#1a1a1a] border border-white/[0.1] rounded-[10px] py-1.5 w-44 shadow-2xl">
                          {c.status==="sent" && <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"><BarChart2 size={13}/> View Report</button>}
                          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"><Copy size={13}/> Duplicate</button>
                          {(c.status==="draft"||c.status==="scheduled") && <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"><FileEdit size={13}/> Edit</button>}
                          <div className="h-px bg-white/[0.06] my-1"/>
                          <button onClick={() => { setDeleteTarget(c); setActiveMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition cursor-pointer"><Trash2 size={13}/> Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && (
            <div className="py-20 text-center">
              {campaigns.length===0
                ? (<><p className="text-white/30 text-[14px] font-medium mb-1">No campaigns yet</p><p className="text-white/18 text-[12px]">Create your first campaign to start reaching customers.</p></>)
                : (<p className="text-white/25 text-[13px]">No campaigns match your filters.</p>)
              }
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-[#111111] border border-white/[0.07] rounded-[12px] overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-white leading-snug">{c.name}</p>
                    <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{c.subject}</p>
                  </div>
                  <StatusChip status={c.status} />
                </div>
                <p className="text-[11px] text-white/30">{c.audience} · {c.recipients.toLocaleString()} recipients</p>
                {c.status==="sent" && (
                  <div className="flex gap-6 mt-3 pt-3 border-t border-white/[0.05]">
                    <div><p className="text-[9px] text-white/25 uppercase tracking-[0.1em] mb-1">Open Rate</p><MiniBar value={c.openRate} max={60} color="bg-blue-400"/></div>
                    <div><p className="text-[9px] text-white/25 uppercase tracking-[0.1em] mb-1">Click Rate</p><MiniBar value={c.clickRate} max={25} color="bg-[#B80013]"/></div>
                  </div>
                )}
              </div>
              <div className="border-t border-white/[0.05] px-4 py-2.5 flex items-center justify-between">
                <span className="text-[11px] text-white/25">{c.sentAt ? new Date(c.sentAt).toLocaleDateString("en-ZA",{day:"numeric",month:"short"}) : "—"}</span>
                <div className="flex items-center gap-3">
                  {c.status==="sent" && <button className="text-[11px] text-white/40 hover:text-white transition cursor-pointer flex items-center gap-1"><BarChart2 size={11}/> Report</button>}
                  <button className="text-[11px] text-white/40 hover:text-white transition cursor-pointer flex items-center gap-1"><Copy size={11}/> Duplicate</button>
                  <button onClick={() => setDeleteTarget(c)} className="text-red-400/50 hover:text-red-400 transition cursor-pointer"><Trash2 size={12}/></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && (
            <div className="py-16 text-center">
              {campaigns.length===0
                ? (<><p className="text-white/30 text-[14px] font-medium mb-1">No campaigns yet</p><p className="text-white/18 text-[12px]">Create your first campaign.</p></>)
                : (<p className="text-white/25 text-[13px]">No campaigns match your filters.</p>)
              }
            </div>
          )}
        </div>

      </div>

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-[#111111] border border-white/[0.1] rounded-t-[20px] sm:rounded-[14px] w-full sm:max-w-sm p-6 sm:p-8">
            <div className="sm:hidden w-8 h-1 bg-white/20 rounded-full mx-auto mb-5"/>
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013] mb-3" style={{ fontFamily:"var(--font-heading)" }}>Delete Campaign?</p>
            <p className="text-[14px] font-semibold text-white mb-1">{deleteTarget.name}</p>
            <p className="text-[13px] text-white/40 mb-7">This cannot be undone. Scheduled sends will be cancelled.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 border border-white/[0.07] text-[13px] text-white/60 hover:text-white rounded-[8px] transition cursor-pointer">Cancel</button>
              <button onClick={() => { setCampaigns(prev => prev.filter(c => c.id !== deleteTarget.id)); setDeleteTarget(null); }} className="flex-1 h-10 bg-red-700 hover:bg-red-800 text-[13px] font-semibold text-white rounded-[8px] transition cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen Composer Overlay ── */}
      {drawerOpen && (
        <div className={`fixed inset-0 z-[100] flex transition-opacity duration-300 ${drawerAnim?"opacity-100":"opacity-0 pointer-events-none"}`}>

          {/* LEFT — Email Preview */}
          <div className={`hidden lg:flex flex-col w-[55%] bg-[#0d0d0d] border-r border-white/[0.07] transition-transform duration-300 ${drawerAnim?"translate-x-0":"-translate-x-8"}`}>
            {/* Preview header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-white/[0.07] shrink-0 bg-[#111111]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#B80013]"/>
                <span className="text-[11px] font-medium text-white/50 uppercase tracking-[0.12em]">Live Preview</span>
                <span className="text-[10px] text-white/20 capitalize">· {cTemplate}</span>
              </div>
              {/* Device toggle */}
              <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-[8px] p-1 gap-0.5">
                <button onClick={() => setPreviewDevice("desktop")} className={`w-8 h-7 flex items-center justify-center rounded-[5px] transition cursor-pointer ${previewDevice==="desktop"?"bg-[#1a1a1a] text-white":"text-white/30 hover:text-white/60"}`}>
                  <Monitor size={13}/>
                </button>
                <button onClick={() => setPreviewDevice("mobile")} className={`w-8 h-7 flex items-center justify-center rounded-[5px] transition cursor-pointer ${previewDevice==="mobile"?"bg-[#1a1a1a] text-white":"text-white/30 hover:text-white/60"}`}>
                  <Smartphone size={13}/>
                </button>
              </div>
            </div>

            {/* Preview canvas */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#141414]">
              {/* Fake email client chrome */}
              <div className="max-w-[640px] mx-auto">
                <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-t-[10px] px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/[0.08]"/>
                    <div className="w-3 h-3 rounded-full bg-white/[0.08]"/>
                    <div className="w-3 h-3 rounded-full bg-white/[0.08]"/>
                  </div>
                  <div className="flex-1 bg-white/[0.04] rounded-[4px] px-3 py-1">
                    <p className="text-[10px] text-white/25 truncate">{cSubject || "Subject line will appear here…"}</p>
                  </div>
                </div>
                {/* iframe wrapper */}
                <div
                  className="bg-white overflow-hidden rounded-b-[10px] shadow-2xl transition-all duration-300"
                  style={{ maxWidth: previewDevice==="mobile" ? "390px" : "640px", margin:"0 auto" }}
                >
                  <iframe
                    ref={iframeRef}
                    title="Email Preview"
                    style={{ width:"100%", height:"600px", border:"none", display:"block" }}
                    sandbox="allow-same-origin"
                  />
                </div>
                {/* Preview label */}
                <div className="mt-4 flex items-center justify-center gap-2 text-white/20">
                  <div className="h-px flex-1 bg-white/[0.06]"/>
                  <span className="text-[10px] uppercase tracking-[0.12em]">{previewDevice==="mobile"?"Mobile (390px)":"Desktop (600px)"}</span>
                  <div className="h-px flex-1 bg-white/[0.06]"/>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Composer */}
          <div className={`flex-1 flex flex-col bg-[#0a0a0a] transition-transform duration-300 ${drawerAnim?"translate-x-0":"translate-x-8"}`}>

            {/* Composer header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-white/[0.07] shrink-0 bg-[#0f0f0f]">
              <div className="flex items-center gap-4 min-w-0">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#B80013]" style={{ fontFamily:"var(--font-heading)" }}>New Campaign</p>
                  <p className="text-[13px] font-medium text-white/70 truncate max-w-[200px]">{cName||"Untitled Campaign"}</p>
                </div>
                {/* Mobile: preview toggle */}
                <button onClick={() => setMobileTab(mobileTab==="form"?"preview":"form")} className="lg:hidden flex items-center gap-1.5 h-7 px-3 bg-white/[0.04] border border-white/[0.07] rounded-[6px] text-[11px] text-white/40 hover:text-white transition cursor-pointer shrink-0">
                  {mobileTab==="form"?<><Eye size={11}/> Preview</>:<><FileEdit size={11}/> Form</>}
                </button>
              </div>
              <button onClick={closeDrawer} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition cursor-pointer shrink-0">
                <X size={16}/>
              </button>
            </div>

            {/* Mobile preview pane */}
            {mobileTab==="preview" && (
              <div className="lg:hidden flex-1 overflow-y-auto p-4 bg-[#141414]">
                <div className="bg-white rounded-[10px] overflow-hidden shadow-2xl">
                  <iframe ref={iframeRef} title="Email Preview" style={{ width:"100%", height:"600px", border:"none", display:"block" }} sandbox="allow-same-origin"/>
                </div>
              </div>
            )}

            {/* Form body */}
            {(mobileTab==="form") && (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

                {/* Details */}
                <div className="space-y-4">
                  <span className={sectionLabel} style={{ fontFamily:"var(--font-heading)" }}>Campaign Details</span>
                  <div>
                    <label className={labelCls}>Campaign Name <span className="text-[#B80013]">*</span></label>
                    <input type="text" placeholder="e.g. November Flash Sale" value={cName} onChange={e => setCName(e.target.value)} className={inputCls}/>
                  </div>
                  <div>
                    <label className={labelCls}>Subject Line <span className="text-[#B80013]">*</span></label>
                    <input type="text" placeholder="Grab attention — be clear and compelling" value={cSubject} onChange={e => setCSubject(e.target.value)} className={inputCls}/>
                    <p className="text-[10px] text-white/20 mt-1.5">Aim for 40–60 characters. Emoji can boost open rate.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Preview Text</label>
                    <input type="text" placeholder="Short teaser shown below subject in inbox" value={cPreview} onChange={e => setCPreview(e.target.value)} className={inputCls}/>
                  </div>
                </div>

                {/* Template */}
                <div className="space-y-3">
                  <span className={sectionLabel} style={{ fontFamily:"var(--font-heading)" }}>Template</span>
                  <div className="grid grid-cols-3 gap-2">
                    {TEMPLATES.map(({ key, label, Icon, desc }) => (
                      <button key={key} onClick={() => setCTemplate(key)}
                        className={`flex flex-col items-center gap-2 py-4 px-2 rounded-[10px] border transition cursor-pointer text-center ${cTemplate===key?"bg-[#B80013]/[0.08] border-[#B80013]/40 text-[#B80013]":"bg-white/[0.03] border-white/[0.07] text-white/40 hover:border-white/[0.12] hover:text-white/60"}`}>
                        <Icon size={17}/>
                        <p className="text-[12px] font-semibold leading-none">{label}</p>
                        <p className="text-[10px] opacity-70 leading-snug">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hero Image */}
                <div className="space-y-3">
                  <span className={sectionLabel} style={{ fontFamily:"var(--font-heading)" }}>Hero Image</span>

                  {/* Preview or placeholder */}
                  {cHeroImage ? (
                    <div className="relative rounded-[8px] overflow-hidden border border-white/[0.08]">
                      <img src={cHeroImage} alt="Hero" className="w-full h-[120px] object-cover block"/>
                      <button
                        onClick={() => { setCHeroImage(null); setGalleryPending(null); }}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer"
                      >
                        <X size={11}/>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-[72px] border border-dashed border-white/[0.1] rounded-[8px] flex items-center justify-center gap-2 text-white/20 text-[12px]">
                      <ImageIcon size={14}/> Using template default
                    </div>
                  )}

                  {/* Picker buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setGalleryPending(cHeroImage); setGalleryOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 border border-white/[0.08] hover:border-white/[0.16] rounded-[8px] text-[12px] text-white/45 hover:text-white/70 transition cursor-pointer"
                    >
                      <ImageIcon size={12}/> Browse Gallery
                    </button>
                    <button
                      onClick={() => heroUploadRef.current?.click()}
                      disabled={uploadLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 border border-white/[0.08] hover:border-white/[0.16] rounded-[8px] text-[12px] text-white/45 hover:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      {uploadLoading
                        ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white/70 rounded-full animate-spin"/> Uploading…</>
                        : <><Upload size={12}/> Upload Custom</>
                      }
                    </button>
                  </div>

                  {/* Constraints */}
                  <p className="text-[10px] text-white/18 leading-relaxed">
                    JPG / PNG / WebP &nbsp;·&nbsp; max 500 KB &nbsp;·&nbsp; min 600 px wide &nbsp;·&nbsp; 200–450 px tall
                  </p>

                  {/* Upload error */}
                  {uploadError && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-400/80">
                      <AlertCircle size={11}/> {uploadError}
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={heroUploadRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadError("");
                      handleHeroUpload(f);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Audience */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={sectionLabel} style={{ fontFamily:"var(--font-heading)" }}>Audience Segment</span>
                    <span className="text-[11px] text-white/30">
                      <span className="text-white/55 font-medium">{recipientCount.toLocaleString()}</span> recipients
                    </span>
                  </div>

                  {/* Segment pills — dimmed when CSV is active */}
                  <div className={`flex flex-wrap gap-2 transition-opacity ${csvEmails.length > 0 ? "opacity-30 pointer-events-none" : ""}`}>
                    {SEGMENTS.map(({ key, label, count }) => (
                      <button key={key} onClick={() => setCSegment(key)}
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] border transition cursor-pointer whitespace-nowrap ${cSegment===key?"bg-[#1a1a1a] border-white/[0.15] text-white font-medium":"border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/[0.12]"}`}>
                        {label}
                        <span className={`text-[10px] ${cSegment===key?"text-white/45":"text-white/25"}`}>· {count.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>

                  {/* CSV upload */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-px flex-1 bg-white/[0.06]"/>
                    <span className="text-[10px] text-white/20 uppercase tracking-[0.12em]">or</span>
                    <div className="h-px flex-1 bg-white/[0.06]"/>
                  </div>

                  {csvEmails.length === 0 ? (
                    <>
                      <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => parseCsv(ev.target?.result as string); r.readAsText(f); e.target.value = ""; }}
                      />
                      <button onClick={() => csvInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 h-10 border border-dashed border-white/[0.12] hover:border-white/[0.25] rounded-[8px] text-[12px] text-white/35 hover:text-white/60 transition cursor-pointer">
                        <Upload size={13}/> Upload CSV
                      </button>
                      <p className="text-[10px] text-white/18">CSV must have an <code className="text-white/30">email</code> column. Optional: <code className="text-white/30">name</code> column.</p>
                    </>
                  ) : (
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[10px] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"/>
                          <span className="text-[13px] font-medium text-white">{csvEmails.length.toLocaleString()} emails loaded</span>
                        </div>
                        <button onClick={() => setCsvEmails([])}
                          className="w-6 h-6 flex items-center justify-center rounded-[5px] text-white/25 hover:text-white hover:bg-white/[0.06] transition cursor-pointer">
                          <X size={12}/>
                        </button>
                      </div>
                      <div className="space-y-1">
                        {csvEmails.slice(0, 3).map((r, i) => (
                          <p key={i} className="text-[11px] text-white/35 truncate">{r.name ? `${r.name} · ` : ""}{r.email}</p>
                        ))}
                        {csvEmails.length > 3 && <p className="text-[10px] text-white/20">+{csvEmails.length - 3} more</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <span className={sectionLabel} style={{ fontFamily:"var(--font-heading)" }}>Email Content <span className="text-[#B80013]">*</span></span>
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-white/[0.03] border border-white/[0.07] rounded-t-[8px] border-b-0">
                    {[["B","font-bold"],["I","italic"],["U","underline"]].map(([l,c]) => (
                      <button key={l} className={`w-7 h-7 flex items-center justify-center rounded-[5px] text-[12px] text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer ${c}`}>{l}</button>
                    ))}
                    <div className="w-px h-4 bg-white/[0.1] mx-1"/>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[5px] text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"><AlignLeft size={12}/></button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[5px] text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"><ImageIcon size={12}/></button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[5px] text-white/40 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"><Layout size={12}/></button>
                  </div>
                  <textarea
                    placeholder={`Hi [First Name],\n\nWrite your message here…`}
                    value={cBody}
                    onChange={e => setCBody(e.target.value)}
                    rows={8}
                    className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.12] focus:border-[#B80013] rounded-b-[8px] outline-none text-[13px] text-white/80 placeholder-white/20 px-4 py-3 transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-white/20">Tags: <code className="text-white/30">[First Name]</code> &nbsp;<code className="text-white/30">[Order #]</code> &nbsp;<code className="text-white/30">[Branch]</code> &nbsp;<code className="text-white/30">[Unsubscribe]</code></p>
                </div>

                {/* Delivery */}
                <div className="space-y-3">
                  <span className={sectionLabel} style={{ fontFamily:"var(--font-heading)" }}>Delivery</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([["now","Send Now",Zap],["schedule","Schedule",Calendar]] as const).map(([mode,label,Icon]) => (
                      <button key={mode} onClick={() => setCScheduleMode(mode)}
                        className={`flex items-center gap-2.5 h-11 px-4 rounded-[8px] border text-[13px] transition cursor-pointer ${cScheduleMode===mode?"bg-[#1a1a1a] border-white/[0.15] text-white font-medium":"bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70"}`}>
                        <Icon size={14}/>{label}
                      </button>
                    ))}
                  </div>
                  {cScheduleMode==="schedule" && (
                    <input type="datetime-local" value={cScheduleDate} onChange={e => setCScheduleDate(e.target.value)}
                      className="w-full h-10 bg-white/[0.04] border border-white/[0.08] focus:border-[#B80013] rounded-[8px] outline-none text-[13px] text-white/70 px-3.5 transition-colors [color-scheme:dark]"/>
                  )}
                </div>

              </div>
            )}

            {/* Composer footer */}
            <div className="px-6 py-4 border-t border-white/[0.07] shrink-0 bg-[#0f0f0f]">
              <div className="flex items-center gap-3">
                <p className="text-[11px] text-white/25 mr-auto">
                  <span className="text-white/45 font-medium">{recipientCount.toLocaleString()}</span> recipients
                  {csvEmails.length > 0 ? <span className="text-green-400/60"> · CSV list</span> : null}
                  {" "}· <span className="capitalize">{cTemplate}</span>
                </p>
                <button onClick={closeDrawer} className="h-10 px-4 text-[12px] border border-white/[0.07] text-white/50 hover:text-white rounded-[8px] transition cursor-pointer">
                  Save Draft
                </button>
                <button
                  onClick={handleSend}
                  disabled={cSending || !cName || !cSubject || !cBody}
                  className="h-10 px-6 flex items-center gap-2 bg-[#B80013] hover:bg-[#c8001a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-bold uppercase tracking-wide rounded-[8px] transition cursor-pointer"
                  style={{ fontFamily:"var(--font-heading)" }}
                >
                  {cSending ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Sending…</>
                  ) : cScheduleMode==="now" ? (
                    <><Send size={13}/> Send Now</>
                  ) : (
                    <><Calendar size={13}/> Schedule</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Gallery Picker Overlay ── */}
      {galleryOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0a]">

          {/* Header */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-white/[0.07] shrink-0 bg-[#0f0f0f]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#B80013]" style={{ fontFamily:"var(--font-heading)" }}>Select Hero Image</p>
              <p className="text-[13px] font-medium text-white/60">{GALLERY_IMAGES.length} photos available</p>
            </div>
            <button
              onClick={() => { setGalleryOpen(false); setGalleryPending(cHeroImage); }}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
            >
              <X size={16}/>
            </button>
          </div>

          {/* Scrollable image grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {GALLERY_IMAGES.map(fname => {
                const src      = `/images/gallery/${fname}`;
                const selected = galleryPending === src;
                return (
                  <button
                    key={fname}
                    onClick={() => setGalleryPending(selected ? null : src)}
                    className="relative aspect-[4/3] overflow-hidden rounded-[6px] transition cursor-pointer focus:outline-none"
                    style={{ boxShadow: selected ? "0 0 0 2px #B80013" : "0 0 0 1px rgba(255,255,255,0.07)" }}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover block"/>
                    {selected && (
                      <div className="absolute inset-0 bg-[#B80013]/25 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-[#B80013] flex items-center justify-center shadow-lg">
                          <CheckCircle2 size={14} className="text-white"/>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.07] shrink-0 bg-[#0f0f0f] flex items-center gap-3">
            <p className="text-[11px] text-white/30 mr-auto">
              {galleryPending ? "1 image selected" : "No image selected"}
            </p>
            <button
              onClick={() => { setGalleryOpen(false); setGalleryPending(cHeroImage); }}
              className="h-9 px-4 text-[12px] border border-white/[0.07] text-white/50 hover:text-white rounded-[8px] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (galleryPending) { setCHeroImage(galleryPending); setUploadError(""); }
                setGalleryOpen(false);
              }}
              disabled={!galleryPending}
              className="h-9 px-5 flex items-center gap-2 bg-[#B80013] hover:bg-[#c8001a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-bold rounded-[8px] transition cursor-pointer"
              style={{ fontFamily:"var(--font-heading)" }}
            >
              <CheckCircle2 size={13}/> Use This Image
            </button>
          </div>

        </div>
      )}

    </DashboardShell>
  );
}
