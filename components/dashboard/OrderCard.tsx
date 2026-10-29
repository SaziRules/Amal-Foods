import { FileDown, ChevronDown, X } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  pending:   "bg-yellow-400",
  processed: "bg-purple-400",
  packed:    "bg-blue-400",
  collected: "bg-teal-400",
  cancelled: "bg-red-400",
};

const STATUS_TEXT: Record<string, string> = {
  pending:   "text-yellow-300/70",
  processed: "text-purple-300/70",
  packed:    "text-blue-300/70",
  collected: "text-teal-300/70",
  cancelled: "text-red-300/70",
};

interface OrderCardProps {
  order: any;
  onView: (order: any) => void;
  onEdit: (order: any) => void;
  onReport: (order: any, format: "pdf" | "xlsx") => void;
  onStatus: (order: any) => void;
  onDelete?: (order: any) => void;
}

export default function OrderCard({ order, onView, onEdit, onReport, onStatus, onDelete }: OrderCardProps) {
  return (
    <div className="bg-[#111111] rounded-[12px] overflow-hidden border border-white/[0.07] flex flex-col w-full min-w-0">
      {/* Info */}
      <div className="px-4 pt-4 pb-4">
        <p className="text-[11px] font-bold tracking-[0.08em] text-[#B80013] mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          {order.order_number || `#${order.id.slice(0, 6)}`}
        </p>
        <p className="text-[17px] font-bold text-white leading-snug">{order.customer_name || "N/A"}</p>
        <p className="text-[12px] text-white/40 mt-0.5 mb-3">{order.cell_number || order.phone_number || "—"}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/25 w-12 shrink-0" style={{ fontFamily: "var(--font-heading)" }}>Region</span>
            <span className="text-[12px] text-white/55 truncate">{order.region || "—"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/25 w-12 shrink-0" style={{ fontFamily: "var(--font-heading)" }}>Date</span>
            <span className="text-[12px] text-white/55">
              {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="border-t border-white/[0.05] px-4 py-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <button onClick={() => onView(order)} className="flex-1 h-10 text-[13px] font-medium bg-white/[0.06] hover:bg-white/[0.10] text-white/70 hover:text-white rounded-[8px] transition cursor-pointer active:scale-[0.97]">View</button>
          <button onClick={() => onEdit(order)} className="w-16 h-10 text-[13px] font-semibold bg-[#B80013] hover:bg-[#c8001a] text-white rounded-[8px] transition cursor-pointer active:scale-[0.97]">Edit</button>
          <button onClick={() => onReport(order, "pdf")} className="w-10 h-10 flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/30 hover:text-white/60 rounded-[8px] transition cursor-pointer active:scale-[0.97]">
            <FileDown size={14} />
          </button>
          {order.status === "cancelled" && onDelete && (
            <button onClick={() => onDelete(order)} className="w-10 h-10 flex items-center justify-center bg-red-500/[0.08] hover:bg-red-500/[0.15] text-red-500/50 hover:text-red-400 rounded-[8px] transition cursor-pointer active:scale-[0.97]">
              <X size={13} />
            </button>
          )}
        </div>
        <button onClick={() => onStatus(order)} className="w-full h-9 flex items-center justify-between px-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-[7px] transition cursor-pointer active:scale-[0.97]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status] || "bg-white/30"}`} />
            <span className={`text-[12px] capitalize ${STATUS_TEXT[order.status] || "text-white/50"}`}>{order.status}</span>
            <span className="text-white/20">·</span>
            <span className={`text-[12px] capitalize ${order.payment_status === "paid" ? "text-green-300/70" : "text-orange-300/70"}`}>
              {order.payment_status || "unpaid"}
            </span>
          </div>
          <ChevronDown size={12} className="text-white/25 shrink-0" />
        </button>
      </div>
    </div>
  );
}
