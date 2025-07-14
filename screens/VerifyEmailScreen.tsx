import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getAuth } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigationTypes";

const VerifyEmailScreen = () => {
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList, "VerifyEmail">
  >();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleResend = async () => {
    const user = getAuth(getApp()).currentUser;

    if (countdown > 0) {
      return;
    }

    try {
      setLoading(true);
      await user?.sendEmailVerification();
      Alert.alert("Verification Sent", "Check your inbox or spam folder.");
      setCountdown(60); // Start 60s countdown
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const user = getAuth(getApp()).currentUser;

    try {
      setRefreshing(true);
      await user?.reload();
      if (user?.emailVerified) {
        Alert.alert("Verified!", "Your email has been verified.");
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } else {
        Alert.alert("Not Verified", "Your email is still not verified.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <LinearGradient colors={["#FFF8E7", "#FFEFD5"]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.text}>
          A verification link has been sent to your email. Please verify before logging in.
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            countdown > 0 && { backgroundColor: "#E5E7EB" },
          ]}
          onPress={handleResend}
          disabled={loading || countdown > 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : countdown > 0 ? (
            <Text style={[styles.buttonText, { color: "#9CA3AF" }]}>
              Resend in {countdown}s
            </Text>
          ) : (
            <Text style={styles.buttonText}>Resend Verification Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Refresh Email Status</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#1F2937",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#4B5563",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#F59E0B",
  },
  refreshButton: {
    backgroundColor: "#D97706",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    color: "#F59E0B",
    textDecorationLine: "underline",
  },
});

export default VerifyEmailScreen;