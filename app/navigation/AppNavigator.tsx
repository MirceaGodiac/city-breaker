import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Reccomendations from '../screens/reccomendations';
import ReviewsScreen from '../screens/Reviews';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;