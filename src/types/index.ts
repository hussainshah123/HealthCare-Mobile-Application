// Shared types mirroring /appoitment-backend/API.md (contract v1).

export type Role = 'CUSTOMER' | 'DOCTOR' | 'RIDER' | 'PHARMACY' | 'ADMIN';
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}

// ---------- Auth ----------
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: AccountStatus;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Exclude<Role, 'ADMIN'>;
  /** Phone GPS at sign-up, sent only when location access is allowed. */
  lat?: number;
  lng?: number;
}

export interface LoginBody {
  email: string;
  password: string;
}

// ---------- Customer ----------
export type Gender = string;

export interface CustomerProfile extends Partial<User> {
  dateOfBirth?: string | null;
  gender?: Gender | null;
  [key: string]: unknown;
}

export interface UpdateCustomerBody {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
}

export interface CreateAddressBody {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

// ---------- Catalogue ----------
export interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  manufacturer: string;
  description: string;
  dosage: string;
  imageUrl: string | null;
  requiresPrescription: boolean;
  categoryId: string;
  minPrice: number | null;
}

export interface MedicineOffer {
  pharmacyId: string;
  pharmacyName: string;
  price: number;
  stock: number;
}

export type MedicineDetail = Medicine & { offers: MedicineOffer[] };

export interface MedicineQuery extends PageQuery {
  search?: string;
  categoryId?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
}

// ---------- Cart ----------
export interface CartItem {
  id: string;
  medicineId: string;
  medicineName: string;
  imageUrl: string | null;
  pharmacyId: string;
  price: number;
  quantity: number;
  requiresPrescription: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

// ---------- Prescriptions (uploaded) ----------
export type PrescriptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Prescription {
  id: string;
  fileUrl: string;
  notes: string | null;
  status: PrescriptionStatus;
  reviewNote: string | null;
  createdAt: string;
}

// ---------- Orders ----------
export type PaymentMethod = 'COD' | 'ONLINE';

export type OrderStatus =
  | 'PENDING'
  | 'PRESCRIPTION_UNDER_REVIEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface OrderItem {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  items: OrderItem[];
  // API.md does not specify the address shape; it is the snapshot of the chosen Address.
  address: Partial<Address> | null;
  pharmacy: { id: string; name: string };
  prescriptionId: string | null;
  history: OrderHistoryEntry[];
  delivery: Delivery | null;
  deliveryOtp?: string;
  createdAt: string;
}

export interface CreateOrderBody {
  addressId: string;
  paymentMethod: PaymentMethod;
  prescriptionId?: string;
  couponCode?: string;
}

// ---------- Riders & deliveries ----------
export type DeliveryStatus =
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  status: DeliveryStatus;
  fee: number;
  pharmacy: { name: string; address: string; lat: number; lng: number };
  dropoff: { line1: string; city: string; lat: number; lng: number };
  customerName: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
}

/**
 * Shape of GET /deliveries/available items. API.md describes them as
 * "READY_FOR_PICKUP orders with no rider" without a schema, so we accept
 * either an Order-like or Delivery-like object and read fields defensively.
 */
export interface AvailableDelivery {
  id: string;
  orderId?: string;
  orderNumber?: string;
  fee?: number;
  deliveryFee?: number;
  total?: number;
  pharmacy?: {
    id?: string;
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  dropoff?: { line1: string; city: string; lat: number; lng: number };
  address?: Partial<Address> | null;
  customerName?: string;
  createdAt?: string;
}

export interface RiderProfile {
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  licenseNumber?: string | null;
  cnic?: string | null;
  online?: boolean;
  status?: AccountStatus;
  [key: string]: unknown;
}

export interface UpdateRiderBody {
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  cnic?: string;
}

export interface RiderEarnings {
  total: number;
  deliveries: number;
  items: {
    deliveryId: string;
    orderNumber: string;
    fee: number;
    deliveredAt: string;
  }[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationBody extends LatLng {
  heading?: number;
  speed?: number;
}

export interface TrackingInfo {
  delivery: Delivery;
  rider: {
    name: string;
    phone: string;
    avatarUrl: string | null;
    vehicleNumber: string | null;
  };
  lastLocation: {
    lat: number;
    lng: number;
    heading: number | null;
    recordedAt: string;
  } | null;
  destination: { lat: number; lng: number; line1: string };
  pharmacy: { lat: number; lng: number; name: string };
}

// ---------- Doctors ----------
export interface Specialization {
  id: string;
  name: string;
}

export interface DoctorCard {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialization: string;
  experienceYears: number;
  fee: number;
  rating: number | null;
  languages: string[];
}

export interface DoctorReview {
  rating: number;
  comment: string | null;
  customerName: string;
  createdAt: string;
}

export type DoctorDetail = DoctorCard & {
  qualifications: string;
  registrationNumber: string;
  bio: string | null;
  reviews: DoctorReview[];
};

export interface DoctorQuery extends PageQuery {
  search?: string;
  specializationId?: string;
  maxFee?: number;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  available: boolean;
}

/** GET /doctors/me — API.md leaves the shape open; it is the doctor's own profile. */
export interface DoctorProfile {
  id?: string;
  name?: string;
  specializationId?: string | null;
  specialization?: string | null;
  qualifications?: string | null;
  registrationNumber?: string | null;
  experienceYears?: number | null;
  fee?: number | null;
  bio?: string | null;
  languages?: string[] | null;
  status?: AccountStatus;
  [key: string]: unknown;
}

export interface UpdateDoctorBody {
  specializationId?: string;
  qualifications?: string;
  registrationNumber?: string;
  experienceYears?: number;
  fee?: number;
  bio?: string;
  languages?: string[];
}

export type SlotMinutes = 15 | 20 | 30 | 60;

export interface AvailabilitySlot {
  dayOfWeek: number; // 0 (Sunday) - 6
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotMinutes: SlotMinutes;
}

export interface DoctorEarnings {
  gross: number;
  commission: number;
  net: number;
  consultations: number;
  items: Record<string, unknown>[];
}

// ---------- Appointments & consultations ----------
export type AppointmentType = 'AUDIO' | 'VIDEO' | 'CHAT';
export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  type: AppointmentType;
  startsAt: string;
  endsAt: string;
  fee: number;
  reason: string | null;
  doctor: {
    id: string;
    name: string;
    specialization: string;
    avatarUrl: string | null;
  };
  customer: { id: string; name: string };
  consultationId: string | null;
}

export interface CreateAppointmentBody {
  doctorId: string;
  startsAt: string;
  type: AppointmentType;
  reason?: string;
}

export type ConsultationStatus = 'WAITING' | 'ACTIVE' | 'ENDED';

export interface Consultation {
  id: string;
  appointmentId: string;
  status: ConsultationStatus;
  roomId: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface ConsultationMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface DoctorPrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface WritePrescriptionBody {
  diagnosis: string;
  notes?: string;
  items: DoctorPrescriptionItem[];
}

/** GET /doctor-prescriptions/me items — shape not fully specified in API.md. */
export interface DoctorPrescription {
  id: string;
  diagnosis: string;
  notes?: string | null;
  items: DoctorPrescriptionItem[];
  doctor?: { id?: string; name: string } | null;
  doctorName?: string;
  consultationId?: string;
  createdAt: string;
}

// ---------- Notifications ----------
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown> | null;
  read?: boolean;
  readAt?: string | null;
  createdAt?: string;
}

export interface DeviceTokenBody {
  token: string;
  platform: 'android' | 'ios';
}

// ---------- Socket payloads ----------
export interface RiderLocationEvent {
  orderId: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  recordedAt: string;
}

export interface DeliveryStatusEvent {
  orderId: string;
  status: OrderStatus | DeliveryStatus;
}

export interface RiderLocationEmit {
  deliveryId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}
