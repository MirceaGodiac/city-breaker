import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Login from "./app/screens/login";
import ScanPage from "./app/screens/ScanPage";
import Reccomendations from "./app/screens/reccomendations";
import Profile from "./app/screens/Profile";
import LandmarkDetails from "./app/screens/LandmarkDetails";
import ScanRating from "./app/screens/ScanRating";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./assets/firebase-config";
import { ThemeProvider } from "./app/context/ThemeContext";
import { RootStackParamList, BottomTabParamList } from "./NavigationTypes";

const Stack = createNativeStackNavigator<RootStackParamList>();
const BottomTab = createBottomTabNavigator<BottomTabParamList>();

function InsideLayout() {
  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "ScanPage") {
            iconName = focused ? "scan" : "scan-outline";
          } else if (route.name === "For You") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={30} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <BottomTab.Screen name="ScanPage" component={ScanPage} />
      <BottomTab.Screen name="For You" component={Reccomendations} />
      <BottomTab.Screen name="Profile" component={Profile} />
    </BottomTab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user ? user : null);
    });
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {user ? (
            <>
              <Stack.Screen
                name="InsideLayout"
                component={InsideLayout}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="LandmarkDetails" component={LandmarkDetails} options={{ headerShown: false }} />
              <Stack.Screen name="ScanRating" component={ScanRating} options={{ headerShown: false }} />
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
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 80,
    backgroundColor: "#ffffff",
    borderTopColor: "#e0e0e0",
    paddingBottom: 10,
    paddingTop: 5,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginHorizontal: 0,
    borderRadius: 0,
    borderTopWidth: 0,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});
