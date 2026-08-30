export type Practitioner = {
  id: number;
  firstName: string;
  lastName: string;
  specialty: string;
  organization: string;
  address?: string;
  languages?: string;
  nextAvailableAt?: string;
};

export type Slot = { id: number; startAt: string; endAt: string; available: boolean };

export type Document = {
  id: number;
  title: string;
  documentType: string;
  documentDate: string;
  practitioner?: Practitioner;
  status: 'PROCESSING' | 'AVAILABLE' | 'FAILED';
};

export type Chat = {
  conversationId: number;
  response: {
    mode: string;
    answer: string;
    sources: { title: string; page?: number; scope: string }[];
    generalKnowledgeNotice: boolean;
    safetyBlocked: boolean;
  };
};

export type Auth = { token: string; role: string };

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
};

export type Appointment = {
  id: number;
  patient?: UserProfile;
  practitioner: Practitioner;
  slot: Slot;
  reason?: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
};
