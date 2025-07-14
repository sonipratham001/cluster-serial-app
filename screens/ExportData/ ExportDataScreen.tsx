import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import Papa from 'papaparse';
import Share from 'react-native-share';
import { encode } from 'base-64';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../components/BottomNavBar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ExportDataScreen = () => {
  const { data = {}, connectedDevice } = useContext(BatteryBluetoothContext);
  const [recordedData, setRecordedData] = useState<any[]>([]);
  const rotation = useRef(new Animated.Value(0)).current;

  // Extract message blocks
  const {
    messageDIU1 = {}, messageDIU2 = {}, messageDIU3 = {}, messageDIU4 = {},
    messageDIU14 = {}, messageDriveParameters = {}, messageMCU1 = {},
    messageMCU2 = {}, messageMCU3 = {}
  } = data;

  useEffect(() => {
    const intervalId: ReturnType<typeof setInterval> = setInterval(() => {
      const newData = {
        timestamp: new Date().toISOString(),
        soc: messageDIU4.stateOfCharge?.toFixed(1) || 0,
        batteryCurrent: messageDIU2.batteryCurrent?.toFixed(1) || 0,
        minCellVoltage: messageDIU3.minCellVoltage?.toFixed(3) || 0,
        maxCellVoltage: messageDIU3.maxCellVoltage?.toFixed(3) || 0,
        maxCellTemp: messageDriveParameters.maxCellTemp || 0,
        minCellTemp: messageDriveParameters.minCellTemp || 0,
        availableEnergy: messageDriveParameters.availableEnergy?.toFixed(2) || 0,
        driveCurrentLimit: messageDIU2.driveCurrentLimit || 0,
        regenCurrentLimit: messageDIU2.regenCurrentLimit || 0,
        controllerTemperature: messageMCU1.controllerTemperature || 0,
        motorTemperature: messageMCU1.motorTemperature || 0,
        rmsCurrent: messageMCU1.rmsCurrent?.toFixed(1) || 0,
        throttle: messageMCU1.throttle || 0,
        brake: messageMCU1.brake || 0,
        speed: messageMCU1.speed || 0,
        motorRPM: messageMCU2.motorRPM || 0,
        capacitorVoltage: messageMCU2.capacitorVoltage?.toFixed(1) || 0,
        odometer: messageMCU2.odometer?.toFixed(1) || 0,
        controllerFaults: messageMCU3.faultMessages?.join(', ') || 'None',
      };
      setRecordedData(prev => [...prev, newData]);
    }, 10);

    return () => clearInterval(intervalId);
  }, [data]);

  const handleExport = async () => {
    if (!recordedData.length) {
      Toast.show({ type: 'info', text1: 'No data to export' });
      return;
    }

    animateRotation();

    const csv = Papa.unparse(recordedData);
    const filename = `export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const base64Data = encode(csv);

    try {
      await Share.open({
        title: 'Share CSV',
        url: `data:text/csv;base64,${base64Data}`,
        filename,
        type: 'text/csv',
      });
      Toast.show({ type: 'success', text1: 'Exported Successfully' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Export Failed' });
    }
  };

  const animateRotation = () => {
    rotation.setValue(0);
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: 1 }
    ).start();
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#0a0f1c', '#1f2937', '#111827']} style={styles.container}>
      <Text style={styles.header}>Export Battery & Motor Data</Text>
      <Text style={styles.subText}>Recorded Points: {recordedData.length}</Text>

      <TouchableOpacity style={styles.iconWrapper} onPress={handleExport}>
        <Animated.View style={[styles.iconCircle, { transform: [{ rotate: spin }] }]}>
          <Icon name="export-variant" size={60} color="#facc15" />
        </Animated.View>
        <Text style={styles.iconLabel}>Export</Text>
      </TouchableOpacity>

      <BottomNavBar />
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#facc15',
    textAlign: 'center',
  },
  subText: {
    color: '#cbd5e1',
    marginTop: 4,
    fontSize: 14,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 25,
    gap: 10,
  },
  iconCircle: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 60,
    // elevation: 4,
  },
  iconLabel: {
    color: '#f9fafb',
    fontSize: 16,
    marginTop: 6,
  },
});

export default ExportDataScreen;