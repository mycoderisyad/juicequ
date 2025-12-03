import { LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  labelKey: "nav.home" | "nav.menu" | "nav.aiChat" | "nav.about";
  icon: LucideIcon;
  special?: boolean;
}

export interface UserData {
  full_name: string;
  email: string;
  role?: string;
}
