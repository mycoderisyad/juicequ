"use client";

import { useState, useEffect, useRef } from "react";
import { Store, MapPin, Globe, Loader2, Navigation, Search } from "lucide-react";
import { 
  fetchProvinces, 
  fetchRegencies, 
  fetchDistricts,
  fetchVillages,
  fetchPostalCodes,
  geocodeLocation,
  Province, 
  Regency,
  District,
  Village,
  PostalCode
} from "@/lib/data/indonesia-regions";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";
import type { StoreSettings } from "./types";
import { SaveButton, InputField, NumberField, TextAreaField, SelectField, CURRENCIES } from "./shared";

interface StoreSettingsPanelProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function StoreSettingsPanel({ settings, onChange, onSave, isSaving }: StoreSettingsPanelProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [postalCodes, setPostalCodes] = useState<PostalCode[]>([]);
  
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  useEffect(() => {
    fetchProvinces().then((data) => {
      setProvinces(data);
      setIsLoadingProvinces(false);
      if (settings.store_province) {
        const existingProvince = data.find(p => p.name === settings.store_province);
        if (existingProvince) setSelectedProvinceId(existingProvince.id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      setIsLoadingRegencies(true);
      fetchRegencies(selectedProvinceId).then((data) => {
        setRegencies(data);
        setIsLoadingRegencies(false);
        if (settings.store_city) {
          const existingRegency = data.find(r => r.name === settings.store_city);
          if (existingRegency) setSelectedRegencyId(existingRegency.id);
        }
      });
    } else {
      setRegencies([]);
      setSelectedRegencyId("");
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedRegencyId) {
      setIsLoadingDistricts(true);
      fetchDistricts(selectedRegencyId).then((data) => {
        setDistricts(data);
        setIsLoadingDistricts(false);
        if (settings.store_district) {
          const existingDistrict = data.find(d => d.name === settings.store_district);
          if (existingDistrict) setSelectedDistrictId(existingDistrict.id);
        }
      });
    } else {
      setDistricts([]);
      setSelectedDistrictId("");
    }
  }, [selectedRegencyId]);

  useEffect(() => {
    if (selectedDistrictId) {
      setIsLoadingVillages(true);
      fetchVillages(selectedDistrictId).then((data) => {
        setVillages(data);
        setIsLoadingVillages(false);
      });
    } else {
      setVillages([]);
    }
  }, [selectedDistrictId]);

  useEffect(() => {
    if (settings.store_province && settings.store_city && settings.store_district) {
      setIsLoadingPostalCodes(true);
      fetchPostalCodes(
        settings.store_province,
        settings.store_city,
        settings.store_district,
        settings.store_village
      ).then((data) => {
        setPostalCodes(data);
        setIsLoadingPostalCodes(false);
        if (data.length > 0 && !settings.store_postal_code) {
          update("store_postal_code", data[0].code);
        }
      });
    } else {
      setPostalCodes([]);
    }
  }, [settings.store_province, settings.store_city, settings.store_district, settings.store_village]);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = async () => {
      if (typeof window === "undefined" || !mapContainerRef.current || mapInstanceRef.current) {
        return;
      }
      
      if ((mapContainerRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) {
        return;
      }

      const L = await import("leaflet");
      
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const lat = settings.store_latitude || -6.2088;
      const lng = settings.store_longitude || 106.8456;
      
      const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        update("store_latitude", Math.round(pos.lat * 1000000) / 1000000);
        update("store_longitude", Math.round(pos.lng * 1000000) / 1000000);
      });

      map.on("click", (e: LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        update("store_latitude", Math.round(e.latlng.lat * 1000000) / 1000000);
        update("store_longitude", Math.round(e.latlng.lng * 1000000) / 1000000);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const lat = settings.store_latitude;
      const lng = settings.store_longitude;
      if (lat && lng && (lat !== 0 || lng !== 0)) {
        const newLatLng: [number, number] = [lat, lng];
        markerRef.current.setLatLng(newLatLng);
        mapInstanceRef.current.setView(newLatLng, 15);
      }
    }
  }, [settings.store_latitude, settings.store_longitude]);

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    const province = provinces.find(p => p.id === provinceId);
    update("store_province", province?.name || "");
    update("store_city", "");
    update("store_district", "");
    update("store_village", "");
    update("store_postal_code", "");
    setSelectedRegencyId("");
    setSelectedDistrictId("");
  };

  const handleRegencyChange = (regencyId: string) => {
    setSelectedRegencyId(regencyId);
    const regency = regencies.find(r => r.id === regencyId);
    update("store_city", regency?.name || "");
    update("store_district", "");
    update("store_village", "");
    update("store_postal_code", "");
    setSelectedDistrictId("");
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const district = districts.find(d => d.id === districtId);
    update("store_district", district?.name || "");
    update("store_village", "");
    update("store_postal_code", "");
  };

  const handleVillageChange = (villageName: string) => {
    update("store_village", villageName);
  };

  const handleFindLocation = async () => {
    if (!settings.store_province || !settings.store_city) {
      setGeocodingError("Pilih provinsi dan kota terlebih dahulu");
      return;
    }
    
    setIsGeocodingLocation(true);
    setGeocodingError(null);
    
    const coords = await geocodeLocation(
      settings.store_province,
      settings.store_city,
      settings.store_district,
      settings.store_village
    );
    
    if (coords) {
      update("store_latitude", coords.lat);
      update("store_longitude", coords.lng);
    } else {
      setGeocodingError("Lokasi tidak ditemukan. Klik pada peta untuk menentukan posisi manual.");
    }
    
    setIsGeocodingLocation(false);
  };

  const handleCurrencyChange = (code: string) => {
    const currency = CURRENCIES.find(c => c.code === code);
    if (currency) {
      onChange({
        ...settings,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
        currency_locale: currency.locale,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Store className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Informasi Toko</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Nama Toko" value={settings.store_name || ""} onChange={(v) => update("store_name", v)} placeholder="JuiceQu" />
          <InputField label="Tagline" value={settings.store_tagline || ""} onChange={(v) => update("store_tagline", v)} placeholder="Fresh & Healthy Juices" />
          <InputField label="Email" type="email" value={settings.store_email || ""} onChange={(v) => update("store_email", v)} placeholder="hello@juicequ.com" />
          <InputField label="Telepon" type="tel" value={settings.store_phone || ""} onChange={(v) => update("store_phone", v)} placeholder="+62 21 1234 5678" />
          <div className="sm:col-span-2">
            <TextAreaField label="Deskripsi" value={settings.store_description || ""} onChange={(v) => update("store_description", v)} placeholder="Deskripsi toko Anda..." rows={3} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Lokasi</h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Provinsi</label>
              <select
                value={selectedProvinceId}
                onChange={(e) => handleProvinceChange(e.target.value)}
                disabled={isLoadingProvinces}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">{isLoadingProvinces ? "Memuat..." : "-- Pilih Provinsi --"}</option>
                {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kota/Kabupaten</label>
              <select
                value={selectedRegencyId}
                onChange={(e) => handleRegencyChange(e.target.value)}
                disabled={!selectedProvinceId || isLoadingRegencies}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">{isLoadingRegencies ? "Memuat..." : !selectedProvinceId ? "Pilih provinsi dulu" : "-- Pilih Kota --"}</option>
                {regencies.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kecamatan</label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedRegencyId || isLoadingDistricts}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">{isLoadingDistricts ? "Memuat..." : !selectedRegencyId ? "Pilih kota dulu" : "-- Pilih Kecamatan --"}</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kelurahan/Desa</label>
              <select
                value={settings.store_village || ""}
                onChange={(e) => handleVillageChange(e.target.value)}
                disabled={!selectedDistrictId || isLoadingVillages}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">{isLoadingVillages ? "Memuat..." : !selectedDistrictId ? "Pilih kecamatan dulu" : "-- Pilih Kelurahan --"}</option>
                {villages.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <TextAreaField label="Alamat Lengkap (Jalan, No, RT/RW)" value={settings.store_address || ""} onChange={(v) => update("store_address", v)} placeholder="Jl. Sudirman No. 123, RT 01/RW 02" rows={2} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kode Pos {isLoadingPostalCodes && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
              </label>
              {postalCodes.length > 0 ? (
                <select
                  value={settings.store_postal_code || ""}
                  onChange={(e) => update("store_postal_code", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">-- Pilih Kode Pos --</option>
                  {postalCodes.map((pc, idx) => <option key={idx} value={pc.code}>{pc.code} {pc.village ? `- ${pc.village}` : ""}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={settings.store_postal_code || ""}
                  onChange={(e) => update("store_postal_code", e.target.value)}
                  placeholder={isLoadingPostalCodes ? "Mencari..." : "Masukkan kode pos"}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              )}
              {!isLoadingPostalCodes && postalCodes.length === 0 && settings.store_district && (
                <p className="mt-1 text-xs text-gray-500">Kode pos tidak ditemukan. Silakan masukkan manual.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Koordinat GPS</h3>
                <button
                  onClick={handleFindLocation}
                  disabled={isGeocodingLocation || !settings.store_city}
                  className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {isGeocodingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  Cari Otomatis
                </button>
              </div>
              
              {geocodingError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{geocodingError}</p>
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField label="Latitude" value={settings.store_latitude || 0} onChange={(v) => update("store_latitude", v)} step={0.000001} placeholder="-6.2088" />
                <NumberField label="Longitude" value={settings.store_longitude || 0} onChange={(v) => update("store_longitude", v)} step={0.000001} placeholder="106.8456" />
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700">
                  <Navigation className="inline h-3 w-3 mr-1" />
                  <strong>Cara menggunakan:</strong>
                </p>
                <ol className="text-xs text-blue-600 mt-1 space-y-1 list-decimal list-inside">
                  <li>Isi data wilayah di atas, lalu klik &quot;Cari Otomatis&quot;</li>
                  <li>Peta akan bergerak ke lokasi perkiraan</li>
                  <li>Klik pada peta atau drag marker untuk posisi tepat</li>
                </ol>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div ref={mapContainerRef} className="h-[300px] w-full" style={{ minHeight: "300px" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Mata Uang & Regional</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Mata Uang" value={settings.currency_code || "IDR"} onChange={handleCurrencyChange} options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))} />
          <InputField label="Simbol" value={settings.currency_symbol || "Rp"} onChange={(v) => update("currency_symbol", v)} placeholder="Rp" />
          <InputField label="Locale" value={settings.currency_locale || "id-ID"} onChange={(v) => update("currency_locale", v)} placeholder="id-ID" />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            Preview: <span className="font-semibold">
              {new Intl.NumberFormat(settings.currency_locale || "id-ID", { style: "currency", currency: settings.currency_code || "IDR" }).format(150000)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Simpan Informasi Toko" />
      </div>
    </div>
  );
}
