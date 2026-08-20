import React from "react";
import Select from "react-select";

export const selectStyles = ({ variant = "filter", error = false, minWidth } = {}) => ({
  control: (base, state) => ({
    ...base,
    minHeight: variant === "filter" ? "34px" : "44px",
    height: variant === "filter" ? "34px" : "44px",
    minWidth: minWidth || (variant === "filter" ? "130px" : "100%"),
    backgroundColor: variant === "filter" ? "#f8fafc" : "#ffffff",
    borderColor: error
      ? "#f43f5e"
      : state.isFocused
      ? "#8D0606"
      : variant === "filter"
      ? "#e2e8f0"
      : "#cbd5e1",
    borderRadius: variant === "filter" ? "0.75rem" : "0.85rem",
    boxShadow: state.isFocused
      ? error
        ? "0 0 0 2px rgba(244, 63, 94, 0.15)"
        : "0 0 0 2px rgba(141, 6, 6, 0.12)"
      : "none",
    "&:hover": {
      borderColor: error ? "#f43f5e" : state.isFocused ? "#8D0606" : "#94a3b8",
    },
    cursor: "pointer",
    paddingLeft: variant === "filter" ? "2px" : "6px",
    fontSize: variant === "filter" ? "11.5px" : "12.5px",
    fontWeight: "700",
    transition: "all 0.15s ease",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 6px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1e293b",
    fontWeight: "700",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#94a3b8",
    fontWeight: "500",
    fontSize: "12px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "6px",
    zIndex: 99999,
    overflow: "hidden",
    marginTop: "6px",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),
  menuList: (base) => ({
    ...base,
    padding: "2px",
    maxHeight: "220px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#8D0606"
      : state.isFocused
      ? "#fff1f1"
      : "transparent",
    color: state.isSelected ? "#ffffff" : state.isFocused ? "#8D0606" : "#334155",
    borderRadius: "0.6rem",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: state.isSelected ? "700" : "600",
    cursor: "pointer",
    transition: "all 0.12s ease",
    "&:active": {
      backgroundColor: state.isSelected ? "#8D0606" : "#fee2e2",
    },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#8D0606" : "#94a3b8",
    padding: "4px 6px",
    transition: "transform 0.2s ease, color 0.15s ease",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "none",
    "&:hover": {
      color: "#8D0606",
    },
  }),
});

export function AppSelect({
  options = [],
  value,
  onChange,
  variant = "filter",
  error = false,
  placeholder = "Select...",
  isSearchable = false,
  minWidth,
  className = "",
  formatOptionLabel,
  ...props
}) {
  const currentOption = options.find((opt) => String(opt.value) === String(value)) || (value && typeof value === "object" ? value : null);

  const handleChange = (selected) => {
    onChange?.(selected?.value !== undefined ? selected.value : selected);
  };

  return (
    <div className={className}>
      <Select
        options={options}
        value={currentOption}
        onChange={handleChange}
        isSearchable={isSearchable}
        placeholder={placeholder}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        styles={selectStyles({ variant, error, minWidth })}
        formatOptionLabel={formatOptionLabel}
        {...props}
      />
    </div>
  );
}

export default AppSelect;