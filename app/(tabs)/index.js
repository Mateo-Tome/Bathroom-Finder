import { useRouter } from 'expo-router'; // ✅ Import useRouter
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function IndexScreen() {
  const router = useRouter(); // ✅ Define the router BEFORE you use it

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🚻 Bathroom Locator</Text>
      <Text style={styles.subtitle}>Find clean and safe restrooms near you</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push ('/(tabs)/explore')}>
        <Text style={styles.buttonText}>Open Map</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push ('/(tabs)/addbathroom')}>
        <Text style={styles.buttonText}>Add Bathroom</Text>
      </TouchableOpacity>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },



});


