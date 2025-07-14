import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  where,
  startAfter,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import SideMenu from './SideMenu';
import Toast from 'react-native-toast-message';
import { useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

interface EVData {
  id: string;
  speed: number;
  voltage: number;
  current: number;
  controllerTemp: number;
  motorTemp: number;
  throttle: number;
  errorCode: number | null;
  errorMessages: string[] | null;
  controllerStatus: string | null;
  switchSignals: {
    boost: boolean;
    footswitch: boolean;
    forward: boolean;
    backward: boolean;
    brake: boolean;
    hallC: boolean;
    hallB: boolean;
    hallA: boolean;
  };
  timestamp: Timestamp;
}

const HistoryScreen = () => {
  const [evData, setEvData] = useState<EVData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [filterOption, setFilterOption] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'History'>['route']>();
const { isSubscribed, isTrialExpired } = route.params ?? { isSubscribed: false, isTrialExpired: true };

  const app = getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'History'>>();

  const applyFilter = (days: number | null) => {
    const now = new Date();
    setFilterOption(days ? `Last ${days} Day${days > 1 ? 's' : ''}` : 'All Time');
    setStartDate(days ? new Date(now.setDate(now.getDate() - days)) : null);
    setEndDate(days ? new Date() : null);
    setEvData([]);
    setLastVisible(null);
    setHasMore(true);
    Toast.show({
      type: 'info',
      text1: 'Filter Applied',
      text2: days ? `Showing data for the last ${days} day${days > 1 ? 's' : ''}` : 'Showing all data',
      visibilityTime: 4000,
      autoHide: true,
      position: 'top',
    });
  };

  const fetchData = useCallback(
    (startAfterDoc: any = null) => {
      if (!user || (!startDate && !endDate)) {
        setLoading(false);
        return () => {};
      }

      setLoading(true);
      const constraints = [
        orderBy('timestamp', 'desc'),
        limit(20),
        ...(startDate ? [where('timestamp', '>=', Timestamp.fromDate(startDate))] : []),
        ...(endDate ? [where('timestamp', '<=', Timestamp.fromDate(endDate))] : []),
        ...(startAfterDoc ? [startAfter(startAfterDoc)] : []),
      ];

      const q = query(collection(db, 'users', user.uid, 'ev_data'), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const newData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as EVData));
          setEvData((prev) => (startAfterDoc ? [...prev, ...newData] : newData));
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === 20);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching data:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load data. Please try again.',
            visibilityTime: 4000,
            autoHide: true,
            position: 'top',
          });
          setLoading(false);
        }
      );

      return unsubscribe;
    },
    [user, startDate, endDate, db]
  );

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  const loadMore = () => {
    if (!loading && hasMore && lastVisible) {
      fetchData(lastVisible);
    }
  };

  const exportData = async () => {
    if (evData.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Data to Export',
        text2: 'There is no data to export.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
      return;
    }

    const headers =
      'Timestamp,Speed (RPM),Voltage (V),Current (A),Controller Temp (°C),Motor Temp (°C),Throttle (V),Controller Status,Boost,Footswitch,Forward,Backward,Brake,Hall C,Hall B,Hall A\n';
    const rows = evData
      .map(
        (item) =>
          `${item.timestamp?.toDate().toLocaleString()},${item.speed},${item.voltage},${
            item.current
          },${item.controllerTemp},${item.motorTemp},${((item.throttle / 255) * 5).toFixed(2)},${
            item.controllerStatus || 'N/A'
          },${item.switchSignals.boost ? 'ON' : 'OFF'},${item.switchSignals.footswitch ? 'ON' : 'OFF'},${
            item.switchSignals.forward ? 'ON' : 'OFF'
          },${item.switchSignals.backward ? 'ON' : 'OFF'},${item.switchSignals.brake ? 'ON' : 'OFF'},${
            item.switchSignals.hallC ? 'ON' : 'OFF'
          },${item.switchSignals.hallB ? 'ON' : 'OFF'},${item.switchSignals.hallA ? 'ON' : 'OFF'}`
      )
      .join('\n');
    const csvContent = headers + rows;

    try {
      const result = await Share.share({
        message: `EV Data Export (${filterOption}):\n${csvContent}`,
        title: 'Share EV Data',
      });
      if (result.action === Share.sharedAction) {
        Toast.show({
          type: 'success',
          text1: 'Data Exported',
          text2: 'Data shared successfully.',
          visibilityTime: 4000,
          autoHide: true,
          position: 'top',
        });
      } else if (result.action === Share.dismissedAction) {
        Toast.show({
          type: 'info',
          text1: 'Export Cancelled',
          text2: 'Data export was cancelled.',
          visibilityTime: 4000,
          autoHide: true,
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Error sharing data: ', error);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Failed to share data. Please try again.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const renderItem = ({ item }: { item: EVData }) => (
    <View style={styles.card}>
      <Text style={styles.cardTime}>{item.timestamp.toDate().toLocaleString()}</Text>
      <View style={styles.cardRow}>
        <MetricItem label="Speed" value={`${item.speed} RPM`} />
        <MetricItem label="Voltage" value={`${item.voltage} V`} />
      </View>
      <View style={styles.cardRow}>
        <MetricItem label="Current" value={`${item.current} A`} />
        <MetricItem label="Controller Temp" value={`${item.controllerTemp}°C`} />
      </View>
      <View style={styles.cardRow}>
        <MetricItem label="Motor Temp" value={`${item.motorTemp}°C`} />
        <MetricItem label="Throttle" value={`${((item.throttle / 255) * 5).toFixed(2)} V`} />
      </View>
      {item.errorCode && (
        <View style={styles.cardRow}>
          <Text style={[styles.metricValue, styles.errorText]}>Error Code: {item.errorCode}</Text>
          {item.errorMessages &&
            item.errorMessages.map((msg, index) => (
              <Text key={index} style={[styles.metricValue, styles.errorText]}>
                Error: {msg}
              </Text>
            ))}
        </View>
      )}
      {item.controllerStatus && (
        <View style={styles.cardRow}>
          <Text style={styles.metricValue}>Controller Status: {item.controllerStatus}</Text>
        </View>
      )}
      <View style={styles.switchContainer}>
        <Text style={styles.switchTitle}>🔌 Switch Signals</Text>
        <View style={styles.switchRow}>
          <SwitchItem label="Boost" value={item.switchSignals.boost} />
          <SwitchItem label="Footswitch" value={item.switchSignals.footswitch} />
        </View>
        <View style={styles.switchRow}>
          <SwitchItem label="Forward" value={item.switchSignals.forward} />
          <SwitchItem label="Backward" value={item.switchSignals.backward} />
        </View>
        <View style={styles.switchRow}>
          <SwitchItem label="Brake" value={item.switchSignals.brake} />
          <SwitchItem label="Hall C" value={item.switchSignals.hallC} />
        </View>
        <View style={styles.switchRow}>
          <SwitchItem label="Hall B" value={item.switchSignals.hallB} />
          <SwitchItem label="Hall A" value={item.switchSignals.hallA} />
        </View>
      </View>
    </View>
  );

  const MetricItem = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.metricContainer}>
      <View style={styles.metricTexts}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );

  const SwitchItem = ({ label, value }: { label: string; value: boolean }) => (
    <View style={styles.switchItem}>
      <Text style={styles.switchLabel}>{label}:</Text>
      <Text style={[styles.switchValue, value ? styles.switchOn : styles.switchOff]}>
        {value ? 'ON' : 'OFF'}
      </Text>
    </View>
  );

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
        <Text style={styles.title}>Historical Data</Text>
      </View>

      <FlatList
        data={evData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filterOption === 'Last 1 Day' && styles.activeFilter]}
                onPress={() => applyFilter(1)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterOption === 'Last 1 Day' && styles.activeFilterText]}>
                  24 Hours
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterOption === 'Last 7 Days' && styles.activeFilter]}
                onPress={() => applyFilter(7)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterOption === 'Last 7 Days' && styles.activeFilterText]}>
                  7 Days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterOption === 'All Time' && styles.activeFilter]}
                onPress={() => applyFilter(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterOption === 'All Time' && styles.activeFilterText]}>
                  All Time
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateIcon}>📅</Text>
                <Text style={styles.dateButtonText}>
                  {startDate ? startDate.toLocaleDateString() : 'Start Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateIcon}>📅</Text>
                <Text style={styles.dateButtonText}>
                  {endDate ? endDate.toLocaleDateString() : 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportData}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#F59E0B", "#FBBF24"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {/* <Text style={styles.dateIcon}>⬇️</Text> */}
                <Text style={styles.exportButtonText}>Export Data</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        }
        ListFooterComponent={loading ? <ActivityIndicator color="#F59E0B" /> : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyText}>No data found for selected period</Text>
            <Text style={styles.emptySubText}>Adjust filters or check your connection</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="spinner"
          onChange={(_, date) => {
            setShowStartPicker(false);
            if (date) {
              setStartDate(date);
              setEvData([]);
              setLastVisible(null);
              setHasMore(true);
              Toast.show({
                type: 'info',
                text1: 'Start Date Updated',
                text2: `Filtering data from ${date.toLocaleDateString()}`,
                visibilityTime: 4000,
                autoHide: true,
                position: 'top',
              });
            }
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="spinner"
          minimumDate={startDate || undefined}
          onChange={(_, date) => {
            setShowEndPicker(false);
            if (date) {
              setEndDate(date);
              setEvData([]);
              setLastVisible(null);
              setHasMore(true);
              Toast.show({
                type: 'info',
                text1: 'End Date Updated',
                text2: `Filtering data up to ${date.toLocaleDateString()}`,
                visibilityTime: 4000,
                autoHide: true,
                position: 'top',
              });
            }
          }}
        />
      )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
    paddingLeft: 0,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    marginLeft: 4,
    flex: 1,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  activeFilter: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F59E0B',
  },
  filterButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dateIcon: {
    fontSize: 18,
    color: '#1F2937',
  },
  dateButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardTime: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  metricContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTexts: {
    flex: 1,
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  switchContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  switchItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  switchValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchOn: {
    color: '#22C55E',
  },
  switchOff: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 50,
    color: '#F59E0B',
  },
  emptyText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 20,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  menuButton: {
    padding: 5,
    marginLeft: -5,
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 28,
    color: '#1F2937',
  },
});

export default HistoryScreen;