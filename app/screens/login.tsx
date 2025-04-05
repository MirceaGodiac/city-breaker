import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../../assets/firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";

function Login() {
  const [email, setEmail] = useState("mircea.godiac@gmail.com");
  const [password, setPassword] = useState("Fastman123!");
  const [loading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  async function handleLogin() {
    setIsLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);
    } catch (error) {
      console.error("Error signing in", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>CityBreaker</Text>
        <Text style={styles.subHeaderText}>Discover your next adventure</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size={"large"} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
  },
  formContainer: {
    flex: 0.6,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  input: {
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 20,
  },
  forgotPasswordText: {
    color: "#4A90E2",
    fontSize: 14,
  },
  linkText: {
    textAlign: "center",
    color: "#007AFF",
    marginTop: 15,
    fontSize: 16,
  },
});

export default Login;
