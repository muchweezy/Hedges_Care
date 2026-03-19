/**
 * Fabric API Gateway
 * Main entry point for all Fabric blockchain operations
 * Manages gateway instance and provides service access
 */

import { FabricGatewayService, FabricConfig } from './gateway/FabricGateway';
import { PartnershipService } from './services/PartnershipService';
import { SupplyChainService } from './services/SupplyChainService';
import { CarbonCreditService } from './services/CarbonCreditService';

// Default configuration (can be overridden by environment variables)
const DEFAULT_FABRIC_CONFIG: FabricConfig = {
  connectionProfile: process.env.FABRIC_CONNECTION_PROFILE || 
    './fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json',
  walletPath: process.env.FABRIC_WALLET_PATH || './fabric-samples/wallet',
  userId: process.env.FABRIC_USER_ID || 'appUser',
  channelName: process.env.FABRIC_CHANNEL_NAME || 'mychannel',
  chaincodeId: process.env.FABRIC_CHAINCODE_ID || 'basic'
};

class FabricApiGateway {
  private static instance: FabricApiGateway | null = null;
  private gateway: FabricGatewayService | null = null;
  private partnershipService: PartnershipService | null = null;
  private supplyChainService: SupplyChainService | null = null;
  private carbonCreditService: CarbonCreditService | null = null;
  private config: FabricConfig;

  private constructor(config?: Partial<FabricConfig>) {
    this.config = { ...DEFAULT_FABRIC_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<FabricConfig>): FabricApiGateway {
    if (!FabricApiGateway.instance) {
      FabricApiGateway.instance = new FabricApiGateway(config);
    }
    return FabricApiGateway.instance;
  }

  /**
   * Initialize gateway connection
   */
  async initialize(): Promise<void> {
    if (this.gateway) {
      console.log('Fabric gateway already initialized');
      return;
    }

    try {
      console.log('Initializing Fabric gateway with config:', this.config);
      this.gateway = new FabricGatewayService(this.config);
      await this.gateway.connect();

      // Initialize services
      this.partnershipService = new PartnershipService(this.gateway);
      this.supplyChainService = new SupplyChainService(this.gateway);
      this.carbonCreditService = new CarbonCreditService(this.gateway);

      console.log('Fabric gateway initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Fabric gateway:', error);
      throw error;
    }
  }

  /**
   * Get partnership service
   */
  getPartnershipService(): PartnershipService {
    if (!this.partnershipService) {
      throw new Error('Fabric gateway not initialized. Call initialize() first.');
    }
    return this.partnershipService;
  }

  /**
   * Get supply chain service
   */
  getSupplyChainService(): SupplyChainService {
    if (!this.supplyChainService) {
      throw new Error('Fabric gateway not initialized. Call initialize() first.');
    }
    return this.supplyChainService;
  }

  /**
   * Get carbon credit service
   */
  getCarbonCreditService(): CarbonCreditService {
    if (!this.carbonCreditService) {
      throw new Error('Fabric gateway not initialized. Call initialize() first.');
    }
    return this.carbonCreditService;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.gateway?.isActive() || false;
  }

  /**
   * Disconnect from Fabric network
   */
  async disconnect(): Promise<void> {
    if (this.gateway) {
      await this.gateway.disconnect();
      this.gateway = null;
      this.partnershipService = null;
      this.supplyChainService = null;
      this.carbonCreditService = null;
      console.log('Fabric gateway disconnected');
    }
  }

  /**
   * Reset singleton (useful for testing)
   */
  static reset(): void {
    FabricApiGateway.instance = null;
  }
}

// Export singleton instance
export const fabricGateway = FabricApiGateway.getInstance();

// Export class for testing/customization
export { FabricApiGateway };

// Export types
export * from './gateway/FabricGateway';
export * from './services/PartnershipService';
export * from './services/SupplyChainService';
export * from './services/CarbonCreditService';
export * from './chaincode/models';
