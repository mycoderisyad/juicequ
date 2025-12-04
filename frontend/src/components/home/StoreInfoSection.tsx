/**
 * Store Info Section Component.
 * Displays store location, hours, and map on homepage.
 */
"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import storeApi, { type StoreInfo, type StoreLocation, type StoreHours } from "@/lib/api/store";
import { useTranslation } from "@/lib/i18n";

interface StoreInfoSectionProps {
  className?: string;
}

export function StoreInfoSection({ className = "" }: StoreInfoSectionProps) {
  const { t } = useTranslation();
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
    return `${hour}:${minute}`;
  };

  const getGoogleMapsUrl = () => {
    if (!location) return "#";
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  };

  const getGoogleMapsEmbedUrl = () => {
    if (!location) return "";
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.388920626388!2d${location.longitude}!3d${location.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInNDQuNCJTIDEwNsKwNDknMTQuMCJF!5e0!3m2!1sen!2sid`;
  };

  if (loading) {
    return (
      <section className={`relative py-16 bg-stone-50 overflow-hidden ${className}`}>
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-stone-200 rounded-full mb-4 mx-auto" />
            <div className="h-12 w-96 bg-stone-200 rounded mb-8 mx-auto" />
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 h-[500px] bg-stone-200 rounded-4xl" />
              <div className="lg:col-span-5 space-y-6">
                <div className="h-48 bg-stone-200 rounded-4xl" />
                <div className="h-48 bg-stone-200 rounded-4xl" />
                <div className="h-48 bg-stone-200 rounded-4xl" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !storeInfo || !location) {
    return null;
  }

  return (
    <section className={`relative py-12 sm:py-16 lg:py-20 bg-stone-50 overflow-hidden ${className}`} id="location">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-lime-100/40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-3">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-100 text-emerald-700 text-sm font-medium shadow-sm">
            <MapPin size={14} />
            {t("home.locations.visitUs")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-emerald-950 tracking-tight">
            {t("home.locations.title")}
          </h2>
          <p className="max-w-xl mx-auto text-stone-500 text-base sm:text-lg px-4">
            {t("home.locations.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: The Map */}
          <div className="lg:col-span-7 h-[400px] sm:h-[500px] relative group">
            {/* Map Frame */}
            <div className="absolute inset-0 bg-white rounded-2xl sm:rounded-4xl shadow-[0_20px_40px_rgba(0,0,0,0.05)] transform transition-transform duration-500 group-hover:scale-[1.01] z-10" />
            
            {/* Map Content Wrapper */}
            <div className="absolute inset-2 sm:inset-3 rounded-xl sm:rounded-3xl overflow-hidden z-20 border border-stone-100 bg-stone-100">
              <iframe 
                src={getGoogleMapsEmbedUrl()}
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(0.2) contrast(0.9) opacity(0.9)' }} 
                allowFullScreen
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title={`Lokasi ${storeInfo.store_name}`}
                className="w-full h-full"
              />
              
              {/* Custom Map Overlay Button */}
              <a 
                href={getGoogleMapsUrl()}
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto bg-white/90 backdrop-blur-md border border-white/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-3 sm:gap-4 hover:bg-emerald-600 hover:text-white transition-all group/btn cursor-pointer"
              >
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg sm:rounded-xl group-hover/btn:bg-white/20 group-hover/btn:text-white transition-colors">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-600 group-hover/btn:text-white/70">Navigasi</p>
                  <p className="font-bold text-xs sm:text-sm text-gray-900 group-hover/btn:text-white">{t("home.locations.openInGoogleMaps")}</p>
                </div>
                <ArrowUpRight size={18} className="ml-auto opacity-50 group-hover/btn:opacity-100" />
              </a>
            </div>
          </div>

          {/* Right Column: Information Cards */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
            {/* Address Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-4xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-stone-100 hover:border-emerald-100 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 sm:mb-6">
                <MapPin size={22} />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-emerald-950 mb-2">{storeInfo.store_name}</h3>
              <p className="text-stone-500 leading-relaxed mb-4 text-sm sm:text-base">
                {location.full_address}
              </p>
              <div className="h-1 w-12 bg-emerald-100 rounded-full" />
            </div>

            {/* Opening Hours Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-4xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-stone-100 hover:border-emerald-100 transition-colors relative overflow-hidden">
              {/* Status Indicator */}
              {hours && (
                <div className={`absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                  hours.is_currently_open 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${
                    hours.is_currently_open ? "bg-green-500" : "bg-red-500"
                  }`} />
                  {hours.is_currently_open ? t("home.locations.open") : t("home.locations.closed")}
                </div>
              )}

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 sm:mb-6">
                <Clock size={22} />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-emerald-950 mb-4">{t("home.locations.openHours")}</h3>
              
              {hours && (
                <ul className="space-y-2 text-stone-500 text-sm sm:text-base">
                  <li className="flex justify-between items-center border-b border-stone-50 pb-2">
                    <span>{t("home.locations.weekdays")}</span>
                    <span className="font-medium text-emerald-800">
                      {formatTime(hours.opening_time)} - {formatTime(hours.closing_time)}
                    </span>
                  </li>
                  <li className="flex justify-between items-center pt-1">
                    <span>{t("home.locations.weekend")}</span>
                    <span className="font-medium text-emerald-800">
                      {formatTime(hours.opening_time)} - {formatTime(hours.closing_time)}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StoreInfoSection;
