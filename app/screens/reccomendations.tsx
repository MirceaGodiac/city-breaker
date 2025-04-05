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
} from "react-native";
import { findNearbyPlaces } from "../firebase_files/find-nearby-places";
import { findNearbyExperiences } from "../firebase_files/find-nearby-experiences";
import { Ionicons } from "@expo/vector-icons";

interface NearbyPlacesScreenProps {
  navigation: any;
}

type SearchTab = "Restaurants" | "Experiences";

const NearbyPlacesScreen: React.FC<NearbyPlacesScreenProps> = ({ navigation }) => {
  const [location, setLocation] = useState("");
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<SearchTab>("Restaurants");

  const searchPlaces = async () => {
    if (!location.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let results;
      if (selectedTab === "Restaurants") {
        results = await findNearbyPlaces(location);
      } else {
        results = await findNearbyExperiences(location);
      }
      setPlaces(results);
    } catch (err) {
      setError("Failed to find nearby places. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh the search when the selectedTab changes
  useEffect(() => {
    if (location.trim()) {
      searchPlaces();
    }
  }, [selectedTab]);

  const renderPlaceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.placeCard}
      onPress={() => navigation.navigate("Reviews", { placeId: item.placeId })}
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
          {item.types.slice(0, 2).map((type: string, index: number) => (
            <Text key={index} style={styles.type}>
              {type.replace(/_/g, " ")}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <TouchableOpacity style={styles.searchButton} onPress={searchPlaces}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* New Tabs below search bar */}
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
          keyExtractor={(item) => item.placeId}
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
});

export default NearbyPlacesScreen;
