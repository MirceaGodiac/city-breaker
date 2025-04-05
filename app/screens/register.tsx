import { View, Text, StyleSheet } from "react-native";
import React from "react";

function Register() {
  return (
    <View style={styles.container}>
      <Text>Register</Text>
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
    fontWeight: "bold",
    color: "#333",
  },
});
export default Register;
