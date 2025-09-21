import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Mindful Bell',
      content: 'Mindful Bell helps you cultivate present-moment awareness throughout your day with gentle, random reminders.',
      image: '🔔'
    },
    {
      title: 'Random Bell Schedule',
      content: 'Bells ring at unpredictable times to catch you in natural moments and bring awareness to your current experience.',
      image: '⏰'
    },
    {
      title: 'Capture Your Observations',
      content: 'When a bell rings, take a moment to notice what you\'re experiencing - thoughts, feelings, sensations, or insights.',
      image: '📝'
    },
    {
      title: 'Privacy First',
      content: 'All your observations stay on your device. Nothing is shared or uploaded anywhere. Your practice is completely private.',
      image: '🔒'
    },
    {
      title: 'Ready to Begin',
      content: 'Your mindfulness journey starts now. We\'ll set up some default bell times that you can customize later.',
      image: '🌟'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.emoji}>{currentStepData.image}</Text>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.content}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={previousStep}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={nextStep}
          >
            <Text style={styles.primaryButtonText}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {currentStep === 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onComplete}
          >
            <Text style={styles.skipButtonText}>Skip Tour</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40
  },
  emoji: {
    fontSize: 80,
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20
  },
  description: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4
  },
  progressDotActive: {
    backgroundColor: '#007bff'
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    flex: 1,
    marginLeft: 10
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 18,
    fontWeight: '600'
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16
  }
});

export default OnboardingScreen;