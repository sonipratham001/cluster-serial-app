import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigationTypes';
import { getAuth, signOut } from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed?: boolean | null;
  isTrialExpired?: boolean | null; // NEW
}

const MENU_WIDTH = 250;

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  isSubscribed,
  isTrialExpired,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const auth = getAuth();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const hasAccess = (isSubscribed ?? false) || !(isTrialExpired ?? true); // true if subscribed OR trial not expired

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          slideAnim.setValue(Math.max(gesture.dx, -MENU_WIDTH));
          backdropOpacity.setValue(1 + gesture.dx / MENU_WIDTH);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -MENU_WIDTH / 2) {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: -MENU_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onClose());
        } else {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error: any) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Side Menu */}
      <Animated.View
        style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        {/* Profile */}
        <TouchableOpacity
          style={styles.userIconContainer}
          onPress={() => {
            if (!hasAccess) return;
            navigation.navigate('UserProfile');
            onClose();
          }}
        >
          <Text style={[styles.userIcon, !hasAccess && styles.disabledIcon]}>👤</Text>
        </TouchableOpacity>

        {/* Home */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('Home');
            onClose();
          }}
        >
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>

        {/* Dashboard */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            if (!hasAccess) return;
            navigation.navigate('Dashboard');
            onClose();
          }}
          disabled={!hasAccess}
        >
          <Text style={[styles.buttonText, !hasAccess && styles.disabledText]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* History */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            if (!hasAccess) return;
            navigation.navigate('History');
            onClose();
          }}
          disabled={!hasAccess}
        >
          <Text style={[styles.buttonText, !hasAccess && styles.disabledText]}>
            History
          </Text>
        </TouchableOpacity>

        {/* Battery Dashboard */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            if (!hasAccess) return;
            navigation.navigate('BatteryDashboard');
            onClose();
          }}
          disabled={!hasAccess}
        >
          <Text style={[styles.buttonText, !hasAccess && styles.disabledText]}>
            Battery Dashboard
          </Text>
        </TouchableOpacity>

        {/* Subscribe Now */}
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => {
            navigation.navigate('PaymentScreen');
            onClose();
          }}
        >
          <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.buttonGradient}>
            <Text style={styles.buttonGradientText}>Subscribe Now</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.buttonWrapper} onPress={handleLogout}>
          <LinearGradient colors={['#EF4444', '#F87171']} style={styles.buttonGradient}>
            <Text style={styles.buttonGradientText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sideMenu: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingTop: 50,
    paddingHorizontal: 20,
    borderRightWidth: 0.5,
    borderColor: 'rgba(224, 224, 224, 0.2)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  userIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userIcon: {
    fontSize: 40,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    width: 60,
    height: 60,
    textAlign: 'center',
    lineHeight: 60,
  },
  disabledIcon: {
    color: '#999',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 224, 224, 0.2)',
    paddingLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  buttonWrapper: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonGradientText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SideMenu;