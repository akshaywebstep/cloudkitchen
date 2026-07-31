import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Expand,
  Globe2,
  Phone,
  Truck,
  UserRound,
  X,
  MapPin,
  Trash2,
  Star,
  FileText,
  Printer,
  ShieldCheck,
  PackageCheck,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { Avatar } from "../../ui/Avatar";
import { orderDetailItems } from "../../../constants/mockData";

export function OrderPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D0606] transition hover:underline"
            onClick={() => navigate("/orders")}
            type="button"
          >
            <ArrowLeft size={16} />
            <span>Back to Orders List</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Order #5552351</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={13} /> Paid via Online Card
            </span>
          </div>
          <p className="mt-1 text-xs font-normal text-slate-400 flex items-center gap-1.5">
            <span>Orders</span>
            <span className="text-slate-300">/</span>
            <span>Order Details</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">#5552351</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={() => window.print()}
            type="button"
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>

          <span className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 border border-sky-200 shadow-2xs">
            <Truck size={16} />
            <span>ON DELIVERY</span>
          </span>
        </div>
      </div>

      <TimelineCard />
      <MapRouteCard />
      <DeliveryGuyCard />
      <OrderItemsTable />

      <div className="grid gap-6 xl:grid-cols-2">
        <CustomerProfileCard />
        <CustomerFavoritesCard />
      </div>
    </div>
  );
}

function TimelineCard() {
  const steps = [
    { title: "Order Created", date: "Thu, 21 Jul 2024, 11:49 AM", completed: true },
    { title: "Payment Success", date: "Fri, 22 Jul 2024, 10:44 AM", completed: true },
    { title: "On Delivery", date: "Sat, 23 Jul 2024, 01:24 PM", completed: true },
    { title: "Order Delivered", date: "Estimated: Sat, 23 Jul 2024, 01:45 PM", completed: false },
  ];

  return (
    <Card className="p-6 border border-slate-200 shadow-xs">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <PackageCheck size={16} className="text-[#8D0606]" /> Order Status Timeline
        </h3>
        <span className="text-xs font-medium text-slate-400">Step 3 of 4 Completed</span>
      </div>

      <div className="relative grid gap-6 md:grid-cols-4">
        {/* Connection Line */}
        <div className="absolute left-6 right-6 top-[13px] hidden h-0.5 bg-slate-200 md:block" />
        <div className="absolute left-6 top-[13px] hidden h-0.5 w-[66%] bg-gradient-to-r from-[#8D0606] to-[#b80808] md:block" />

        {steps.map((step, idx) => (
          <div key={step.title} className="relative z-10">
            <span
              className={`mb-2.5 flex size-7 items-center justify-center rounded-full text-white shadow-2xs ${
                step.completed ? "bg-[#8D0606] ring-4 ring-rose-50" : "bg-slate-200 text-slate-400"
              }`}
            >
              <CheckCircle2 size={15} />
            </span>
            <h4 className="text-xs font-semibold text-slate-800">{step.title}</h4>
            <p className="mt-0.5 text-[11px] font-normal text-slate-400 leading-tight">{step.date}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MapRouteCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`p-5 border border-slate-200 shadow-xs ${expanded ? "fixed inset-6 z-50 bg-white" : ""}`}>
      <div className="relative h-[250px] overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(45deg,transparent_44%,#dedede_45%,#dedede_55%,transparent_56%),linear-gradient(-45deg,transparent_44%,#e4e4e4_45%,#e4e4e4_55%,transparent_56%)] [background-size:180px_180px]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 300" preserveAspectRatio="none">
          <path
            d="M90 60 L270 240 L360 150 L450 235 L560 75 L650 150 L725 60"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M90 60 L270 240 L360 150"
            fill="none"
            stroke="#8D0606"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Start Kitchen Pin */}
        <span className="absolute left-[83px] top-[52px] size-5 rounded-full bg-[#8D0606] ring-4 ring-rose-100 shadow-xs" />
        
        {/* Live Rider Marker */}
        <span className="absolute left-[350px] top-[138px] grid size-11 place-items-center rounded-full bg-[#8D0606] text-white shadow-md ring-4 ring-rose-100">
          <Truck size={20} />
        </span>

        {/* Customer Pin */}
        <span className="absolute left-[610px] top-[47px] grid size-11 place-items-center rounded-full bg-white text-amber-500 shadow-md ring-4 ring-amber-100">
          <UserRound size={22} />
        </span>

        {/* ETA Badge Card */}
        <span className="absolute left-[340px] top-[195px] rounded-xl bg-white px-3.5 py-1.5 shadow-md border border-slate-200 text-xs font-semibold text-slate-800">
          1-2 Min ETA
          <span className="block text-[10px] font-normal text-slate-400">Estimated Arrival</span>
        </span>

        <button
          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-xl bg-slate-900 text-white shadow-xs transition hover:bg-slate-800"
          onClick={() => setExpanded((value) => !value)}
          type="button"
          title="Toggle Fullscreen Map"
        >
          {expanded ? <X size={16} /> : <Expand size={16} />}
        </button>
      </div>
    </Card>
  );
}

function DeliveryGuyCard() {
  const [message, setMessage] = useState("");

  return (
    <Card className="grid gap-5 p-5 border border-slate-200 shadow-xs md:grid-cols-[1fr_auto_auto] md:items-center">
      <div className="flex items-center gap-4">
        <Avatar />
        <div>
          <p className="text-[11px] font-normal text-slate-400">Assigned Delivery Agent</p>
          <h3 className="text-sm font-semibold text-slate-900">Rainold Hawkins</h3>
          <p className="mt-0.5 text-xs font-semibold text-[#8D0606]">Rider ID: #412455</p>
        </div>
      </div>

      {message ? (
        <p className="whitespace-pre-line rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-medium text-rose-700 md:col-span-3">
          {message}
        </p>
      ) : null}

      <button
        className="flex h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-4 text-left text-white shadow-xs transition hover:from-[#7a0505] hover:to-[#a10707]"
        onClick={() => setMessage("Initiating call to Rider (+12 345 5662 66)...")}
        type="button"
      >
        <Phone size={18} />
        <div>
          <span className="block text-[9px] font-normal uppercase tracking-wider text-white/70">Contact Rider</span>
          <span className="text-xs font-semibold">+12 345 5662 66</span>
        </div>
      </button>

      <button
        className="flex h-12 items-center gap-3 rounded-xl bg-slate-900 px-4 text-left text-white shadow-xs transition hover:bg-slate-800"
        onClick={() => setMessage("Delivery reminder SMS sent to customer.")}
        type="button"
      >
        <Truck size={18} />
        <div>
          <span className="block text-[9px] font-normal uppercase tracking-wider text-white/70">Delivery Time</span>
          <span className="text-xs font-semibold">12:52 AM EST</span>
        </div>
      </button>
    </Card>
  );
}

function OrderItemsTable() {
  const [items, setItems] = useState(orderDetailItems);

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(String(item[3]).replace(/[^0-9.]/g, "")) || 0;
    return sum + price;
  }, 0);

  const deliveryFee = 2.5;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + deliveryFee + tax;

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <ShoppingBag size={17} className="text-[#8D0606]" />
          <h3 className="text-sm font-semibold text-slate-800">Purchased Menu Items</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">{items.length} Items</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Item Details</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Total Price</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {items.map((item) => (
              <tr key={item[0]} className="transition hover:bg-slate-50/60">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <img src={item[4]} alt="" className="size-11 rounded-xl object-cover border border-slate-100 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#8D0606]">Main Course</span>
                      <h4 className="text-xs font-semibold text-slate-800">{item[0]}</h4>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-500">
                        <Star size={11} fill="currentColor" />
                        <Star size={11} fill="currentColor" />
                        <Star size={11} fill="currentColor" />
                        <Star size={11} fill="currentColor" />
                        <span className="ml-1 text-slate-400 font-normal">(454 reviews)</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">{item[1]}</td>
                <td className="px-4 py-3.5 text-slate-600">{item[2]}</td>
                <td className="px-4 py-3.5 font-semibold text-[#8D0606]">{item[3]}</td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                    onClick={() => setItems((current) => current.filter((row) => row[0] !== item[0]))}
                    type="button"
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? (
          <p className="py-8 text-center text-xs font-medium text-slate-400">
            All items removed from order.
          </p>
        ) : null}
      </div>

      {/* Pricing Summary Footer */}
      {items.length ? (
        <div className="border-t border-slate-100 bg-slate-50/70 p-5">
          <div className="ml-auto max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-700">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery Charge</span>
              <span className="font-semibold text-slate-700">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated Tax (5%)</span>
              <span className="font-semibold text-slate-700">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
              <span>Grand Total</span>
              <span className="text-[#8D0606] font-bold text-base">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function CustomerProfileCard() {
  return (
    <Card className="overflow-hidden border border-slate-200 shadow-xs">
      <div className="flex items-center gap-4 p-5 border-b border-slate-100 bg-slate-50/60">
        <Avatar />
        <div>
          <h3 className="text-xs font-semibold text-slate-800">James Hawkins</h3>
          <span className="mt-0.5 inline-block rounded-md bg-[#fff1f1] px-2.5 py-0.5 text-[10px] font-semibold text-[#8D0606]">
            Verified Customer
          </span>
        </div>
      </div>
      <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
        <p className="flex items-center gap-3 px-5 py-3.5 text-slate-600">
          <Phone size={15} className="text-[#8D0606]" /> +01234567890
        </p>
        <p className="flex items-center gap-3 px-5 py-3.5 text-slate-600">
          <Globe2 size={15} className="text-[#8D0606]" /> Long Horn St. Avenue 000000 London
        </p>
        <div className="px-5 py-4">
          <h4 className="mb-1 text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <FileText size={14} className="text-[#8D0606]" /> Special Delivery Instructions
          </h4>
          <p className="text-xs font-normal leading-relaxed text-slate-500">
            Please deliver by back entrance if front door is closed. No plastic cutlery required.
          </p>
        </div>
      </div>
    </Card>
  );
}

function CustomerFavoritesCard() {
  return (
    <Card className="p-5 border border-slate-200 shadow-xs">
      <h3 className="mb-4 text-xs font-semibold text-slate-800 flex items-center gap-1.5">
        <Sparkles size={15} className="text-amber-500" /> Customer Favorites Breakdown
      </h3>
      <FavoriteBar label="Pizza & Italian (40%)" value="25 Orders" color="#FFB800" width="82%" />
      <FavoriteBar label="Juice & Beverages (35%)" value="60 Orders" color="#8D0606" width="61%" />
      <FavoriteBar label="Desserts & Pastries (25%)" value="7 Orders" color="#3155df" width="25%" />
    </Card>
  );
}

function FavoriteBar({ label, value, color, width }) {
  return (
    <div className="mb-3.5">
      <div className="mb-1 flex justify-between text-xs font-medium text-slate-700">
        <span>{label}</span>
        <span className="text-slate-400 font-normal">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: color, width }} />
      </div>
    </div>
  );
}
