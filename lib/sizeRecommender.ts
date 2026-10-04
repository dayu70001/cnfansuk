export const SIZE_REFERENCE = [
  {
    size: "M",
    chineseReference: "170/88A",
    garmentChest: 106,
    flatChest: 53,
    garmentChestRange: "104–108 cm",
    shoulder: "44–46 cm",
    length: "67–70 cm",
    sleeve: "61–64 cm",
    heightRange: "165–175 cm",
    heightMidpoint: 170,
    weightRange: "55–65 kg",
    weightMidpoint: 60,
  },
  {
    size: "L",
    chineseReference: "175/92A",
    garmentChest: 110,
    flatChest: 55,
    garmentChestRange: "108–112 cm",
    shoulder: "45–47 cm",
    length: "69–72 cm",
    sleeve: "62–65 cm",
    heightRange: "170–180 cm",
    heightMidpoint: 175,
    weightRange: "62.5–72.5 kg",
    weightMidpoint: 67.5,
  },
  {
    size: "XL",
    chineseReference: "180/96A",
    garmentChest: 114,
    flatChest: 57,
    garmentChestRange: "112–116 cm",
    shoulder: "46–49 cm",
    length: "71–74 cm",
    sleeve: "63–66 cm",
    heightRange: "175–185 cm",
    heightMidpoint: 180,
    weightRange: "70–80 kg",
    weightMidpoint: 75,
  },
  {
    size: "XXL",
    chineseReference: "185/100A",
    garmentChest: 118,
    flatChest: 59,
    garmentChestRange: "116–120 cm",
    shoulder: "47–50 cm",
    length: "73–76 cm",
    sleeve: "64–68 cm",
    heightRange: "180–190 cm",
    heightMidpoint: 185,
    weightRange: "77.5–90 kg",
    weightMidpoint: 83.75,
  },
] as const;

export const FIT_EASE = {
  slim: 8,
  regular: 12,
  relaxed: 16,
} as const;

export type PreferredFit = keyof typeof FIT_EASE;
export type ClothingSize = (typeof SIZE_REFERENCE)[number]["size"];
export type FitConfidence = "GOOD" | "LOW";

export type SizeRecommendationInput = {
  height: number;
  weight: number;
  bodyChest: number;
  fit: PreferredFit;
};

export type SizeRecommendation = {
  size: ClothingSize;
  chestSize: ClothingSize;
  heightReferenceSize: ClothingSize;
  weightReferenceSize: ClothingSize;
  targetGarmentChest: number;
  confidence: FitConfidence;
  reason: string;
  warnings: string[];
};

export function isValidSizeInput({ height, weight, bodyChest }: Omit<SizeRecommendationInput, "fit">) {
  return (
    Number.isFinite(height) && height >= 140 && height <= 210 &&
    Number.isFinite(weight) && weight >= 40 && weight <= 160 &&
    Number.isFinite(bodyChest) && bodyChest >= 70 && bodyChest <= 150
  );
}

function nearestReferenceIndex(value: number, field: "heightMidpoint" | "weightMidpoint") {
  return SIZE_REFERENCE.reduce((bestIndex, row, index) => {
    const bestDistance = Math.abs(value - SIZE_REFERENCE[bestIndex][field]);
    const distance = Math.abs(value - row[field]);
    return distance < bestDistance ? index : bestIndex;
  }, 0);
}

export function recommendSize(input: SizeRecommendationInput): SizeRecommendation {
  if (!isValidSizeInput(input) || !Object.prototype.hasOwnProperty.call(FIT_EASE, input.fit)) {
    throw new RangeError("Please check your measurement.");
  }

  const targetGarmentChest = input.bodyChest + FIT_EASE[input.fit];
  const lastIndex = SIZE_REFERENCE.length - 1;
  const firstMeetingIndex = SIZE_REFERENCE.findIndex((row) => row.garmentChest >= targetGarmentChest);
  const chestIndex = firstMeetingIndex < 0 ? lastIndex : firstMeetingIndex;
  const heightIndex = nearestReferenceIndex(input.height, "heightMidpoint");
  const weightIndex = nearestReferenceIndex(input.weight, "weightMidpoint");
  const aboveRange = targetGarmentChest > SIZE_REFERENCE[lastIndex].garmentChest;
  const belowRange = targetGarmentChest < SIZE_REFERENCE[0].garmentChest;
  const bothAuxiliariesHigher = heightIndex > chestIndex && weightIndex > chestIndex;
  const finalIndex = bothAuxiliariesHigher ? Math.min(chestIndex + 1, lastIndex) : chestIndex;
  const hasAuxiliaryConflict =
    Math.abs(heightIndex - chestIndex) > 1 ||
    Math.abs(weightIndex - chestIndex) > 1 ||
    Math.abs(heightIndex - weightIndex) > 1;
  const hasLowConfidence = aboveRange || hasAuxiliaryConflict;
  const warnings: string[] = [];

  if (aboveRange) {
    warnings.push(
      "Your chest measurement is above the general reference range for XXL. Check the individual product measurements before ordering.",
    );
  }
  if (belowRange) {
    warnings.push("Suggested starting size: M. M is the smallest CNFans clothing size currently available.");
  }
  if (hasAuxiliaryConflict) {
    warnings.push(
      "Your measurements fall across different general size ranges. Check the individual product measurements before ordering.",
    );
  }

  let reason = "Your chest measurement is the main reference, with height and weight used as secondary guides.";
  if (bothAuxiliariesHigher && finalIndex > chestIndex) {
    reason = "Your height and weight both sit closer to the next size, so the recommendation moves up one size.";
  } else if (hasAuxiliaryConflict) {
    reason = "The chest-based starting size is kept as the primary recommendation because your references do not align closely.";
  } else if (aboveRange) {
    reason = "XXL is the closest available reference, but your target garment chest is above its general measurement.";
  }

  return {
    size: SIZE_REFERENCE[finalIndex].size,
    chestSize: SIZE_REFERENCE[chestIndex].size,
    heightReferenceSize: SIZE_REFERENCE[heightIndex].size,
    weightReferenceSize: SIZE_REFERENCE[weightIndex].size,
    targetGarmentChest,
    confidence: hasLowConfidence ? "LOW" : "GOOD",
    reason,
    warnings,
  };
}
