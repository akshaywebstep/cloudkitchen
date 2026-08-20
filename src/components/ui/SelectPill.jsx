import React from "react";
import { AppSelect } from "./AppSelect";

export function SelectPill({ value = "Monthly", onChange, options = ["Monthly", "Weekly", "Today"] }) {
  const formattedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  return (
    <div className="w-32">
      <AppSelect
        variant="filter"
        value={value}
        onChange={onChange}
        options={formattedOptions}
      />
    </div>
  );
}
