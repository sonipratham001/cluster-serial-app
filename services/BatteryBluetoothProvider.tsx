import React, { createContext, useEffect, useState } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { RNSerialport, actions } from "@fugood/react-native-usb-serialport";
import { Buffer } from "buffer";
import { USE_MOCK_DATA, USE_GPIO_TEST_MODE } from '../src/config';
import { mockBluetoothData } from './mockBluetoothData';

// Create Context
export const BatteryBluetoothContext = createContext<any>(null);

// Error Code Mapping for Msg_DIU1 Faults
const ERROR_CODES: { [key: number]: string } = {
  0: "General Battery Fault",
  1: "Battery Over Temperature",
};

export const BatteryBluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [data, setData] = useState<any>({});
  const [lastDataTime, setLastDataTime] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // Prevent multiple connection attempts

  // Mock data injection
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setData(mockBluetoothData);
      return;
    }
  }, []);

  // Mock and GPIO test mode
  useEffect(() => {
    if (!USE_MOCK_DATA && !USE_GPIO_TEST_MODE) return;

    const interval = setInterval(() => {
      setData((prev: any) => {
        const updatedData: any = { ...prev };
        // [Existing mock data logic remains unchanged]
        return updatedData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Connect to USB device
  const connectToDevice = async (device: any) => {
    if (connectedDevice || isConnecting) {
      console.log("🛑 Already connected or connecting, skipping...");
      return;
    }
    setIsConnecting(true);
    console.log("🛠 Attempting to connect to device:", device);
    try {
      await RNSerialport.connectDevice(device.name, 115200);
      console.log("✅ Port connected:", device.name);
      setConnectedDevice(device.name);
      let accumulatedData: number[] = [];

      const listener = DeviceEventEmitter.addListener(actions.ON_READ_DATA, (event: { deviceName: string; payload: any }) => {
        if (!Array.isArray(event.payload)) {
          console.warn("⚠️ [USB] Invalid payload type:", typeof event.payload, event.payload);
          return;
        }
        accumulatedData = [...accumulatedData, ...event.payload];
        console.log("📦 [USB] Accumulated raw bytes:", accumulatedData);

        const dataString = Buffer.from(accumulatedData).toString('utf8').split('\n').filter(Boolean);
        if (dataString.length > 0) {
          dataString.forEach(base64Val => {
            if (base64Val.trim()) {
              console.log("📦 [USB] Reconstructed Base64 value:", base64Val.trim());
              const binaryData = Buffer.from(base64Val.trim(), 'base64');
              const decodedData = parseSerialData(binaryData);
              if (decodedData?.gpioStates?.states) {
                console.log("🧪 [USB] GPIO states updated:", decodedData.gpioStates.states);
              }
              setData((prevData: any) => ({ ...prevData, ...decodedData }));
              setLastDataTime(Date.now());
            }
          });
          accumulatedData = accumulatedData.slice(Buffer.from(dataString.join('\n')).length);
        } else {
          setLastDataTime(Date.now());
        }
      });

      return () => {
        listener.remove();
        (RNSerialport as any).disconnectDevice(device.name);
      };
    } catch (error) {
      console.error("❌ USB Connection Error:", error);
      setConnectedDevice(null);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect USB device
  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        await (RNSerialport as any).disconnectDevice(connectedDevice);
        console.log("✅ USB disconnected");
      } catch (error) {
        console.error("❌ USB Disconnect Error:", error);
      } finally {
        setConnectedDevice(null);
        setData({});
        setLastDataTime(0);
      }
    }
  };

  // Auto-connect on device attachment
  useEffect(() => {
    if (Platform.OS !== "android" || USE_MOCK_DATA) return;

    // Start USB service
    console.log("🚀 Starting USB service...");
    try {
      RNSerialport.startUsbService();
      console.log("✅ USB service started");
    } catch (error) {
      console.error("❌ Failed to start USB service:", error);
    }

    // Listen for device attachment
    const attachListener = DeviceEventEmitter.addListener(
      actions.ON_DEVICE_ATTACHED,
      async (device: any) => {
        console.log("🔌 USB Device Attached:", device);
        await connectToDevice(device);
      }
    );

    // Listen for device detachment
    const detachListener = DeviceEventEmitter.addListener(
      actions.ON_DEVICE_DETACHED,
      async (device: any) => {
        console.log("🔌 USB Device Detached:", device);
        if (device.name === connectedDevice) {
          await disconnectDevice();
        }
      }
    );

    // Check for already connected devices on mount
    const checkDevices = async () => {
      const devices = await RNSerialport.getDeviceList();
      console.log("🔍 USB devices found on mount:", devices);
      if (devices && devices.length > 0 && !connectedDevice && !isConnecting) {
        await connectToDevice(devices[0]);
      }
    };
    checkDevices();

    return () => {
      attachListener.remove();
      detachListener.remove();
      RNSerialport.stopUsbService();
    };
  }, [connectedDevice, isConnecting]);

  // Detect disconnection via timeout
  useEffect(() => {
    if (!connectedDevice) return;

    const checkConnection = setInterval(async () => {
      if (Date.now() - lastDataTime > 60000) {
        console.warn("⚠️ No USB data received for 60 seconds, assuming disconnected");
        await disconnectDevice();
      } else {
        console.log("✅ Data received within 60 seconds, connection active");
      }
    }, 5000);

    return () => clearInterval(checkConnection);
  }, [connectedDevice, lastDataTime]);

  // Parse serial data
  const parseSerialData = (buffer: Buffer) => {
    try {
      console.log("🧪 [Parser] Raw hex buffer before decode:", buffer.toString('hex'));
      if (buffer.length < 4) {
        console.error("❌ [USB] Incomplete packet - buffer too short:", buffer.length);
        return { error: "USB packet too short" };
      }

      const messageID = buffer.readUInt32BE(0).toString(16).padStart(8, "0").toUpperCase();
      const payload = buffer.slice(4); // May be 0–8 bytes

      console.log("📨 [USB] Parsed Message ID:", messageID);
      console.log("📏 [USB] Payload length:", payload.length);

      switch (messageID) {
        case "1038FF50": // Msg_DIU1
          if (payload.length < 8) return { error: "Invalid Msg_DIU1 Data" };
          return { messageDIU1: parseMsgDIU1(payload) };
        case "14234050": // Msg_DIU2
          if (payload.length < 8) return { error: "Invalid Msg_DIU2 Data" };
          return { messageDIU2: parseMsgDIU2(payload) };
        case "14244050": // Msg_DIU3
          if (payload.length < 8) return { error: "Invalid Msg_DIU3 Data" };
          return { messageDIU3: parseMsgDIU3(payload) };
        case "10281050": // Msg_DIU4
          if (payload.length < 8) return { error: "Invalid Msg_DIU4 Data" };
          return { messageDIU4: parseMsgDIU4(payload) };
        case "1031FF50": // Msg_DIU14
          if (payload.length < 8) return { error: "Invalid Msg_DIU14 Data" };
          return { messageDIU14: parseMsgDIU14(payload) };
        case "14498250": // Msg_DriveParameters
          if (payload.length < 8) return { error: "Invalid Msg_DriveParameters Data" };
          return { messageDriveParameters: parseMsgDriveParameters(payload) };
        case "18265040": // MCU1
          if (payload.length < 8) return { error: "Invalid MCU1 Data" };
          return { messageMCU1: parseMsgMCU1(payload) };
        case "18275040": // MCU2
          if (payload.length < 8) return { error: "Invalid MCU2 Data" };
          return { messageMCU2: parseMsgMCU2(payload) };
        case "18305040": // MCU3
          if (payload.length < 8) return { error: "Invalid MCU3 Data" };
          return { messageMCU3: parseMsgMCU3(payload) };
        case "FEED0001": // GPIO
          console.log("📥 [USB] GPIO message received");
          if (payload.length < 2) {
            console.error("❌ [USB] GPIO payload too short:", payload.length);
            return { error: "Invalid GPIO Data" };
          }
          const parsedGPIO = parseGPIOMsg(payload);
          console.log("✅ [USB] Final GPIO State Map:", parsedGPIO.states);
          return { gpioStates: parsedGPIO };
        default:
          console.warn("Unknown Message ID:", messageID, "Full buffer:", buffer.toString('hex'));
          setLastDataTime(Date.now()); // Update time for unknown but received data
          return {};
      }
    } catch (error) {
      console.error("❌ Parsing error:", (error as Error).message);
      return { parsingError: (error as Error).message };
    }
  };

  // Parsing functions (unchanged)
  const extractBits = (buffer: Buffer, startBit: number, size: number) => {
    let value = 0;
    for (let i = 0; i < size; i++) {
      const byteIndex = Math.floor((startBit + i) / 8);
      const bitIndex = (startBit + i) % 8;
      value |= ((buffer[byteIndex] >> bitIndex) & 1) << i; // Intel format
    }
    return value;
  };

  const parseMsgDIU1 = (buffer: Buffer) => {
    const faults: string[] = [];
    const signals = [
      { name: "sigFltBatteryFault", startBit: 0, size: 1 },
      { name: "sigFltBatteryOverTemp", startBit: 1, size: 1 },
    ];
    signals.forEach((s) => {
      if (extractBits(buffer, s.startBit, s.size)) faults.push(s.name);
    });
    return { messageType: "Faults", faultMessages: faults.length ? faults : ["No Faults Detected"] };
  };

  const parseMsgDIU2 = (buffer: Buffer) => {
    const sigBatteryCurrent = buffer.readInt16LE(0) * 0.1; // Signed, little-endian, factor 0.1
    const driveLSB = buffer.readUInt8(2); // StartBit 16
    const driveMSB = buffer.readUInt8(5); // StartBit 40
    const sigDriveCurrentLimit = (driveMSB << 8) | driveLSB; // Little-endian
    const regenLSB = buffer.readUInt8(3); // StartBit 24
    const regenMSB = buffer.readUInt8(6); // StartBit 48
    const sigRegenCurrentLimit = (regenMSB << 8) | regenLSB; // Little-endian
    const sigVehicleModeRequest = extractBits(buffer, 32, 3); // 3 bits, unsigned
    return {
      messageType: "Current and Limits",
      batteryCurrent: sigBatteryCurrent,
      driveCurrentLimit: sigDriveCurrentLimit,
      regenCurrentLimit: sigRegenCurrentLimit,
      vehicleModeRequest: sigVehicleModeRequest,
    };
  };

  const parseMsgDIU3 = (buffer: Buffer) => {
    return {
      messageType: "Cell Voltages",
      minCellVoltage: buffer.readUInt16LE(0) * 0.001, // Little-endian, factor 0.001
      maxCellVoltage: buffer.readUInt16LE(4) * 0.001, // Little-endian, factor 0.001
    };
  };

  const parseMsgDIU4 = (buffer: Buffer) => {
    return {
      messageType: "SOC and Indicators",
      stateOfCharge: buffer.readUInt8(0), // Factor 1.0, 0-100
      keyOnIndicator: extractBits(buffer, 34, 2), // 2 bits, unsigned
      distanceToEmpty: buffer.readUInt16BE(1), // StartBit 8, big-endian
      batteryMalfunctionLight: extractBits(buffer, 36, 2), // 2 bits, unsigned
    };
  };

  const parseMsgDIU14 = (buffer: Buffer) => {
    return {
      messageType: "DIU14 Faults",
      socOrPackVoltageImbalance: extractBits(buffer, 4, 1), // Bit 4, unsigned
      batterySevUnderVtgAnyBP: extractBits(buffer, 4, 1), // Bit 3, unsigned
      batterySevOverVtgAnyBP: extractBits(buffer, 2, 1), // Bit 2, unsigned
      overCurrentAllBP: extractBits(buffer, 1, 1), // Bit 1, unsigned
      overCurrentAnyBP: extractBits(buffer, 0, 1), // Bit 0, unsigned
    };
  };

  const parseMsgDriveParameters = (buffer: Buffer) => {
    return {
      messageType: "Drive Parameters",
      packVoltage: buffer.readUInt16BE(0) * 0.01,
      noOfActiveBPs: buffer.readUInt8(2),
      noOfCommunicationLossBPs: buffer.readUInt8(3),
      maxCellTemp: buffer.readInt8(4), // Start 32, signed
      minCellTemp: buffer.readInt8(5), // Start 40, signed
      availableEnergy: buffer.readUInt16LE(6) * 0.01,
    };
  };

  const parseMsgMCU1 = (buffer: Buffer) => {
    const sigControllerTemperature = buffer.readInt8(0); // Signed, start 0, factor 1
    const sigMotorTemperature = buffer.readInt8(1); // Signed, start 8, factor 1
    const sigRMSCurrent = buffer.readUInt16LE(2) * 0.1; // Unsigned, start 16, factor 0.1, little-endian
    const sigThrottle = buffer.readUInt8(4); // Unsigned, start 32, factor 1
    const sigBrake = buffer.readUInt8(5); // Unsigned, start 40, factor 1
    const sigSpeed = buffer.readUInt8(6); // Unsigned, start 48, factor 1
    const sigDriveMode = extractBits(buffer, 56, 3); // Unsigned, start 56, 3 bits
    return {
      messageType: "Controller Parameters",
      controllerTemperature: sigControllerTemperature,
      motorTemperature: sigMotorTemperature,
      rmsCurrent: sigRMSCurrent,
      throttle: sigThrottle,
      brake: sigBrake,
      speed: sigSpeed,
      driveMode: sigDriveMode,
    };
  };

  const parseMsgMCU2 = (buffer: Buffer) => {
    const sigMotorRPM = buffer.readUInt16LE(0); // 0|16@1+ (1,0)
    const sigCapacitorVoltage = buffer.readUInt16LE(2) * 0.1; // 16|16@1+ (0.1,0)
    const sigOdometer = buffer.readUInt32LE(4) * 0.1; // 32|32@1+ (0.1,0)
    return {
      messageType: "Motor Parameters",
      motorRPM: sigMotorRPM,
      capacitorVoltage: sigCapacitorVoltage,
      odometer: sigOdometer,
    };
  };

  const parseMsgMCU3 = (buffer: Buffer) => {
    const faults: string[] = [];
    const signals = [
      { name: "sigFltControllerFault", startBit: 0, size: 1 },
      { name: "sigFltControllerOverCurrent", startBit: 1, size: 1 },
      { name: "sigFltCurrentSensor", startBit: 2, size: 1 },
      { name: "sigFltControllerCapacitorOvertemp", startBit: 4, size: 1 },
      { name: "sigFltControllerIGBTOvertemp", startBit: 5, size: 1 },
      { name: "sigFltSevereBPosUndervoltage", startBit: 6, size: 1 },
      { name: "sigFltSevereBPosOvervoltage", startBit: 8, size: 1 },
      { name: "sigFltControllerOvertempCutback", startBit: 10, size: 1 },
      { name: "sigFltBPosUndervoltageCutback", startBit: 11, size: 1 },
      { name: "sigFltBPosOvervoltageCutback", startBit: 12, size: 1 },
      { name: "sigFlt5VSupplyFailure", startBit: 13, size: 1 },
      { name: "sigFltMotorHotCutback", startBit: 14, size: 1 },
      { name: "sigFltThrottlewiperHigh", startBit: 21, size: 1 },
      { name: "sigFltThrottlewiperLow", startBit: 22, size: 1 },
      { name: "sigFltEEPROMFailure", startBit: 23, size: 1 },
      { name: "sigFltEncoder", startBit: 27, size: 1 },
    ];
    signals.forEach((s) => {
      if (extractBits(buffer, s.startBit, s.size)) faults.push(s.name);
    });
    return {
      messageType: "Controller Faults",
      faultMessages: faults.length ? faults : ["No Faults Detected"],
    };
  };

  const parseGPIOMsg = (buffer: Buffer) => {
    if (buffer.length < 2) {
      console.error("❌ Invalid GPIO payload length:", buffer.length);
      return { error: "Invalid GPIO Data" };
    }
    const high = buffer[0];
    const low = buffer[1];
    const bitfield = (high << 8) | low;
    console.log("🧮 [GPIO] Raw Bytes → High:", high, "Low:", low);
    console.log("🔢 [GPIO] Bitfield (binary):", bitfield.toString(2).padStart(16, '0'));
    console.log("🔍 [GPIO] Decoded States:");
    const pinNames = [
      "REV_OUT", "FWD_OUT", "KEY_OUT", "BRAKE_OUT", "LOWB_OUT", "HIGHB_OUT",
      "LEFT_OUT", "RIGHT_OUT", "SPORTS_OUT", "ECO_OUT", "NEUTRAL_OUT"
    ];
    const states: { [key: string]: boolean } = {};
    pinNames.forEach((name, index) => {
      const isActive = (bitfield & (1 << index)) !== 0;
      states[name] = isActive;
      console.log(`➡️  ${name}: ${isActive ? "ON ✅" : "OFF ❌"}`);
    });
    return { messageType: "GPIO", states };
  };

  return (
    <BatteryBluetoothContext.Provider
      value={{
        connectedDevice,
        connectToDevice,
        disconnectDevice,
        connectToFirstAvailableDevice: async () => {
          const devices = await RNSerialport.getDeviceList();
          console.log("🔍 USB devices found:", devices);
          if (devices && devices.length > 0) {
            await connectToDevice(devices[0]);
          } else {
            console.warn("⚠️ No USB devices found");
          }
        },
        data,
      }}
    >
      {children}
    </BatteryBluetoothContext.Provider>
  );
};