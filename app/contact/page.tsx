'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, X, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const branches = [
  {
    title: 'Durban Branch',
    address: '1271 Umgeni Rd, Stamford Hill, Durban, 4025',
    phone: '031 303 7786',
    email: 'info@amalfoods.co.za',
    mapUrl: 'https://maps.google.com/?q=1271+Umgeni+Rd,+Stamford+Hill,+Durban,+4025',
  },
  {
    title: 'Johannesburg Branch',
    address: '123 Van Tonder St, Sunderland Ridge, Centurion, 0157',
    phone: '011 838 3299',
    email: 'jhb@amalfoods.co.za',
    mapUrl: 'https://maps.google.com/?q=123+Van+Tonder+St,+Sunderland+Ridge,+Centurion,+0157',
  },
];

const socials = [
  { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { Icon: Instagram, href: 'https://www.instagram.com/amalfoods_', label: 'Instagram' },
  { Icon: Twitter, href: 'https://x.com', label: 'X / Twitter' },
  { Icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
];

export default function ContactPage() {
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <main className="bg-[#0d0d0d] text-white overflow-x-hidden">
      {/* ── PAGE HERO ── */}
      <section className="relative h-[60vh] flex items-end overflow-hidden">
        <Image
          src="/images/brand/contact-hero.JPG"
          fill
          alt="Amal Foods Durban branch – contact us"
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/60 to-black/20" />
        <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto w-full pb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-4 font-bold"
          >
            Reach Out
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold uppercase leading-[1.0]"
            style={{ fontFamily: 'var(--font-roboto-condensed)' }}
          >
            We&apos;re Here
            <br />
            <span className="text-[#B80013]">To Help You.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-white/50 text-sm tracking-widest uppercase"
          >
            Reach out to our branches directly or send us a message below.
          </motion.p>
        </div>
      </section>

      {/* ── BRANCH CARDS ── */}
      <section className="py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-12 font-bold">
            Our Locations
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {branches.map((branch, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative rounded-2xl border border-white/8 hover:border-[#B80013]/40 p-8 transition-colors duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 110%, rgba(184,0,19,0.12) 0%, transparent 70%)' }}
                />
                <div className="relative z-10">
                  <h3
                    className="text-2xl font-extrabold uppercase tracking-tight mb-6 group-hover:text-[#B80013] transition-colors duration-200"
                    style={{ fontFamily: 'var(--font-roboto-condensed)' }}
                  >
                    {branch.title}
                  </h3>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-start gap-3 text-white/60 text-sm">
                      <MapPin size={16} className="text-[#B80013] shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <Phone size={16} className="text-[#B80013] shrink-0" />
                      <a href={`tel:${branch.phone}`} className="hover:text-white transition-colors">
                        {branch.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <Mail size={16} className="text-[#B80013] shrink-0" />
                      <a href={`mailto:${branch.email}`} className="hover:text-white transition-colors">
                        {branch.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={branch.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 bg-[#B80013] text-white text-sm font-bold uppercase tracking-wide rounded-full hover:bg-[#a00010] transition"
                    >
                      Get Directions
                    </a>
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-6 py-2.5 border border-white/20 text-white/80 text-sm font-bold uppercase tracking-wide rounded-full hover:border-white/60 hover:text-white transition"
                    >
                      Get In Touch
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL ── */}
      <section className="py-20 px-6 md:px-16 lg:px-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-10 font-bold">
            Follow Us
          </p>
          <div className="flex gap-4 flex-wrap">
            {socials.map(({ Icon, href, label }, i) => (
              <motion.a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/10 text-white/60 text-sm hover:border-[#B80013]/60 hover:text-white hover:bg-[#B80013]/10 transition-all duration-200"
              >
                <Icon size={16} />
                <span>{label}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT MODAL ── */}
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0, transition: { duration: 0.2 } }}
              className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-[95%] max-w-lg p-8 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
              <p className="text-[#B80013] text-xs uppercase tracking-[0.4em] mb-2 font-bold">
                Send a Message
              </p>
              <h2
                className="text-2xl font-extrabold uppercase mb-6"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                Get In Touch
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:ring-1 focus:ring-[#B80013] focus:border-[#B80013] outline-none transition"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:ring-1 focus:ring-[#B80013] focus:border-[#B80013] outline-none transition"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:ring-1 focus:ring-[#B80013] focus:border-[#B80013] outline-none transition"
                />
                <textarea
                  name="message"
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:ring-1 focus:ring-[#B80013] focus:border-[#B80013] outline-none resize-none transition"
                />
                <button
                  type="submit"
                  className="w-full bg-[#B80013] text-white font-bold uppercase tracking-widest text-sm rounded-full py-3 mt-2 hover:bg-[#a00010] transition"
                >
                  Send Message
                </button>
                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-sm text-center mt-3"
                  >
                    Message sent successfully!
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
