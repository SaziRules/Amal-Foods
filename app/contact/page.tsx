"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, X, Facebook, Instagram, Twitter, Music, Youtube } from "lucide-react";
import HeroSection from "@/components/HeroSection";

export default function ContactPage() {
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const branches = [
    {
      title: "Durban Branch",
      address: "202 Brickfield Road, Durban, South Africa",
      phone: "031 209 0176",
      email: "info@aminasfoods.co.za",
      mapUrl: "https://maps.google.com/?q=202+Brickfield+Road,+Durban",
    },
    {
      title: "Johannesburg Branch",
      address: "55 Crown Road, Fordsburg, Johannesburg",
      phone: "011 838 3299",
      email: "sales@aminasfoods.co.za",
      mapUrl: "https://maps.google.com/?q=55+Crown+Road,+Fordsburg,+Johannesburg",
    },
  ];

  const faqs = [
    {
      q: "Where can I buy Amal Foods products?",
      a: "You can find our range in major supermarkets, select local retailers, and right here through our online store. Simply choose your region (Durban or Johannesburg) to shop directly.",
    },
    {
      q: "Do you offer wholesale or bulk purchasing?",
      a: "Yes! We supply to stores, restaurants, and caterers across South Africa. Use the contact form or call your nearest branch to set up a wholesale account.",
    },
    {
      q: "Can I collaborate or become a distributor?",
      a: "We’re always open to partnerships that share our love for quality food. Reach out via the contact form and our sales team will get in touch.",
    },
    {
      q: "How long do deliveries take?",
      a: "Delivery times depend on your area, but typically orders are fulfilled within 2–5 business days from your nearest branch.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#111] text-white">
      {/* 🧱 HERO SECTION */}
      <HeroSection
        title="We're here"
        highlight="To help you"
        subtitle="Reach out to our branches directly or send us a message below."
        primaryLabel="Contact Us"
        secondaryLabel="Our Stores"
        onPrimaryClick={() => setShowModal(true)}
      />

      {/* 📍 CONTACT DETAILS */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-[#f4f4f4] text-[#111]">
        <h2 className="max-w-7xl mx-auto text-3xl md:text-4xl font-bold text-left mb-12 text-[#B80013]">
          Pickup Locations & Contact Information
        </h2>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
          {branches.map((branch, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-[#1a1a1a] text-white rounded-2xl shadow-xl border border-white/10 p-8 flex flex-col md:flex-row items-start md:items-center gap-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#B80013]/10 transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <div className="bg-[#B80013] w-16 h-16 rounded-full flex items-center justify-center mb-2">
                  <MapPin size={28} color="white" />
                </div>
                <div className="hidden md:block h-16 w-[1px] bg-white/20" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold">{branch.title}</h3>
                <p className="text-sm text-gray-200 mt-1">{branch.address}</p>
                <p className="text-sm text-gray-200 flex items-center gap-2 mt-2">
                  <Phone size={16} /> {branch.phone}
                </p>
                <p className="text-sm text-gray-200 flex items-center gap-2 mt-1">
                  <Mail size={16} /> {branch.email}
                </p>

                <div className="flex gap-3 mt-5 flex-wrap">
                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#B80013] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#a00010] transition"
                  >
                    Open in Google Maps
                  </a>
                  <button
                    onClick={() => setShowModal(true)}
                    className="border border-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white hover:text-[#111] transition"
                  >
                    Get In Touch
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🌐 SOCIAL MEDIA SECTION */}
      <section className="bg-[#111] py-16 border-t border-white/10 text-center">
        <h3 className="text-2xl font-semibold mb-8 text-white">Follow Us</h3>
        <div className="flex justify-center gap-6">
          {[
            { Icon: Facebook, href: "https://facebook.com" },
            { Icon: Instagram, href: "https://instagram.com" },
            { Icon: Twitter, href: "https://x.com" },
            { Icon: Youtube, href: "https://tiktok.com" },
          ].map(({ Icon, href }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center hover:bg-[#B80013] hover:border-[#B80013] transition-all duration-300 group"
            >
              <Icon size={22} className="text-white group-hover:text-white" />
            </a>
          ))}
        </div>
      </section>

      {/* ❓ FAQ SECTION */}
      <section className="py-20 px-6 md:px-16 lg:px-24 bg-[#f4f4f4] text-[#111]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#B80013] mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <span
                    className={`font-semibold text-base md:text-lg ${
                      openFAQ === i ? "text-[#B80013]" : "text-[#111]"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <span
                    className={`transition-transform duration-300 ${
                      openFAQ === i ? "rotate-45 text-[#B80013]" : "rotate-0"
                    } text-xl`}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence>
                  {openFAQ === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-5 text-gray-700 text-sm md:text-base leading-relaxed bg-gray-50"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💌 CONTACT MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999]"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-[95%] max-w-lg p-8 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white"
              >
                <X size={22} />
              </button>

              <h2 className="text-2xl font-bold mb-6 text-[#B80013]">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-[#B80013] outline-none"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-[#B80013] outline-none"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-[#B80013] outline-none"
                />
                <textarea
                  name="message"
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-[#B80013] outline-none resize-none"
                />

                <button
                  type="submit"
                  className="w-full bg-[#B80013] text-white font-semibold rounded-full py-3 mt-2 hover:bg-[#a00010] transition"
                >
                  Send Message
                </button>

                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-500 text-sm font-medium text-center mt-3"
                  >
                    ✅ Message sent successfully!
                  </motion.p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
