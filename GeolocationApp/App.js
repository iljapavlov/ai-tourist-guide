// import * as Speech from 'expo-speech';  // Import the expo-speech module
import { Audio } from 'expo-av';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import * as Location from 'expo-location'; // Install: expo install expo-location
import { Ionicons } from '@expo/vector-icons'; // Install: expo install @expo/vector-icons
import routes from './assets/data/routes.json'; // Preprocessed KML converted to JSON

const audioFiles = {
    intro: require('./assets/data/intro.mp3'),
    outro: require('./assets/data/outro.mp3'),
    m1: require('./assets/data/m1.mp3'),
    m2: require('./assets/data/m2.mp3'),
    m3: require('./assets/data/m3.mp3'),
    m5: require('./assets/data/m5.mp3'),
    m6: require('./assets/data/m6.mp3'),
    m7: require('./assets/data/m7.mp3'),
    m8: require('./assets/data/m8.mp3'),
    m9: require('./assets/data/m9.mp3'),
    m10: require('./assets/data/m10.mp3'),
    m11: require('./assets/data/m11.mp3'),
    m12: require('./assets/data/m12.mp3'),
    m13: require('./assets/data/m13.mp3'),
    m15: require('./assets/data/m15.mp3'),
  };

const App = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const narrationQueue = useRef([]); // Queue for narration
  const isNarrating = useRef(false); // To track if narration is ongoing
  const locationWatcher = useRef(null); // Reference to geolocation watcher
  const [triggeredLandmarks, setTriggeredLandmarks] = useState(new Set()); // Track triggered landmarks


  const [isSimulating, setIsSimulating] = useState(false); // Track simulation state
  const [simulationIndex, setSimulationIndex] = useState(0); // Index for simulated location


  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  useEffect(() => {
    const startLocationWatch = async () => {
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (location) => {
          setUserLocation(location.coords);
          if (selectedRoute && !isSimulating) {
            checkLandmarkProximity(location.coords);
          }
        }
      );
      locationWatcher.current = watcher;
    };

    startLocationWatch();

    return () => {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
      }
    };
  }, [selectedRoute]);

  const checkLandmarkProximity = (location) => {
    const { latitude, longitude } = location;

    selectedRoute.landmarks.forEach((landmark, index) => {
      const distance = getDistance(
        { latitude, longitude },
        { latitude: landmark.lat, longitude: landmark.lon }
      );

      if (distance <= 50 && !triggeredLandmarks.has(landmark.name)) {
        console.log('triggering', landmark.name);
        
        setTriggeredLandmarks((prev) => new Set(prev).add(landmark.name)); // Mark landmark as triggered
        enqueueNarration(index + 1);  // landmark.index starts from 1
      }
    });
  };

  const getDistance = (loc1, loc2) => {
    const R = 6371e3; // Earth's radius in meters
    const lat1 = (loc1.latitude * Math.PI) / 180;
    const lat2 = (loc2.latitude * Math.PI) / 180;
    const deltaLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const deltaLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const enqueueNarration = async (landmarkIndex) => {
    let narrationFiles = [];

    // Add intro file
    narrationFiles.push('intro');
    
    // Add landmark narration based on the landmark index
    if (landmarkIndex > 0) {
      const landmarkFile = `m${landmarkIndex}`;
      narrationFiles.push(landmarkFile);
    }

    // Add outro file
    narrationFiles.push('outro');

    // Add all files to the queue
    narrationQueue.current.push(...narrationFiles);

    // If no narration is ongoing, start the first narration
    if (!isNarrating.current) {
      playNextNarration();
    }
  };

  const playNextNarration = async () => {
    if (narrationQueue.current.length === 0) {
      isNarrating.current = false;
      return;
    }

    isNarrating.current = true;
    const narrationFile = narrationQueue.current.shift(); // Get next narration file

    console.log('Playing narration:', narrationFile); // Log which file is playing

    // Load and play the audio file
    const sound = new Audio.Sound();
    try {
      const fileToPlay = audioFiles[narrationFile];
      
      if (!fileToPlay) {
        console.error(`No audio file found for: ${narrationFile}`);
        playNextNarration(); // Skip to next file if not found
        return;
      }

      await sound.loadAsync(fileToPlay);
      await sound.playAsync();

      // After playback completes, proceed to the next file in the queue
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          playNextNarration(); // Play next narration file
        }
      });
    } catch (error) {
      console.error('Error during narration playback:', error);
      playNextNarration(); // Skip to the next narration in case of error
    }
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setMapRegion({
      latitude: route.coords[0].latitude,
      longitude: route.coords[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
    setMenuVisible(false);
  };

  const handleSimulateMovement = () => {
    if (!selectedRoute) return;

    setIsSimulating(true);
    let index = simulationIndex;

    // Simulate location change every 2 seconds (adjust for your preference)
    const simulationInterval = setInterval(() => {
      if (index < selectedRoute.coords.length - 1) {
        index++;
        setSimulationIndex(index);
        setUserLocation(selectedRoute.coords[index]);
        checkLandmarkProximity(selectedRoute.coords[index]);
      } else {
        clearInterval(simulationInterval);
        setIsSimulating(false);
      }
    }, 5000); // Move every 3 seconds
  };

  const handleCenterMap = () => {
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  return (
    <View style={styles.container}>
    {/* Map View */}
      <MapView
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        onRegionChangeComplete={(region) => setMapRegion(region)}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Selected Route */}
        {selectedRoute && (
          <>
            {/* Start and End Markers */}
            <Marker
              coordinate={{
                latitude: selectedRoute.coords[0].latitude,
                longitude: selectedRoute.coords[0].longitude,
              }}
              title="Start"
              pinColor="green"
            />
            <Marker
              coordinate={{
                latitude: selectedRoute.coords[selectedRoute.coords.length - 1].latitude,
                longitude: selectedRoute.coords[selectedRoute.coords.length - 1].longitude,
              }}
              title="End"
              pinColor="red"
            />

            {/* Dashed Line for Route */}
            <Polyline
              coordinates={selectedRoute.coords.map((coord) => ({
                latitude: coord.latitude,
                longitude: coord.longitude,
              }))}
              strokeColor="gray"
              strokeWidth={2}
              lineDashPattern={[6, 3]} // Dashed line pattern
            />

            {/* Landmarks as Circles */}
            {selectedRoute.landmarks.map((landmark, index) => (
                <Circle
                key={`landmark-${index}`}
                center={{
                    latitude: landmark.lat,
                    longitude: landmark.lon,
                }}
                radius={50} // Adjust radius for circle size
                strokeColor="orange"
                fillColor="rgba(255, 165, 0, 0.5)" // Semi-transparent fill
                zIndex={999} // Ensure circles are on top of other map layers
                />
            ))}
          </>
        )}

        
      </MapView>

      {/* Center on Me Button */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterMap}>
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>

      {/* Burger Button */}
      <TouchableOpacity style={styles.burgerButton} onPress={() => setMenuVisible(true)}>
        <Ionicons name="menu" size={24} color="white" />
      </TouchableOpacity>
        
      {/* Simulate Movement Button */}
      <TouchableOpacity
        style={styles.simulateButton}
        onPress={handleSimulateMovement}
        disabled={isSimulating}
      >
        <Text style={styles.simulateButtonText}>
        {isSimulating ? 'Simulating...' : 'Start Simulation'}
        </Text>
      </TouchableOpacity>

      {/* Popup Menu */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" size={30} color="black" />
            </TouchableOpacity>

            {/* Route selection */}
            <Text style={styles.menuHeader}>Select a Route</Text>
            <FlatList
              data={routes}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleRouteSelect(item)}
                >
                  <Text style={styles.menuItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centerButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 30,
  },
  burgerButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
  },
  simulateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  simulateButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
  closeButton: { position: 'absolute', top: 10, right: 10 },
  menuHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  menuItemText: { fontSize: 16 },
});

export default App;
