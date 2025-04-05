import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getDatabase, ref, push, set, update } from "firebase/database";
import { app, auth } from "../../assets/firebase-config";
import { FontAwesome6 } from "@expo/vector-icons";

export default function ScanRating() {
  const route = useRoute();
  const navigation = useNavigation();
  const { scanData, isPublic } = route.params || {};

  const [rating, setRating] = useState(0);
  const [desc, setDesc] = useState(scanData.description || "");

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert("Please provide a rating between 1 and 5");
      return;
    }
    try {
      const db = getDatabase(app);
      const uid = auth.currentUser?.uid || "dummyUID";
      const newScanRef = push(ref(db, "SCANS"));
      const scanID = newScanRef.key;
      const scanRecord = {
        UID: uid,
        base64: scanData.base64,
        locationGPS: scanData.locationGPS,
        locationName: scanData.landmarkName,
        time: scanData.timestamp,
        description: desc,
        rating: rating,
        tags: scanData.tags, // new: include tags from scanData
      };
      await set(ref(db, "SCANS/" + scanID), scanRecord);
      if (isPublic) {
        await update(ref(db, "USERS/" + uid + "/PUBLIC_SCANS"), {
          [scanID]: { uuid: scanID },
        });
      } else {
        await update(ref(db, "USERS/" + uid + "/PRIVATE_SCANS"), {
          [scanID]: scanRecord,
        });
      }
      Alert.alert("Success", "Scan uploaded successfully.");
      navigation.popToTop();
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error.message || "Something went wrong during upload."
      );
    }
  };

  const renderStars = () => {
    let stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <FontAwesome6
            name="star"
            size={32}
            color={i <= rating ? "#ffd700" : "#ccc"}
            style={styles.star}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate your Scan</Text>
      {renderStars()}
      <Text style={styles.label}>Optional Description:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter description"
        value={desc}
        onChangeText={setDesc}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  star: { marginHorizontal: 5 },
  label: { fontSize: 16, marginVertical: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 20 },
});
