// Shared data models for Hyperledger Fabric chaincode

export interface Partnership {
  partnershipId: string;
  org1Id: string;
  org2Id: string;
  org1Name: string;
  org2Name: string;
  agreementHash: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'completed' | 'terminated';
  type: PartnershipType;
  milestones: Milestone[];
  payments: Payment[];
  reputationScore: number;
  environmentalImpact: EnvironmentalMetrics;
  createdAt: string;
  updatedAt: string;
}

export type PartnershipType = 
  | 'landscaping'
  | 'nursery_supply'
  | 'enterprise_contract'
  | 'research_collaboration'
  | 'certification';

export interface Milestone {
  milestoneId: string;
  name: string;
  description: string;
  targetDate: string;
  actualDate?: string;
  targetValue: number;
  actualValue?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: 'environmental' | 'financial' | 'operational';
  evidence: Evidence[];
}

export interface Evidence {
  evidenceId: string;
  type: 'image' | 'document' | 'sensor_data' | 'satellite';
  hash: string;
  uploadedBy: string;
  uploadedAt: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationComments?: string;
}

export interface Payment {
  paymentId: string;
  amount: number;
  currency: string;
  fromOrg: string;
  toOrg: string;
  milestoneId?: string;
  status: 'pending' | 'approved' | 'paid' | 'failed';
  transactionHash?: string;
  createdAt: string;
  paidAt?: string;
}

export interface EnvironmentalMetrics {
  totalCO2Absorbed: number;
  treesPlanted: number;
  habitatCreated: number; // in square meters
  biodiversityIndex: number; // 0-100 scale
  waterConserved: number; // in liters
}

export interface PlantCertificate {
  certificateId: string;
  plantId: string;
  species: string;
  commonName: string;
  origin: OriginInfo;
  sustainabilityCertifications: Certification[];
  supplyChainEvents: SupplyChainEvent[];
  currentOwner: string;
  finalDestination?: string;
  status: 'created' | 'in_transit' | 'delivered' | 'planted';
  createdAt: string;
  updatedAt: string;
  transferHistory: TransferRecord[];
}

export interface OriginInfo {
  farm: string;
  farmId: string;
  location: GeoLocation;
  date: string;
}

export interface Certification {
  certId: string;
  name: string;
  issuer: string;
  issuedDate: string;
  expiryDate: string;
  verified: boolean;
}

export interface SupplyChainEvent {
  eventId: string;
  plantId: string;
  eventType: 'harvested' | 'transported' | 'inspected' | 'planted' | 'transferred';
  location: GeoLocation;
  timestamp: string;
  participantId: string;
  participantName: string;
  quality: QualityMetric;
  environmental: EnvironmentalSnapshot;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface QualityMetric {
  healthScore: number; // 0-100
  condition: string;
  size: number; // height in cm
  notes?: string;
}

export interface EnvironmentalSnapshot {
  temperature: number;
  humidity: number;
  soilMoisture?: number;
  lightLevel?: number;
  notes?: string;
}

export interface TransferRecord {
  from: string;
  to: string;
  timestamp: string;
  reason: string;
}

export interface CarbonCredits {
  creditId: string;
  orgId: string;
  orgName: string;
  amount: number;
  verificationData: CarbonVerificationData;
  sourceCredit?: string;
  purpose?: string;
  mintedAt: string;
  transfers: CarbonTransfer[];
  retired: boolean;
  retiredAmount?: number;
  retirementClaims?: RetirementClaim[];
}

export interface CarbonVerificationData {
  method: 'ai_analysis' | 'manual_inspection' | 'sensor_data' | 'third_party';
  verifiedBy: string;
  verificationDate: string;
  confidence: number; // 0-1
  evidence: string[]; // Hashes of evidence files
}

export interface CarbonTransfer {
  to: string;
  toName: string;
  amount: number;
  timestamp: string;
  purpose: string;
  transactionHash?: string;
}

export interface RetirementClaim {
  amount: number;
  claim: string;
  timestamp: string;
  verified: boolean;
}

export interface CarbonBalance {
  orgId: string;
  orgName: string;
  availableCredits: number;
  totalMinted: number;
  totalRetired: number;
  totalTransferred: number;
  certifications: Certification[];
}

export interface AuditLog {
  logId: string;
  timestamp: string;
  userId: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  txnId?: string;
  success: boolean;
}

export interface HistoryRecord {
  timestamp: string;
  txId: string;
  isDelete: boolean;
  data: any;
}

// Utility functions
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function hashData(data: string): string {
  // This would use actual crypto in production
  return `hash_${data.length}_${Date.now()}`;
}
