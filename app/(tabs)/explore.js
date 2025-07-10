import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { db } from '../../firebaseConfig';


export default function TabTwoScreen() {
  const [region, setRegion] = useState(null);
  const router = useRouter();
  const [bathrooms, setBathrooms] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      if (location && location.coords) {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        const fetchBathrooms = async () => {
          try {
            const snapshot = await getDocs(collection(db, 'bathrooms'));
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setBathrooms(data);
          } catch (error) {
            console.error('Error fetching bathrooms:', error);
          }
        };
        
        fetchBathrooms();
        
      }
    })();
  }, []);
  console.log('🧻 Bathrooms from Firestore:', bathrooms);
  bathrooms.forEach((b) =>
    console.log(`📍 ${b.name} at (${b.latitude}, ${b.longitude})`)
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Map</Text>

      {region ? (
        <>
         <Button
            title="+ Add Bathroom"
            onPress={() => router.push('/(tabs)/addbathroom')}
          />
          <MapView style={styles.map} region={region}>
            <Marker coordinate={region} title="You are here" />
            {bathrooms.map((bathroom) => (
  <Marker
    key={bathroom.id}
    coordinate={{
      latitude: bathroom.latitude,
      longitude: bathroom.longitude,
    }}
    title={bathroom.name}
    description={bathroom.notes}
  />
))}

          </MapView>

         
        </>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 5,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  map: {
    flex: 1,
    width: '100%',
  },
});

