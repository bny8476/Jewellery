export type KycStatus = 
  | 'NOT_SUBMITTED'
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED';

export interface CustomerKycRecord {
  id: string;
  reference_id: string;
  kyc_reference?: string;
  customer_id: string;
  user_id?: string;
  legal_name: string;
  full_name?: string;
  date_of_birth?: string;
  pan_masked: string;
  pan_number_masked?: string;
  pan_hash?: string;
  pan_number_hash?: string;
  aadhaar_masked: string;
  aadhaar_number_masked?: string;
  aadhaar_hash?: string;
  aadhaar_number_hash?: string;
  document_type?: string;
  id_proof_type?: string;
  document_url?: string;
  document_name?: string;
  consent_given?: boolean;
  consent_obtained?: boolean;
  consent_timestamp?: string;
  status: KycStatus;
  rejection_reason?: string;
  action_required_notes?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_email?: string;
  reviewed_at?: string;
  verified_at?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  customer_code?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface KycAuditRecord {
  id: string;
  kyc_id: string;
  customer_id?: string;
  from_status?: KycStatus | string;
  to_status?: KycStatus | string;
  previous_status?: KycStatus | string;
  new_status?: KycStatus | string;
  changed_by_user_id?: string;
  changed_by_name?: string;
  change_reason?: string;
  action_by?: string;
  action_role?: string;
  notes?: string;
  created_at: string;
}

export interface KycSubmissionPayload {
  customerId?: string;
  userId?: string;
  legal_name?: string;
  full_name?: string;
  pan_number: string;
  aadhaar_number: string;
  date_of_birth: string;
  document_type?: string;
  id_proof_type?: string;
  document_name?: string;
  document_url?: string;
  document_data_url?: string;
  consent_given?: boolean;
  consent?: boolean;
}

export interface KycStats {
  total: number;
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
  action_required: number;
}
