"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, Heart } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/juicequ", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/juicequ", label: "Facebook" },
  { icon: Youtube, href: "https://youtube.com/juicequ", label: "Youtube" },
];

const paymentMethods = ["VISA", "Mastercard", "BCA", "Mandiri", "GoPay", "OVO", "DANA"];

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    menu: [
      { label: t("footer.menu.allProducts"), href: "/menu" },
      { label: t("footer.menu.smoothies"), href: "/menu?category=smoothies" },
      { label: t("footer.menu.freshJuices"), href: "/menu?category=juices" },
      { label: t("footer.menu.acaiBowls"), href: "/menu?category=bowls" },
    ],
    company: [
      { label: t("footer.company.aboutUs"), href: "/about" },
      { label: t("footer.company.careers"), href: "/#" },
      { label: t("footer.company.franchise"), href: "/#" },
      { label: t("footer.company.blog"), href: "/#" },
      { label: t("footer.company.pressKit"), href: "/#" },
    ],
    support: [
      { label: t("footer.support.helpCenter"), href: "/#" },
      { label: t("footer.support.contactUs"), href: "/#" },
      { label: t("footer.support.faq"), href: "/#" },
      { label: t("footer.support.deliveryInfo"), href: "/#" },
      { label: t("footer.support.trackOrder"), href: "/#" },
    ],
    legal: [
      { label: t("footer.legal.privacyPolicy"), href: "/#" },
      { label: t("footer.legal.termsOfService"), href: "/#" },
      { label: t("footer.legal.cookiePolicy"), href: "/#" },
      { label: t("footer.legal.refundPolicy"), href: "/#" },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-10 sm:py-12 lg:py-16">
        <div className="grid gap-8 sm:gap-10 lg:gap-12 grid-cols-2 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4" aria-label="JuiceQu - Back to home">
              <span>JuiceQu</span>
              <span className="text-xs align-top text-gray-500" aria-hidden="true">TM</span>
            </Link>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 max-w-sm">
              {t("footer.description")}
            </p>
            
            {/* Contact Info */}
            <address className="space-y-2 sm:space-y-3 text-xs sm:text-sm not-italic">
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-green-500 shrink-0" aria-hidden="true" />
                <span>Jl. Sudirman No. 123, Jakarta Pusat, Indonesia</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" aria-hidden="true" />
                <a href="tel:+6281234567890" className="hover:text-white">+62 812 3456 7890</a>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" aria-hidden="true" />
                <a href="mailto:hello@juicequ.com" className="hover:text-white break-all">hello@juicequ.com</a>
              </div>
            </address>

            {/* Social Links */}
            <nav aria-label="Social media links" className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:p-2.5 bg-gray-800 rounded-full text-gray-400 hover:bg-green-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label={`${t("footer.followUsOn")} ${social.label}`}
                >
                  <social.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>

          {/* Menu Links */}
          <nav aria-labelledby="footer-menu-title">
            <h3 id="footer-menu-title" className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t("footer.menuTitle")}</h3>
            <ul className="space-y-1.5 sm:space-y-2.5" role="list">
              {footerLinks.menu.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-xs sm:text-sm hover:text-green-400 transition-colors focus:outline-none focus:text-green-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company Links */}
          <nav aria-labelledby="footer-company-title">
            <h3 id="footer-company-title" className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t("footer.companyTitle")}</h3>
            <ul className="space-y-1.5 sm:space-y-2.5" role="list">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-xs sm:text-sm hover:text-green-400 transition-colors focus:outline-none focus:text-green-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support Links */}
          <nav aria-labelledby="footer-support-title">
            <h3 id="footer-support-title" className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t("footer.supportTitle")}</h3>
            <ul className="space-y-1.5 sm:space-y-2.5" role="list">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-xs sm:text-sm hover:text-green-400 transition-colors focus:outline-none focus:text-green-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal Links */}
          <nav aria-labelledby="footer-legal-title">
            <h3 id="footer-legal-title" className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t("footer.legalTitle")}</h3>
            <ul className="space-y-1.5 sm:space-y-2.5" role="list">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-xs sm:text-sm hover:text-green-400 transition-colors focus:outline-none focus:text-green-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">{t("footer.paymentMethods")}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {paymentMethods.map((method, index) => (
                  <span 
                    key={index} 
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800 rounded text-[10px] sm:text-xs font-medium text-gray-400"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">{t("footer.secureEncrypted")}</p>
              <p className="text-[10px] sm:text-xs text-gray-600">{t("footer.sslSecurity")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <p className="text-center sm:text-left">{t("footer.copyright")}</p>
            <p className="flex items-center gap-1">
              {t("footer.madeWith")} {t("footer.inIndonesia")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
