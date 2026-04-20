export type ReferralStatus = 'pending' | 'in_review' | 'scheduled' | 'completed' | 'cancelled';
export type ReferralPriority = 'normal' | 'urgent';

export type Referral = {
  id: string;
  referralNumber: string;
  createdAt: Date;
  fromOffice: string;
  toOffice: string;
  category: string;
  reason: string;
  status: ReferralStatus;
  priority: ReferralPriority;
  referredBy: string;
  assignedTo?: string;
  nextAppointment?: string;
};
