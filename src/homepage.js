import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, Dimensions, Vibration, Platform } from 'react-native';
import { database } from './firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { LineChart } from 'react-native-chart-kit';
import Modal from 'react-native-modal';
import { Audio } from 'expo-av';

// Main Homepage component
export default function Homepage() {
  const [sensorData, setSensorData] = useState({
    analogValue: 0,
    state: "Normal",
  });
  const [chartData, setChartData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const alertSound = useRef(null);
  const lastState = useRef("Normal");

  const getFormattedTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Request audio permissions (needed for iOS/Android)
  const requestAudioPermissions = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Audio permissions are required to play sounds');
      }
    }
  };

  useEffect(() => {
    requestAudioPermissions();
  }, []);

  const loadAndPlayAlertSound = async () => {
    try {
      if (!alertSound.current) {
        alertSound.current = new Audio.Sound();
        await alertSound.current.loadAsync(require('./soundalarm.mp3'));
        await alertSound.current.setIsLoopingAsync(true);
        await alertSound.current.playAsync();
      }
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const stopAlertSound = async () => {
    try {
      if (alertSound.current) {
        await alertSound.current.stopAsync();
        await alertSound.current.unloadAsync();
        alertSound.current = null;
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  };

  const handleFirebaseState = (value) => {
    const analogValue = isNaN(value.analogValue) ? 0 : value.analogValue;

    setSensorData({
      analogValue,
      state: value.state || "Normal",
    });

    setChartData((prev) => {
      const updatedData = [...prev, analogValue].slice(-10);
      return updatedData;
    });

    setTimestamps((prev) => {
      const updatedTimestamps = [...prev, getFormattedTime()].slice(-10);
      return updatedTimestamps;
    });

    // Handle only state changes to prevent repeated trigger
    if (value.state !== lastState.current) {
      console.log(`Handling state change: ${value.state}`);
      lastState.current = value.state; // Update state to the current state

      if (value.state === "Alert" || value.state === "Danger") {
        console.log("Triggering alert modal...");
        setModalVisible(true);
        Vibration.vibrate(1000);
        loadAndPlayAlertSound();
      } else if (value.state === "Normal") {
        console.log("Resetting alert modal...");
        setModalVisible(false);
        Vibration.cancel();
        stopAlertSound();
      }
    }
  };

  useEffect(() => {
    const dbRef = ref(database, 'sensorReading/');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const value = snapshot.val();
      if (value) {
        console.log("Firebase Data: ", value);
        handleFirebaseState(value);
      }
    });

    return () => {
      unsubscribe();
      stopAlertSound();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Display real-time sensor data */}
      <Text style={styles.text}>Analog Value: {sensorData.analogValue}</Text>
      <Text style={styles.text}>System State: {sensorData.state}</Text>

      {/* Render the LineChart */}
      <LineChart
        data={{
          labels: timestamps,
          datasets: [
            {
              data: chartData.length > 0 ? chartData : [0],
              color: () => `rgba(255, 0, 0, 0.5)`,
              strokeWidth: 2,
            },
          ],
        }}
        width={Dimensions.get('window').width - 30}
        height={220}
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: "#e26a00",
          backgroundGradientFrom: "#fb8c00",
          backgroundGradientTo: "#ffa726",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />

      {/* Danger alert modal */}
      <Modal isVisible={isModalVisible}>
        <View style={styles.modal}>
          <Text style={styles.modalText}>
            Danger! Smoke or Gas levels are high!
          </Text>
          <Button
            title="Dismiss Alert"
            onPress={() => {
              console.log("Alert dismissed.");
              setModalVisible(false);
              Vibration.cancel();
              stopAlertSound();
              lastState.current = "Normal"; // Explicitly reset state here
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    color: "red",
    fontWeight: "bold",
  },
});
