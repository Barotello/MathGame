export function getHighestUnlockedLevel(
  completedLevelNumbers: number[],
  totalLevelCount: number,
): number {
  const completed = new Set(completedLevelNumbers);
  let highestConsecutiveCompletion = 0;

  while (completed.has(highestConsecutiveCompletion + 1)) {
    highestConsecutiveCompletion += 1;
  }

  return Math.min(totalLevelCount, highestConsecutiveCompletion + 1);
}
