"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Youtube, Heart } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/juicequ", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/juicequ", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/juicequ", label: "Twitter" },
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
      { label: t("footer.menu.healthySnacks"), href: "/menu?category=snacks" },
    ],
    company: [
      { label: t("footer.company.aboutUs"), href: "/about" },
      { label: t("footer.company.careers"), href: "/careers" },
      { label: t("footer.company.franchise"), href: "/franchise" },
      { label: t("footer.company.blog"), href: "/blog" },
      { label: t("footer.company.pressKit"), href: "/press" },
    ],
    support: [
      { label: t("footer.support.helpCenter"), href: "/help" },
      { label: t("footer.support.contactUs"), href: "/contact" },
      { label: t("footer.support.faq"), href: "/faq" },
      { label: t("footer.support.deliveryInfo"), href: "/delivery" },
      { label: t("footer.support.trackOrder"), href: "/track" },
    ],
    legal: [
      { label: t("footer.legal.privacyPolicy"), href: "/privacy" },
      { label: t("footer.legal.termsOfService"), href: "/terms" },
      { label: t("footer.legal.cookiePolicy"), href: "/cookies" },
      { label: t("footer.legal.refundPolicy"), href: "/refund" },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-4">
              <span>JuiceQu</span>
              <span className="text-xs align-top text-gray-500">TM</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              {t("footer.description")}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Jl. Sudirman No. 123, Jakarta Pusat, Indonesia</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-500" />
                <a href="tel:+6281234567890" className="hover:text-white">+62 812 3456 7890</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-green-500" />
                <a href="mailto:hello@juicequ.com" className="hover:text-white">hello@juicequ.com</a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-gray-800 rounded-full text-gray-400 hover:bg-green-600 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.menuTitle")}</h3>
            <ul className="space-y-2.5">
              {footerLinks.menu.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm hover:text-green-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.companyTitle")}</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm hover:text-green-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.supportTitle")}</h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm hover:text-green-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.legalTitle")}</h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-sm hover:text-green-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-3">{t("footer.paymentMethods")}</p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1.5 bg-gray-800 rounded text-xs font-medium text-gray-400"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">{t("footer.secureEncrypted")}</p>
              <p className="text-xs text-gray-600">{t("footer.sslSecurity")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>{t("footer.copyright")}</p>
            <p className="flex items-center gap-1">
              {t("footer.madeWith")} <Heart className="h-4 w-4 text-red-500 fill-red-500" /> {t("footer.inIndonesia")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
