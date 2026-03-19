/**
 * Partnership Service
 * High-level API for partnership operations on Hyperledger Fabric
 */

import { FabricGatewayService } from '../gateway/FabricGateway';
import type {
  Partnership,
  Milestone,
  Evidence,
  EnvironmentalMetrics,
  PartnershipType
} from '../chaincode/models';

export interface CreatePartnershipRequest {
  org1Id: string;
  org2Id: string;
  org1Name: string;
  org2Name: string;
  agreementHash: string;
  startDate: string;
  endDate: string;
  partnershipType: PartnershipType;
}

export interface AddMilestoneRequest {
  partnershipId: string;
  name: string;
  description: string;
  targetDate: string;
  targetValue: number;
  milestoneType: 'environmental' | 'financial' | 'operational';
}

export interface UpdateMilestoneRequest {
  partnershipId: string;
  milestoneId: string;
  actualValue: number;
  evidence?: Evidence;
}

export interface VerifyEvidenceRequest {
  partnershipId: string;
  milestoneId: string;
  evidenceId: string;
  verified: boolean;
  comments?: string;
}

export class PartnershipService {
  private gateway: FabricGatewayService;

  constructor(gateway: FabricGatewayService) {
    this.gateway = gateway;
  }

  /**
   * Create a new partnership
   */
  async createPartnership(request: CreatePartnershipRequest): Promise<Partnership> {
    const partnershipId = `partnership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await this.gateway.submitTransaction(
      'createPartnership',
      partnershipId,
      request.org1Id,
      request.org2Id,
      request.org1Name,
      request.org2Name,
      request.agreementHash,
      request.startDate,
      request.endDate,
      request.partnershipType
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to create partnership');
    }

    return result.payload || { partnershipId, ...request };
  }

  /**
   * Add a milestone to a partnership
   */
  async addMilestone(request: AddMilestoneRequest): Promise<Milestone> {
    const result = await this.gateway.submitTransaction(
      'addMilestone',
      request.partnershipId,
      request.name,
      request.description,
      request.targetDate,
      request.targetValue.toString(),
      request.milestoneType
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to add milestone');
    }

    return result.payload;
  }

  /**
   * Update milestone progress
   */
  async updateMilestone(request: UpdateMilestoneRequest): Promise<void> {
    const evidenceJson = request.evidence ? JSON.stringify(request.evidence) : '';

    const result = await this.gateway.submitTransaction(
      'updateMilestone',
      request.partnershipId,
      request.milestoneId,
      request.actualValue.toString(),
      evidenceJson
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to update milestone');
    }
  }

  /**
   * Verify evidence
   */
  async verifyEvidence(request: VerifyEvidenceRequest): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'verifyEvidence',
      request.partnershipId,
      request.milestoneId,
      request.evidenceId,
      request.verified.toString(),
      request.comments || ''
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to verify evidence');
    }
  }

  /**
   * Update partnership status
   */
  async updatePartnershipStatus(
    partnershipId: string,
    status: 'active' | 'paused' | 'completed' | 'terminated'
  ): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'updatePartnershipStatus',
      partnershipId,
      status
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to update partnership status');
    }
  }

  /**
   * Update organization reputation
   */
  async updateReputation(
    orgId: string,
    scoreChange: number,
    reason: string
  ): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'updateReputation',
      orgId,
      scoreChange.toString(),
      reason
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to update reputation');
    }
  }

  /**
   * Read a specific partnership
   */
  async getPartnership(partnershipId: string): Promise<Partnership> {
    const result = await this.gateway.evaluateTransaction(
      'readPartnership',
      partnershipId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to read partnership');
    }

    return result.payload;
  }

  /**
   * Get all partnerships for an organization
   */
  async getPartnershipsByOrganization(orgId: string): Promise<Partnership[]> {
    const result = await this.gateway.evaluateTransaction(
      'queryPartnershipsByOrganization',
      orgId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to query partnerships');
    }

    return result.payload || [];
  }

  /**
   * Get partnerships by status
   */
  async getPartnershipsByStatus(status: string): Promise<Partnership[]> {
    const result = await this.gateway.evaluateTransaction(
      'queryPartnershipsByStatus',
      status
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to query partnerships');
    }

    return result.payload || [];
  }

  /**
   * Get partnerships by type
   */
  async getPartnershipsByType(partnershipType: PartnershipType): Promise<Partnership[]> {
    const result = await this.gateway.evaluateTransaction(
      'queryPartnershipsByType',
      partnershipType
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to query partnerships');
    }

    return result.payload || [];
  }

  /**
   * Get partnership history (audit trail)
   */
  async getPartnershipHistory(partnershipId: string): Promise<any[]> {
    const result = await this.gateway.evaluateTransaction(
      'getPartnershipHistory',
      partnershipId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to get partnership history');
    }

    return result.payload || [];
  }

  /**
   * Get all partnerships
   */
  async getAllPartnerships(): Promise<Partnership[]> {
    const result = await this.gateway.evaluateTransaction('getAllPartnerships');

    if (!result.success) {
      throw new Error(result.error || 'Failed to query all partnerships');
    }

    return result.payload || [];
  }

  /**
   * Get active partnerships
   */
  async getActivePartnerships(orgId: string): Promise<Partnership[]> {
    return this.getPartnershipsByOrganization(orgId).then(partnerships =>
      partnerships.filter(p => p.status === 'active')
    );
  }
}
