import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { db } from "@/firebaseConfig";

const storage = getStorage();

type RatingValue = 1 | 2 | 3 | 4 | 5;

function RatingSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RatingValue;
  onChange: (value: RatingValue) => void;
}) {
  return (
    <View style={styles.ratingGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Pressable
            key={rating}
            style={[
              styles.ratingButton,
              value === rating && styles.ratingButtonActive,
            ]}
            onPress={() => onChange(rating as RatingValue)}
          >
            <Text
              style={[
                styles.ratingButtonText,
                value === rating && styles.ratingButtonTextActive,
              ]}
            >
              {rating}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function UpdateBathroomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [bathroomName, setBathroomName] = useState("Bathroom");
  const [cleanliness, setCleanliness] = useState<RatingValue>(3);
  const [safety, setSafety] = useState<RatingValue>(3);
  const [access, setAccess] = useState<RatingValue>(3);
  const [privacy, setPrivacy] = useState<RatingValue>(3);
  const [note, setNote] = useState("");
  const [codeUpdate, setCodeUpdate] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadBathroomName() {
      if (!id) return;

      const snapshot = await getDoc(doc(db, "bathrooms", id));
      if (snapshot.exists()) {
        setBathroomName(snapshot.data().name ?? "Bathroom");
      }
    }

    loadBathroomName();
  }, [id]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        ...result.assets.map((asset) => asset.uri),
      ]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Camera required", "Camera access is needed to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const uploadImages = async () => {
    const uploads = images.map(async (uri, index) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(
        storage,
        `bathroomUpdates/${id}/${Date.now()}-${index}.jpg`,
      );

      await uploadBytes(imageRef, blob);
      return getDownloadURL(imageRef);
    });

    return Promise.all(uploads);
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      setIsSaving(true);

      const photoUrls = await uploadImages();

      await addDoc(collection(db, "bathroomUpdates"), {
        bathroomId: id,
        cleanliness,
        safety,
        access,
        privacy,
        note: note.trim(),
        codeUpdate: codeUpdate.trim(),
        photoUrls,
        createdAt: serverTimestamp(),
      });

      // Simple temporary aggregation.
      // Later we should replace this with better average recalculation.
      await updateDoc(doc(db, "bathrooms", id), {
        cleanlinessAvg: cleanliness,
        safetyAvg: safety,
        accessAvg: access,
        privacyAvg: privacy,
        codeHint: codeUpdate.trim() || undefined,
        totalReviews: increment(1),
        updatedAt: serverTimestamp(),
        ...(photoUrls[0] ? { coverImageUrl: photoUrls[0] } : {}),
      });

      Alert.alert("Update saved", "Thanks for improving this bathroom info.");
      router.back();
    } catch (error) {
      console.error("Error saving update:", error);
      Alert.alert("Save failed", "Something went wrong. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Update Bathroom</Text>
      <Text style={styles.subtitle}>{bathroomName}</Text>

      <View style={styles.card}>
        <RatingSelector
          label="Cleanliness"
          value={cleanliness}
          onChange={setCleanliness}
        />
        <RatingSelector label="Safety" value={safety} onChange={setSafety} />
        <RatingSelector
          label="Ease of access"
          value={access}
          onChange={setAccess}
        />
        <RatingSelector label="Privacy" value={privacy} onChange={setPrivacy} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What should others know?"
          placeholderTextColor="#94a3b8"
          multiline
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.label}>Code / key update</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 1234, ask cashier, code no longer works"
          placeholderTextColor="#94a3b8"
          value={codeUpdate}
          onChangeText={setCodeUpdate}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Photos</Text>

        <View style={styles.photoActions}>
          <Pressable style={styles.secondaryButton} onPress={takePhoto}>
            <Text style={styles.secondaryButtonText}>Take Photo</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={pickImages}>
            <Text style={styles.secondaryButtonText}>Choose</Text>
          </Pressable>
        </View>

        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoRow}
          >
            {images.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={styles.photo}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <Pressable
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Update</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 16, paddingTop: 58, paddingBottom: 40 },
  backButton: { marginBottom: 16 },
  backButtonText: { color: "#cbd5e1", fontSize: 16, fontWeight: "800" },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#cbd5e1", fontSize: 15, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  ratingGroup: { marginBottom: 16 },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 8,
  },
  ratingRow: { flexDirection: "row", gap: 8 },
  ratingButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  ratingButtonActive: { backgroundColor: "#2563eb" },
  ratingButtonText: { color: "#334155", fontWeight: "900" },
  ratingButtonTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#0f172a",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 94, textAlignVertical: "top" },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  photoActions: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#0f172a", fontWeight: "900" },
  photoRow: { marginTop: 14 },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#e5e7eb",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
