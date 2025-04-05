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
} from "react-native";
import { Platform } from "react-native";
import { findNearbyPlaces } from "../firebase_files/find-nearby-places";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios"; // added import

const OPENAI_API_KEY =
  "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"; // Replace with your API key

// Add your Google API key
const GOOGLE_MAPS_API_KEY = "AIzaSyA9p8_jce6LBPwXB_BoHOMosBaLo85yeF8"; // Replace with your key

// New helper to get embedding from OpenAI
const getEmbedding = async (text: string): Promise<number[]> => {
  // Call OpenAI’s embedding API using the text-embedding-ada-002 model
  const response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: text,
      model: "text-embedding-ada-002",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );
  return response.data.data[0].embedding;
};

// Helper to compute cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]) => {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// Replace dummy function with a real fetch for reviews
const fetchTopReviews = async (place: any): Promise<string> => {
  // Fetch the top 5 reviews for a place using its placeId
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.placeId}&fields=reviews&key=${GOOGLE_MAPS_API_KEY}`
    );
    if (response.data.result && response.data.result.reviews) {
      // Log the fetched reviews for verification
      console.log(
        "Fetched reviews for place",
        place.placeId,
        response.data.result.reviews
      );
      const reviews = response.data.result.reviews.slice(0, 10); // Get top 10 reviews
      // Aggregate reviews text
      return reviews.map((r: any) => r.text).join(" ");
    }
    return "";
  } catch (err) {
    console.error("Failed to fetch reviews", err);
    return "";
  }
};

interface NearbyPlacesScreenProps {
  navigation: any;
}

const NearbyPlacesScreen: React.FC<NearbyPlacesScreenProps> = ({
  navigation,
}) => {
  const [location, setLocation] = useState("");
  const [reviewQuery, setReviewQuery] = useState(""); // new state for review criteria
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New function to handle category selection
  const handleCategorySelect = (category: string) => {
    setReviewQuery(category);
  };

  const searchPlaces = async () => {
    if (!location.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const nearbyPlaces = await findNearbyPlaces(location);
      let scoredPlaces = nearbyPlaces;
      if (reviewQuery.trim()) {
        const queryEmbedding = await getEmbedding(reviewQuery);
        scoredPlaces = await Promise.all(
          nearbyPlaces.map(async (place: any) => {
            const reviewText = await fetchTopReviews(place);
            const reviewEmbedding = await getEmbedding(reviewText);
            const similarity = cosineSimilarity(
              queryEmbedding,
              reviewEmbedding
            );
            return { ...place, score: similarity };
          })
        );
        scoredPlaces.sort((a: any, b: any) => b.score - a.score);
      }
      setPlaces(scoredPlaces);
    } catch (err) {
      setError("Failed to find nearby places. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

      {/* New culinary categories circles */}
      <View style={styles.circleContainer}>
        <TouchableOpacity
          style={styles.circleItem}
          onPress={() => handleCategorySelect("Fine Dining")}
        >
          <Text style={styles.circleText}>Culinary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleItem}
          onPress={() => handleCategorySelect("Cafes")}
        >
          <Text style={styles.circleText}>Activities</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleItem}
          onPress={() => handleCategorySelect("Street Food")}
        >
          <Text style={styles.circleText}>Landmarks</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        {/* location input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Enter location..."
          value={location}
          onChangeText={setLocation}
          onSubmitEditing={searchPlaces}
        />
        {/* new natural language review query input */}
        <TextInput
          style={styles.reviewQueryInput}
          placeholder="What are you in the mood for?"
          value={reviewQuery}
          onChangeText={setReviewQuery}
          onSubmitEditing={searchPlaces}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchPlaces}>
          <Ionicons name="search" size={24} color="white" />
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
  circleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  circleItem: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  circleText: {
    color: "#4A90E2",
    fontSize: 12,
    textAlign: "center",
  },
  searchContainer: {
    height: 150,
    flexDirection: "column",
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
    paddingVertical: 8, // added vertical padding
    textAlignVertical: "center", // ensures text is centered vertically
  },
  reviewQueryInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
    marginTop: 8,
    paddingVertical: 8, // added vertical padding
    textAlignVertical: "center", // ensures text is centered vertically
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: "#0066cc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
