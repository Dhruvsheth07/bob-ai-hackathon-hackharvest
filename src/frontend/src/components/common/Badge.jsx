import React from 'react';
import { cn } from '../../utils/cn';

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-transparent bg-primary text-on-primary",
    secondary: "border-transparent bg-secondary-container text-on-secondary-container",
    destructive: "border-transparent bg-error-container text-on-error-container",
    outline: "text-on-surface border-outline",
    success: "border-transparent bg-[#163b27] text-[#4ade80]", // Custom for status
    warning: "border-transparent bg-[#422006] text-[#facc15]" // Custom for status
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
