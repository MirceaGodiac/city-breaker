import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Reccomendations from '../screens/reccomendations';
import ReviewsScreen from '../screens/Reviews';
// Import any other screens you want to add to this navigator

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Reccomendations">
      <Stack.Screen
        name="Reccomendations"
        component={Reccomendations}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: 'Reviews' }}
      />
      {/* Add additional screens here if needed */}
    </Stack.Navigator>
  );
};

export default AppNavigator;