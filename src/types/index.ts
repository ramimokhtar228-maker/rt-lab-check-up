export type SampleType = 
  | 'دم كامل (EDTA)'
  | 'مصل دم (Serum)'
  | 'بلازما (Citrate)'
  | 'عينة بول (Urine)'
  | 'عينة براز (Stool)'
  | 'مسحة (Swab)'
  | 'أخرى';

export type TestCategory = 
  | 'أمراض الدم والسيولة'
  | 'وظائف الكبد'
  | 'وظائف الكلى واليوريك'
  | 'السكر والتمثيل الغذائي'
  | 'دهون وكوليسترول الدم'
  | 'الهرمونات والغدد'
  | 'الفيتامينات والمعادن'
  | 'دلالات الأورام والمناعة'
  | 'الفيروسات والأمراض المعدية'
  | 'التحاليل الميكروسكوبية والسريرية'
  | 'فحوصات مخصصة';

export interface LabTest {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: TestCategory;
  price: number;
  sampleType: SampleType;
  fastingHours: number; // 0 = no fasting, e.g. 8, 12
  turnaroundHours: number; // turnaround time in hours
  description?: string;
  isPopular?: boolean;
  isCustom?: boolean; // added by patient or staff
}

export interface CheckupPackage {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description: string;
  price: number;
  originalPrice: number;
  testIds: string[];
  sampleTypes: SampleType[];
  fastingHours: number;
  targetAudience: string;
  badge?: string;
}

export type VisitType = 'branch' | 'home';

export interface HomeVisitConfig {
  standardFee: number;
  isFreeEligible: boolean;
  freeThresholdAmount: number; // e.g. free if total > 1000 EGP
  availableAreas: string[];
}

export interface Patient {
  id: string;
  nationalId?: string;
  fileNumber: string;
  fullName: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  address?: string;
  area?: string;
  notes?: string;
  createdAt: string;
  points: number;
}

export type BookingStatus = 
  | 'pending'    // في الانتظار
  | 'confirmed'  // مؤكد
  | 'sampling'   // جاري سحب العينة
  | 'processing' // جاري التحليل
  | 'completed'  // جاهز النتائج
  | 'cancelled'; // ملغي

export interface BookingTestItem {
  testId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  isCustom?: boolean;
}

export interface TestResultItem {
  testId: string;
  testName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'pending';
  notes?: string;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. RT-2026-0812
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  patientAddress?: string;
  
  visitType: VisitType;
  isHomeVisitFree: boolean;
  homeVisitFreeReason?: string;
  homeVisitFee: number;
  
  selectedTests: BookingTestItem[];
  selectedPackages: string[]; // package IDs
  customTestsRequested?: string[]; // notes on custom tests
  
  appointmentDate: string;
  appointmentTimeSlot: string;
  
  subtotal: number;
  discount: number;
  discountReason?: string;
  total: number;
  paidAmount: number;
  
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Results entered from Unified System or management
  results?: TestResultItem[];
  resultsPublishedAt?: string;
  
  // Sync status with RT Unified System
  syncedToUnified: boolean;
  syncedAt?: string;
}

export interface RewardPrize {
  id: string;
  title: string;
  type: 'discount_percent' | 'discount_fixed' | 'free_test' | 'free_visit' | 'points' | 'try_again';
  value: number; // percentage or fixed amount or points
  freeTestName?: string;
  description: string;
  color: string;
  probabilityWeight: number; // 1 to 10
  isActive: boolean;
}

export interface WonReward {
  id: string;
  prizeId: string;
  prizeTitle: string;
  couponCode: string;
  discountValue: number;
  type: RewardPrize['type'];
  patientPhone?: string;
  isUsed: boolean;
  wonAt: string;
  usedAt?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'outgoing_booking' | 'incoming_result' | 'catalog_sync' | 'error';
  message: string;
  bookingCode?: string;
  success: boolean;
}

export interface BranchItem {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  isMain?: boolean;
  isActive: boolean;
  googleMapsUrl?: string;
}

export interface LabSettings {
  labNameAr: string;
  labNameEn: string;
  hotline: string;
  whatsapp: string;
  adminPhone: string;
  adminEmail: string;
  announcementBanner: string;
  branches: string[];
  branchesList: BranchItem[];
  homeVisitFee: number;
  freeVisitNotice: string;
  accreditationText: string;
  githubToken: string;
  githubRepo: string;
  unifiedSystemUrl: string;
  broadcastSyncEnabled: boolean;
  adminPassword?: string;
}
