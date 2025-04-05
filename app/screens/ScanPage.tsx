import { View, Text, StyleSheet } from "react-native";
import React from "react";
// ts-ignore
import { NavigationProp } from "@react-navigation/native";

interface RouterProps {
  navigation: NavigationProp<any, any>; // Replace with the correct type for your navigation prop
}

function ScanPage({ navigation }: RouterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scan Screen</Text>
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
  },
});

export default ScanPage;
