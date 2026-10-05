export function validateHuntProgress(hunt: { bonusCount: number; openedCount: number }) {
  if (hunt.openedCount > hunt.bonusCount) {
    throw new Error("Bonuses opened cannot exceed bonuses planned.");
  }
}
