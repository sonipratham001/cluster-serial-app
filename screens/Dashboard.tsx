import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { BluetoothContext } from '../services/BluetoothServices';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import LinearGradient from 'react-native-linear-gradient';
import { getFirestore, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import Speedometer from 'react-native-speedometer';
import SideMenu from './SideMenu';

type DashboardScreenRouteProp = {
  params: {
    isSubscribed: boolean;
    isTrialExpired: boolean;
  };
};

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Dashboard'>>();
  const route = useRoute() as DashboardScreenRouteProp;
  const { isSubscribed, isTrialExpired } = route.params;

  const { data = {}, connectedDevice } = useContext(BluetoothContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const message1 = data.message1 || {};
  const message2 = data.message2 || {};

  useEffect(() => {
    const authInstance = getAuth(getApp());
    const db = getFirestore(getApp());

    const saveData = async () => {
      if (
        connectedDevice &&
        data.message1 &&
        !data.message1.error &&
        data.message2 &&
        !data.message2.error
      ) {
        const user = authInstance.currentUser;
        if (user) {
          const combinedData = {
            speed: data.message1.speed,
            voltage: data.message1.voltage,
            current: data.message1.current,
            errorCode: data.message1.errorCode,
            errorMessages: data.message1.errorMessages,
            throttle: data.message2.throttle,
            controllerTemp: data.message2.controllerTemp,
            motorTemp: data.message2.motorTemp,
            controllerStatus: data.message2.controllerStatus,
            switchSignals: data.message2.switchSignals,
            timestamp: serverTimestamp(),
          };

          try {
            await addDoc(collection(db, 'users', user.uid, 'ev_data'), combinedData);
            console.log('Data saved successfully');
          } catch (error) {
            console.error('Error saving data:', error);
          }
        }
      }
    };

    saveData();
    const interval = setInterval(saveData, 300000); // Every 5 min
    return () => clearInterval(interval);
  }, [connectedDevice, data.message1, data.message2]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
        <Text style={styles.title}> BLDC Motor Dashboard</Text>
      </View>

      {connectedDevice ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dataContainer}>
            <View style={styles.speedometerContainer}>
              <Speedometer
                value={message1.speed || 0}
                totalValue={5000}
                size={200}
                showText
                textStyle={styles.speedometerText}
                needleColor="#F59E0B"
                backgroundColor="#FFFFFF"
                arcWidth={15}
                arcBackgroundColor="#E5E7EB"
                customArcs={[
                  { start: 0, end: 1250, color: '#22C55E' },
                  { start: 1250, end: 2500, color: '#FBBF24' },
                  { start: 2500, end: 3750, color: '#F59E0B' },
                  { start: 3750, end: 5000, color: '#EF4444' },
                ]}
              />
            </View>

            <Text style={styles.sectionTitle}>📊 Motor Metrics</Text>
            <Text style={styles.dataText}>⚡ Speed: {message1.speed ?? 'N/A'} RPM</Text>
            <Text style={styles.dataText}>🔋 Battery Voltage: {message1.voltage ?? 'N/A'} V</Text>
            <Text style={styles.dataText}>🔌 Motor Current: {message1.current ?? 'N/A'} A</Text>

            <Text style={styles.sectionTitle}>🎚 Control Metrics</Text>
            <Text style={styles.dataText}>🌡 Controller Temp: {message2.controllerTemp ?? 'N/A'} °C</Text>
            <Text style={styles.dataText}>🌡 Motor Temp: {message2.motorTemp ?? 'N/A'} °C</Text>
            <Text style={styles.dataText}>
              🎛 Throttle Signal: {message2.throttle ? ((message2.throttle / 255) * 5).toFixed(2) : 'N/A'} V
            </Text>

            <Text style={styles.sectionTitle}>🔌 Switch Signals</Text>
            {Object.entries({
              '🚀 Boost': message2.switchSignals?.boost,
              '👣 Footswitch': message2.switchSignals?.footswitch,
              '⏩ Forward': message2.switchSignals?.forward,
              '⏪ Backward': message2.switchSignals?.backward,
              '🛑 Brake': message2.switchSignals?.brake,
              '🔵 Hall C': message2.switchSignals?.hallC,
              '🟡 Hall B': message2.switchSignals?.hallB,
              '🟢 Hall A': message2.switchSignals?.hallA,
            }).map(([label, value]) => (
              <Text key={label} style={styles.dataText}>
                {label}: {value ? 'ON' : 'OFF'}
              </Text>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.disconnected}>❌ Not Connected to Controller</Text>
      )}

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isSubscribed={isSubscribed}
        isTrialExpired={isTrialExpired}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 25,
    marginBottom: 20,
  },
  menuButton: { marginLeft: -7, marginBottom: 18 },
  menuIcon: { fontSize: 30, color: '#000' },
  scrollView: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 20, alignItems: 'center' },
  dataContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  speedometerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    height: 200,
  },
  speedometerText: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dataText: {
    fontSize: 16,
    color: '#1F2937',
    marginVertical: 2,
  },
  disconnected: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default DashboardScreen;