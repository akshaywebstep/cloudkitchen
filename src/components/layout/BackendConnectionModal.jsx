import React from "react";
import { X, Server, Database } from "lucide-react";
import { ApiConnectionPanel } from "./ApiConnectionPanel";
import { KitchenApiActions } from "./KitchenApiActions";

export function BackendConnectionModal({ apiState, onLogin, refreshKitchenData, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="ml-auto flex h-full w-full max-w-[480px] flex-col bg-slate-50 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#8D0606] border border-rose-100">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Backend Connection</h2>
              <p className="text-xs font-normal text-slate-400">Manage REST API server connection & credentials</p>
            </div>
          </div>
          <button
            className="grid size-8 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <ApiConnectionPanel apiState={apiState} onLogin={onLogin} compact />
          <KitchenApiActions apiState={apiState} refreshKitchenData={refreshKitchenData} compact />
        </div>
      </div>
    </div>
  );
}
