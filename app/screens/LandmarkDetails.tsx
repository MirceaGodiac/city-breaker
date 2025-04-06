import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
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
import { Ionicons } from "@expo/vector-icons"; // using Ionicons for play/pause

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
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const {
    info,
    characteristics,
    landmarkName,
    base64,
    locationGPS,
    timestamp,
    description,
  } = route.params;

  useEffect(() => {
    return () => {
      // This cleanup function is called when the component unmounts.
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Function to handle audio button press with pause/resume functionality.
  // Before any audio is loaded, the button shows the TTS PNG image.
  // After the first press, it will toggle between play and pause icons.
  const handleAudioPress = async () => {
    // If audio is still loading, do nothing.
    if (audioLoading) return;

    if (!sound) {
      // First press: load the audio.
      setAudioLoading(true);
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const apiKey = "";
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
        if (!data.audioContent) {
          throw new Error("No audio content returned from TTS API");
        }

        const fileUri = FileSystem.cacheDirectory + "ttsAudio.mp3";
        await FileSystem.writeAsStringAsync(fileUri, data.audioContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound: newSound } = await Audio.Sound.createAsync({
          uri: fileUri,
        });
        // Remove logging from playback status update:
        newSound.setOnPlaybackStatusUpdate(() => {});
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing TTS audio:", error);
        Alert.alert("Playback Error", "Unable to play audio at this time.");
      } finally {
        setAudioLoading(false);
      }
    } else {
      // Subsequent presses toggle between pause and resume.
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
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

  // Add helper function to format text for tags and categories
  function formatText(text: string): string {
    return text
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{landmarkName}</Text>
        <Image
          source={{ uri: `data:image/jpeg;base64,${base64}` }}
          style={styles.image}
        />
        <View style={styles.infoContainerWrapper}>
          <ScrollView style={styles.infoContainer}>
            <Text style={styles.info}>{info}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.audioButtonCircle}
            onPress={handleAudioPress}
          >
            {audioLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : !sound ? (
              <Image
                source={require("../../assets/tts.png")}
                style={styles.audioIcon}
              />
            ) : isPlaying ? (
              <Ionicons name="pause" size={24} color="black" />
            ) : (
              <Ionicons name="play" size={24} color="black" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Feedback and other UI elements */}
      <View style={styles.feedbackContainer}>
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            selectedPreference === "thumbsDown" && styles.selectedButton,
          ]}
          onPress={() => {
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
        {Object.keys(characteristics).length > 0 ? (
          <View style={styles.tagsWrapper}>
            {Object.entries(characteristics as { [key: string]: string[] }).map(
              ([category, items]) => (
                <View key={category} style={styles.tag}>
                  <Text style={styles.tagTitle}>{formatText(category)}</Text>
                  <Text style={styles.tagItems}>
                    {items.map((item) => formatText(item)).join(", ")}
                  </Text>
                </View>
              )
            )}
          </View>
        ) : (
          <Text style={styles.info}>No characteristics provided.</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.coolButton, { backgroundColor: "#007AFF" }]}
          onPress={async () => {
            if (selectedPreference !== "") {
              await updateUserPreferences(characteristics, selectedPreference);
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
        >
          <Text style={styles.coolButtonText}>Make Public Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.coolButton, { backgroundColor: "#007AFF" }]}
          onPress={uploadPrivateScan}
        >
          <Text style={styles.coolButtonText}>Save as Private Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.coolButton, { backgroundColor: "#FF3B30" }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.coolButtonText}>Go Back</Text>
        </TouchableOpacity>
        <View style={{ height: 50 }} /> {/* Spacer for better layout */}
      </View>
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
    position: "relative", // So that absolutely positioned children are relative to the card
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
  infoContainerWrapper: {
    position: "relative", // ensure the audio button can be positioned relative to this container
    overflow: "visible",
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    overflow: "visible",
  },
  info: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
  // Position the audio button so its center is exactly at the bottom right of the wrapper
  audioButtonCircle: {
    position: "absolute",
    bottom: 0,
    right: 0,
    transform: [{ translateX: 25 }, { translateY: 25 }],
    width: 50,
    height: 50,
  },
  audioIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
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
  buttonContainer: {
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  coolButton: {
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  coolButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
