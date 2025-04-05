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
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

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
        // Extract geo coordinates from API response
        const latLng =
          landmarkAnnotations[0].locations &&
          landmarkAnnotations[0].locations[0]?.latLng;
        const locationGPS = latLng
          ? `${latLng.latitude},${latLng.longitude}`
          : "0,0";
        const chatGPTResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are an expert and passionate tour guide AI.`,
              },
              {
                role: "user",
                content: `Tell me about ${detectedLandmarkName}, fun facts and about stuff around it in 500 words. Only if no information is available, say: "Sorry, no information on this landmark. Add fun facts or history in bullet points in max 500 words. Provide JUST a JSON object with the text and another JSON with characteristics of each landmark.
                The characteristics JSON should include: for each of the below categories, provide a list of items that belong to that category, you can assign multiple items to a category. Use JUST categories and items listed below. Thanks!:
                ARCHITECTURE:
                - CLASSICAL
                - ROMANESQUE
                - GOTHIC
                - BAROQUE
                - VICTORIAN
                - NEOCLASSICAL
                - MODERNIST
                - BRUTALIST
                - POSTMODERN
                - FUTURISTIC
                - VERNACULAR
                - TRADITIONAL
                - MINIMALIST
                - INDUSTRIAL
                - ISLAMIC
                - BYZANTINE
                - MOORISH

                HISTORICAL_ERA:
                - ANCIENT (BEFORE 500 AD)
                - MEDIEVAL (500–1500)
                - RENAISSANCE (1500–1700)
                - CLASSICAL REVIVAL (1700–1850)
                - INDUSTRIAL ERA (1850–1900)
                - MODERN (1900–1970)
                - CONTEMPORARY (1970–PRESENT)

                CULTURAL:
                - EUROPEAN
                - EASTERN EUROPEAN
                - MIDDLE EASTERN
                - NORTH AFRICAN
                - SUB-SAHARAN AFRICAN
                - EAST ASIAN
                - SOUTH ASIAN
                - SOUTHEAST ASIAN
                - LATIN AMERICAN
                - INDIGENOUS
                - NORDIC
                - SLAVIC

                LANDMARK_TYPE:
                - RELIGIOUS (CHURCH, MOSQUE, TEMPLE)
                - MILITARY (FORT, CASTLE, BUNKER)
                - GOVERNMENTAL (PALACE, PARLIAMENT)
                - RESIDENTIAL (HISTORIC HOUSES, MANORS)
                - COMMERCIAL (OLD MARKETS, SHOPS)
                - BRIDGES
                - TOWERS
                - OBELISKS
                - RUINS
                - WALLS 
                - GATES
                - SCULPTURES
                - MONUMENTS
                - FOUNTAINS
                - MUSEUMS
                - PLAZAS
                - TOWN SQUARES

                VIBE:
                - COLORFUL
                - SYMMETRICAL
                - DETAILED
                - ORNATE
                - MINIMALIST
                - GRAND
                - RUSTIC
                - SHARP
                - SOFT 
                - OVERGROWN 
                - REFLECTIVE (GLASS, WATER)
                - NIGHT-LIT
                - STREET ART

                EXPERIENCE_STYLE:
                - PHOTO SPOT
                - PANORAMIC VIEW
                - INSTAGRAMMABLE
                - PEACEFUL
                - CROWD FAVORITE
                - HIDDEN GEM
                - ROMANTIC
                - FAMILY-FRIENDLY
                - ADVENTURE INVOLVED`,
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
        const responseContent =
          chatGPTResponse.data.choices[0]?.message?.content;
        // New: Remove markdown fences if present
        const cleanedResponse = responseContent
          .replace(/```(json\s*)?/gi, "")
          .replace(/```/gi, "")
          .trim();
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(cleanedResponse);
        } catch (e) {
          parsedResponse = { text: cleanedResponse, characteristics: {} };
        }
        navigation.navigate("LandmarkDetails", {
          info: parsedResponse.text,
          characteristics: parsedResponse.characteristics,
          landmarkName: detectedLandmarkName,
          base64: base64ImageData,
          locationGPS, // now using the extracted GPS coordinates
          timestamp: Date.now(),
          description: "",
        });
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
        <SafeAreaView style={styles.overlayContainer}>
          <Pressable style={styles.retakeBtn} onPress={() => setUri(null)}>
            <AntDesign name="arrowleft" size={16} color="white" />
            <Text style={styles.retakeBtnText}>Retake Photo</Text>
          </Pressable>
          <TouchableOpacity
            style={styles.spotBtn}
            onPress={analyseImage}
            disabled={loading} // disable the button while loading
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome6 name="star" size={18} color="white" />
                <Text style={styles.spotBtnText}>Spot it!</Text>
              </>
            )}
          </TouchableOpacity>
        </SafeAreaView>
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
  // New styles for overlay buttons
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
});
