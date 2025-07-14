export const MOTOR_FAULT_MAPPINGS: { 
  [key: string]: { label: string; icon: string; severity: 'critical' | 'warning' | 'info' } 
} = {
  sigFltControllerFault: {
    label: "Controller Fault",
    icon: "alert-circle",
    severity: "critical",
  },
  sigFltControllerOverCurrent: {
    label: "Controller Overcurrent",
    icon: "flash-alert",
    severity: "critical",
  },
  sigFltCurrentSensor: {
    label: "Current Sensor Fault",
    icon: "speedometer",
    severity: "critical",
  },
  sigFltControllerCapacitorOvertemp: {
    label: "Capacitor Overtemp",
    icon: "thermometer-alert",
    severity: "warning",
  },
  sigFltControllerIGBTOvertemp: {
    label: "IGBT Overtemp",
    icon: "fire",
    severity: "critical",
  },
  sigFltSevereBPosUndervoltage: {
    label: "Severe B+ Undervoltage",
    icon: "battery-alert",
    severity: "critical",
  },
  sigFltSevereBPosOvervoltage: {
    label: "Severe B+ Overvoltage",
    icon: "battery-high",
    severity: "critical",
  },
  sigFltControllerOvertempCutback: {
    label: "Controller Temp Cutback",
    icon: "fan-alert",
    severity: "warning",
  },
  sigFltBPosUndervoltageCutback: {
    label: "B+ Undervoltage Cutback",
    icon: "battery-minus",
    severity: "warning",
  },
  sigFltBPosOvervoltageCutback: {
    label: "B+ Overvoltage Cutback",
    icon: "battery-plus",
    severity: "warning",
  },
  sigFlt5VSupplyFailure: {
    label: "5V Supply Failure",
    icon: "power-plug-off",
    severity: "critical",
  },
  sigFltMotorHotCutback: {
    label: "Motor Hot Cutback",
    icon: "car-brake-alert",
    severity: "warning",
  },
  sigFltThrottlewiperHigh: {
    label: "Throttle High Fault",
    icon: "arrow-up-thick",
    severity: "warning",
  },
  sigFltThrottlewiperLow: {
    label: "Throttle Low Fault",
    icon: "arrow-down-thick",
    severity: "warning",
  },
  sigFltEEPROMFailure: {
    label: "EEPROM Failure",
    icon: "memory",
    severity: "critical",
  },
  sigFltEncoder: {
    label: "Encoder Fault",
    icon: "radar",
    severity: "warning",
  },
  NoFaultsDetected: {
    label: "No Faults Detected",
    icon: "check-circle",
    severity: "info",
  },
};