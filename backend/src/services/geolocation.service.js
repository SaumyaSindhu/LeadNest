import axios from "axios";
import { isIP } from "node:net";

async function lookupWithIpApi(ip) {
  const response = await axios.get(
    `http://ip-api.com/json/${encodeURIComponent(ip)}`,
    {
      params: {
        fields: "status,message,country,city",
      },
      timeout: 3000,
    },
  );

  const result = response.data;

  if (result.status !== "success") {
    throw new Error(result.message || "ip-api lookup failed");
  }

  return {
    country: result.country || null,
    city: result.city || null,
  };
}

async function lookupWithIpApiCo(ip) {
  const response = await axios.get(
    `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
    { timeout: 3000 },
  );

  const result = response.data;

  if (result.error) {
    throw new Error(result.reason || "ipapi.co lookup failed");
  }

  return {
    country: result.country_name || null,
    city: result.city || null,
  };
}

export async function getGeolocation(ip) {
  // Never send an invalid or local development IP to a provider.
  if (!ip || !isIP(ip) || ip === "127.0.0.1" || ip === "::1") {
    return { country: null, city: null };
  }

  try {
    return await lookupWithIpApi(ip);
  } catch (error) {
    console.warn("Primary geolocation provider failed:", error.message);
  }

  try {
    return await lookupWithIpApiCo(ip);
  } catch (error) {
    console.warn("Fallback geolocation provider failed:", error.message);
  }

  // Geolocation is optional: never block a lead because lookup failed.
  return { country: null, city: null };
}
