import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { app, auth } from "../../assets/firebase-config";
import {
  getDatabase,
  ref,
  push,
  update,
  runTransaction,
} from "firebase/database";
import { FontAwesome } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

type LandmarkDetailsRouteProp = RouteProp<
  {
    params: {
      info: string;
      characteristics: { [key: string]: string[] };
      landmarkName: string;
      base64: string;
      locationGPS: string;
      timestamp: number;
      description: string;
    };
  },
  "params"
>;

type Props = {
  route: LandmarkDetailsRouteProp;
};

export default function LandmarkDetails({ route }: Props) {
  const navigation = useNavigation();
  const [selectedPreference, setSelectedPreference] = useState<string>("");
  const {
    info,
    characteristics,
    landmarkName,
    base64,
    locationGPS,
    timestamp,
    description,
  } = route.params;

  // Function to play TTS audio of the "info" text using Google TTS API.
  const playInfoAudio = async () => {
    try {
      // Ensure that the audio plays in silent mode (especially on iOS)
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      
      const apiKey = "AIzaSyA9p8_jce6LBPwXB_BoHOMosBaLo85yeF8";
      const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
      const requestBody = {
        input: { text: info },
        voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3" },
      };

      const response = await fetch(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("TTS API response:", data); // Check the response

      if (!data.audioContent) {
        throw new Error("No audio content returned from TTS API");
      }
      
      // Write the base64 audio content to a file in the cache directory
      const fileUri = FileSystem.cacheDirectory + "ttsAudio.mp3";
      await FileSystem.writeAsStringAsync(fileUri, data.audioContent, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("Audio file written to:", fileUri);

      // Load and play the audio file
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      sound.setOnPlaybackStatusUpdate((status) =>
        console.log("Playback status:", status)
      );
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing TTS audio:", error);
      Alert.alert("Playback Error", "Unable to play audio at this time.");
    }
  };

  const updateUserPreferences = async (
    tagGroups: { [key: string]: string[] },
    preference: string
  ) => {
    try {
      const db = getDatabase(app);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("User not authenticated");

      let delta = 0;
      if (preference === "thumbsDown") delta = -1;
      else if (preference === "thumbsUp") delta = 1;
      else if (preference === "heart") delta = 2;

      Object.entries(tagGroups).forEach(([groupKey, tags]) => {
        tags.forEach((tag) => {
          const tagKey = tag.toLowerCase();
          runTransaction(
            ref(db, `USERS/${uid}/${groupKey.toUpperCase()}/${tagKey}`),
            (currentValue) => {
              if (currentValue === null || typeof currentValue !== "number") {
                return preference === "thumbsDown" ? 0 : delta;
              }
              const newValue = currentValue + delta;
              return newValue < 0 ? 0 : newValue;
            }
          );
        });
      });

      console.log("User preferences updated.");
    } catch (error) {
      console.error("Failed to update preferences:", error);
    }
  };

  const uploadPrivateScan = async () => {
    try {
      if (selectedPreference !== "") {
        await updateUserPreferences(characteristics, selectedPreference!);
      }
      const db = getDatabase(app);
      const uid = auth.currentUser?.uid || "dummyUID";
      const newScanRef = push(ref(db, "SCANS"));
      const scanID = newScanRef.key;
      const scanRecord = {
        UID: uid,
        base64,
        locationGPS,
        locationName: landmarkName,
        time: timestamp,
        description,
        tags: characteristics,
      };
      await update(ref(db, "USERS/" + uid + "/PRIVATE_SCANS"), {
        [scanID]: scanRecord,
      });
      Alert.alert("Success", "Private scan uploaded successfully.");
      navigation.popToTop();
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error.message || "Something went wrong during upload."
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{landmarkName}</Text>
        <Image
          source={{ uri: `data:image/jpeg;base64,${base64}` }}
          style={styles.image}
        />
        <ScrollView style={styles.infoContainer}>
          <Text style={styles.info}>{info}</Text>
        </ScrollView>

        {/* New button to play audio version of the info text */}
        <TouchableOpacity style={styles.audioButton} onPress={playInfoAudio}>
          <FontAwesome name="microphone" size={24} color="white" />
          <Text style={styles.audioButtonText}>Play Info Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedbackContainer}>
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            selectedPreference === "thumbsDown" && styles.selectedButton,
          ]}
          onPress={async () => {
            setSelectedPreference("thumbsDown");
          }}
        >
          <FontAwesome name="thumbs-down" size={24} color="#ff5252" />
          <Text style={styles.feedbackText}>Not my thing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            selectedPreference === "thumbsUp" && styles.selectedButton,
          ]}
          onPress={() => {
            setSelectedPreference("thumbsUp");
          }}
        >
          <FontAwesome name="thumbs-up" size={24} color="#4caf50" />
          <Text style={styles.feedbackText}>I like this!</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            selectedPreference === "heart" && styles.selectedButton,
          ]}
          onPress={() => {
            setSelectedPreference("heart");
          }}
        >
          <FontAwesome name="heart" size={24} color="#e91e63" />
          <Text style={styles.feedbackText}>I really like this!</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tagsSection}>
        <Text style={styles.tagsTitle}>Tags:</Text>
        <View style={styles.tagsWrapper}>
          {Object.keys(characteristics).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagTitle}>{tag}</Text>
              <Text style={styles.tagItems}>
                {characteristics[tag].join(", ")}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Button
        title="Make Public Scan"
        onPress={async () => {
          if (selectedPreference !== "") {
            await updateUserPreferences(characteristics, selectedPreference!);
          }
          navigation.navigate("ScanRating", {
            scanData: {
              info,
              landmarkName,
              base64,
              locationGPS,
              timestamp,
              description,
              tags: characteristics,
            },
            isPublic: true,
          });
        }}
      />
      <View style={{ height: 10 }} />
      <Button title="Save as Private Scan" onPress={uploadPrivateScan} />
      <View style={{ height: 10 }} />
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f5f7",
    padding: 15,
  },
  card: {
    marginTop: 50,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoContainer: {
    maxHeight: 1500,
  },
  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 15,
    lineHeight: 22,
  },
  audioButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  audioButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  tagsSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tagsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#e0e0e0",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  tagTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  tagItems: {
    fontSize: 12,
    color: "#555",
  },
  feedbackContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  feedbackButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  feedbackText: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  selectedButton: {
    backgroundColor: "#cce5ff",
  },
});
