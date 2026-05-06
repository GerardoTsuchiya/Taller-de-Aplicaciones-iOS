export function calculateStreak(completions: string[]): number {
  if (completions.length === 0) return 0;

  const unique = [...new Set(completions)].sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 0;
  let expected = unique[0];

  for (const date of unique) {
    if (date === expected) {
      streak++;
      const d = new Date(expected + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateMaxStreak(completions: string[]): number {
  if (completions.length === 0) return 0;

  const sorted = [...new Set(completions)].sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00Z');
    const curr = new Date(sorted[i] + 'T00:00:00Z');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function calculateCoins(streak: number): { base: number; bonus: number; total: number } {
  const base = 10;
  const bonus = streak > 0 && streak % 7 === 0 ? 25 : 0;
  return { base, bonus, total: base + bonus };
}
