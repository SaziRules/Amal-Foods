"use client";

import React from "react";
import Image from "next/image";

interface SendingInvoiceModalProps {
  open: boolean;
}

export default function SendingInvoiceModal({ open }: SendingInvoiceModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111]/95 border border-white/10 rounded-2xl p-8 w-[90%] max-w-sm text-center shadow-2xl">

        {/* Loading GIF */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
  <Image
    src="/images/loading.gif"
    alt="Loading"
    width={60}
    height={60}
    className="rounded-md"
  />
</div>


        <h2 className="text-xl font-bold text-[#B80013] mb-2">
          Sending Invoice
        </h2>

        <p className="text-gray-300 text-sm leading-relaxed">
          Please hold on while we prepare and send your invoice PDF.
          <br />
          This may take a few seconds.
        </p>
      </div>
    </div>
  );
}
