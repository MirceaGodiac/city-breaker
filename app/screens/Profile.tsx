import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from "react-native";
import React from "react";
import { auth } from "../../assets/firebase-config";
import { signOut } from "firebase/auth";
import { useNavigation, NavigationProp, StackActions } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext"; // ensure this path is correct

type RootStackParamList = {
  Login: undefined;
  Profile: undefined;
};

function Profile() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme, toggleTheme } = useTheme();  
  const isLightTheme = theme === "light";

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Error", "There was an error signing out.");
    }
  }

  // Dynamic colors based on theme
  const backgroundColor = isLightTheme ? "#fff" : "#333";
  const textColor = isLightTheme ? "#000" : "#fff";
  const sectionBackgroundColor = isLightTheme ? "#f7f7f7" : "#555";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Profile Screen</Text>

      <View style={[styles.section, { backgroundColor: sectionBackgroundColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Settings</Text>
        
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: textColor }]}>Theme</Text>
          <Switch
            value={isLightTheme}
            onValueChange={toggleTheme}
            thumbColor="#4A90E2"
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: sectionBackgroundColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Preferences</Text>
        <Text style={[styles.placeholderText, { color: textColor }]}>No preferences available.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  placeholderText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 10,
  },
});

export default Profile;
