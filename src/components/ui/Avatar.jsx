import React from "react";
import { UserRound } from "lucide-react";

export function Avatar() {
  return <div className="grid size-[88px] place-items-center rounded-full bg-[#2c7888] text-white"><UserRound size={58} fill="currentColor" /></div>;
}
