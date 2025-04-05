import { Client } from "@googlemaps/google-maps-services-js";
import axios from "axios";
import { getDatabase, ref, get } from "firebase/database";
import { auth } from "../../assets/firebase-config";

const GOOGLE_MAPS_API_KEY = "AIzaSyA9p8_jce6LBPwXB_BoHOMosBaLo85yeF8";
const client = new Client({
  config: {
    adapter: axios.create().defaults.adapter,
  },
});

// Helper function to compute distance in meters using the haversine formula
function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // earth radius in m
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to determine if scanned landmark's tags share at least one common tag with userPrefs.
// Here, scanTags is an object where values are arrays of strings.
function hasCommonTag(
  scanTags: { [group: string]: string[] },
  userPrefs: string[]
): boolean {
  for (const group in scanTags) {
    for (const tag of scanTags[group]) {
      if (userPrefs.includes(tag)) {
        return true;
      }
    }
  }
  return false;
}

async function getUserPreferences(): Promise<string[]> {
  const uid = auth.currentUser?.uid;
  const db = getDatabase();
  const snapshot = await get(ref(db, `USERS/${uid}`));
  const userData = snapshot.val();
  let prefs: string[] = [];
  const categories = [
    "ARCHITECTURE",
    "HISTORICAL ERA",
    "CULTURAL",
    "LANDMARK TYPE",
    "VIBE",
    "EXPERIENCE STYLE",
  ];
  categories.forEach((category) => {
    if (userData && userData[category]) {
      Object.entries(userData[category]).forEach(([key, value]) => {
        if (Number(value) > 0) {
          prefs.push(key);
        }
      });
    }
  });
  return prefs;
}

export async function findNearbyLandmarks(
  locationName: string,
  latitude: number,
  longitude: number,
  inputType: string,
  radius: number
): Promise<{ name: string }[]> {
  let lat = latitude;
  let lng = longitude;
  let keywords: string[] = [];

  try {
    // First, geocode the location name to get coordinates if necessary
    if (inputType !== "default") {
      const geocodeResponse = await client.geocode({
        params: {
          address: locationName,
          key: GOOGLE_MAPS_API_KEY,
        },
      });

      if (!geocodeResponse.data.results[0]) {
        throw new Error("Location not found");
      }
      const { lat: geocodeLat, lng: geocodeLng } =
        geocodeResponse.data.results[0].geometry.location;
      lat = geocodeLat;
      lng = geocodeLng;
    }

    // Merge user preferences if uid is provided
    const userPrefs = await getUserPreferences();
    keywords = Array.from(new Set([...keywords, ...userPrefs]));
    console.log("Merged keywords:", keywords.join(" ") + " landmarks");

    // Query Firebase for scanned landmarks in the SCANS node
    const db = getDatabase();
    const scansSnapshot = await get(ref(db, "SCANS"));
    const scansData = scansSnapshot.val();
    let dbLandmarks: { name: string }[] = [];
    if (scansData) {
      Object.values(scansData).forEach((scan: any) => {
        // Assume 'locationGPS' is stored as "lat,lng" and 'tags' as object.
        if (scan.locationGPS && scan.tags && scan.locationName) {
          const [scanLatStr, scanLngStr] = scan.locationGPS.split(",");
          const scanLat = parseFloat(scanLatStr);
          const scanLng = parseFloat(scanLngStr);
          const distance = getDistance(lat, lng, scanLat, scanLng);
          if (distance <= radius && hasCommonTag(scan.tags, userPrefs)) {
            dbLandmarks.push({ name: scan.locationName });
          }
        }
      });
    }

    // Call Google Places API as before.
    const placesResponse = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius: radius,
        keyword: keywords.join(" ") + " landmarks",
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const googleLandmarks = placesResponse.data.results.map((place) => ({
      name: place.name || "Unknown",
    }));

    // Merge both arrays and return
    return [...dbLandmarks, ...googleLandmarks];
  } catch (error) {
    console.error("Error finding nearby places:", error);
    throw error;
  }
}
