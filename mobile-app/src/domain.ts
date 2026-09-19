export type Role = 'PATIENT' | 'ADMIN';
export type Practitioner = { id: number; firstName: string; lastName: string; specialty: string; organization: string; address?: string; languages?: string; nextAvailableAt?: string };
export type Slot = { id: number; startAt: string; endAt: string; available: boolean };
export type Appointment = { id: number; practitioner: Practitioner; slot: Slot; reason?: string; status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' };
export type MedicalDocument = { id: number; title: string; documentType: string; documentDate: string; practitioner?: Practitioner; status: 'PROCESSING' | 'AVAILABLE' | 'FAILED' };
export type UserProfile = { id: number; firstName: string; lastName: string; email: string; phone?: string; role: Role };
export type Chat = { conversationId: number; response: { mode: string; answer: string; sources: { title: string; page?: number; scope: string }[]; generalKnowledgeNotice: boolean; safetyBlocked: boolean } };
export type MobileAuth = { session: { accessToken: string; refreshToken: string; expiresInSeconds: number }; id: number; firstName: string; lastName: string; email: string; role: Role };
