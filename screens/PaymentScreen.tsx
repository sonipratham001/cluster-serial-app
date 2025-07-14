import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import SideMenu from './SideMenu';
import Toast from 'react-native-toast-message';

type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentScreen'>;

const subscriptionSkus = ['bldc_monitor_basic', 'bldc_monitor_premium'];

const PaymentScreen = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const [subscriptions, setSubscriptions] = useState<RNIap.SubscriptionAndroid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const authInstance = getAuth(getApp());

  const saveSubscriptionStatus = async () => {
    const user = authInstance.currentUser;
    if (user) {
      const db = getFirestore(getApp());
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { isSubscribed: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
        console.log('Subscription status saved successfully');
      } catch (error) {
        console.error('Error saving subscription status:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to save subscription status. Please try again.',
          visibilityTime: 4000,
          autoHide: true,
          position: 'top',
        });
      }
    }
  };

  useEffect(() => {
    const initializeIap = async () => {
      try {
        await RNIap.initConnection();
        const availableSubscriptions = (await RNIap.getSubscriptions({
          skus: subscriptionSkus,
        })) as RNIap.SubscriptionAndroid[];
        setSubscriptions(availableSubscriptions);

        const purchases = await RNIap.getAvailablePurchases();
        const isUserSubscribed = purchases.some((purchase) =>
          subscriptionSkus.includes(purchase.productId)
        );
        setIsSubscribed(isUserSubscribed);
        if (isUserSubscribed) {
          await AsyncStorage.setItem(
            `isSubscribed_${authInstance.currentUser?.uid}`,
            'true'
          );
          await saveSubscriptionStatus();
        }
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to load subscriptions.',
          visibilityTime: 4000,
          autoHide: true,
          position: 'top',
        });
      } finally {
        setLoading(false);
      }
    };

    const purchaseListener = RNIap.purchaseUpdatedListener(async (purchase) => {
      if (purchase.transactionReceipt && subscriptionSkus.includes(purchase.productId)) {
        setIsSubscribed(true);
        await AsyncStorage.setItem(
          `isSubscribed_${authInstance.currentUser?.uid}`,
          'true'
        );
        await saveSubscriptionStatus();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Subscription purchased successfully!',
          visibilityTime: 4000,
          autoHide: true,
          position: 'top',
        });
        setPurchasing(null);
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        navigation.navigate('Home');
      }
    });

    const purchaseErrorListener = RNIap.purchaseErrorListener((error) => {
      setPurchasing(null);
      Toast.show({
        type: 'error',
        text1: 'Purchase Failed',
        text2: error.message || 'An error occurred during the purchase.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    });

    initializeIap();
    return () => {
      purchaseListener.remove();
      purchaseErrorListener.remove();
      RNIap.endConnection();
    };
  }, [navigation]);

  const handleSubscription = async (sku: string) => {
    if (isSubscribed) {
      Toast.show({
        type: 'info',
        text1: 'Already Subscribed',
        text2: 'You are already subscribed!',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
      return;
    }

    try {
      setPurchasing(sku);
      await RNIap.requestSubscription({ sku });
    } catch (error: any) {
      setPurchasing(null);
      Toast.show({
        type: 'error',
        text1: 'Purchase Failed',
        text2: error.message || 'Failed to process purchase.',
        visibilityTime: 4000,
        autoHide: true,
        position: 'top',
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <LinearGradient
      colors={['#FFF8E7', '#FFEFD5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select a Subscription Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#F59E0B"
            style={styles.loadingIndicator}
          />
        ) : isSubscribed ? (
          <View style={styles.subscribedContainer}>
            <Text style={styles.subscribedText}>You’re Subscribed to Premium! 🎉</Text>
            <Text style={styles.subscribedSubText}>
              Enjoy unlimited access to all features and priority support.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#F59E0B", "#FBBF24"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Go to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            {subscriptions.map((plan) => (
              <TouchableOpacity
                key={plan.productId}
                style={styles.planCard}
                onPress={() => handleSubscription(plan.productId)}
                activeOpacity={0.7}
                disabled={purchasing === plan.productId}
              >
                <LinearGradient
                  colors={purchasing === plan.productId ? ['#E5E7EB', '#E5E7EB'] : ['#FFFFFF', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.planGradient}
                >
                  <View style={styles.planDetails}>
                    <Text style={styles.planTitle}>
                      {plan.title || 'Subscription Plan'}
                    </Text>
                    <Text style={styles.planPrice}>
                      {plan.subscriptionOfferDetails?.[0]?.pricingPhases.pricingPhaseList[0].formattedPrice || 'N/A'}
                    </Text>
                    <Text style={styles.planDescription}>
                      {plan.description || 'Unlock premium features with this plan.'}
                    </Text>
                  </View>
                  <View style={styles.subscribeButton}>
                    {purchasing === plan.productId ? (
                      <ActivityIndicator size="small" color="#F59E0B" />
                    ) : (
                      <LinearGradient
                        colors={["#F59E0B", "#FBBF24"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.subscribeGradient}
                      >
                        <Text style={styles.subscribeButtonText}>Subscribe</Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            {subscriptions.length === 0 && (
              <View style={styles.noPlansContainer}>
                <Text style={styles.noPlansIcon}>⚠️</Text>
                <Text style={styles.noPlansText}>No Subscription Plans Available</Text>
                <Text style={styles.noPlansSubText}>
                  Please check your connection or try again later.
                </Text>
              </View>
            )}
          </View>
        )}
        {!loading && isSubscribed && (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>
              Back to <Text style={styles.backLinkHighlight}>Subscription</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    marginLeft: 10,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  planCard: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  planGradient: {
    padding: 16,
    borderRadius: 12,
  },
  planDetails: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  subscribeGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backButton: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subscribedContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  subscribedText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subscribedSubText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  noPlansContainer: {
    alignItems: 'center',
    marginVertical: 40,
    gap: 12,
  },
  noPlansIcon: {
    fontSize: 50,
    color: '#F59E0B',
  },
  noPlansText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  noPlansSubText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  backLinkHighlight: {
    fontWeight: '600',
    color: '#F59E0B',
    textDecorationLine: 'underline',
  },
  loadingIndicator: {
    marginVertical: 40,
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
});

export default PaymentScreen;