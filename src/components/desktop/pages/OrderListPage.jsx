import React, { useState } from "react";
import { MoreVertical, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/Card";
import { SearchFilterRow } from "../../ui/SearchFilterRow";
import { Pagination } from "../../ui/Pagination";
import { orderListRows } from "../../../constants/mockData";

export function OrderListPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 pb-12">
      <SearchFilterRow
        calendarTone="blue"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <OrderCustomerTable searchQuery={searchQuery} />
    </div>
  );
}

export function OrderCustomerTable({ searchQuery = "" }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const PAGE_SIZE = 5;

  const filteredRows = orderListRows.filter((row) => {
    const matchesStatus = statusFilter === "All" || row[6] === statusFilter;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      row[0].toLowerCase().includes(q) || // Order ID (#245883)
      row[3].toLowerCase().includes(q) || // Customer Name
      row[4].toLowerCase().includes(q)    // Location
    );
  });

  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Card className="overflow-hidden p-6 shadow-xs border border-slate-200">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["All", "Delivery", "New Order", "On Delivery"].map((status) => (
            <button
              key={status}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                statusFilter === status
                  ? "bg-[#8D0606] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              type="button"
            >
              {status}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <ShoppingBag size={15} className="text-[#8D0606]" />
          <span>{filteredRows.length} Orders Found</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5">Order ID</th>
              <th className="px-4 py-3.5">Date & Time</th>
              <th className="px-4 py-3.5">Customer Name</th>
              <th className="px-4 py-3.5">Delivery Address</th>
              <th className="px-4 py-3.5">Total Amount</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {paginatedRows.map((row) => (
              <tr
                key={row[0]}
                className="cursor-pointer transition hover:bg-slate-50/70"
                onClick={() => navigate("/order")}
              >
                <td className="px-4 py-3.5 font-semibold text-[#8D0606]">{row[0]}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                  {row[1]} <span className="ml-1 text-[11px] font-semibold text-slate-400">{row[2]}</span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">{row[3]}</td>
                <td className="px-4 py-3.5 text-slate-500 max-w-[240px] truncate" title={row[4]}>
                  {row[4]}
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-900">{row[5]}</td>
                <td className="px-4 py-3.5">
                  <StatusPill status={row[6]} />
                </td>
                <td className="px-4 py-3.5 text-right text-slate-400">
                  <button className="p-1 rounded-lg hover:bg-slate-100 transition" type="button">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredRows.length ? (
          <p className="py-10 text-center text-xs font-normal text-slate-400">
            No orders found matching your filter criteria.
          </p>
        ) : null}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filteredRows.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        className="mt-4"
      />
    </Card>
  );
}

export function StatusPill({ status }) {
  const cls =
    status === "New Order"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : status === "On Delivery"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${cls}`}>
      {status}
    </span>
  );
}
