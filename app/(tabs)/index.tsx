import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import {
  BathroomCardData,
  BathroomProfileCard,
} from "@/components/bathrooms/BathroomProfileCard";
import { db } from "@/firebaseConfig";

function getScoreColor(score?: number) {
  if (!score || score <= 0) return "#64748b";
  if (score >= 4.2) return "#16a34a";
  if (score >= 3.4) return "#84cc16";
  if (score >= 2.6) return "#eab308";
  if (score >= 1.8) return "#f97316";
  return "#dc2626";
}

function getOverallScore(bathroom: BathroomCardData) {
  const scores = [
    bathroom.cleanlinessAvg,
    bathroom.safetyAvg,
    bathroom.accessAvg,
  ].filter((value): value is number => typeof value === "number" && value > 0);

  if (scores.length === 0) return undefined;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export default function MapScreen() {
  const router = useRouter();

  const [region, setRegion] = useState<Region | null>(null);
  const [bathrooms, setBathrooms] = useState<BathroomCardData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCardOpen, setIsCardOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const selectedBathroom = useMemo(() => {
    if (bathrooms.length === 0) return null;
    return bathrooms[selectedIndex] ?? bathrooms[0];
  }, [bathrooms, selectedIndex]);

  useEffect(() => {
    async function loadMapData() {
      try {
        setIsLoading(true);

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          alert("Location permission is needed to show bathrooms near you.");
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});

        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        });

        const snapshot = await getDocs(collection(db, "bathrooms"));

        const bathroomData = snapshot.docs
          .map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              name: data.name,
              notes: data.notes,
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              cleanlinessAvg:
                data.cleanlinessAvg ?? data.ratings?.cleanlinessAvg,
              safetyAvg: data.safetyAvg ?? data.ratings?.safetyAvg,
              accessAvg: data.accessAvg ?? data.ratings?.accessAvg,
              totalReviews: data.totalReviews ?? data.ratings?.totalReviews,
              accessType: data.accessType,
              codeHint: data.codeHint,
              imageUrls: data.imageUrls ?? data.images ?? [],
              coverImageUrl:
                data.coverImageUrl ??
                data.imageUrls?.[0] ??
                data.images?.[0] ??
                null,
              wheelchairAccessible: data.wheelchairAccessible,
            };
          })
          .filter(
            (bathroom) =>
              Number.isFinite(bathroom.latitude) &&
              Number.isFinite(bathroom.longitude),
          );

        setBathrooms(bathroomData);
        setSelectedIndex(0);
        setIsCardOpen(bathroomData.length > 0);
      } catch (error) {
        console.error("Error loading bathrooms:", error);
        alert("Something went wrong loading bathrooms.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMapData();
  }, []);

  const selectBathroomById = (bathroomId: string) => {
    const index = bathrooms.findIndex((bathroom) => bathroom.id === bathroomId);
    if (index >= 0) {
      setSelectedIndex(index);
      setIsCardOpen(true);
    }
  };

  const goPrevious = () => {
    setSelectedIndex((current) => {
      if (bathrooms.length === 0) return 0;
      return current === 0 ? bathrooms.length - 1 : current - 1;
    });
    setIsCardOpen(true);
  };

  const goNext = () => {
    setSelectedIndex((current) => {
      if (bathrooms.length === 0) return 0;
      return current === bathrooms.length - 1 ? 0 : current + 1;
    });
    setIsCardOpen(true);
  };

  const openDirections = async (bathroom: BathroomCardData) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${bathroom.latitude},${bathroom.longitude}`;
    await Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        {isLoading || !region ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingTitle}>Finding bathrooms nearby</Text>
            <Text style={styles.loadingText}>
              Loading the map and checking saved bathrooms...
            </Text>
          </View>
        ) : (
          <MapView style={styles.map} initialRegion={region} showsUserLocation>
            {bathrooms.map((bathroom) => {
              const overallScore = getOverallScore(bathroom);
              const pinColor = getScoreColor(overallScore);

              return (
                <Marker
                  key={bathroom.id}
                  coordinate={{
                    latitude: bathroom.latitude,
                    longitude: bathroom.longitude,
                  }}
                  pinColor={pinColor}
                  title={bathroom.name ?? "Bathroom"}
                  description={bathroom.notes}
                  onPress={() => selectBathroomById(bathroom.id)}
                />
              );
            })}
          </MapView>
        )}
      </View>

      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/add" as any)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>

      {!isLoading && bathrooms.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No bathrooms here yet</Text>
          <Text style={styles.emptyText}>
            Add the first bathroom nearby so other people can find it later.
          </Text>

          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push("/add" as any)}
          >
            <Text style={styles.emptyButtonText}>Add Bathroom</Text>
          </Pressable>
        </View>
      )}

      {selectedBathroom && isCardOpen && (
        <BathroomProfileCard
          bathroom={selectedBathroom}
          currentIndex={selectedIndex}
          total={bathrooms.length}
          onClose={() => setIsCardOpen(false)}
          onPrevious={goPrevious}
          onNext={goNext}
          onDirections={() => openDirections(selectedBathroom)}
          onDetails={() =>
            router.push(`/bathroom/${selectedBathroom.id}` as any)
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mapWrap: {
    flex: 1,
    backgroundColor: "#000000",
  },
  map: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    backgroundColor: "#0f172a",
  },
  loadingTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 14,
  },
  loadingText: {
    color: "#cbd5e1",
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    position: "absolute",
    top: 58,
    right: 16,
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "600",
  },
  emptyCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 26,
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  emptyButton: {
    backgroundColor: "#2563eb",
    borderRadius: 17,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
});
