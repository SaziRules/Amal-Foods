"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  Edit3,
  Save,
  Trash2,
  Phone,
  Home,
  MapPin,
  X,
  Info,
} from "lucide-react";
import CustomerSidebar from "@/components/CustomerSidebar";

interface Order {
  id: string;
  branch: string;
  total: number;
  status: string;
  payment_status?: string;
  order_number?: string;
  created_at: string;
  items?: any[];
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    name: "",
    surname: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    avatar_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [deleting, setDeleting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 🔐 Fetch user, profile, and orders
  const fetchData = async (refreshOnly = false) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/customer/login");
      return;
    }
    if (!refreshOnly) setUser(user);

    // Fetch profile data
    const { data: profileData } = await supabase
      .from("customers")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile({
        name: profileData.name || "",
        surname: profileData.surname || "",
        email: user.email || "",
        phone: profileData.phone || "",
        street: profileData.street || "",
        city: profileData.city || "",
        avatar_url: profileData.avatar_url || "",
      });
    } else {
      setProfile((p: any) => ({ ...p, email: user.email }));
    }

    // Fetch user orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("email", user.email)
      .order("created_at", { ascending: false });

    if (ordersData) setOrders(ordersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // 💾 Save Profile
  const handleSaveProfile = async () => {
    setSaving(true);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      name: profile.name,
      surname: profile.surname,
      email: profile.email,
      phone: profile.phone,
      street: profile.street,
      city: profile.city,
      avatar_url: profile.avatar_url,
      updated_at: new Date(),
    });

    if (!error) {
      await fetchData(true);
      setSavedMessage("Saved successfully");
      setEditing(false);
      setTimeout(() => setSavedMessage(""), 1500);
    }

    setSaving(false);
  };

  // 🖼️ Upload Avatar
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.length) return;
    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) return console.error(uploadError);

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    await supabase.from("profiles").upsert({
      id: user.id,
      avatar_url: publicUrl,
    });

    setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to permanently delete your account? This cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    router.push("/");
  };

  /* ───────────── Unified Filtering Logic (matches ManageOrdersModal) ───────────── */
  const filteredOrders = orders.filter((o) => {
    const normalizedStatus = o.status?.toLowerCase?.() || "";
    const normalizedPayment = o.payment_status?.toLowerCase?.() || "";
    const filter = activeFilter.toLowerCase();

    if (filter === "all") return true;
    if (normalizedStatus === filter) return true;
    if (normalizedPayment === filter) return true;
    if (o.order_number?.toLowerCase?.().includes(filter)) return true;

    return false;
  });

  if (loading)
    return (
      <main className="flex items-center justify-center h-screen text-white">
        <p className="animate-pulse text-gray-400">Loading your dashboard...</p>
      </main>
    );

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white px-6 md:px-16 pt-44 pb-24"
      style={{ backgroundImage: "url('/images/login.png')" }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="text-left mb-12">
          <h1 className="text-6xl font-bold text-[#B80013]">
            Welcome, {profile.name || "User"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your profile and view your order history below
          </p>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-10">
          {/* SIDEBAR */}
          <CustomerSidebar 
            user={user}
            profile={profile}
            editing={editing}
            saving={saving}
            deleting={deleting}
            savedMessage={savedMessage}
            setEditing={setEditing}
            handleSaveProfile={handleSaveProfile}
            handleUpload={handleUpload}
            handleLogout={handleLogout}
            handleDeleteAccount={handleDeleteAccount}
            setProfile={setProfile}
          />

          {/* ORDERS SECTION */}
          <section className="bg-[#111]/85 p-8 rounded-2xl border border-white/10 shadow-[0_0_25px_rgba(255,0,0,0.1)] relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-[#B80013]">Your Orders</h2>
              <div className="flex gap-2 flex-wrap justify-center">
                {["all", "pending", "packed", "collected", "cancelled", "paid", "unpaid"].map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                        activeFilter === f
                          ? "bg-red-700 text-white"
                          : "bg-black/40 hover:bg-black/60 text-gray-300"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-10">
                No orders found in this category.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="flex justify-between items-center bg-black/60 border border-white/10 rounded-xl px-6 py-3 hover:border-red-700 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1">
                        <Info size={14} className="text-red-600" />{" "}
                        {order.order_number || `Order #${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()} •{" "}
                        {order.branch}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-semibold ${
                          order.status === "completed"
                            ? "bg-green-700/80 text-white"
                            : order.status === "packed"
                            ? "bg-blue-700/70 text-white"
                            : order.status === "collected"
                            ? "bg-teal-700/70 text-white"
                            : order.status === "cancelled"
                            ? "bg-gray-600/80 text-white"
                            : "bg-red-700/80 text-white"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="text-sm font-bold">
                        R{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ORDER DETAILS MODAL */}
            {selectedOrder && (
              <>
                <div
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
                  onClick={() => setSelectedOrder(null)}
                ></div>
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <div className="bg-[#111]/95 border border-white/10 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative text-sm text-gray-200">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>

                    <h3 className="text-xl font-semibold text-[#B80013] mb-4">
                      Order Details
                    </h3>

                    <div className="space-y-1 mb-4">
                      <p>
                        <strong>Order ID:</strong>{" "}
                        {selectedOrder.order_number || selectedOrder.id}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </p>
                      <p>
                        <strong>Branch:</strong> {selectedOrder.branch}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className="capitalize text-white">
                          {selectedOrder.status}
                        </span>
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-3 mt-3">
                      <h4 className="font-semibold text-white mb-2">Items</h4>
                      {Array.isArray(selectedOrder.items) &&
                      selectedOrder.items.length > 0 ? (
                        <ul className="divide-y divide-white/10">
                          {selectedOrder.items.map((i, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between py-2 text-sm"
                            >
                              <span>
                                {i.title}{" "}
                                <span className="text-gray-400">
                                  × {i.quantity}
                                </span>
                              </span>
                              <span>
                                R{(i.price * i.quantity).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400">Item details unavailable</p>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-[#B80013]">
                        R{selectedOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
