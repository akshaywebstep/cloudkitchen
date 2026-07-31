import React from "react";
import {
  User,
  X,
  Building2,
  Plus,
  Pencil,
  Server,
  KeyRound,
  Database,
  LogOut,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBranchLabel, resolveSelectedBranchId } from "../../utils/helpers";

export function ProfilePanel({ apiState, onBranchChange, onClose, onLogout, onReset, onBackend }) {
  const navigate = useNavigate();
  const branches = apiState?.branches || [];
  const selectedBranchId = resolveSelectedBranchId(branches, apiState?.selectedBranchId);

  const openAddBranch = () => {
    onClose?.();
    navigate("/kitchen");
  };

  const selectBranch = (branchId) => {
    onBranchChange?.(branchId);
    onClose?.();
  };

  return (
    <div className="absolute right-6 top-16 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95">
      {/* Header User Info */}
      <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] text-white shadow-xs">
            <User size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {apiState?.kitchen?.kitchenName || "Admin Profile"}
            </h3>
            <p className="text-xs font-medium text-slate-400 truncate max-w-[180px]">
              {apiState?.kitchen?.email || "admin@cloudkitchen.test"}
            </p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                apiState?.token
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <CheckCircle2 size={11} />
              <span>{apiState?.token ? "Logged In" : "Demo Session"}</span>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X size={15} />
        </button>
      </div>

      {/* Branch Selector Box */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Building2 size={14} className="text-[#8D0606]" />
            <span>Kitchen Branches</span>
          </span>
          <button
            className="flex items-center gap-1 text-[11px] font-semibold text-[#8D0606] hover:underline"
            onClick={openAddBranch}
            type="button"
          >
            <Plus size={13} />
            <span>Add Branch</span>
          </button>
        </div>

        {branches.length ? (
          <div className="max-h-[160px] space-y-1 overflow-y-auto pr-1">
            {branches.map((branch, index) => {
              const active = String(branch.id) === String(selectedBranchId);
              return (
                <button
                  key={branch.id}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                    active
                      ? "bg-[#8D0606] text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                  }`}
                  onClick={() => selectBranch(branch.id)}
                  type="button"
                >
                  <div>
                    <span className="block text-xs font-semibold truncate">{getBranchLabel(branch)}</span>
                    <span className={`block text-[10px] ${active ? "text-white/80" : "text-slate-400"}`}>
                      {index === 0 ? "Default branch" : `ID: ${branch.id}`}
                    </span>
                  </div>
                  {active ? <CheckCircle2 size={14} /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <button
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#8D0606] px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#770505]"
            onClick={openAddBranch}
            type="button"
          >
            <Plus size={14} /> Add First Kitchen Branch
          </button>
        )}
      </div>

      {/* Menu Actions */}
      <div className="space-y-1">
        <MenuButton
          icon={Pencil}
          label="Edit Kitchen Profile"
          onClick={openAddBranch}
        />
        <MenuButton
          icon={Server}
          label="Backend Connection"
          onClick={onBackend}
        />
        <MenuButton
          icon={KeyRound}
          label="Reset Password"
          onClick={onReset}
        />
        <MenuButton
          icon={Database}
          label="Account Data & Tables"
          onClick={() => {
            onClose?.();
            navigate("/table");
          }}
        />

        <button
          className="flex w-full items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 mt-2"
          onClick={onLogout}
          type="button"
        >
          <LogOut size={16} />
          <span>Logout Account</span>
        </button>
      </div>
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100"
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-2.5">
        <Icon size={16} className="text-slate-400" />
        <span>{label}</span>
      </span>
      <ChevronRight size={14} className="text-slate-400" />
    </button>
  );
}
