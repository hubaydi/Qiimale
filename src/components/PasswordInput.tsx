"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={visible ? "text" : "password"}
        className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-10 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${props.className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
});
