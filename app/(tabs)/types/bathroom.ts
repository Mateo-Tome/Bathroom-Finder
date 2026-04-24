export type RatingValue = 1 | 2 | 3 | 4 | 5;

export type AccessType =
  | "public"
  | "customers_only"
  | "private"
  | "code_required"
  | "key_required"
  | "ask_staff";

export type BathroomStatus = "open" | "closed" | "under_renovation" | "unknown";

export type BathroomRatingsSummary = {
  cleanlinessAvg: number;
  safetyAvg: number;
  privacyAvg: number;
  accessAvg: number;
  overallAvg: number;
  totalReviews: number;
};

export type Bathroom = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;

  accessType: AccessType;
  codeHint?: string;
  status: BathroomStatus;

  isPublic: boolean;
  wheelchairAccessible?: boolean;
  babyChangingStation?: boolean;

  ratings: BathroomRatingsSummary;

  coverImageUrl?: string;
  imageUrls: string[];

  createdAt: string;
  updatedAt: string;
};

export type BathroomUpdate = {
  id: string;
  bathroomId: string;
  userId: string;

  cleanliness: RatingValue;
  safety: RatingValue;
  privacy: RatingValue;
  easeOfAccess: RatingValue;

  note?: string;
  photoUrls: string[];

  codeUpdate?: string;
  statusUpdate?: BathroomStatus;
  accessTypeUpdate?: AccessType;

  createdAt: string;
};
