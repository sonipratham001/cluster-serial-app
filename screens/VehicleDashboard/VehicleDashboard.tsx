import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import VehicleDashboardUI from './VehicleDashboardUI';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import { BluetoothContext } from '../../services/BluetoothServices';
import Orientation from 'react-native-orientation-locker';

const VehicleDashboard = () => {
  const {
    data: batteryData,
    connectedDevice: batteryConnected,
  } = useContext(BatteryBluetoothContext) || {
    data: {},
    connectedDevice: null,
  };

  const { connectedDevice: bldcConnected } = useContext(BluetoothContext) || { connectedDevice: null };
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  const mcu1 = batteryData.messageMCU1 || {};
  const diu4 = batteryData.messageDIU4 || {};
  const diu2 = batteryData.messageDIU2 || {};
  const driveParams = batteryData.messageDriveParameters || {};
  const gpio = batteryData.gpioStates?.states || {};
  const batteryFaults = batteryData.messageDIU1?.faultMessages;
  const motorFaults = batteryData.messageMCU3?.faultMessages;

  const batteryHasFault =
    batteryFaults && batteryFaults.length > 0 && !batteryFaults.includes('No Faults Detected');
  const motorHasFault =
    motorFaults && motorFaults.length > 0 && !motorFaults.includes('No Faults Detected');

  let gear: 'f' | 'n' | 'r' = 'n';
  if (gpio.FWD_OUT) gear = 'f';
  else if (gpio.REV_OUT) gear = 'r';
  else if (gpio.NEUTRAL_OUT) gear = 'n';

  const getGlowColor = (speed: number | undefined): { color: string; intensity: number } => {
    if (speed == null) return { color: '#3b82f6', intensity: 0.4 };

    if (speed <= 30) {
      const intensity = speed / 30;
      return { color: '#22c55e', intensity }; // green
    }

    if (speed <= 60) {
      const intensity = (speed - 30) / 30;
      return { color: '#facc15', intensity }; // yellow
    }

    const intensity = Math.min((speed - 60) / 40, 1);
    return { color: '#ef4444', intensity }; // red
  };

  const { color: glowColor, intensity: glowIntensity } = getGlowColor(mcu1.speed);

  return (
    <SafeAreaView style={styles.fullScreen}>
      <VehicleDashboardUI
        speed={mcu1.speed}
        time={time}
        batteryPercentage={diu4.stateOfCharge}
        gear={gear}
        mode={gpio.ECO_OUT ? 'eco' : gpio.SPORTS_OUT ? 'sports' : undefined}
        range={diu4.distanceToEmpty}
        odometer={batteryData.messageMCU2?.odometer}
        glowColor={glowColor}
        glowIntensity={glowIntensity}
        batteryHasFault={batteryHasFault}
        motorHasFault={motorHasFault}
        turnSignal={gpio.LEFT_OUT ? 'left' : gpio.RIGHT_OUT ? 'right' : null}
        brakeStatus={{
          bf: !!gpio.BRAKE_OUT,
          hb: false,
          s: false,
        }}
        headlightStatus={{
          low: gpio.LOWB_OUT,
          high: gpio.HIGHB_OUT,
          hazard: false,
          service: false,
        }}
        isConnected={!!(batteryConnected || bldcConnected)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
});

export default VehicleDashboard;