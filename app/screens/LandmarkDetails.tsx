import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
} from "react-native";
import { 
  useNavigation, 
  useRoute, 
  RouteProp,
  StackActions,
  NavigationProp 
} from "@react-navigation/native";
import { app, auth } from "../../assets/firebase-config";
import { getDatabase, ref, push, update } from "firebase/database";
import { RootStackParamList } from "../../NavigationTypes";

export default function LandmarkDetails() {
  const route = useRoute<RouteProp<RootStackParamList, 'LandmarkDetails'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { info, landmarkName, base64, locationGPS, timestamp, description } =
    route.params || {};

  const uploadPrivateScan = async () => {
    try {
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
      };
      await update(ref(db, "USERS/" + uid + "/PRIVATE_SCANS"), {
        [scanID]: scanRecord,
      });
      Alert.alert("Success", "Private scan uploaded successfully.");
      // Replace popToTop with dispatch(StackActions.popToTop())
      navigation.dispatch(StackActions.popToTop());
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error.message || "Something went wrong during upload."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{landmarkName || "Landmark Details"}</Text>
      <ScrollView style={styles.scroll}>
        <Text style={styles.infoText}>
          {info || "No information available."}
        </Text>
      </ScrollView>
      <Button
        title="Make Public Scan"
        onPress={() =>
          navigation.navigate("ScanRating", {
            scanData: {
              info,
              landmarkName,
              base64,
              locationGPS,
              timestamp,
              description,
            },
            isPublic: true,
          })
        }
      />
      <View style={{ height: 10 }} />
      {/* For private scans, directly call uploadPrivateScan */}
      <Button title="Save as Private Scan" onPress={uploadPrivateScan} />
      <View style={{ height: 10 }} />
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
