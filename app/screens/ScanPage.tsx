import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ActivityIndicator, // <-- added import
} from "react-native";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import axios from "axios";

const VISION_API_KEY = "AIzaSyAnHyrHJLYMvcRD38LwYsHCIc9WqWS34vg";
const OPENAI_API_KEY =
  "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";

export default function App() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    setUri(photo?.uri ?? null);
  };

  const analyseImage = async () => {
    if (!uri) {
      Alert.alert("Please capture a photo first!");
      return;
    }
    setLoading(true);
    try {
      const base64ImageData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const visionAPIURL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;
      const requestData = {
        requests: [
          {
            image: { content: base64ImageData },
            features: [{ type: "LANDMARK_DETECTION", maxResults: 1 }],
          },
        ],
      };
      const visionResponse = await axios.post(visionAPIURL, requestData);
      const landmarkAnnotations =
        visionResponse.data.responses[0]?.landmarkAnnotations;
      if (landmarkAnnotations && landmarkAnnotations.length > 0) {
        const detectedLandmarkName = landmarkAnnotations[0].description;
        const chatGPTResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a tour guide AI. Add fun facts or history in bullet points in max 500 words.`,
              },
              {
                role: "user",
                content: `Tell me about ${detectedLandmarkName}, and about stuff around it. Only if no information is available, say: "Sorry, no information on this landmark."`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        const landmarkInfo = chatGPTResponse.data.choices[0]?.message?.content;
      } else {
        Alert.alert("No landmark detected, please try again");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const renderPicture = () => {
    return (
      <View style={{ flex: 1 }}>
        <Image
          source={{ uri }}
          contentFit="cover"
          style={{ flex: 1, width: "100%", height: "100%" }}
        />
        {/* Overlay buttons */}
        <View style={styles.overlayContainer}>
          <Pressable style={styles.retakeBtn} onPress={() => setUri(null)}>
            <AntDesign name="arrowleft" size={16} color="white" />
            <Text style={styles.retakeBtnText}>Retake Photo</Text>
          </Pressable>
          <TouchableOpacity style={styles.spotBtn} onPress={analyseImage}>
            <FontAwesome6 name="star" size={18} color="white" />
            <Text style={styles.spotBtnText}>Spot it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        mode={"picture"}
        facing={"back"}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <View></View>

          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: "white",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
          <View />
        </View>
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {uri ? renderPicture() : renderCamera()}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: 20,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  retakeBtnText: {
    color: "white",
    marginLeft: 5,
  },
  spotBtn: {
    alignSelf: "center",
    backgroundColor: "#ff9900",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  spotBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
