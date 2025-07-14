import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { BluetoothContext } from '../../services/BluetoothServices';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBluetoothPopup } from '../Context/BluetoothPopupContext';

const manager = new BleManager();

const BluetoothPopup = () => {
  const { isVisible: visible, hidePopup: onClose } = useBluetoothPopup();

  const {
    connectToDevice: connectBldc,
    disconnectDevice: disconnectBldc,
    connectedDevice: bldcDevice,
  } = useContext(BluetoothContext);

  const {
    connectToDevice: connectBattery,
    disconnectDevice: disconnectBattery,
    connectedDevice: batteryDevice,
  } = useContext(BatteryBluetoothContext);

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      startScan();
      autoConnectToLastDevice();
    }
    return () => {
      manager.stopDeviceScan();
    };
  }, [visible]);

  const requestBluetoothPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) {
          const scan = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
          const connect = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
          const fineLoc = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
          return (
            scan === RESULTS.GRANTED &&
            connect === RESULTS.GRANTED &&
            fineLoc === RESULTS.GRANTED
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      }
      return true;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const startScan = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      console.warn('Bluetooth permissions not granted');
      return;
    }

    const state = await manager.state();
    if (state !== 'PoweredOn') {
      console.warn('Bluetooth is not powered on');
      return;
    }

    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices(prev => {
          if (!prev.find(d => d.id === device.id)) return [...prev, device];
          return prev;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 8000);
  };

  const autoConnectToLastDevice = async () => {
    const lastId = await AsyncStorage.getItem('lastConnectedDeviceId');
    if (!lastId) return;

    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) return;

      if (device?.id === lastId) {
        manager.stopDeviceScan();
        await handleConnect(device);
      }
    });

    setTimeout(() => manager.stopDeviceScan(), 8000);
  };

  const handleConnect = async (device: Device) => {
    try {
      await connectBldc(device);
      await connectBattery(device);
      await AsyncStorage.setItem('lastConnectedDeviceId', device.id);
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    await disconnectBldc();
    await disconnectBattery();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>Bluetooth Devices</Text>

          {isScanning && (
            <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 10 }} />
          )}

          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.deviceItem}>
                <View>
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </View>

                {bldcDevice?.id === item.id || batteryDevice?.id === item.id ? (
                  <Icon name="check-circle" size={24} color="#10b981" />
                ) : (
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => handleConnect(item)}
                  >
                    <Text style={styles.connectText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={
              !isScanning
                ? () => <Text style={styles.empty}>No devices found</Text>
                : undefined
            }
          />

          {(bldcDevice || batteryDevice) && (
            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default BluetoothPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '50%',
    maxHeight: 400,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151',
    marginVertical: 6,
    borderRadius: 12,
  },
  connectBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 20,
  },
  disconnectButton: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  disconnectText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 8,
    backgroundColor: '#111827',
    borderRadius: 20,
  },
});