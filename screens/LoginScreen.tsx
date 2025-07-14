import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../App"; // Adjust path to App.tsx
import {
  getAuth,
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import Icon from "react-native-vector-icons/Feather";
import Toast from "react-native-toast-message";

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Login">>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const authInstance = getAuth(getApp());

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please fill in all fields.");
    return;
  }

  setLoading(true);
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    const user = authInstance.currentUser;

    // Reload user to get updated emailVerified status
    await user?.reload();

    if (user && !user.emailVerified) {
      await authInstance.signOut();  // Immediately sign out
      Toast.show({
        type: "error",
        text1: "Email Not Verified",
        text2: "Please verify your email before logging in.",
        visibilityTime: 4000,
        position: "bottom",
      });
      return;
    }

    // Success login — user is verified
    Toast.show({
      type: "success",
      text1: "Login Successful",
      text2: "Welcome back!",
      visibilityTime: 4000,
      position: "bottom",
    });

    // Navigation is handled by auth state listener in App.tsx

  } catch (error: any) {
    Toast.show({
      type: "error",
      text1: "Login Failed",
      text2: error.message,
      visibilityTime: 4000,
      position: "bottom",
    });
  }

  setLoading(false);
};


  const toggleSecureTextEntry = () => {
    setSecureTextEntry((prev) => !prev);
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
        <View style={styles.logoContainer}>
          <Image source={require("../assets/intuteLogo.png")} style={styles.logo} />
        </View>
        <Text style={styles.title}>Login</Text>
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
        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={toggleSecureTextEntry}
              disabled={loading}
            >
              <Icon
                name={secureTextEntry ? "eye-off" : "eye"}
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.forgotPasswordContainer}
          disabled={loading}
        >
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
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
              <Text style={styles.buttonText}>Login</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
          style={styles.signupRedirectContainer}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Don’t have an account? <Text style={styles.linkHighlight}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
    marginLeft: 65,
  },
  logo: {
    width: 240,
    height: 140,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 30,
    letterSpacing: 0.5,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#1F2937",
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  forgotPasswordContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 20,
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
  signupRedirectContainer: {
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

export default LoginScreen;