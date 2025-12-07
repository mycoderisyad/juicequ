"use client";

import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center cursor-pointer select-none">
      <Image
        src="/images/logo.png"
        alt="JuiceQu Logo"
        width={120}
        height={40}
        priority
      />
    </Link>
  );
}
