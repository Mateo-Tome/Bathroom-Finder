import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export type BathroomCardData = {
  id: string;
  name?: string;
  notes?: string;
  latitude: number;
  longitude: number;
  cleanlinessAvg?: number;
  safetyAvg?: number;
  accessAvg?: number;
  totalReviews?: number;
  accessType?: string;
  codeHint?: string;
  imageUrls?: string[];
  coverImageUrl?: string | null;
  wheelchairAccessible?: boolean;
};

type Props = {
  bathroom: BathroomCardData;
  currentIndex: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDirections: () => void;
  onDetails: () => void;
};

function getScoreColor(score?: number) {
  if (!score || score <= 0) return "#94a3b8";
  if (score >= 4.2) return "#16a34a";
  if (score >= 3.4) return "#84cc16";
  if (score >= 2.6) return "#eab308";
  if (score >= 1.8) return "#f97316";
  return "#dc2626";
}

function formatAccess(accessType?: string) {
  if (!accessType) return "Access unknown";

  return accessType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RatingBlock({ label, score }: { label: string; score?: number }) {
  const color = getScoreColor(score);

  return (
    <View style={styles.ratingBlock}>
      <View style={[styles.ratingBar, { backgroundColor: color }]} />
      <Text style={styles.ratingLabel}>{label}</Text>
      <Text style={styles.ratingValue}>
        {score && score > 0 ? score.toFixed(1) : "New"}
      </Text>
    </View>
  );
}

export function BathroomProfileCard({
  bathroom,
  currentIndex,
  total,
  onClose,
  onPrevious,
  onNext,
  onDirections,
  onDetails,
}: Props) {
  const imageUrl = bathroom.coverImageUrl || bathroom.imageUrls?.[0];

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.emptyImage}>
            <Text style={styles.emptyImageIcon}>🚻</Text>
            <Text style={styles.emptyImageText}>No photo yet</Text>
          </View>
        )}

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        <View style={styles.counterPill}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {total}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text numberOfLines={1} style={styles.title}>
              {bathroom.name ?? "Bathroom"}
            </Text>
            <Text style={styles.meta}>
              {bathroom.totalReviews ?? 0} reviews ·{" "}
              {formatAccess(bathroom.accessType)}
            </Text>
          </View>

          <View style={styles.badgeRow}>
            {bathroom.wheelchairAccessible && (
              <View style={styles.blueBadge}>
                <Text style={styles.blueBadgeText}>♿</Text>
              </View>
            )}

            {(bathroom.accessType === "code_required" ||
              !!bathroom.codeHint) && (
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>PIN</Text>
              </View>
            )}
          </View>
        </View>

        {!!bathroom.notes && (
          <Text numberOfLines={2} style={styles.notes}>
            {bathroom.notes}
          </Text>
        )}

        <View style={styles.ratingsRow}>
          <RatingBlock label="Clean" score={bathroom.cleanlinessAvg} />
          <RatingBlock label="Safe" score={bathroom.safetyAvg} />
          <RatingBlock label="Access" score={bathroom.accessAvg} />
        </View>

        <View style={styles.navRow}>
          <Pressable style={styles.arrowButton} onPress={onPrevious}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>

          <View style={styles.mainActions}>
            <Pressable style={styles.detailsButton} onPress={onDetails}>
              <Text style={styles.detailsButtonText}>Details</Text>
            </Pressable>

            <Pressable style={styles.directionsButton} onPress={onDirections}>
              <Text style={styles.directionsButtonText}>Directions</Text>
            </Pressable>
          </View>

          <Pressable style={styles.arrowButton} onPress={onNext}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  imageWrap: {
    height: 155,
    backgroundColor: "#111827",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  emptyImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  emptyImageIcon: {
    fontSize: 34,
  },
  emptyImageText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 29,
  },
  counterPill: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  counterText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  body: {
    padding: 15,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  meta: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  blueBadge: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  blueBadgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  codeBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  codeBadgeText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "900",
  },
  notes: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
  },
  ratingsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
  },
  ratingBlock: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
  },
  ratingBar: {
    height: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  ratingLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
  },
  ratingValue: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 14,
  },
  arrowButton: {
    width: 44,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: "#0f172a",
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "700",
  },
  mainActions: {
    flex: 1,
    flexDirection: "row",
    gap: 9,
  },
  detailsButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    paddingVertical: 14,
  },
  detailsButtonText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  directionsButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    paddingVertical: 14,
  },
  directionsButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
});
