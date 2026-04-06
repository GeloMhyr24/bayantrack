import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

export function Reveal({ children, className }: RevealProps) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export default Reveal;
