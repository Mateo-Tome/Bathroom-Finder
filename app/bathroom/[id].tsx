import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { db } from "@/firebaseConfig";

type Bathroom = {
  id: string;
  name?: string;
  notes?: string;
  latitude: number;
  longitude: number;
  accessType?: string;
  codeHint?: string;
  imageUrls?: string[];
  coverImageUrl?: string | null;
  cleanlinessAvg?: number;
  safetyAvg?: number;
  accessAvg?: number;
  privacyAvg?: number;
  totalReviews?: number;
  wheelchairAccessible?: boolean;
};

function formatAccess(accessType?: string) {
  if (!accessType) return "Access unknown";
  return accessType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function Score({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreValue}>
        {value && value > 0 ? value.toFixed(1) : "New"}
      </Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

export default function BathroomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [bathroom, setBathroom] = useState<Bathroom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBathroom() {
      if (!id) return;

      try {
        const snapshot = await getDoc(doc(db, "bathrooms", id));

        if (!snapshot.exists()) {
          setBathroom(null);
          return;
        }

        const data = snapshot.data();

        setBathroom({
          id: snapshot.id,
          name: data.name,
          notes: data.notes,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          accessType: data.accessType,
          codeHint: data.codeHint,
          imageUrls: data.imageUrls ?? data.images ?? [],
          coverImageUrl:
            data.coverImageUrl ??
            data.imageUrls?.[0] ??
            data.images?.[0] ??
            null,
          cleanlinessAvg: data.cleanlinessAvg ?? data.ratings?.cleanlinessAvg,
          safetyAvg: data.safetyAvg ?? data.ratings?.safetyAvg,
          accessAvg: data.accessAvg ?? data.ratings?.accessAvg,
          privacyAvg: data.privacyAvg ?? data.ratings?.privacyAvg,
          totalReviews: data.totalReviews ?? data.ratings?.totalReviews,
          wheelchairAccessible: data.wheelchairAccessible,
        });
      } catch (error) {
        console.error("Error loading bathroom:", error);
        alert("Could not load this bathroom.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBathroom();
  }, [id]);

  const openDirections = async () => {
    if (!bathroom) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${bathroom.latitude},${bathroom.longitude}`;
    await Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading bathroom...</Text>
      </View>
    );
  }

  if (!bathroom) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Bathroom not found</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const heroImage = bathroom.coverImageUrl || bathroom.imageUrls?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
        ) : (
          <View style={styles.emptyHero}>
            <Text style={styles.emptyHeroIcon}>🚻</Text>
            <Text style={styles.emptyHeroText}>No photo yet</Text>
          </View>
        )}

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{bathroom.name ?? "Bathroom"}</Text>
        <Text style={styles.meta}>
          {bathroom.totalReviews ?? 0} reviews ·{" "}
          {formatAccess(bathroom.accessType)}
        </Text>

        <View style={styles.badgeRow}>
          {bathroom.wheelchairAccessible && (
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeBlueText}>♿ Accessible</Text>
            </View>
          )}

          {!!bathroom.codeHint && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PIN / code info available</Text>
            </View>
          )}
        </View>

        <View style={styles.scoreRow}>
          <Score label="Clean" value={bathroom.cleanlinessAvg} />
          <Score label="Safe" value={bathroom.safetyAvg} />
          <Score label="Access" value={bathroom.accessAvg} />
          <Score label="Privacy" value={bathroom.privacyAvg} />
        </View>

        {!!bathroom.codeHint && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Access code / key info</Text>
            <Text style={styles.infoText}>{bathroom.codeHint}</Text>
          </View>
        )}

        {!!bathroom.notes && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Notes</Text>
            <Text style={styles.infoText}>{bathroom.notes}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push(`/update/${bathroom.id}` as any)}
          >
            <Text style={styles.secondaryButtonText}>Add Update</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={openDirections}>
            <Text style={styles.primaryButtonText}>Directions</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: { color: "#cbd5e1", marginTop: 10 },
  errorTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16,
  },
  hero: { height: 260, backgroundColor: "#111827" },
  heroImage: { width: "100%", height: "100%" },
  emptyHero: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyHeroIcon: { fontSize: 44 },
  emptyHeroText: { color: "#cbd5e1", fontWeight: "800", marginTop: 6 },
  backButton: {
    position: "absolute",
    top: 54,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: "#fff", fontSize: 38, lineHeight: 40 },
  card: {
    marginTop: -24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
  },
  title: { color: "#0f172a", fontSize: 28, fontWeight: "900" },
  meta: { color: "#64748b", marginTop: 4, fontWeight: "700" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  badge: {
    backgroundColor: "#dbeafe",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: { color: "#1d4ed8", fontWeight: "900", fontSize: 12 },
  badgeBlue: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeBlueText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  scoreRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  scoreCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  scoreValue: { color: "#0f172a", fontSize: 18, fontWeight: "900" },
  scoreLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoTitle: { color: "#0f172a", fontWeight: "900", marginBottom: 5 },
  infoText: { color: "#334155", lineHeight: 21 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 17,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#0f172a", fontWeight: "900" },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 17,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "900" },
});
