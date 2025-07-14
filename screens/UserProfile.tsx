import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { 
    getAuth, 
    reauthenticateWithCredential, 
    updatePassword 
  } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import SideMenu from './SideMenu';
import Toast from "react-native-toast-message";
import { RouteProp, useRoute } from '@react-navigation/native';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

const UserProfile: React.FC = () => {
  const navigation = useNavigation<UserProfileNavigationProp>();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const authInstance = getAuth(getApp());
const route = useRoute<UserProfileRouteProp>();
const { isTrialExpired = true } = route.params || {};

  useEffect(() => {
    const fetchUserData = async () => {
      const user = authInstance.currentUser;
      if (user) {
        setEmail(user.email);
        const subscriptionStatus = await AsyncStorage.getItem(`isSubscribed_${user.uid}`);
        setIsSubscribed(subscriptionStatus === 'true');
      }
    };
    fetchUserData();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openModal = () => {
    setIsModalVisible(true);
    setError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handlePasswordChange = async () => {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    try {
      const user = authInstance.currentUser;
      if (user && user.email) {
        const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Password updated successfully!",
          visibilityTime: 4000,
          autoHide: true,
          position: "top",
        });
        closeModal();
      }
    } catch (error: any) {
      console.error('Password Change Error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={['#FFF8E7', '#FFEFD5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Profile</Text>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.userIconContainer}>
          <Text style={styles.userIcon}>👤</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{email || 'Not available'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Subscription Status:</Text>
          <Text style={[styles.value, isSubscribed ? styles.premiumText : styles.freeText]}>
            {isSubscribed ? 'Premium' : 'Free Trial'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={openModal}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#F59E0B", "#FBBF24"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Change Password</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#EF4444", "#F87171"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKeyboardContainer}
          >
            <LinearGradient
              colors={['#FFF8E7', '#FFEFD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}>Change Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Current Password"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor="#6B7280"
                />
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#EF4444", "#F87171"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handlePasswordChange}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#F59E0B", "#FBBF24"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Update</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <SideMenu
  isOpen={isMenuOpen}
  onClose={() => setIsMenuOpen(false)}
  isSubscribed={isSubscribed}
  isTrialExpired={isTrialExpired}
/>
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 10,
    paddingLeft: 0,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 20,
    marginRight: 26,
    marginLeft: 78,
  },
  profileContainer: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  userIconContainer: {
    marginBottom: 30,
  },
  userIcon: {
    fontSize: 60,
    color: '#1F2937',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 50,
    width: 80,
    height: 80,
    textAlign: 'center',
    lineHeight: 80,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '500',
  },
  premiumText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  freeText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  changePasswordButton: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  backButton: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 20,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  menuButton: {
    padding: 5,
    marginLeft: -5,
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 28,
    color: '#1F2937',
    paddingLeft: 0,
    marginLeft: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalKeyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#1F2937',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButton: {},
  cancelButton: {},
});

export default UserProfile;