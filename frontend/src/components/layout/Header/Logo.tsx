"use client";

import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1 cursor-pointer select-none">
      <span className="text-xl md:text-2xl font-bold text-green-600">Juice</span>
      <span className="text-xl md:text-2xl font-bold text-slate-800">Qu</span>
      <span className="text-[10px] font-medium text-slate-400 -mt-3 ml-0.5">™</span>
    </Link>
  );
}
