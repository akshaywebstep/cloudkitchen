import React from "react";

export function IconGraphic({ icon: Icon, size = 20, className = "", alt = "" }) {
  if (typeof Icon === "string") {
    return <img src={Icon} alt={alt} width={size} height={size} className={className} />;
  }

  return <Icon size={size} className={className} />;
}
