import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Linking,
} from "react-native";
import { findNearbyPlaces } from "../firebase_files/find-nearby-restaurants";
import { findNearbyExperiences } from "../firebase_files/find-nearby-experiences";
import { findNearbyLandmarks } from "../firebase_files/find-nearby-landmarks";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";

// Helper functions similar to profile.tsx
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

function getStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

interface NearbyPlacesScreenProps {
  navigation: any;
}

type SearchTab = "Restaurants" | "Experiences" | "Landmarks";

const NearbyPlacesScreen: React.FC<NearbyPlacesScreenProps> = ({
  navigation,
}) => {
  const [location, setLocation] = useState("");
  const [adress, setAdress] = useState("");
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<SearchTab>("Restaurants");
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [inputType, setInputType] = useState("default");
  // Cache results per tab; key are the tab names.
  const [cachedResults, setCachedResults] = useState<{
    [key in SearchTab]?: any[];
  }>({});

  const [searchRadius, setSearchRadius] = useState(20); // default 20 km

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    if (userCoords && !location.trim()) {
      (async () => {
        let [result] = await Location.reverseGeocodeAsync(userCoords);
        let formattedAddress =
          result.name && result.city
            ? `${result.name}, ${result.city}`
            : result.city || "";
        setLocation(formattedAddress);
        setAdress(formattedAddress);
      })();
    }
  }, [userCoords, location]);

  const searchPlaces = async () => {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let results;
      if (selectedTab === "Restaurants") {
        results = await findNearbyPlaces(location);
      } else if (selectedTab === "Landmarks") {
        results = await findNearbyLandmarks(
          location,
          userCoords!.latitude,
          userCoords!.longitude,
          inputType,
          searchRadius * 1000 // convert km to meters
        );
      } else {
        results = await findNearbyExperiences(location);
      }
      // Cache the results for the current tab
      setCachedResults((prev) => ({ ...prev, [selectedTab]: results }));
      setPlaces(results);
    } catch (err) {
      setError("Failed to find nearby places. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // When the selectedTab changes, check if results exist in cache.
  useEffect(() => {
    if (location.trim()) {
      if (cachedResults[selectedTab]) {
        setPlaces(cachedResults[selectedTab]!);
      } else {
        searchPlaces();
      }
    }
  }, [selectedTab]);

  // Clear cache when location is empty.
  useEffect(() => {
    if (!location.trim()) {
      setCachedResults({});
      setPlaces([]);
    }
  }, [location]);

  // New function to update search field with the user's location
  const updateUserLocation = async () => {
    if (userCoords) {
      let [result] = await Location.reverseGeocodeAsync(userCoords);
      let formattedAddress =
        result.name && result.city
          ? `${result.name}, ${result.city}`
          : result.city || "";
      setLocation(formattedAddress);
      setAdress(formattedAddress);
    }
  };

  // New function to open Google Maps navigation
  const handleNavigate = (destination: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination
    )}`;
    Linking.openURL(url);
  };

  const renderPlaceItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.placeCard}
        onPress={() =>
          navigation.navigate("Reviews", { placeId: item.key || item.placeId })
        }
      >
        <View style={styles.placeHeader}>
          <Text style={styles.placeName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            {item.rating && (
              <>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
              </>
            )}
          </View>
        </View>
        {selectedTab === "Landmarks" ? (
          <>
            {item.photo && (
              <Image
                source={{
                  uri:
                    item.photo && item.photo.startsWith("data:")
                      ? item.photo
                      : `data:image/png;base64,${item.photo}`,
                }}
                style={styles.landmarkImage}
                resizeMode="contain"
              />
            )}
            {item.description !== "" && (
              <Text style={styles.description}>{item.description}</Text>
            )}
            {item.rating && (
              <Text style={styles.subtitle}>{getStars(item.rating)}</Text>
            )}
            {item.time && <Text style={styles.time}>{timeAgo(item.time)}</Text>}
          </>
        ) : (
          <>
            <Text style={styles.address}>{item.address}</Text>
            <View style={styles.detailsContainer}>
              {item.openNow !== undefined && (
                <Text
                  style={[
                    styles.openStatus,
                    { color: item.openNow ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {item.openNow ? "Open Now" : "Closed"}
                </Text>
              )}
              <View style={styles.typeContainer}>
                {(item.types || [])
                  .slice(0, 2)
                  .map((type: string, index: number) => (
                    <Text key={index} style={styles.type}>
                      {type.replace(/_/g, " ")}
                    </Text>
                  ))}
              </View>
            </View>
          </>
        )}
        <View style={styles.navigateContainer}>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => handleNavigate(item.address || item.name)}
          >
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter location..."
          value={location}
          onChangeText={setLocation}
          onSubmitEditing={searchPlaces}
        />
        {/* New location button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            updateUserLocation();
            setInputType("default");
          }}
        >
          <Ionicons name="location-outline" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            searchPlaces();
            setInputType("default");
          }}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {/* New Slider under search bar */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>{searchRadius} km</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={50}
          step={1}
          value={searchRadius}
          onValueChange={setSearchRadius}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#ccc"
        />
      </View>
      {/* Updated Tabs below search bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "Restaurants" && styles.tabActive,
          ]}
          onPress={() => setSelectedTab("Restaurants")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Restaurants" && styles.tabTextActive,
            ]}
          >
            Restaurants
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "Landmarks" && styles.tabActive,
          ]}
          onPress={() => setSelectedTab("Landmarks")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Landmarks" && styles.tabTextActive,
            ]}
          >
            Landmarks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "Experiences" && styles.tabActive,
          ]}
          onPress={() => setSelectedTab("Experiences")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Experiences" && styles.tabTextActive,
            ]}
          >
            Experiences
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066cc" />
      ) : (
        <FlatList
          data={places}
          renderItem={renderPlaceItem}
          keyExtractor={(item) => item.key || item.placeId}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            !loading && (
              <Text style={styles.emptyText}>
                No places found. Try searching for a location.
              </Text>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: "#0066cc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  sliderContainer: {
    alignItems: "center",
    backgroundColor: "#fff", // match background white

    padding: 8,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 16, // thicker slider bar
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "white",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  tabTextActive: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  placeCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  openStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  type: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
    textTransform: "capitalize",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#F44336",
    textAlign: "center",
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 32,
  },
  landmarkImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  // New styles for rating stars and time ago display
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
    color: "#888",
  },
  navigateContainer: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  navigateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  navigateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default NearbyPlacesScreen;
