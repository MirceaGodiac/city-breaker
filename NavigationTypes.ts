import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  ScanPage: undefined;
  "For You": undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  LandmarkDetails: {
    info?: string;
    landmarkName?: string;
    base64?: string;
    locationGPS?: string;
    timestamp?: string;
    description?: string;
  };
  ScanRating: {
    scanData: {
      info?: string;
      landmarkName?: string;
      base64?: string;
      locationGPS?: string;
      timestamp?: string;
      description?: string;
    };
    isPublic: boolean;
  };
};