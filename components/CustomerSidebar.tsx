"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Camera, X, Save } from "lucide-react";

export default function CustomerSidebar({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        await supabase.from("customers").insert({ id: user.id, email: user.email });
        setProfile({ id: user.id, email: user.email, name: "", surname: "", phone: "", street: "", city: "", avatar_url: "" });
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({
        name: profile.name,
        surname: profile.surname,
        phone: profile.phone,
        street: profile.street,
        city: profile.city,
        updated_at: new Date(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (!error) {
      setEditing(false);
      setSavedMsg("Saved");
      setTimeout(() => setSavedMsg(""), 2000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) return;

    const filePath = `avatars/${user.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { cacheControl: "3600", upsert: true, contentType: file.type });
    if (error) return;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    await supabase.from("customers").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setProfile((p: any) => ({ ...p, avatar_url: data.publicUrl }));
    e.target.value = "";
  };

  if (loading || !profile) {
    return (
      <div className="px-4 py-5">
        <div className="w-11 h-11 rounded-[8px] bg-white/[0.04] mb-3 animate-pulse" />
        <div className="h-3 w-28 bg-white/[0.04] rounded mb-2 animate-pulse" />
        <div className="h-2.5 w-36 bg-white/[0.04] rounded animate-pulse" />
      </div>
    );
  }

  const initials = [(profile.name || "")[0], (profile.surname || "")[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const displayName = profile.name && profile.surname
    ? `${profile.name} ${profile.surname}`
    : profile.name || "—";

  return (
    <>
      {/* ── Profile card — goes in DashboardShell's sidebarTop slot ── */}
      <div className="px-4 py-5">
        {/* Avatar */}
        <div
          className="relative w-11 h-11 rounded-[8px] overflow-hidden mb-3 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill className="object-cover" />
          ) : (
            <div
              className="w-full h-full bg-[#B80013]/20 flex items-center justify-center text-[#B80013] text-[13px] font-bold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={12} className="text-white" />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatarUpload}
        />

        <p className="text-[14px] font-semibold text-white leading-tight truncate">{displayName}</p>
        <p className="text-[11px] text-white/35 mt-0.5 truncate">{profile.email || user?.email}</p>

        {/* Data rows */}
        <div className="mt-4 space-y-3">
          {[
            { label: "Phone", value: profile.phone },
            { label: "Address", value: profile.street },
            { label: "City", value: profile.city },
          ].map(({ label, value }) => (
            <div key={label}>
              <p
                className="text-[9px] uppercase tracking-[0.14em] text-white/25"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {label}
              </p>
              <p className="text-[12px] text-white/55 mt-0.5 leading-tight">{value || "—"}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setEditing(true)}
          className="mt-5 w-full h-[32px] text-[10px] font-bold uppercase tracking-[0.1em] border border-white/[0.1] rounded-[6px] text-white/45 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Edit Profile
        </button>
      </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111111] border border-white/[0.07] rounded-[12px] w-full max-w-md p-6 relative">
            <button
              onClick={() => setEditing(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            <p
              className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Edit Profile
            </p>

            {/* Avatar in modal */}
            <div
              className="relative w-14 h-14 rounded-[8px] overflow-hidden mb-6 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <div
                  className="w-full h-full bg-[#B80013]/20 flex items-center justify-center text-[#B80013] text-[16px] font-bold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={14} className="text-white" />
              </div>
            </div>

            <div className="space-y-5">
              {[
                { field: "name", placeholder: "First name" },
                { field: "surname", placeholder: "Last name" },
                { field: "phone", placeholder: "Phone number" },
                { field: "street", placeholder: "Street address" },
                { field: "city", placeholder: "City" },
              ].map(({ field, placeholder }) => (
                <input
                  key={field}
                  type="text"
                  placeholder={placeholder}
                  value={profile[field] || ""}
                  onChange={(e) => setProfile((p: any) => ({ ...p, [field]: e.target.value }))}
                  className="w-full bg-transparent border-b border-white/[0.1] focus:border-[#B80013] outline-none text-[14px] text-white py-2 placeholder-white/25 transition-colors"
                />
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-[44px] bg-[#B80013] hover:bg-[#960010] text-white font-bold text-[12px] uppercase tracking-[0.1em] transition rounded-[4px] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <Save size={13} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-[44px] border border-white/[0.07] text-[12px] text-white/50 hover:text-white transition rounded-[4px] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {savedMsg && (
              <p className="text-[12px] text-[#B80013] text-center mt-3">{savedMsg}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
