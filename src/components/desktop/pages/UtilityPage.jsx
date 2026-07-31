import React from "react";
import {
  Bell,
  MessageSquareText,
  Gift,
  ShoppingBag,
  Truck,
  CreditCard,
  UserRound,
  ReceiptText,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Layers,
  Table,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { IconGraphic } from "../../ui/IconGraphic";

export function UtilityPage({ title, subtitle }) {
  const navigate = useNavigate();
  const actions = [
    ["Orders Management", "/orders"],
    ["Menu Catalog", "/menu"],
    ["Customer Reviews", "/reviews"],
    ["Kitchen Branch Form", "/kitchen"],
  ];

  return (
    <div className="mx-auto  space-y-6 pb-12">
      {/* Top Banner Card */}
      <Card className="p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] text-white shadow-[0_6px_16px_rgba(141,6,6,0.35)]">
            <Table size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs font-normal text-slate-500">{subtitle}</p>
          </div>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:from-[#7a0505] hover:to-[#a10707]"
            onClick={() => navigate("/")}
            type="button"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </Card>

      {title === "Icons" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[Bell, MessageSquareText, Gift, ShoppingBag, Truck, CreditCard, UserRound, ReceiptText].map(
            (Icon, index) => (
              <Card key={index} className="p-5 border border-slate-200 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="grid size-12 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100">
                  <IconGraphic icon={Icon} size={24} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">Action Icon #{index + 1}</h3>
                <p className="mt-1 text-xs font-normal leading-relaxed text-slate-500">
                  Reusable dashboard action icon component for alerts, orders, billing, and profile workflows.
                </p>
              </Card>
            )
          )}
        </div>
      ) : (
        <Card className="overflow-hidden border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#8D0606]" />
              <h3 className="text-sm font-semibold text-slate-800">Quick Data Table</h3>
            </div>
            <button
              className="rounded-xl bg-[#fff1f1] px-4 py-1.5 text-xs font-semibold text-[#8D0606] transition hover:bg-[#ffe4e4]"
              onClick={() => navigate("/orders")}
              type="button"
            >
              Open Orders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Module</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {actions.map(([label, path]) => (
                  <tr key={label} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{label}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">Cloud Kitchen</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        className="inline-flex items-center gap-1 font-semibold text-[#8D0606] hover:underline"
                        onClick={() => navigate(path)}
                        type="button"
                      >
                        <span>Open</span>
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
