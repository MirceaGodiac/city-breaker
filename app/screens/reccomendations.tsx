import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import addScanForUser from "../firebase_files/upload_scan"
import * as ImagePicker from 'expo-image-picker';
import { Alert } from "react-native";

function Home() {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.5,
        allowsEditing: true,
      });

      if (!result.canceled && user) {
        let base64Image = result.assets[0].base64 ?? null;
        setPhotoBase64(base64Image);
        if (base64Image) {
          await addScanForUser(
            user.uid,           // user ID
            "location",         // you can add location logic here
            base64Image
          );
          Alert.alert(
            "Success",
            "Image uploaded successfully!",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert(
        "Error",
        "Failed to upload image. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // You can access user email like this
  const userEmail = user?.email;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={pickImage}
      >
        <Text style={styles.buttonText}>Choose Image</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: 36,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Home;
