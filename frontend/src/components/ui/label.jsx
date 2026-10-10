import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Label = forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none mb-1.5 block", className)} {...props} />
));
Label.displayName = "Label";

export { Label };
