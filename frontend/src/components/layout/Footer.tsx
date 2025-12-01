import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <span>JuiceQu</span>
            <span className="text-xs align-top text-gray-500">TM</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact Support</Link>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 JuiceQu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
