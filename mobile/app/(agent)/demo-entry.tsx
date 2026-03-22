import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { Button, Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { useAgent } from '@/contexts/AgentContext';
import { defaultStyles, loginstyles } from '@/styles';

const AgentDemoEntry = () => {
  const { loginAsAgent } = useAgent();

  const handleStartDemo = (demoMode: boolean) => {
    loginAsAgent(demoMode);
    if (demoMode) {
      router.replace('/(agent)/(kyc)');
    } else {
      router.replace('/(agent)/(index)');
    }
  };

  return (
    <View style={[defaultStyles.flex, defaultStyles.container]}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Icon source="truck-delivery" size={48} color={Colors.primary[500]} />
        </View>
        
        <Text style={styles.title}>Agent Demo</Text>
        <Text style={styles.subtitle}>
          Experience the complete agent delivery flow
        </Text>

        <View style={styles.flowSteps}>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: Colors.primary[500] }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>KYC Verification</Text>
              <Text style={styles.stepDescription}>
                Submit identity documents and vehicle registration
              </Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: Colors.primary[500] }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Accept Orders</Text>
              <Text style={styles.stepDescription}>
                View available deliveries and accept ones near you
              </Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: Colors.primary[500] }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Pickup & Deliver</Text>
              <Text style={styles.stepDescription}>
                Navigate to locations, confirm pickup, enter security code
              </Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: Colors.success }]}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Paid</Text>
              <Text style={styles.stepDescription}>
                Earn delivery fees for each completed order
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => handleStartDemo(true)}
            style={[defaultStyles.button, { backgroundColor: Colors.primary[500] }]}
            contentStyle={{ height: 56 }}
            icon="rocket-launch">
            Start Full Demo
          </Button>
          <Text style={styles.demoNote}>
            Full demo includes KYC submission with auto-approval
          </Text>

          <TouchableOpacity
            onPress={() => handleStartDemo(false)}
            style={styles.skipButton}>
            <Text style={styles.skipText}>
              Skip to Orders (KYC Already Verified)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark[0],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey['61'],
    textAlign: 'center',
    marginBottom: 32,
  },
  flowSteps: {
    width: '100%',
    backgroundColor: Colors.light[10],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: Colors.light[10],
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark[0],
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.grey['61'],
    lineHeight: 20,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: Colors.grey['e1'],
    marginLeft: 15,
    marginVertical: 8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  demoNote: {
    fontSize: 12,
    color: Colors.grey['61'],
    marginTop: 8,
    marginBottom: 16,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: Colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AgentDemoEntry;
