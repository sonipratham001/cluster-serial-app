import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GearSelector from '../components/GearSelector';
import BatteryIndicator from '../components/BatteryIndicator';
import BottomNavBar from '../components/BottomNavBar';
import LinearGradient from 'react-native-linear-gradient';
import BlueGlow from '../components/BlueGlow';
import RedOuterBorder from '../components/DesignLines';
import StatusIndicator from '../components/StatusIndicator';

const {width, height} = Dimensions.get('window');

interface VehicleDashboardUIProps {
  speed?: number;
  time?: string;
  batteryPercentage?: number;
  gear?: 'f' | 'n' | 'r';
  mode?: 'eco' | 'sports';
  range?: number;
  odometer?: number;
  turnSignal?: 'left' | 'right' | null;
  brakeStatus?: {
    bf?: boolean;
    hb?: boolean;
    s?: boolean;
  };
  isConnected: boolean;
  headlightStatus?: {
    low?: boolean;
    high?: boolean;
    hazard?: boolean;
    service?: boolean;
  };
  batteryHasFault?: boolean;
motorHasFault?: boolean;
glowColor?: string;
  glowIntensity?: number;
}

const VehicleDashboardUI: React.FC<VehicleDashboardUIProps> = ({
  speed,
  time,
  batteryPercentage,
  gear,
  mode,
  range,
  odometer,
  turnSignal,
  brakeStatus,
  isConnected,
  headlightStatus,
  batteryHasFault,
  motorHasFault,
  glowColor,
  glowIntensity
}) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (turnSignal) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      blinkAnim.setValue(1);
    }
  }, [turnSignal]);

  return (
    <LinearGradient
      colors={['#0a0f1c', '#1f2937', '#111827']}
      style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.scrollContainer}>
          {/* <CurvedPartitionLines /> */}
          <RedOuterBorder />
          <BlueGlow glowColor={glowColor} glowIntensity={glowIntensity} />
          <View style={styles.container}>
            {/* Turn Signals Row */}
            <View style={styles.topRow}>
              <Animated.View style={{opacity: blinkAnim}}>
                <Icon name="arrow-left-bold" size={48} color="#facc15" />
              </Animated.View>
              <Text style={styles.timeText}>{time || '--:--'}</Text>
              <Animated.View style={{opacity: blinkAnim}}>
                <Icon name="arrow-right-bold" size={48} color="#facc15" />
              </Animated.View>
            </View>

              
            <View style={styles.logoWithStatusRow}>
  <View style={styles.logoContainer}>
    <Image
      source={require('../../assets/intuteLogo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
</View>

            

            {/* Headlights, Hazard, Low Beam */}
            <View style={styles.topStatusRow}>
              <Icon
                name="car-light-high"
                size={48}
                color={headlightStatus?.high ? '#3b82f6' : '#1e293b'}
                style={{transform: [{translateY: -5} ,{translateX: -18}]}}
              />
              <Icon
                name="car-light-dimmed"
                size={48}
                color={headlightStatus?.low ? '#3b82f6' : '#1e293b'}
                style={{transform: [{translateY: -5} ,{translateX: 18}]}}
              />
            </View>

            {/* Gear & Battery Info */}
            <View style={styles.cornerInfoRow}>
              <View style={styles.leftSide}>
                <GearSelector gear={gear ?? 'n'} />
              </View>

              <View style={styles.rightSide}>
                <BatteryIndicator
                  level={batteryPercentage ?? 0}
                  horizontal={false}
                />
                <Text style={styles.value}>{batteryPercentage ?? '--'}%</Text>
              </View>
            </View>

            {/* Speed */}
           
  <View style={styles.speedContainer}>
    <Text style={styles.speedText}>{speed ?? '--'}</Text>
    <Text style={styles.kmph}>km/h</Text>
  </View>


            {/* ECO & SPORTS Row */}
            <View style={styles.modeRow}>
              <View style={[styles.iconBox, {alignItems: 'center'}]}>
                <Icon name="leaf" size={36} color="#10b981" />
                <Text
                  style={[
                    styles.modeText,
                    mode === 'eco' && styles.activeEcoText,
                  ]}>
                  ECO
                </Text>
              </View>
              <View style={styles.modeBlock}>
                <View style={[styles.iconBox, {alignItems: 'center'}]}>
                  <Icon name="lightning-bolt" size={36} color="#f43f5e" />
                  <Text
                    style={[
                      styles.modeText,
                      mode === 'sports' && styles.activeSportText,
                    ]}>
                    SPORTS
                  </Text>
                </View>
              </View>
            </View>

            {/* Range & Odometer Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricBoxLeft}>
                <Icon name="map-marker-distance" size={36} color="#60a5fa" />
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.metricText}>Range</Text>
                  <Text style={styles.metricText}>{range ?? '--'} km</Text>
                </View>
              </View>

              <View style={styles.metricBoxRight}>
                <Icon name="speedometer" size={36} color="#60a5fa" />
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.metricText}>Odo</Text>
                  <Text style={styles.metricText}>
                    {odometer ? odometer.toFixed(1) : '--'} km
                  </Text>
                </View>
              </View>
            </View>

            {/* Vertical Status Column */}
            <View style={styles.verticalStatusColumn}>
              <Icon name="car-brake-parking" size={24} color="#f87171" />
              <Icon
                name="car-brake-fluid-level"
                size={24}
                color={brakeStatus?.bf ? '#f87171' : '#6b7280'}
              />
              <StatusIndicator
    iconName="battery-charging-high"
    status={batteryHasFault ? 'fault' : 'ok'}
  />
  <StatusIndicator
    iconName="engine-outline"
    status={motorHasFault ? 'fault' : 'ok'}
  />
            </View>
          </View>
        </View>

        <BottomNavBar />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 2,
    paddingBottom: 0,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  timeText: {
    marginTop: 5,
    fontSize: 18,
    color: '#fff',
  },
  topStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 144,
  },
  cornerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: width * 0.1,
    marginTop: height * 0.02,
  },

  leftSide: {
    alignItems: 'flex-start',
    transform: [{translateY: -30}],
  },

  rightSide: {
    alignItems: 'flex-end',
    transform: [{translateY: -30}],
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  speedContainer: {
    alignItems: 'center',
    marginTop: -140,
  },
  speedText: {
    fontSize: 68,
    fontWeight: 'bold',
    color: '#fff',
  },
  kmph: {
    fontSize: 18,
    color: '#ccc',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 6,
  },
  modeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeEcoText: {
    color: '#10b981',
  },
  activeSportText: {
    color: '#f43f5e',
  },
  metricsRow: {
    position: 'absolute',
    bottom: 15, 
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: -60,
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{translateX: -90}], 
  },

  metricBoxRight: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{translateX: 115}], 
  },
  metricText: {
    fontSize: 18,
    color: '#e5e7eb',
  },
  verticalStatusColumn: {
  position: 'absolute',
  right: 8,
  top: 90,
  justifyContent: 'space-between',
  alignItems: 'center',   // 👈 this is critical
  height: 140,
},
  iconBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 40,
    marginHorizontal: 6,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  logo: {
    width: 200,
    height: 60,
  },
  logoWithStatusRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  marginTop: -20,
  paddingHorizontal: 24,
  zIndex: 2,
},
});

export default VehicleDashboardUI;