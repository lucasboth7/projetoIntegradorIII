// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAchievements } from './achievements';

const KEYS = {
  RECORDS: '@vapefree_records',
  DEVICE: '@vapefree_device',
  ECONOMY: '@vapefree_economy',
  ACHIEVEMENTS: '@vapefree_achievements',
};

// ─── Records ────────────────────────────────────────────────────────────────

export async function getRecords() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveRecord(record) {
  try {
    const records = await getRecords();
    records.push(record);
    await AsyncStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export async function deleteRecord(id) {
  try {
    const records = await getRecords();
    const updated = records.filter((r) => r.id !== id);
    await AsyncStorage.setItem(KEYS.RECORDS, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export async function updateRecord(updatedRecord) {
  try {
    const records = await getRecords();
    const index = records.findIndex((r) => r.id === updatedRecord.id);
    if (index !== -1) {
      records[index] = updatedRecord;
      await AsyncStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Device ─────────────────────────────────────────────────────────────────

export async function getDevice() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DEVICE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveDevice(device) {
  try {
    await AsyncStorage.setItem(KEYS.DEVICE, JSON.stringify(device));
    return true;
  } catch {
    return false;
  }
}

// ─── Economy ────────────────────────────────────────────────────────────────

export async function getEconomy() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ECONOMY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setEconomy(economyMap) {
  try {
    await AsyncStorage.setItem(KEYS.ECONOMY, JSON.stringify(economyMap));
    return true;
  } catch {
    return false;
  }
}

// ─── Economy Calculation ─────────────────────────────────────────────────────

export async function recalcEconomy(records, device) {
  if (!device) return {};
  const costPerPuff = device.price / device.totalPuffs;
  const dailyGoal = device.totalPuffs / device.days;

  // Group records by date
  const byDate = {};
  records.forEach((r) => {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  });

  const economyMap = {};
  Object.entries(byDate).forEach(([date, recs]) => {
    const usedToday = recs.reduce((sum, r) => sum + (r.puffs || 0), 0);
    const notGiven = Math.max(0, dailyGoal - usedToday);
    economyMap[date] = parseFloat((notGiven * costPerPuff).toFixed(2));
  });

  await setEconomy(economyMap);
  return economyMap;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function getLastNWeeks(n) {
  const weeks = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    weeks.push(d.toISOString().slice(0, 10));
  }
  return weeks;
}

export function getLastNMonths(n) {
  const months = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 10));
  }
  return months;
}

export function getWeekLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `${monday.toISOString().slice(5, 10)}`;
}

export function getMonthLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function calcStreak(records) {
  const dates = [...new Set(records.map((r) => r.date))].sort().reverse();
  if (!dates.length) return 0;
  let streak = 0;
  let d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().slice(0, 10);
    if (dates.includes(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── Achievements ────────────────────────────────────────────────────────────

export async function getAchievements() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAchievement(achievementId, unlockedAt) {
  try {
    const achievements = await getAchievements();
    if (!achievements.find((a) => a.id === achievementId)) {
      achievements.push({ id: achievementId, unlockedAt: unlockedAt || new Date().toISOString() });
      await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    }
    return true;
  } catch {
    return false;
  }
}

export async function checkAndUnlockAchievements(records, economy) {
  try {
    const unlocked = await getAchievements();
    const unlockedIds = new Set(unlocked.map((u) => u.id));
    const newUnlocks = [];

    const results = checkAchievements(records, economy);
    for (const result of results) {
      if (result.unlocked && !unlockedIds.has(result.id)) {
        await saveAchievement(result.id, result.unlockedAt);
        newUnlocks.push(result);
      }
    }
    return newUnlocks;
  } catch (e) {
    console.log('Error checking achievements:', e);
    return [];
  }
}
