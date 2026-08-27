import { canView, canCreate } from "../../utils/permissions";

const QUICK_LINKS = [
  { label: "Dashboard",         path: "/kitchen/dashboard", module: "dashboard", action: "VIEW" },
  { label: "Order List",        path: "/kitchen/orders",    module: "order",     action: "VIEW" },
  { label: "Food Menu",         path: "/kitchen/menu",      module: "menu",      action: "VIEW" },
  { label: "Add Menu",          path: "/kitchen/add-menu",  module: "menu",      action: "CREATE" },
  { label: "Customer List",     path: "/kitchen/customers", module: "customer",  action: "VIEW" },
  { label: "Customer Review",   path: "/kitchen/reviews",   module: "reviews",   action: "VIEW" },
  { label: "Add / Edit Kitchen", path: "/kitchen/branches", module: "branch",    action: "VIEW" },
];

export function QuickMenu({ onClose, apiState }) {
  const navigate = useNavigate();
  const kitchen = apiState?.kitchen;

  const allowedLinks = QUICK_LINKS.filter((link) => {
    if (link.action === "CREATE") {
      return canCreate(kitchen, link.module);
    }
    return canView(kitchen, link.module);
  });

  return (
    <div className="absolute left-[330px] top-24 z-40 w-[280px] rounded-xl bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <div className="mb-2 flex items-center justify-between px-2">
        <b>Quick Menu</b>
        <button onClick={onClose} type="button"><X size={18} /></button>
      </div>
      {allowedLinks.map((link) => (
        <button
          key={link.path}
          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left font-semibold hover:bg-[#fff1f1] hover:text-[#8D0606]"
          onClick={() => { navigate(link.path); onClose(); }}
          type="button"
        >
          {link.label}<ChevronRight size={16} />
        </button>
      ))}
    </div>
  );
}
