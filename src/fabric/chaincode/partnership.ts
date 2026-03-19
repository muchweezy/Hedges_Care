import { Context, Contract } from 'fabric-contract-api';
import {
  Partnership,
  Milestone,
  Evidence,
  Payment,
  EnvironmentalMetrics,
  generateId,
  hashData
} from './models';

export class PartnershipContract extends Contract {

  /**
   * Create a new partnership between two organizations
   */
  async createPartnership(
    ctx: Context,
    partnershipId: string,
    org1Id: string,
    org2Id: string,
    org1Name: string,
    org2Name: string,
    agreementHash: string,
    startDate: string,
    endDate: string,
    partnershipType: string
  ): Promise<void> {
    // Check if partnership already exists
    const exists = await this.partnershipExists(ctx, partnershipId);
    if (exists) {
      throw new Error(`Partnership ${partnershipId} already exists`);
    }

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    // Verify caller is one of the organizations
    if (mspId !== org1Id && mspId !== org2Id) {
      throw new Error('Caller is not authorized to create this partnership');
    }

    const partnership: Partnership = {
      partnershipId,
      org1Id,
      org2Id,
      org1Name,
      org2Name,
      agreementHash,
      startDate,
      endDate,
      status: 'active',
      type: partnershipType as any,
      milestones: [],
      payments: [],
      reputationScore: 50,
      environmentalImpact: {
        totalCO2Absorbed: 0,
        treesPlanted: 0,
        habitatCreated: 0,
        biodiversityIndex: 0,
        waterConserved: 0
      },
      createdAt: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      updatedAt: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString()
    };

    // Save to world state
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    const eventData = Buffer.from(JSON.stringify({
      partnershipId,
      org1Id,
      org2Id,
      type: partnershipType,
      createdAt: partnership.createdAt
    }));
    ctx.stub.setEvent('PartnershipCreated', eventData);
  }

  /**
   * Add milestone to a partnership
   */
  async addMilestone(
    ctx: Context,
    partnershipId: string,
    name: string,
    description: string,
    targetDate: string,
    targetValue: string,
    milestoneType: string
  ): Promise<void> {
    // Get partnership
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    if (!partnershipBytes || partnershipBytes.length === 0) {
      throw new Error(`Partnership ${partnershipId} does not exist`);
    }

    const partnership: Partnership = JSON.parse(partnershipBytes.toString());

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    // Verify caller is one of the organizations
    if (mspId !== partnership.org1Id && mspId !== partnership.org2Id) {
      throw new Error('Caller is not authorized to modify this partnership');
    }

    const milestone: Milestone = {
      milestoneId: generateId('milestone'),
      name,
      description,
      targetDate,
      targetValue: parseFloat(targetValue),
      status: 'pending',
      type: milestoneType as any,
      evidence: []
    };

    partnership.milestones.push(milestone);
    partnership.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save partnership
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    ctx.stub.setEvent('MilestoneAdded', buffer);
  }

  /**
   * Update milestone progress
   */
  async updateMilestone(
    ctx: Context,
    partnershipId: string,
    milestoneId: string,
    actualValue: string,
    evidence: string
  ): Promise<void> {
    // Get partnership
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    if (!partnershipBytes || partnershipBytes.length === 0) {
      throw new Error(`Partnership ${partnershipId} does not exist`);
    }

    const partnership: Partnership = JSON.parse(partnershipBytes.toString());

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    // Verify caller is one of the organizations
    if (mspId !== partnership.org1Id && mspId !== partnership.org2Id) {
      throw new Error('Caller is not authorized to modify this partnership');
    }

    // Find milestone
    const milestone = partnership.milestones.find(
      m => m.milestoneId === milestoneId
    );

    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    // Update milestone
    milestone.actualValue = parseFloat(actualValue);
    milestone.actualDate = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();
    
    const actualVal = parseFloat(actualValue);
    milestone.status = actualVal >= milestone.targetValue 
      ? 'completed' 
      : 'in_progress';

    // Parse and add evidence
    if (evidence) {
      const evidenceData: Evidence = JSON.parse(evidence);
      milestone.evidence.push(evidenceData);
    }

    // Update partnership environmental impact if environmental milestone
    if (milestone.type === 'environmental') {
      partnership.environmentalImpact.totalCO2Absorbed += actualVal;
      
      // Update reputation based on milestone completion
      if (milestone.status === 'completed') {
        partnership.reputationScore = Math.min(100, 
          partnership.reputationScore + 5
        );
      }
    }

    // Update timestamp
    partnership.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save partnership
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    ctx.stub.setEvent('MilestoneUpdated', buffer);
  }

  /**
   * Verify evidence submitted for a milestone
   */
  async verifyEvidence(
    ctx: Context,
    partnershipId: string,
    milestoneId: string,
    evidenceId: string,
    verified: string,
    comments?: string
  ): Promise<void> {
    // Get partnership
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    if (!partnershipBytes || partnershipBytes.length === 0) {
      throw new Error(`Partnership ${partnershipId} does not exist`);
    }

    const partnership: Partnership = JSON.parse(partnershipBytes.toString());

    // Find milestone
    const milestone = partnership.milestones.find(
      m => m.milestoneId === milestoneId
    );

    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    // Find evidence
    const evidence = milestone.evidence.find(
      e => e.evidenceId === evidenceId
    );

    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const verifierId = clientIdentity.getMSPID();

    // Update evidence verification
    evidence.verified = verified === 'true';
    evidence.verifiedBy = verifierId;
    evidence.verifiedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();
    evidence.verificationComments = comments;

    // Update timestamp
    partnership.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save partnership
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    ctx.stub.setEvent('EvidenceVerified', buffer);
  }

  /**
   * Update partnership status
   */
  async updatePartnershipStatus(
    ctx: Context,
    partnershipId: string,
    status: string
  ): Promise<void> {
    // Get partnership
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    if (!partnershipBytes || partnershipBytes.length === 0) {
      throw new Error(`Partnership ${partnershipId} does not exist`);
    }

    const partnership: Partnership = JSON.parse(partnershipBytes.toString());

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    // Verify caller is one of the organizations
    if (mspId !== partnership.org1Id && mspId !== partnership.org2Id) {
      throw new Error('Caller is not authorized to modify this partnership');
    }

    // Update status
    partnership.status = status as any;
    partnership.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save partnership
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    ctx.stub.setEvent('PartnershipStatusUpdated', buffer);
  }

  /**
   * Update organization reputation score
   */
  async updateReputation(
    ctx: Context,
    orgId: string,
    scoreChange: string,
    reason: string
  ): Promise<void> {
    // Query all partnerships involving the organization
    const queryString = {
      selector: {
        $or: [
          { org1Id: orgId },
          { org2Id: orgId }
        ]
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);

    let updatedCount = 0;
    for (const result of results) {
      const partnership: Partnership = JSON.parse(result);
      
      if (partnership.org1Id === orgId || partnership.org2Id === orgId) {
        partnership.reputationScore = Math.max(0, 
          Math.min(100, partnership.reputationScore + parseFloat(scoreChange))
        );
        partnership.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

        const buffer = Buffer.from(JSON.stringify(partnership));
        await ctx.stub.putState(partnership.partnershipId, buffer);
        updatedCount++;
      }
    }

    // Emit event
    const eventData = Buffer.from(JSON.stringify({
      orgId,
      scoreChange,
      reason,
      updatedPartnerships: updatedCount
    }));
    ctx.stub.setEvent('ReputationUpdated', eventData);
  }

  /**
   * Read a specific partnership
   */
  async readPartnership(
    ctx: Context,
    partnershipId: string
  ): Promise<string> {
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    if (!partnershipBytes || partnershipBytes.length === 0) {
      throw new Error(`Partnership ${partnershipId} does not exist`);
    }
    return partnershipBytes.toString();
  }

  /**
   * Query all partnerships for a specific organization
   */
  async queryPartnershipsByOrganization(
    ctx: Context,
    orgId: string
  ): Promise<string> {
    const queryString = {
      selector: {
        $or: [
          { org1Id: orgId },
          { org2Id: orgId }
        ]
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Query all partnerships by status
   */
  async queryPartnershipsByStatus(
    ctx: Context,
    status: string
  ): Promise<string> {
    const queryString = {
      selector: {
        status: status
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Query all partnerships by type
   */
  async queryPartnershipsByType(
    ctx: Context,
    partnershipType: string
  ): Promise<string> {
    const queryString = {
      selector: {
        type: partnershipType
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Get history of a partnership (audit trail)
   */
  async getPartnershipHistory(
    ctx: Context,
    partnershipId: string
  ): Promise<string> {
    const iterator = await ctx.stub.getHistoryForKey(partnershipId);
    const results = await this.getAllHistoryResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Get all partnerships
   */
  async getAllPartnerships(ctx: Context): Promise<string> {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Helper function to check if partnership exists
   */
  async partnershipExists(
    ctx: Context,
    partnershipId: string
  ): Promise<boolean> {
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    return partnershipBytes && partnershipBytes.length > 0;
  }

  /**
   * Helper function to get all query results
   */
  private async getAllResults(iterator: any): Promise<any[]> {
    const allResults = [];
    let res;
    while (true) {
      res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        const record = JSON.parse(res.value.value.toString('utf8'));
        allResults.push(record);
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    return allResults;
  }

  /**
   * Helper function to get all history results
   */
  private async getAllHistoryResults(iterator: any): Promise<any[]> {
    const allResults = [];
    let res;
    while (true) {
      res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        const record = {
          txId: res.value.txId,
          timestamp: new Date(res.value.timestamp.seconds * 1000).toISOString(),
          isDelete: res.value.isDelete,
          data: JSON.parse(res.value.value.toString('utf8'))
        };
        allResults.push(record);
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    return allResults;
  }
}
