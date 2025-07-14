import React, { useEffect, useState, useContext } from "react";
import {
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { BatteryBluetoothContext } from "./services/BatteryBluetoothProvider";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ImmersiveMode from "react-native-immersive-mode"; // ✅ Correct import
import 'react-native-get-random-values';
// Screens
import HomeScreen from "./screens/HomeScreen";
import DashboardScreen from "./screens/Dashboard";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import Subscription from "./screens/SubscriptionScreen";
import PaymentScreen from "./screens/PaymentScreen";
import HistoryScreen from "./screens/HistoryScreen";
import UserProfile from "./screens/UserProfile";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import BatteryDashboardScreen from "./screens/BatteryDashboardScreen";
import VerifyEmailScreen from "./screens/VerifyEmailScreen";
import MenuScreen from "./screens/MenuScreen/MenuScreen";
import BatteryHealth from './screens/BatteryHealth/BatteryHealth';
import MotorHealth from "./screens/MotorHealth/MotorHealth";
import Youtube from "./screens/Youtube/Youtube";
import Map from "./screens/MapsScreen/Map";
import ExportDataScreen from "./screens/ExportData/ ExportDataScreen";
import { RNSerialport } from '@fugood/react-native-usb-serialport'; // ✅ Added import
// Providers
import { BluetoothProvider } from "./services/BluetoothServices";
import { BatteryBluetoothProvider } from "./services/BatteryBluetoothProvider";
import { BluetoothPopupProvider } from "./screens/Context/BluetoothPopupContext";
import { LocationProvider } from './screens/Context/LocationContext';
// Components
import BluetoothPopup from "./screens/components/BluetoothPopup";
import Toast from "react-native-toast-message";

import { enableScreens } from 'react-native-screens';
enableScreens();

// Stack type
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Dashboard: undefined;
  Subscription: undefined;
  PaymentScreen: undefined;
  History: undefined;
  UserProfile: undefined;
  BatteryHealth: undefined;
  VerifyEmail: undefined;
  MenuScreen: undefined;
  MotorHealth: undefined;
  Youtube: undefined;
  Map: undefined;
  ExportDataScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [loading, setLoading] = useState(true);
  const [usbServiceReady, setUsbServiceReady] = useState(false);
  const batteryContext = useContext(BatteryBluetoothContext);

  // Initialize USB service and auto-connect
  useEffect(() => {
    if (Platform.OS === "android") {
      console.log("🚀 Starting USB service...");
      try {
        // Start USB service
        ImmersiveMode.fullLayout(true);
        ImmersiveMode.setBarMode("FullSticky");
        // @ts-ignore – enterImmersive is a runtime method not declared in types
        ImmersiveMode.enterImmersive?.();
        // Initialize USB service
        RNSerialport.startUsbService();
        console.log("✅ USB service started");
        setUsbServiceReady(true);
      } catch (error) {
        console.error("❌ Failed to start USB service:", error);
      }
    } else {
      setUsbServiceReady(true); // No USB service needed on iOS
    }

    // Auto-connect after service is ready
    if (usbServiceReady && batteryContext?.connectToFirstAvailableDevice) {
      console.log("🚀 Auto-connecting to USB device...");
      batteryContext.connectToFirstAvailableDevice();
    }

    // Cleanup on unmount
    return () => {
      if (Platform.OS === "android") {
        RNSerialport.stopUsbService();
      }
    };
  }, [usbServiceReady, batteryContext]);

  // Set loading to false after initialization
  useEffect(() => {
    if (usbServiceReady) {
      setLoading(false);
    }
  }, [usbServiceReady]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        hidden={true}
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <SafeAreaProvider>
        <LocationProvider>
          <BluetoothProvider>
            <BatteryBluetoothProvider>
              <BluetoothPopupProvider>
                <NavigationContainer ref={navigationRef}>
                  <Stack.Navigator
                    screenOptions={{
                      headerShown: false,
                      gestureEnabled: true,
                      animation: 'slide_from_right',
                      animationDuration: 300,
                      contentStyle: { backgroundColor: '#000' },
                    }}
                  >
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="Subscription" component={Subscription} />
                    <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
                    <Stack.Screen name="History" component={HistoryScreen} />
                    <Stack.Screen name="UserProfile" component={UserProfile} />
                    <Stack.Screen name="BatteryHealth" component={BatteryHealth} />
                    <Stack.Screen name="MenuScreen" component={MenuScreen} />
                    <Stack.Screen name="MotorHealth" component={MotorHealth} />
                    <Stack.Screen name="Youtube" component={Youtube} />
                    <Stack.Screen name="Map" component={Map} />
                    <Stack.Screen name="ExportDataScreen" component={ExportDataScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
                  </Stack.Navigator>
                </NavigationContainer>

                <BluetoothPopup />
                <Toast />
              </BluetoothPopupProvider>
            </BatteryBluetoothProvider>
          </BluetoothProvider>
        </LocationProvider>
      </SafeAreaProvider>
    </>
  );
};

export default App;