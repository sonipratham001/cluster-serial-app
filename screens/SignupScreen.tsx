import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import Icon from 'react-native-vector-icons/Feather';
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = () => {
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList, "Signup">
  >();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // In SignupScreen.tsx
const handleSignup = async () => {
  if (!email || !password || !fullName) {
    Alert.alert("Error", "Please fill in all fields.");
    return;
  }

  setLoading(true);
  try {
    // Create user
    const authInstance = getAuth(getApp());
const userCredential = await authInstance.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Send verification email
    await user.sendEmailVerification();

    // Sign out immediately to prevent access
    // await auth().signOut();

    Toast.show({
      type: "success",
      text1: "Verify Your Email",
      text2: "A verification email has been sent. Please verify before logging in.",
      visibilityTime: 5000,
      position: "bottom",
    });

    // Navigate to login screen
    navigation.navigate("VerifyEmail");

  } catch (error: any) {
    Alert.alert("Signup Failed", error.message);
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
        <View style={styles.logoContainer}>
          <Image source={require("../assets/intuteLogo.png")} style={styles.logo} />
        </View>
        <Text style={styles.title}>Create an Account</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#6B7280"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>
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
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
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
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.loginRedirectContainer}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkHighlight}>Login</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    marginLeft: 55,
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
  button: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 20,
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
  loginRedirectContainer: {
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

export default SignupScreen;