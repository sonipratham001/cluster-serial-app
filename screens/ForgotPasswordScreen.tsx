import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import { getAuth, sendPasswordResetEmail } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import Toast from "react-native-toast-message";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const authInstance = getAuth(getApp());

  const handleResetPassword = async () => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter your email address to reset your password.",
        visibilityTime: 4000,
        autoHide: true,
        position: "bottom",
      });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(authInstance, email);
      Toast.show({
        type: "success",
        text1: "Password Reset Email Sent!",
        text2: "Please check your inbox.",
        visibilityTime: 4000,
        autoHide: true,
        position: "bottom",
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to send password reset email.",
        visibilityTime: 4000,
        autoHide: true,
        position: "bottom",
      });
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#FFF8E7", "#FFEFD5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.innerContainer}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address to receive a password reset link.
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["#F59E0B", "#FBBF24"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Email</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkContainer}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Back to <Text style={styles.linkHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  input: {
    width: "100%",
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#1F2937",
  },
  button: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  linkContainer: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  linkHighlight: {
    fontWeight: "600",
    color: "#F59E0B",
    textDecorationLine: "underline",
  },
});

export default ForgotPasswordScreen;