import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface LandmarkCardProps {
  name: string;
  photo: string;
  rating: number;
  description: string;
  timeAgo: string;
}

const LandmarkCard: React.FC<LandmarkCardProps> = ({
  name,
  photo,
  rating,
  description,
  timeAgo,
}) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: photo }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.rating}>Rating: {rating}/5</Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    margin: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  rating: {
    fontSize: 14,
    color: "#333",
  },
  timeAgo: {
    fontSize: 12,
    color: "#999",
  },
});

export default LandmarkCard;
