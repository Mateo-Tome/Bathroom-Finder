import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { Alert, Button, Image, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { db } from '../../firebaseConfig';
const storage = getStorage();

export default function AddBathroomScreen() {
  const [bathroomName, setBathroomName] = useState('');
  const [notes, setNotes] = useState('');
  const [bathroomImages, setBathroomImages] = useState([]);

  const pickImagesFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled){
      setBathroomImages(prev => [...prev, ...result.assets.map(asset => asset.uri)]);
    }
  };
  const takeMultiplePhotos = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert('Camera access is required');
      return;
    }
  
    let keepTakingPhotos = true;
  
    while (keepTakingPhotos) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
      });
  
      if (!result.canceled) {
        setBathroomImages(prev => [...prev, result.assets[0].uri]);
      }
  
    
      keepTakingPhotos = await new Promise((resolve) => {
        Alert.alert(
          "Take another photo?",
          "",
          [
            { text: "No", onPress: () => resolve(false), style: "cancel" },
            { text: "Yes", onPress: () => resolve(true) }
          ],
          { cancelable: false }
        );
      });
    }
  };
  
  
  const handleSave = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
  
      // Upload images to Firebase Storage
      const uploadPromises = bathroomImages.map(async (uri, index) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const imageRef = ref(storage, `bathroomImages/${Date.now()}-${index}.jpg`);
        await uploadBytes(imageRef, blob);
        return getDownloadURL(imageRef); // Return URL
      });
  
      const imageUrls = await Promise.all(uploadPromises); // Wait for all uploads
  
      // Save to Firestore
      await addDoc(collection(db, 'bathrooms'), {
        name: bathroomName,
        notes: notes,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        images: imageUrls,
        createdAt: new Date()
      });
  
      alert('Bathroom saved!');
      setBathroomName('');
      setNotes('');
      setBathroomImages([]);
    } catch (error) {
      console.error('Error saving bathroom:', error);
      alert('Something went wrong. Try again.');
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Add a Bathroom</Text>

      <TextInput
        style={styles.input}
        placeholder="Bathroom Name"
        value={bathroomName}
        onChangeText={setBathroomName}
      />

      <TextInput
        style={styles.input}
        placeholder="Notes (PIN, code, directions, etc.)"
        value={notes}
        onChangeText={setNotes}
      />
      <Button title="Take Photo" onPress={takeMultiplePhotos} />

      <Button title="Choose Photos" onPress={pickImagesFromGallery} />

      {bathroomImages.map((uri, index) => (
  <View key={index} style={{ marginTop: 10, alignItems: 'center' }}>
    <Image
      source={{ uri }}
      style={{ width: 100, height: 100, marginBottom: 5 }}
    />
    <Button
      title="Remove"
      onPress={() => {
        setBathroomImages(prev => prev.filter((_, i) => i !== index));
      }}
      color="red"
    />
  </View>
))}

      <Button title="Save Bathroom" onPress={handleSave} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1c1c1e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
});