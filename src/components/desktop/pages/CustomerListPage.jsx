import React, { useMemo, useState, useEffect } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Award,
  ChevronRight,
  RefreshCw,
  X,
  UserCheck,
} from "lucide-react";
import { getApiBaseUrl, getStoredToken, getApiErrorMessage } from "../../../api";
import { Pagination } from "../../ui/Pagination";
import { Loader } from "../../ui/Loader";
import { PageHeader } from "../../ui/PageHeader";

export function CustomerListPage({ apiState, onToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const token = apiState?.token || getStoredToken();
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "GET",
      headers,
      redirect: "follow",
    };

    fetch(`${getApiBaseUrl()}/kitchen/customer`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        try {
          const parsed = result ? JSON.parse(result) : null;
          const list = Array.isArray(parsed?.data)
            ? parsed.data
            : Array.isArray(parsed?.customers)
            ? parsed.customers
            : Array.isArray(parsed)
            ? parsed
            : [];
          setCustomersData(list);
        } catch (e) {
          console.error("Failed to parse customers JSON:", e);
        }
      })
      .catch((error) => {
        console.error(error);
        const msg = getApiErrorMessage(error, "Failed to load customers list");
        onToast?.({ message: msg, type: "error" });
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [apiState?.token]);

  // Normalized customer records
  const customers = useMemo(() => {
    return customersData.map((c, index) => {
      const firstName = c.firstName || c.name?.split(" ")?.[0] || "Customer";
      const lastName = c.lastName || c.name?.split(" ")?.slice(1)?.join(" ") || `#${c.id || index + 1}`;
      const fullName = c.name || `${firstName} ${lastName}`.trim();
      const phone = c.phone || c.phoneNumber || c.addresses?.[0]?.phoneNumber || "—";
      const email = c.email || `${firstName.toLowerCase()}@example.com`;
      const gender = c.gender || "Customer";
      const addrObj = c.addresses?.[0] || {};
      const address = c.address || addrObj.address1 || addrObj.address || "Local Area";
      const pincode = c.pincode || addrObj.pincode || "";
      const totalOrders = Number(c.totalOrders ?? c.ordersCount ?? c.orders?.length ?? 1);
      const totalSpent = Number(c.totalSpent ?? c.totalAmount ?? c.lifetimeSpent ?? 0);
      const lastOrderDate = c.lastOrderDate || c.updatedAt || c.createdAt;

      return {
        id: c.id || index + 1,
        firstName,
        lastName,
        fullName,
        phone,
        email,
        gender,
        address,
        pincode,
        totalOrders,
        totalSpent,
        lastOrderDate,
      };
    });
  }, [customersData]);

  // Filter by search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const nameMatch = c.fullName.toLowerCase().includes(q);
      const phoneMatch = c.phone.toLowerCase().includes(q);
      const emailMatch = c.email.toLowerCase().includes(q);
      const addressMatch = c.address.toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || addressMatch;
    });
  }, [customers, searchQuery]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* Header Banner matching Reference */}
      <PageHeader
        badge="Customer Network"
        activeBadge={`${customers.length} Registered Customers`}
        title="Customer Profiles"
        subtitle="Manage customer contact information, order histories, and lifetime spending records."
        actions={
          <button
            type="button"
            onClick={() => fetchCustomers(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            title="Refresh Customers"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-[#8D0606]" : ""} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search customer by name, phone, email, or address..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#8D0606] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8D0606]/10 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-[#8D0606] hover:bg-rose-100 transition"
          >
            Reset Search
          </button>
        )}
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="py-20">
            <Loader variant="page" text="Loading customer records from server..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <th className="pl-5 pr-2 py-4 w-12 text-slate-400">#</th>
                  <th className="px-5 py-4">Customer Name</th>
                  <th className="px-5 py-4">Contact Phone</th>
                  <th className="px-5 py-4">Email Address</th>
                  <th className="px-5 py-4">Delivery Address</th>
                  <th className="px-5 py-4">Total Orders</th>
                  <th className="px-5 py-4">Lifetime Spend</th>
                  <th className="px-5 py-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedCustomers.map((c, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  const formattedDate = c.lastOrderDate
                    ? new Date(c.lastOrderDate).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={c.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="pl-5 pr-2 py-4 font-bold text-xs text-[#8D0606] whitespace-nowrap">
                        #{itemIndex}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white font-bold text-xs shadow-2xs">
                            {c.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 whitespace-nowrap">{c.fullName}</p>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {c.gender}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="font-semibold">{c.phone}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 max-w-[200px]">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate" title={c.email}>{c.email}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 max-w-[250px]">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate" title={c.address}>
                            {c.address} {c.pincode ? `(${c.pincode})` : ""}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 shrink-0 whitespace-nowrap border border-slate-200/60 shadow-2xs">
                          <ShoppingBag size={13} className="text-[#8D0606] shrink-0" />
                          <span>{c.totalOrders} order(s)</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-extrabold text-sm text-[#8D0606] whitespace-nowrap">
                          ₹{c.totalSpent.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span className="font-medium">{formattedDate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!paginatedCustomers.length && (
              <div className="flex flex-col items-center justify-center p-14 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-[#8D0606] mb-3">
                  <Users size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No customers found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  {searchQuery ? "No customer matches your search query." : "No customer records available yet."}
                </p>
              </div>
            )}
          </div>
        )}

        {filteredCustomers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 8, 15, 25]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

// Export alias for backwards compatibility
export { CustomerListPage as OrderCustomerTable };
