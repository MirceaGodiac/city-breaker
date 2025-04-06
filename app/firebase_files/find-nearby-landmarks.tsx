import { Client } from "@googlemaps/google-maps-services-js";
import axios from "axios";
import { getDatabase, ref, get } from "firebase/database";
import { auth } from "../../assets/firebase-config";
import { Alert } from "react-native";

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

// Modified getUserPreferences to return a mapping of tag -> score.
async function getUserPreferences(): Promise<{ [tag: string]: number }> {
  const uid = auth.currentUser?.uid;
  const db = getDatabase();
  const snapshot = await get(ref(db, `USERS/${uid}`));
  const userData = snapshot.val();
  let prefs: { [tag: string]: number } = {};
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
        let score = Number(value);
        if (score > 0) {
          prefs[key.toLowerCase()] = score; // Normalize keys to lowercase
        }
      });
    }
  });

  // Log the extracted preferences
  Alert.alert("User Preferences", JSON.stringify(prefs));
  return prefs;
}

// Modified findNearbyLandmarks to only return scanned landmarks sorted by matching score.
// Modified findNearbyLandmarks to include photo, rating, and description
// Modified findNearbyLandmarks to include base64 image, rating, and description
export async function findNearbyLandmarks(
  locationName: string,
  latitude: number,
  longitude: number,
  inputType: string,
  radius: number
): Promise<
  {
    key: string;
    name: string;
    photo: string;
    rating: number;
    description: string;
    time: string;
  }[]
> {
  try {
    // Extract user's tag preferences with scores
    const userPrefs = await getUserPreferences();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not signed in.");

    const db = getDatabase();

    // Fetch user's PUBLIC_SCANS
    const userScansSnapshot = await get(ref(db, `USERS/${uid}/PUBLIC_SCANS`));
    const userScansData = userScansSnapshot.val();
    const allowedScanIDs = userScansData ? Object.keys(userScansData) : [];

    // Query Firebase for scanned landmarks in the SCANS node
    const scansSnapshot = await get(ref(db, "SCANS"));
    const scansData = scansSnapshot.val();
    // Include totalScore temporarily for sorting
    const dbLandmarks: {
      key: string;
      name: string;
      photo: string;
      rating: number;
      description: string;
      totalScore: number;
      time: string;
    }[] = [];

    if (scansData) {
      Object.entries(scansData).forEach(([scanID, scan]: [string, any]) => {
        // Process only if the landmark has NOT been visited by the user
        if (!allowedScanIDs.includes(scanID)) {
          if (scan.locationName) {
            let totalScore = 0;
            // Traverse the nested tags structure (non-case-sensitive)
            Object.entries(scan.tags).forEach(
              ([group, tags]: [string, any]) => {
                if (Array.isArray(tags)) {
                  tags.forEach((tag: string) => {
                    const normalizedTag = tag.toLowerCase();
                    if (userPrefs[normalizedTag]) {
                      totalScore += userPrefs[normalizedTag];
                    }
                  });
                }
              }
            );
            if (totalScore > 0) {
              dbLandmarks.push({
                key: scanID,
                name: scan.locationName,
                photo: scan.base64 || "",
                rating: scan.Rating || 0,
                description: scan.description || "",
                totalScore,
                time: scan.time || "",
              });
            }
          }
        }
      });
    }

    // Sort landmarks by total matching score in descending order
    dbLandmarks.sort((a, b) => b.totalScore - a.totalScore);
    return dbLandmarks.map((item) => ({
      key: item.key,
      name: item.name,
      photo: item.photo,
      rating: item.rating,
      description: item.description,
      time: item.time, // include timestamp for display in recommendations
    }));
  } catch (error) {
    console.error("Error finding scanned landmarks:", error);
    throw error;
  }
}
