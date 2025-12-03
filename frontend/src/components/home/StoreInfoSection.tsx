/**
 * Store Info Section Component.
 * Displays store location, hours, and map on homepage.
 */
"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, Phone, Mail, ExternalLink } from "lucide-react";
import storeApi, { type StoreInfo, type StoreLocation, type StoreHours } from "@/lib/api/store";

interface StoreInfoSectionProps {
  className?: string;
}

export function StoreInfoSection({ className = "" }: StoreInfoSectionProps) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [location, setLocation] = useState<StoreLocation | null>(null);
  const [hours, setHours] = useState<StoreHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const [infoData, locationData, hoursData] = await Promise.all([
          storeApi.getInfo(),
          storeApi.getLocation(),
          storeApi.getHours(),
        ]);
        setStoreInfo(infoData);
        setLocation(locationData);
        setHours(hoursData);
      } catch (err) {
        console.error("Failed to fetch store info:", err);
        setError("Gagal memuat informasi toko");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  const getGoogleMapsUrl = () => {
    if (!location) return "#";
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  };

  // Google Maps embed requires API key - using OpenStreetMap instead

  const getOpenStreetMapEmbedUrl = () => {
    if (!location) return "";
    const bbox = `${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude},${location.longitude}`;
  };

  if (loading) {
    return (
      <section className={`py-16 bg-gray-50 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-8 mx-auto" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-200 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !storeInfo || !location) {
    return null; // Silently fail - don't break the page
  }

  return (
    <section className={`py-10 sm:py-12 lg:py-16 bg-gray-50 ${className}`} id="location">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Kunjungi Kami
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            Temukan {storeInfo.store_name} dan nikmati jus segar langsung di lokasi kami
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Map */}
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg bg-white">
            <div className="aspect-4/3 w-full">
              <iframe
                src={getOpenStreetMapEmbedUrl()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Lokasi ${storeInfo.store_name}`}
                className="w-full h-full"
              />
            </div>
            <a
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Buka di </span>Google Maps
            </a>
          </div>

          {/* Info Cards */}
          <div className="space-y-4 sm:space-y-6">
            {/* Address Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">Alamat</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{location.full_address}</p>
                </div>
              </div>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">Jam Operasional</h3>
                    {hours && (
                      <span
                        className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                          hours.is_currently_open
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {hours.is_currently_open ? "Buka" : "Tutup"}
                      </span>
                    )}
                  </div>
                  {hours && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatTime(hours.opening_time)} - {formatTime(hours.closing_time)}
                    </p>
                  )}
                  {hours && hours.days_open && (
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      {hours.days_open.length === 7
                        ? "Buka setiap hari"
                        : `Buka: ${hours.days_open.join(", ")}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Hubungi Kami</h3>
              <div className="space-y-2 sm:space-y-3">
                <a
                  href={`tel:${storeInfo.store_phone}`}
                  className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{storeInfo.store_phone}</span>
                </a>
                <a
                  href={`mailto:${storeInfo.store_email}`}
                  className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors break-all"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">{storeInfo.store_email}</span>
                </a>
              </div>
            </div>

            {/* Social Links */}
            {(storeInfo.social_instagram || storeInfo.social_facebook || storeInfo.social_whatsapp) && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Ikuti Kami</h3>
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {storeInfo.social_instagram && (
                    <a
                      href={storeInfo.social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                      aria-label="Instagram"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {storeInfo.social_facebook && (
                    <a
                      href={storeInfo.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                      aria-label="Facebook"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {storeInfo.social_whatsapp && (
                    <a
                      href={`https://wa.me/${storeInfo.social_whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                      aria-label="WhatsApp"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                  {storeInfo.social_twitter && (
                    <a
                      href={storeInfo.social_twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-black rounded-lg sm:rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                      aria-label="Twitter/X"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StoreInfoSection;
