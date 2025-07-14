import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Button, View, Text, ActivityIndicator } from 'react-native';
import VehicleDashboardUI from './VehicleDashboardUI';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import { BluetoothContext } from '../../services/BluetoothServices';
import Orientation from 'react-native-orientation-locker';

const VehicleDashboard = () => {
  const {
    data: batteryData,
    connectedDevice: batteryConnected,
    connectToFirstAvailableDevice,
    disconnectDevice,
  } = useContext(BatteryBluetoothContext) || {
    data: {},
    connectedDevice: null,
    connectToFirstAvailableDevice: async () => {},
    disconnectDevice: async () => {},
  };

  const { connectedDevice: bldcConnected } = useContext(BluetoothContext) || { connectedDevice: null };
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  // 🔧 Debug handlers
  const handleConnectUSB = async () => {
    setIsConnecting(true);
    setConnectionStatus("Connecting...");
    console.log("🔌 Trying to connect to first USB device...");
    try {
      await connectToFirstAvailableDevice?.();
      console.log("✅ USB connection attempted");
      setConnectionStatus("Connected");
    } catch (error) {
      console.error("❌ Failed to connect to USB:", error);
      setConnectionStatus("Connection Failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectUSB = async () => {
    setIsConnecting(true);
    setConnectionStatus("Disconnecting...");
    console.log("🔌 Disconnecting from USB device...");
    try {
      await disconnectDevice?.();
      console.log("✅ USB disconnected");
      setConnectionStatus("Disconnected");
    } catch (error) {
      console.error("❌ Failed to disconnect USB:", error);
      setConnectionStatus("Disconnect Failed");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.fullScreen}>
      {/* ⚙️ Debug Buttons and Status */}
      <View style={styles.debugControls}>
        <View style={styles.debugButtons}>
          <Button
            title={isConnecting ? "Connecting..." : "Connect USB"}
            onPress={handleConnectUSB}
            disabled={isConnecting}
          />
          <Button
            title={isConnecting ? "Disconnecting..." : "Disconnect USB"}
            onPress={handleDisconnectUSB}
            disabled={isConnecting}
          />
        </View>
        {connectionStatus && (
          <View style={styles.status}>
            <Text style={styles.statusText}>{connectionStatus}</Text>
          </View>
        )}
      </View>

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
  debugControls: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 999,
    flexDirection: 'column',
    gap: 4,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  status: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default VehicleDashboard;