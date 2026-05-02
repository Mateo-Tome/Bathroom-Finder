import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { db } from "@/firebaseConfig";

type AccessType =
  | "public"
  | "customers_only"
  | "code_required"
  | "key_required"
  | "ask_staff";

type RatingValue = 1 | 2 | 3 | 4 | 5;

const accessOptions: { label: string; value: AccessType }[] = [
  { label: "Public", value: "public" },
  { label: "Customers Only", value: "customers_only" },
  { label: "Code Required", value: "code_required" },
  { label: "Key Required", value: "key_required" },
  { label: "Ask Staff", value: "ask_staff" },
];

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

function getOverallAverage(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

export default function AddScreen() {
  const router = useRouter();

  const [bathroomName, setBathroomName] = useState("");
  const [notes, setNotes] = useState("");
  const [accessType, setAccessType] = useState<AccessType>("public");
  const [codeHint, setCodeHint] = useState("");

  const [cleanliness, setCleanliness] = useState<RatingValue>(3);
  const [safety, setSafety] = useState<RatingValue>(3);
  const [access, setAccess] = useState<RatingValue>(3);
  const [privacy, setPrivacy] = useState<RatingValue>(3);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!bathroomName.trim()) {
      Alert.alert("Missing name", "Add a name for this bathroom.");
      return;
    }

    if (isSaving) return;

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

      const overallAvg = getOverallAverage([
        cleanliness,
        safety,
        access,
        privacy,
      ]);

      await addDoc(collection(db, "bathrooms"), {
        name: bathroomName.trim(),
        notes: notes.trim(),
        latitude,
        longitude,

        accessType,
        codeHint: codeHint.trim(),
        status: "open",
        isPublic: accessType === "public",

        cleanlinessAvg: cleanliness,
        safetyAvg: safety,
        accessAvg: access,
        privacyAvg: privacy,
        overallAvg,
        totalReviews: 1,

        imageUrls: [],
        coverImageUrl: null,

        verificationStatus: "unverified",
        verificationCount: 0,
        reportCount: 0,
        isFlagged: false,
        isHidden: false,
        lastVerifiedAt: null,
        createdByRole: "user",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Bathroom saved", "This bathroom was added successfully.");

      setBathroomName("");
      setNotes("");
      setAccessType("public");
      setCodeHint("");
      setCleanliness(3);
      setSafety(3);
      setAccess(3);
      setPrivacy(3);

      router.replace("/" as any);
    } catch (error) {
      console.error("Error saving bathroom:", error);
      Alert.alert("Save failed", "Something went wrong. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Bathroom</Text>
          <Text style={styles.subtitle}>
            Add a bathroom location and give it a first rating. New bathrooms
            start unverified until people confirm them.
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
          <Text style={styles.sectionTitle}>First Rating</Text>
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
          <RatingSelector
            label="Privacy"
            value={privacy}
            onChange={setPrivacy}
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

        <View style={styles.disabledCard}>
          <Text style={styles.disabledTitle}>Photos coming next</Text>
          <Text style={styles.disabledText}>
            Firebase Storage is not set up yet, so photos are disabled for now.
          </Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 16 },
  title: { color: "#ffffff", fontSize: 30, fontWeight: "800" },
  subtitle: { color: "#cbd5e1", fontSize: 15, marginTop: 4, lineHeight: 21 },
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
  textArea: { minHeight: 92, textAlignVertical: "top" },
  ratingGroup: { marginBottom: 14 },
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
  ratingButtonTextActive: { color: "#ffffff" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 999,
  },
  optionChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  optionText: { color: "#334155", fontSize: 13, fontWeight: "800" },
  optionTextActive: { color: "#ffffff" },
  disabledCard: {
    backgroundColor: "#1e293b",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  disabledTitle: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  disabledText: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
});
