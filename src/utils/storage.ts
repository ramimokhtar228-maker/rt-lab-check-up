import { 
  LabTest, 
  CheckupPackage, 
  Patient, 
  Booking, 
  RewardPrize, 
  WonReward, 
  LabSettings, 
  SyncLog 
} from '../types';
import { 
  INITIAL_TESTS, 
  INITIAL_PACKAGES, 
  INITIAL_PATIENTS, 
  INITIAL_BOOKINGS, 
  INITIAL_REWARDS, 
  INITIAL_SETTINGS 
} from '../data/initialData';

const KEYS = {
  TESTS: 'rt_lab_tests_v2',
  PACKAGES: 'rt_lab_packages_v2',
  PATIENTS: 'rt_lab_patients_v2',
  BOOKINGS: 'rt_lab_bookings_v2',
  REWARDS: 'rt_lab_rewards_v2',
  WON_REWARDS: 'rt_lab_won_rewards_v2',
  SETTINGS: 'rt_lab_settings_v2',
  SYNC_LOGS: 'rt_lab_sync_logs_v2',
};

// Safe JSON parser
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// ----------------- Lab Tests -----------------
export const getTests = (): LabTest[] => safeGet(KEYS.TESTS, INITIAL_TESTS);
export const saveTests = (tests: LabTest[]): void => safeSet(KEYS.TESTS, tests);

export const saveTest = (test: LabTest): LabTest[] => {
  const current = getTests();
  const index = current.findIndex(t => t.id === test.id);
  let updated: LabTest[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = test;
  } else {
    updated = [test, ...current];
  }
  saveTests(updated);
  return updated;
};

export const deleteTest = (testId: string): LabTest[] => {
  const current = getTests();
  const updated = current.filter(t => t.id !== testId);
  saveTests(updated);
  return updated;
};

// ----------------- Packages -----------------
export const getPackages = (): CheckupPackage[] => safeGet(KEYS.PACKAGES, INITIAL_PACKAGES);
export const savePackages = (pkgs: CheckupPackage[]): void => safeSet(KEYS.PACKAGES, pkgs);

export const savePackage = (pkg: CheckupPackage): CheckupPackage[] => {
  const current = getPackages();
  const index = current.findIndex(p => p.id === pkg.id);
  let updated: CheckupPackage[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = pkg;
  } else {
    updated = [pkg, ...current];
  }
  savePackages(updated);
  return updated;
};

// ----------------- Patients -----------------
export const getPatients = (): Patient[] => safeGet(KEYS.PATIENTS, INITIAL_PATIENTS);
export const savePatients = (patients: Patient[]): void => safeSet(KEYS.PATIENTS, patients);

export const savePatient = (patient: Patient): Patient[] => {
  const current = getPatients();
  const index = current.findIndex(p => p.id === patient.id);
  let updated: Patient[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = patient;
  } else {
    updated = [patient, ...current];
  }
  savePatients(updated);
  return updated;
};

/**
 * Delete a specific patient with complete cascade:
 * Deletes the patient profile and all associated bookings!
 */
export const deletePatientWithData = (patientId: string): { patients: Patient[]; bookings: Booking[] } => {
  const currentPatients = getPatients();
  const currentBookings = getBookings();

  const updatedPatients = currentPatients.filter(p => p.id !== patientId);
  const updatedBookings = currentBookings.filter(b => b.patientId !== patientId);

  savePatients(updatedPatients);
  saveBookings(updatedBookings);

  return { patients: updatedPatients, bookings: updatedBookings };
};

// ----------------- Bookings -----------------
export const getBookings = (): Booking[] => safeGet(KEYS.BOOKINGS, INITIAL_BOOKINGS);
export const saveBookings = (bookings: Booking[]): void => safeSet(KEYS.BOOKINGS, bookings);

export const saveBooking = (booking: Booking): Booking[] => {
  const current = getBookings();
  const index = current.findIndex(b => b.id === booking.id);
  let updated: Booking[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...booking, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...booking, updatedAt: new Date().toISOString() }, ...current];
  }
  saveBookings(updated);
  return updated;
};

export const deleteBooking = (bookingId: string): Booking[] => {
  const current = getBookings();
  const updated = current.filter(b => b.id !== bookingId);
  saveBookings(updated);
  return updated;
};

/**
 * RESET PATIENTS AND BOOKINGS (تصفير بيانات المرضى والحجوزات):
 * Resets all patient registrations and active bookings,
 * while safely PRESERVING test catalog, pricing, packages,
 * rewards prizes, and laboratory settings!
 */
export const resetPatientDataPreservingCatalog = (): void => {
  // Clear patients and bookings
  safeSet(KEYS.PATIENTS, []);
  safeSet(KEYS.BOOKINGS, []);
  safeSet(KEYS.WON_REWARDS, []);
  // Keep tests, packages, rewards, and settings intact!
};

// ----------------- Rewards -----------------
export const getRewards = (): RewardPrize[] => safeGet(KEYS.REWARDS, INITIAL_REWARDS);
export const saveRewards = (rewards: RewardPrize[]): void => safeSet(KEYS.REWARDS, rewards);

export const saveReward = (reward: RewardPrize): RewardPrize[] => {
  const current = getRewards();
  const index = current.findIndex(r => r.id === reward.id);
  let updated: RewardPrize[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = reward;
  } else {
    updated = [reward, ...current];
  }
  saveRewards(updated);
  return updated;
};

export const deleteReward = (id: string): RewardPrize[] => {
  const current = getRewards();
  const updated = current.filter(r => r.id !== id);
  saveRewards(updated);
  return updated;
};

// Won rewards history
export const getWonRewards = (): WonReward[] => safeGet(KEYS.WON_REWARDS, []);
export const saveWonRewards = (list: WonReward[]): void => safeSet(KEYS.WON_REWARDS, list);

export const addWonReward = (reward: WonReward): WonReward[] => {
  const current = getWonRewards();
  const updated = [reward, ...current];
  saveWonRewards(updated);
  return updated;
};

// ----------------- Settings -----------------
export const getSettings = (): LabSettings => {
  const stored = safeGet<Partial<LabSettings>>(KEYS.SETTINGS, INITIAL_SETTINGS);
  return {
    ...INITIAL_SETTINGS,
    ...stored,
    branchesList: (stored.branchesList && stored.branchesList.length > 0) ? stored.branchesList : INITIAL_SETTINGS.branchesList,
    branches: (stored.branches && stored.branches.length > 0) ? stored.branches : INITIAL_SETTINGS.branches,
  };
};
export const saveSettings = (settings: LabSettings): void => safeSet(KEYS.SETTINGS, settings);

// ----------------- Sync Logs -----------------
export const getSyncLogs = (): SyncLog[] => safeGet(KEYS.SYNC_LOGS, [
  {
    id: 'log_init',
    timestamp: new Date().toISOString(),
    type: 'catalog_sync',
    message: 'تم تفعيل الاتصال المباشر وتهيئة قناة المزامنة مع نظام RT الموحد',
    success: true,
  }
]);

export const addSyncLog = (log: Omit<SyncLog, 'id'>): SyncLog[] => {
  const current = getSyncLogs();
  const newLog: SyncLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };
  const updated = [newLog, ...current.slice(0, 49)]; // keep latest 50
  safeSet(KEYS.SYNC_LOGS, updated);
  return updated;
};
