import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { signOut } from "firebase/auth";
import { auth } from "../../assets/firebase-config";
// Updated interface with rating, description, and time
interface Scan {
  base64: string;
  locationName: string;
  rating: number;
  description?: string;
  time: number;
}

// Helper function to display how long ago the scan was taken
function timeAgo(time: number): string {
  const diff = Date.now() - time;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

// Helper function to convert a rating number to a string of stars
function getStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function Profile() {
  const [scans, setScans] = useState<Scan[]>([]);
  const uid = auth.currentUser?.uid;

  // Add logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    if (!uid) {
      console.error("No UID found. User might not be signed in.");
      return;
    }

    const db = getDatabase();
    const publicScansRef = ref(db, `USERS/${uid}/PUBLIC_SCANS`);
    get(publicScansRef)
      .then((snapshot) => {
        const scansData = snapshot.val();
        console.log("PUBLIC_SCANS data:", scansData);
        if (scansData) {
          // Option 2: If the keys of PUBLIC_SCANS are the scanIDs:
          const scanIDs = Object.keys(scansData);
          console.log("Extracted scan IDs:", scanIDs);
          return Promise.all(
            scanIDs.map((id: string) => get(ref(db, `SCANS/${id}`)))
          );
        }
        return [];
      })
      .then((scanSnapshots) => {
        const scanList = scanSnapshots
          .filter((snap: any) => snap.exists())
          .map((snap: any) => snap.val());
        console.log("Scans from SCANS node:", scanList);
        setScans(scanList);
      })
      .catch((error) => console.error("Error fetching scans:", error));
  }, [uid]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {scans.length === 0 ? (
        <Text>No scans found.</Text>
      ) : (
        scans.map((scan, index) => (
          <View key={index} style={styles.card}>
            <Image
              source={{
                uri:
                  scan.base64 && scan.base64.startsWith("data:")
                    ? scan.base64
                    : `data:image/png;base64,${scan.base64}`,
              }}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.title}>{scan.locationName}</Text>
            <Text style={styles.subtitle}>{getStars(scan.rating)}</Text>
            {scan.description && (
              <Text style={styles.description}>{scan.description}</Text>
            )}
            <Text style={styles.time}>{timeAgo(scan.time)}</Text>
          </View>
        ))
      )}
      {/* Logout Button */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 4,
  },
  title: {
    fontSize: 18,
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    color: "#555",
  },
  time: {
    fontSize: 12,
    marginTop: 2,
    color: "#888",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    alignSelf: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Profile;
