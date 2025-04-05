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
import * as ImagePicker from "expo-image-picker";
import { analyzeLandmarkImage } from "../claude";
import { SafeAreaView } from "react-native-safe-area-context";

const VISION_API_KEY = "AIzaSyAnHyrHJLYMvcRD38LwYsHCIc9WqWS34vg";
const CLAUDE_API_KEY =
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

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setUri(result.assets[0].uri);
    }
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
        const latLng =
          landmarkAnnotations[0].locations &&
          landmarkAnnotations[0].locations[0]?.latLng;
        const locationGPS = latLng
          ? `${latLng.latitude},${latLng.longitude}`
          : "0,0";
        console.log("Detected Landmark:", detectedLandmarkName);

        const string_result = await analyzeLandmarkImage(detectedLandmarkName);
        const result = JSON.parse(string_result);
        navigation.navigate("LandmarkDetails", {
          info: result.text,
          characteristics: result.characteristics,
          landmarkName: detectedLandmarkName,
          base64: base64ImageData,
          locationGPS,
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
        <View style={styles.overlayContainer}>
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
          <TouchableOpacity
            onPress={pickImageFromGallery}
            style={styles.galleryBtn}
          >
            <Feather name="image" size={24} color="white" />
          </TouchableOpacity>
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
          <View style={{ width: 50 }} />
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
    justifyContent: "center",
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
  galleryBtn: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 20,
  },
});
