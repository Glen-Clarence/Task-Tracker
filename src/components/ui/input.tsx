import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-black/40 bg-[#1a1c23] px-3 py-2 text-base text-gray-100 ring-offset-[#1a1c23] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-100 placeholder:text-gray-400 shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
