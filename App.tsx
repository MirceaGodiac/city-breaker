import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
// @ts-ignore
import { NavigationContainer } from "@react-navigation/native";
// @ts-ignore
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Login from "./app/screens/login";
import ScanPage from "./app/screens/ScanPage";
import Reccomendations from "./app/screens/reccomendations";
import Profile from "./app/screens/Profile";
import Settings from "./app/screens/Settings";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./assets/firebase-config";
import LandmarkDetails from "./app/screens/LandmarkDetails";
import ScanRating from "./app/screens/ScanRating";

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

function InsideLayout() {
  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "ScanPage") {
            iconName = focused ? "scan" : "scan-outline";
          } else if (route.name === "Reccomendations") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <BottomTab.Screen name="ScanPage" component={ScanPage} />
      <BottomTab.Screen name="Reccomendations" component={Reccomendations} />
      <BottomTab.Screen name="Profile" component={Profile} />
      <BottomTab.Screen name="Settings" component={Settings} />
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
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
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
});
