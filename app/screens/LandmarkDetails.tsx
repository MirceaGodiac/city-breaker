import React from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function LandmarkDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { info, landmarkName } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{landmarkName || "Landmark Details"}</Text>
      <ScrollView style={styles.scroll}>
        <Text style={styles.infoText}>
          {info || "No information available."}
        </Text>
      </ScrollView>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  scroll: { flex: 1, marginBottom: 20 },
  infoText: { fontSize: 16, lineHeight: 22 },
});
