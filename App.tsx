import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
// @ts-ignore
import { NavigationContainer } from "@react-navigation/native";
// @ts-ignore
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Login from "./app/screens/login";
import Register from "./app/screens/Register";
import ScanPage from "./app/screens/ScanPage";
import Reccomendations from "./app/screens/reccomendations";
import Profile from "./app/screens/Profile";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./assets/firebase-config";
import LandmarkDetails from "./app/screens/LandmarkDetails";
import ScanRating from "./app/screens/ScanRating";
import ReviewsScreen from "./app/screens/Reviews"; // imported Reviews screen
import BuyPackages from "./app/screens/BuyPackages"; // imported BuyPackages screen

// Add custom scan button component
const CustomScanButton = ({ onPress, accessibilityState, ...props }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.customScanButtonContainer}
    >
      <View style={styles.customScanButton}>
        <Ionicons name="camera" size={30} color="white" />
      </View>
    </TouchableOpacity>
  );
};

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

function InsideLayout() {
  return (
    <BottomTab.Navigator
      initialRouteName="Scan"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name !== "Scan") {
            let iconName;
            if (route.name === "For You") {
              iconName = focused ? "list" : "list-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          }
          return null; // icon rendered in custom button for Scan
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <BottomTab.Screen name="For You" component={Reccomendations} />
      <BottomTab.Screen
        name="Scan"
        component={ScanPage}
        options={{
          tabBarLabel: "",
          tabBarButton: (props) => <CustomScanButton {...props} />,
        }}
      />
      <BottomTab.Screen name="Profile" component={Profile} />
    </BottomTab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {user ? (
          <>
            <Stack.Screen
              name="InsideLayout"
              component={InsideLayout}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LandmarkDetails"
              component={LandmarkDetails}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ScanRating"
              component={ScanRating}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Reviews"
              component={ReviewsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BuyPackages"
              component={BuyPackages}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={Register}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    height: 60,
    backgroundColor: "#ffffff",
    borderTopColor: "#e0e0e0",
    paddingBottom: 5,
    paddingTop: 5,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    margin: 10,
    borderRadius: 20,
    borderTopWidth: 0,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  // New styles for the custom scan button:
  customScanButtonContainer: {
    top: -30, // lifts the button above the nav bar
    justifyContent: "center",
    alignItems: "center",
  },
  customScanButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#007AFF", // blue border
    backgroundColor: "#007AFF", // blue background
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
});
