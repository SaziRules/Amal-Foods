"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  Edit3,
  Save,
  Phone,
  Home,
  MapPin,
  LogOut,
  Trash2,
  X,
  Camera,
} from "lucide-react";

export default function CustomerSidebar({ user }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ───────────── Fetch Customer Profile ───────────── */
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        console.warn("⚠️ No customer record found. Creating one...");
        await supabase.from("customers").insert({
          id: user.id,
          email: user.email,
        });
        setProfile({
          id: user.id,
          email: user.email,
          name: "",
          surname: "",
          phone: "",
          street: "",
          city: "",
          avatar_url: "",
        });
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  /* ───────────── Save Profile ───────────── */
  const handleSaveProfile = async () => {
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
        avatar_url: profile.avatar_url,
        updated_at: new Date(),
      })
      .eq("id", user.id);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      setSavedMessage("Saved successfully!");
      setEditing(false);
      setTimeout(() => setSavedMessage(""), 1500);
    }

    setSaving(false);
  };

  /* ───────────── Upload Avatar ───────────── */
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  try {
    const fileInput = event.target as HTMLInputElement;
    const files = fileInput.files;

    if (!files || files.length === 0) {
      alert("Please select an image to upload.");
      return;
    }

    const file = files[0];
    if (!(file instanceof File)) {
      alert("❌ Invalid file type. Please upload a real image file.");
      return;
    }

    // ✅ Check supported formats
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Only PNG, JPG, and WEBP formats are supported.");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log("Uploading file:", fileName, "type:", file.type);

    // ✅ Upload binary file, not JSON
    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("❌ Upload failed:", uploadError.message);
      alert("❌ Upload failed: " + uploadError.message);
      return;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = publicData.publicUrl;

    console.log("✅ File uploaded successfully:", publicUrl);

    // ✅ Save avatar URL to `customers`
    const { error: dbError } = await supabase
      .from("customers")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (dbError) {
      console.error("DB update error:", dbError.message);
      alert("Error saving avatar: " + dbError.message);
      return;
    }

    // ✅ Reflect new image instantly
    setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    alert("✅ Avatar updated successfully!");

    // ✅ Reset file input so same file can re-upload later
    fileInput.value = "";
  } catch (err: any) {
    console.error("Unexpected upload error:", err);
    alert("An unexpected error occurred: " + err.message);
  }
};




  /* ───────────── Logout ───────────── */
  const handleLogout = () => {
  try {
    // Kick off Supabase sign-out (don’t await so it runs async)
    supabase.auth.signOut();

    // Immediately clear any local and session storage
    localStorage.clear();
    sessionStorage.clear();

    // Subtle UI feedback to show it’s working
    document.body.style.opacity = "0.5";
    document.body.style.pointerEvents = "none";

    // 🔥 Force a guaranteed reload and redirect
    setTimeout(() => {
      window.location.href = "/";
    }, 300); // 300ms delay gives smooth transition
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed — please refresh manually.");
  }
};


  /* ───────────── Delete Account ───────────── */
  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account?")) return;
    setDeleting(true);
    await supabase.from("customers").delete().eq("id", user.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /* ───────────── Avatar Uploader UI ───────────── */
  const Avatar = () => (
    <div className="relative w-28 h-28 rounded-full overflow-hidden border border-white/20 mb-3 group cursor-pointer">
      {profile?.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt="Profile"
          fill
          className="object-cover group-hover:opacity-60 transition"
          onClick={() => fileInputRef.current?.click()}
        />
      ) : (
        <div
          className="bg-gray-700 w-full h-full flex items-center justify-center text-xs text-gray-300 group-hover:opacity-60 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          No Image
        </div>
      )}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <Camera size={22} className="text-white" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleAvatarUpload}
      />
    </div>
  );

  if (loading)
    return (
      <div className="bg-[#111]/90 p-6 rounded-2xl text-center text-gray-400">
        Loading profile...
      </div>
    );

  return (
    <>
      <aside className="bg-[#111]/90 p-6 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <Avatar />
          <h2 className="font-semibold text-lg">
            {profile.name || "User"} {profile.surname}
          </h2>
          <p className="text-xs text-gray-400">{profile.email}</p>
        </div>

        {/* Details */}
        <ul className="text-sm text-gray-300 space-y-3 mb-6">
          <li className="flex items-center gap-2">
            <Phone size={16} className="text-red-600" /> {profile.phone || "—"}
          </li>
          <li className="flex items-center gap-2">
            <Home size={16} className="text-red-600" /> {profile.street || "—"}
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={16} className="text-red-600" /> {profile.city || "—"}
          </li>
        </ul>

        {/* Actions */}
        <button
          onClick={() => setEditing(true)}
          className="flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 w-full rounded-full text-sm font-semibold"
        >
          <Edit3 size={14} /> Edit Profile
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 mt-6 px-4 py-2 w-full rounded-full text-sm"
        >
          <LogOut size={14} /> Logout
        </button>

        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 mt-3 px-4 py-2 w-full rounded-full text-sm text-red-400 border border-red-800"
        >
          <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </aside>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111]/95 border border-white/10 p-8 rounded-2xl w-full max-w-md relative">
            <button
              onClick={() => setEditing(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-semibold text-[#B80013] mb-4 text-center">
              Edit Profile
            </h3>

            {/* Avatar inside modal */}
            <div className="flex justify-center mb-4">
              <Avatar />
            </div>

            <div className="flex flex-col gap-3">
              {["name", "surname", "phone", "street", "city"].map((field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={profile[field] || ""}
                  onChange={(e) =>
                    setProfile((p: any) => ({
                      ...p,
                      [field]: e.target.value,
                    }))
                  }
                  className="rounded-md bg-black/40 border border-white/20 px-3 py-2 text-sm focus:border-red-600 outline-none"
                />
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  saving
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-red-700 hover:bg-red-800"
                }`}
              >
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold bg-gray-700 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
            </div>

            {savedMessage && (
              <p className="text-green-500 text-xs text-center mt-2">
                {savedMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
