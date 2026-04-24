import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { db } from "@/firebaseConfig";

const storage = getStorage();

type AccessType =
  | "public"
  | "customers_only"
  | "code_required"
  | "key_required"
  | "ask_staff";

const accessOptions: { label: string; value: AccessType }[] = [
  { label: "Public", value: "public" },
  { label: "Customers Only", value: "customers_only" },
  { label: "Code Required", value: "code_required" },
  { label: "Key Required", value: "key_required" },
  { label: "Ask Staff", value: "ask_staff" },
];

export default function AddScreen() {
  const [bathroomName, setBathroomName] = useState("");
  const [notes, setNotes] = useState("");
  const [accessType, setAccessType] = useState<AccessType>("public");
  const [codeHint, setCodeHint] = useState("");
  const [bathroomImages, setBathroomImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const pickImagesFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setBathroomImages((prev) => [
        ...prev,
        ...result.assets.map((asset) => asset.uri),
      ]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera required",
        "Camera access is needed to take bathroom photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setBathroomImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setBathroomImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const uploadImages = async () => {
    const uploadPromises = bathroomImages.map(async (uri, index) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(
        storage,
        `bathroomImages/${Date.now()}-${index}.jpg`,
      );

      await uploadBytes(imageRef, blob);

      return getDownloadURL(imageRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSave = async () => {
    if (!bathroomName.trim()) {
      Alert.alert("Missing name", "Add a name for this bathroom.");
      return;
    }

    try {
      setIsSaving(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location required",
          "Location access is needed to save this bathroom.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const imageUrls = await uploadImages();

      await addDoc(collection(db, "bathrooms"), {
        name: bathroomName.trim(),
        notes: notes.trim(),
        latitude,
        longitude,

        accessType,
        codeHint: codeHint.trim(),
        status: "open",
        isPublic: accessType === "public",

        cleanlinessAvg: 0,
        safetyAvg: 0,
        accessAvg: 0,
        privacyAvg: 0,
        overallAvg: 0,
        totalReviews: 0,

        imageUrls,
        coverImageUrl: imageUrls[0] ?? null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Bathroom saved", "This bathroom was added successfully.");

      setBathroomName("");
      setNotes("");
      setAccessType("public");
      setCodeHint("");
      setBathroomImages([]);
    } catch (error) {
      console.error("Error saving bathroom:", error);
      Alert.alert("Save failed", "Something went wrong. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Bathroom</Text>
          <Text style={styles.subtitle}>
            Help someone find a clean, safe, usable bathroom fast.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <Text style={styles.label}>Bathroom name</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Target restroom"
            placeholderTextColor="#94a3b8"
            value={bathroomName}
            onChangeText={setBathroomName}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="PIN, directions, cleanliness notes, etc."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Access</Text>

          <View style={styles.optionGrid}>
            {accessOptions.map((option) => {
              const selected = accessType === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.optionChip,
                    selected && styles.optionChipActive,
                  ]}
                  onPress={() => setAccessType(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Code / key info</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: 1234, ask cashier, code on receipt"
            placeholderTextColor="#94a3b8"
            value={codeHint}
            onChangeText={setCodeHint}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.helperText}>
            Add photos of the entrance, sign, or bathroom condition.
          </Text>

          <View style={styles.photoActions}>
            <Pressable style={styles.secondaryButton} onPress={takePhoto}>
              <Text style={styles.secondaryButtonText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={pickImagesFromGallery}
            >
              <Text style={styles.secondaryButtonText}>Choose Photos</Text>
            </Pressable>
          </View>

          {bathroomImages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoRow}
            >
              {bathroomImages.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photo} />
                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removePhotoText}>×</Text>
                  </Pressable>
                </View>
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
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Bathroom</Text>
          )}
        </Pressable>

        <Text style={styles.footerNote}>
          Ratings come next after the bathroom exists. Users will be able to
          update cleanliness, safety, privacy, and access from the detail
          screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    marginTop: 4,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 8,
  },
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
  textArea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 999,
  },
  optionChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  optionText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },
  optionTextActive: {
    color: "#ffffff",
  },
  helperText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  photoActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "800",
  },
  photoRow: {
    marginTop: 14,
  },
  photoWrap: {
    width: 92,
    height: 92,
    marginRight: 10,
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
  },
  removePhotoButton: {
    position: "absolute",
    top: -7,
    right: -7,
    width: 26,
    height: 26,
    borderRadius: 99,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoText: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "800",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  footerNote: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 10,
  },
});
