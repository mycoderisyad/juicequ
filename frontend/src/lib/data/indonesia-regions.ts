const API_BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

export interface Province {
  id: string;
  name: string;
}

export interface Regency {
  id: string;
  province_id: string;
  name: string;
}

export interface District {
  id: string;
  regency_id: string;
  name: string;
}

export interface Village {
  id: string;
  district_id: string;
  name: string;
}

export interface PostalCode {
  code: string;
  village: string;
  district: string;
  city: string;
  province: string;
}

const cache: {
  provinces: Province[] | null;
  regencies: Record<string, Regency[]>;
  districts: Record<string, District[]>;
  villages: Record<string, Village[]>;
} = {
  provinces: null,
  regencies: {},
  districts: {},
  villages: {},
};

export async function fetchProvinces(): Promise<Province[]> {
  if (cache.provinces) return cache.provinces;
  
  try {
    const response = await fetch(`${API_BASE_URL}/provinces.json`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data: Province[] = await response.json();
    cache.provinces = data;
    return data;
  } catch {
    return [];
  }
}

export async function fetchRegencies(provinceId: string): Promise<Regency[]> {
  if (cache.regencies[provinceId]) return cache.regencies[provinceId];
  
  try {
    const response = await fetch(`${API_BASE_URL}/regencies/${provinceId}.json`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data: Regency[] = await response.json();
    cache.regencies[provinceId] = data;
    return data;
  } catch {
    return [];
  }
}

export async function fetchDistricts(regencyId: string): Promise<District[]> {
  if (cache.districts[regencyId]) return cache.districts[regencyId];
  
  try {
    const response = await fetch(`${API_BASE_URL}/districts/${regencyId}.json`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data: District[] = await response.json();
    cache.districts[regencyId] = data;
    return data;
  } catch {
    return [];
  }
}

export async function fetchVillages(districtId: string): Promise<Village[]> {
  if (cache.villages[districtId]) return cache.villages[districtId];
  
  try {
    const response = await fetch(`${API_BASE_URL}/villages/${districtId}.json`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data: Village[] = await response.json();
    cache.villages[districtId] = data;
    return data;
  } catch {
    return [];
  }
}

export async function fetchPostalCodes(
  province: string,
  city: string,
  district: string,
  village?: string
): Promise<PostalCode[]> {
  try {
    const parts = [village, district, city, province, "Indonesia"].filter(Boolean);
    const query = parts.join(", ");
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
      { headers: { "User-Agent": "JuiceQu-Store-App/1.0" } }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const postalCodes: PostalCode[] = [];
    
    for (const item of data) {
      if (item.address?.postcode) {
        postalCodes.push({
          code: item.address.postcode,
          village: item.address.village || item.address.suburb || village || "",
          district: item.address.county || district,
          city: item.address.city || item.address.town || city,
          province: item.address.state || province
        });
      }
    }
    
    return postalCodes.filter((pc, index, self) => 
      index === self.findIndex(t => t.code === pc.code)
    );
  } catch {
    return [];
  }
}

export async function geocodeLocation(
  province: string,
  city: string,
  district?: string,
  village?: string
): Promise<{ lat: number; lng: number } | null> {
  const cleanName = (name: string) => {
    const cleaned = name
      .replace(/^(KABUPATEN|KAB\.|KOTA|KECAMATAN|KEC\.|KELURAHAN|KEL\.|DESA)\s*/i, "")
      .trim();
    return cleaned
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const cleanProvince = cleanName(province);
  const cleanCity = cleanName(city);
  const cleanDistrict = district ? cleanName(district) : "";
  const cleanVillage = village ? cleanName(village) : "";

  const queries = [
    cleanVillage && cleanDistrict ? `${cleanVillage}, ${cleanDistrict}, ${cleanCity}, ${cleanProvince}, Indonesia` : null,
    cleanDistrict ? `${cleanDistrict}, ${cleanCity}, ${cleanProvince}, Indonesia` : null,
    `${cleanCity}, ${cleanProvince}, Indonesia`,
    `${cleanCity}, Indonesia`,
    cleanDistrict ? `Kecamatan ${cleanDistrict}, ${cleanCity}, Indonesia` : null,
    `${cleanProvince}, Indonesia`,
  ].filter(Boolean) as string[];

  for (const query of queries) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=id`,
        {
          headers: {
            "User-Agent": "JuiceQu-Store-App/1.0",
            "Accept-Language": "id"
          }
        }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
          return { lat, lng };
        }
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ display_name: string; address: Record<string, string> } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "JuiceQu-Store-App/1.0" } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      display_name: data.display_name,
      address: data.address || {}
    };
  } catch {
    return null;
  }
}

export function clearCache(): void {
  cache.provinces = null;
  cache.regencies = {};
  cache.districts = {};
  cache.villages = {};
}
