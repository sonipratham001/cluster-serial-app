import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { BatteryBluetoothContext } from "../services/BatteryBluetoothProvider";
import LinearGradient from "react-native-linear-gradient";
import SideMenu from "./SideMenu";
import Papa from 'papaparse';
import Share from 'react-native-share';
import { encode } from 'base-64';
import Toast from "react-native-toast-message";
import { useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigationTypes';



const BatteryDashboardScreen = () => {
  const { data = {}, connectedDevice } = useContext(BatteryBluetoothContext);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
const route = useRoute<NativeStackScreenProps<RootStackParamList, 'BatteryDashboard'>['route']>();
const { isSubscribed, isTrialExpired } = route.params ?? { isSubscribed: false, isTrialExpired: true };

  const messageDIU1 = data.messageDIU1 || {};
  const messageDIU2 = data.messageDIU2 || {};
  const messageDIU3 = data.messageDIU3 || {};
  const messageDIU4 = data.messageDIU4 || {};
  const messageDIU14 = data.messageDIU14 || {};
  const messageDriveParameters = data.messageDriveParameters || {};
  const messageMCU1 = data.messageMCU1 || {};
  const messageMCU2 = data.messageMCU2 || {};
  const messageMCU3 = data.messageMCU3 || {};

  useEffect(() => {
    console.log("Connected Device:", connectedDevice ? "Yes" : "No");
    console.log("Dashboard Data:", data);
  }, [connectedDevice, data]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRecording && connectedDevice) {
      intervalId = setInterval(() => {
        const currentData = {
          timestamp: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          soc: messageDIU4.stateOfCharge?.toFixed(1) || 0,
          batteryCurrent: messageDIU2.batteryCurrent?.toFixed(1) || 0,
          minCellVoltage: messageDIU3.minCellVoltage?.toFixed(3) || 0,
          maxCellVoltage: messageDIU3.maxCellVoltage?.toFixed(3) || 0,
          maxCellTemp: messageDriveParameters.maxCellTemp || 0,
          minCellTemp: messageDriveParameters.minCellTemp || 0,
          availableEnergy: messageDriveParameters.availableEnergy?.toFixed(2) || 0,
          driveCurrentLimit: messageDIU2.driveCurrentLimit || 0,
          regenCurrentLimit: messageDIU2.regenCurrentLimit || 0,
          vehicleModeRequest: messageDIU2.vehicleModeRequest || 0,
          keyOnIndicator: messageDIU4.keyOnIndicator || 0,
          controllerTemperature: messageMCU1.controllerTemperature || 0,
          motorTemperature: messageMCU1.motorTemperature || 0,
          rmsCurrent: messageMCU1.rmsCurrent?.toFixed(1) || 0,
          throttle: messageMCU1.throttle || 0,
          brake: messageMCU1.brake || 0,
          speed: messageMCU1.speed || 0,
          driveMode: messageMCU1.driveMode || 0,
          motorRPM: messageMCU2.motorRPM || 0,
          capacitorVoltage: messageMCU2.capacitorVoltage?.toFixed(1) || 0,
          odometer: messageMCU2.odometer?.toFixed(1) || 0,
          controllerFaults: messageMCU3.faultMessages?.join(", ") || "None",
        };
        setRecordedData(prev => [...prev, currentData]);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording, connectedDevice, messageDIU4, messageDIU2, messageDIU3, messageDriveParameters, messageMCU1, messageMCU2, messageMCU3]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const startRecording = () => {
    if (connectedDevice) {
      setIsRecording(true);
      Toast.show({
        type: 'success',
        text1: 'Recording Started',
        text2: 'Data recording has begun.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Cannot Start Recording',
        text2: 'No BMS connection detected.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordedData.length > 0) {
      setShowShareModal(true);
    } else {
      Toast.show({
        type: 'error',
        text1: 'No Data Recorded',
        text2: 'No data available to share.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    }
  };

  const handleShare = async () => {
    setShowShareModal(false);
    const csv = Papa.unparse(recordedData, {
      header: true,
      columns: [
        "timestamp",
        "soc",
        "batteryCurrent",
        "minCellVoltage",
        "maxCellVoltage",
        "maxCellTemp",
        "minCellTemp",
        "availableEnergy",
        "driveCurrentLimit",
        "regenCurrentLimit",
        "vehicleModeRequest",
        "keyOnIndicator",
        "controllerTemperature",
        "motorTemperature",
        "rmsCurrent",
        "throttle",
        "brake",
        "speed",
        "driveMode",
        "motorRPM",
        "capacitorVoltage",
        "odometer",
        "controllerFaults",
      ],
    });
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/[/:]/g, '-');
    const filename = `battery_data_${timestamp}.csv`;
    console.log("Generated CSV:", csv);

    try {
      const base64Data = encode(csv);
      console.log("Base64 Data:", base64Data);
      await Share.open({
        title: 'Share Battery Data',
        message: 'Battery data recorded on ' + new Date().toLocaleString(),
        url: `data:text/csv;base64,${base64Data}`,
        filename: filename,
        type: 'text/csv',
      });
      console.log("Share operation completed successfully");
      Toast.show({
        type: 'success',
        text1: 'Data Shared',
        text2: 'Battery data shared successfully.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    } catch (error) {
      console.error("Share error:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Share',
        text2: 'Unable to share the data.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    }

    setRecordedData([]);
  };

  const handleCancel = () => {
    setShowShareModal(false);
    setRecordedData([]);
    Toast.show({
      type: 'info',
      text1: 'Recording Cancelled',
      text2: 'Data recording has been cancelled.',
      visibilityTime: 4000,
      autoHide: true,
      position: 'top',
    });
  };

  const faultsPresent = (message: any) => (message.faultMessages?.length || 1) > 1;

  return (
    <LinearGradient
      colors={["#FFF8E7", "#FFEFD5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}> Sun Mobility BMS Dashboard</Text>
      </View>

      {connectedDevice ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.dataContainer}>
            <Text style={styles.sectionTitle}>🔋 Battery Metrics</Text>
            <Text style={styles.dataText}>📊 SOC: {messageDIU4.stateOfCharge?.toFixed(1) || 0}%</Text>
            <Text style={styles.dataText}>🔌 Battery Current: {messageDIU2.batteryCurrent?.toFixed(1) || 0} A</Text>
            <Text style={styles.dataText}>⚡ Min Cell Voltage: {messageDIU3.minCellVoltage?.toFixed(3) || 0} V</Text>
            <Text style={styles.dataText}>⚡ Max Cell Voltage: {messageDIU3.maxCellVoltage?.toFixed(3) || 0} V</Text>
            <Text style={styles.dataText}>🌡️ Max Cell Temp: {messageDriveParameters.maxCellTemp || 0} °C</Text>
            <Text style={styles.dataText}>🌡️ Min Cell Temp: {messageDriveParameters.minCellTemp || 0} °C</Text>
            <Text style={styles.dataText}>🔋 Available Energy: {messageDriveParameters.availableEnergy?.toFixed(2) || 0} kWh</Text>
            <Text style={styles.dataText}>🔌 Drive Current Limit: {messageDIU2.driveCurrentLimit || 0} A</Text>
            <Text style={styles.dataText}>🔌 Regen Current Limit: {messageDIU2.regenCurrentLimit || 0} A</Text>
            <Text style={styles.dataText}>🚗 Vehicle Mode Request: {messageDIU2.vehicleModeRequest || 0}</Text>
            <Text style={styles.dataText}>🔑 Key On Indicator: {messageDIU4.keyOnIndicator || 0}</Text>

            <Text style={styles.sectionTitle}>🛠️ Controller Metrics (MCU1)</Text>
            <Text style={styles.dataText}>🌡️ Controller Temperature: {messageMCU1.controllerTemperature || 0} °C</Text>
            <Text style={styles.dataText}>🌡️ Motor Temperature: {messageMCU1.motorTemperature || 0} °C</Text>
            <Text style={styles.dataText}>🔌 RMS Current: {messageMCU1.rmsCurrent?.toFixed(1) || 0} Arms</Text>
            <Text style={styles.dataText}>🎮 Throttle: {messageMCU1.throttle || 0}%</Text>
            <Text style={styles.dataText}>🛑 Brake: {messageMCU1.brake || 0}%</Text>
            <Text style={styles.dataText}>🚀 Speed: {messageMCU1.speed || 0} kmph</Text>
            <Text style={styles.dataText}>⚙️ Drive Mode: {messageMCU1.driveMode || 0} {getDriveModeText(messageMCU1.driveMode)}</Text>

            <Text style={styles.sectionTitle}>🏍️ Motor Metrics (MCU2)</Text>
            <Text style={styles.dataText}>🔄 Motor RPM: {messageMCU2.motorRPM || 0} RPM</Text>
            <Text style={styles.dataText}>⚡ Capacitor Voltage: {messageMCU2.capacitorVoltage?.toFixed(1) || 0} V</Text>
            <Text style={styles.dataText}>🛣️ Odometer: {messageMCU2.odometer?.toFixed(1) || 0} km</Text>

            <Text style={styles.sectionTitle}>⚠️ Faults (DIU1)</Text>
            {(messageDIU1.faultMessages || ["No Faults Detected"]).map((fault: string, index: number) => (
              <Text key={`diu1-${index}`} style={[styles.dataText, faultsPresent(messageDIU1) && styles.warning]}>
                {fault}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>⚠️ Faults (DIU14)</Text>
            <Text style={styles.dataText}>⚠️ SOC/Pack Voltage Imbalance: <Text style={messageDIU14.socOrPackVoltageImbalance ? styles.warning : styles.success}>{messageDIU14.socOrPackVoltageImbalance ? "Yes" : "No"}</Text></Text>
            <Text style={styles.dataText}>⚠️ Sev Under Voltage Any BP: <Text style={messageDIU14.batterySevUnderVtgAnyBP ? styles.warning : styles.success}>{messageDIU14.batterySevUnderVtgAnyBP ? "Yes" : "No"}</Text></Text>
            <Text style={styles.dataText}>⚠️ Sev Over Voltage Any BP: <Text style={messageDIU14.batterySevOverVtgAnyBP ? styles.warning : styles.success}>{messageDIU14.batterySevOverVtgAnyBP ? "Yes" : "No"}</Text></Text>
            <Text style={styles.dataText}>⚠️ Over Current All BP: <Text style={messageDIU14.overCurrentAllBP ? styles.warning : styles.success}>{messageDIU14.overCurrentAllBP ? "Yes" : "No"}</Text></Text>
            <Text style={styles.dataText}>⚠️ Over Current Any BP: <Text style={messageDIU14.overCurrentAnyBP ? styles.warning : styles.success}>{messageDIU14.overCurrentAnyBP ? "Yes" : "No"}</Text></Text>

            <Text style={styles.sectionTitle}>⚠️ Controller Faults (MCU3)</Text>
            {(messageMCU3.faultMessages || ["No Faults Detected"]).map((fault: string, index: number) => (
              <Text key={`mcu3-${index}`} style={[styles.dataText, faultsPresent(messageMCU3) && styles.warning]}>
                {fault}
              </Text>
            ))}
          </View>

          {isRecording && <Text style={styles.recordingText}>🔴 Recording...</Text>}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, !connectedDevice && styles.disabledButton]}
              onPress={startRecording}
              disabled={!connectedDevice || isRecording}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#F59E0B", "#FBBF24"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Start Recording</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, !isRecording && styles.disabledButton]}
              onPress={stopRecording}
              disabled={!isRecording}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#F59E0B", "#FBBF24"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Stop Recording</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.disconnected}>❌ Not Connected to BMS</Text>
      )}

      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#FFF8E7", "#FFEFD5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Share Data</Text>
            <Text style={styles.modalMessage}>
              Recording stopped. Would you like to share the data?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#EF4444", "#F87171"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#F59E0B", "#FBBF24"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.modalButtonText}>Share</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
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

const getDriveModeText = (mode: number) => {
  const modes: { [key: number]: string } = {
    0: "(Stop)",
    1: "(Run)",
    2: "(Forward)",
    3: "(Reverse)",
    4: "(Neutral)",
    5: "(Fault)",
    6: "(Unknown)",
    7: "(Unknown)",
  };
  return modes[mode] || "";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginBottom: 20,
    paddingLeft: 0,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 20,
    alignItems: "center",
  },
  dataContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginVertical: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  dataText: {
    fontSize: 16,
    color: "#1F2937",
    marginVertical: 4,
    paddingHorizontal: 5,
  },
  success: {
    fontWeight: "600",
    color: "#22C55E",
  },
  warning: {
    fontWeight: "600",
    color: "#EF4444",
  },
  disconnected: {
    fontSize: 18,
    color: "#EF4444",
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
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
  recordingText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 10,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    width: "45%",
    borderRadius: 16,
    overflow: "hidden",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 5,
  },
  cancelButton: {},
  shareButton: {},
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default BatteryDashboardScreen;