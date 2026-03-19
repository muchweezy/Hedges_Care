/**
 * Carbon Credit Service
 * High-level API for carbon credit operations on Hyperledger Fabric
 */

import { FabricGatewayService } from '../gateway/FabricGateway';
import type {
  CarbonCredits,
  CarbonBalance,
  CarbonVerificationData,
  RetirementClaim
} from '../chaincode/models';

export interface MintCreditsRequest {
  orgId: string;
  orgName: string;
  amount: number;
  verificationData: CarbonVerificationData;
}

export interface TransferCreditsRequest {
  creditId: string;
  fromOrg: string;
  toOrg: string;
  toOrgName: string;
  amount: number;
  purpose: string;
}

export interface RetireCreditsRequest {
  creditId: string;
  amount: number;
  retirementClaim: string;
}

export class CarbonCreditService {
  private gateway: FabricGatewayService;

  constructor(gateway: FabricGatewayService) {
    this.gateway = gateway;
  }

  /**
   * Mint new carbon credits
   */
  async mintCredits(request: MintCreditsRequest): Promise<CarbonCredits> {
    const creditId = `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await this.gateway.submitTransaction(
      'mintCarbonCredits',
      creditId,
      request.orgId,
      request.orgName,
      request.amount.toString(),
      JSON.stringify(request.verificationData)
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to mint credits');
    }

    return result.payload || { creditId, ...request };
  }

  /**
   * Transfer carbon credits between organizations
   */
  async transferCredits(request: TransferCreditsRequest): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'transferCredits',
      request.creditId,
      request.fromOrg,
      request.toOrg,
      request.toOrgName,
      request.amount.toString(),
      request.purpose
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to transfer credits');
    }
  }

  /**
   * Retire carbon credits (used for carbon offset claims)
   */
  async retireCredits(request: RetireCreditsRequest): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'retireCredits',
      request.creditId,
      request.amount.toString(),
      request.retirementClaim
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to retire credits');
    }
  }

  /**
   * Verify a retirement claim
   */
  async verifyRetirementClaim(
    creditId: string,
    claimIndex: number,
    verified: boolean
  ): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'verifyRetirementClaim',
      creditId,
      claimIndex.toString(),
      verified.toString()
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to verify retirement claim');
    }
  }

  /**
   * Read specific carbon credits
   */
  async getCredit(creditId: string): Promise<CarbonCredits> {
    const result = await this.gateway.evaluateTransaction(
      'readCredits',
      creditId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to read credits');
    }

    return result.payload;
  }

  /**
   * Get credits by organization
   */
  async getCreditsByOrganization(orgId: string): Promise<CarbonCredits[]> {
    const result = await this.gateway.evaluateTransaction(
      'queryCreditsByOrganization',
      orgId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to query credits');
    }

    return result.payload || [];
  }

  /**
   * Get carbon balance for an organization
   */
  async getCarbonBalance(orgId: string, orgName: string): Promise<CarbonBalance> {
    const result = await this.gateway.evaluateTransaction(
      'getCarbonBalance',
      orgId,
      orgName
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to get carbon balance');
    }

    return result.payload;
  }

  /**
   * Query all available credits
   */
  async getAvailableCredits(): Promise<CarbonCredits[]> {
    const result = await this.gateway.evaluateTransaction('queryAvailableCredits');

    if (!result.success) {
      throw new Error(result.error || 'Failed to query available credits');
    }

    return result.payload || [];
  }

  /**
   * Get credit history
   */
  async getCreditHistory(creditId: string): Promise<any[]> {
    const result = await this.gateway.evaluateTransaction(
      'getCreditHistory',
      creditId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to get credit history');
    }

    return result.payload || [];
  }

  /**
   * Get all carbon credits
   */
  async getAllCredits(): Promise<CarbonCredits[]> {
    const result = await this.gateway.evaluateTransaction('getAllCredits');

    if (!result.success) {
      throw new Error(result.error || 'Failed to query all credits');
    }

    return result.payload || [];
  }

  /**
   * Get retirement claims for a credit
   */
  async getRetirementClaims(creditId: string): Promise<RetirementClaim[]> {
    const credit = await this.getCredit(creditId);
    return credit.retirementClaims || [];
  }
}
