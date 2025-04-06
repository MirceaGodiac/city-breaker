import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";

const packages = [
  { id: "1", name: "1 Week", duration: "1 Week", price: "$2.99" },
  { id: "2", name: "1 Month", duration: "1 Month", price: "$5.99" },
  { id: "3", name: "1 Year", duration: "1 Year", price: "$45.00" },
];

export default function BuyPackages() {
  const handlePurchase = (pack: (typeof packages)[0]) => {
    Alert.alert("Purchase", `You selected: ${pack.name}\nPrice: ${pack.price}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.header}>Buy Subscription Package</Text>
      {packages.map((pack) => (
        <TouchableOpacity
          key={pack.id}
          style={styles.packageCard}
          onPress={() => handlePurchase(pack)}
        >
          <Text style={styles.packageName}>{pack.name}</Text>
          <Text style={styles.packageDetails}>
            {pack.duration} - {pack.price}
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.footer}>Select a package to subscribe!</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#007AFF",
  },
  packageCard: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  packageName: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  packageDetails: {
    fontSize: 16,
    color: "#666",
  },
  footer: {
    marginTop: 30,
    fontSize: 16,
    color: "#888",
  },
});
