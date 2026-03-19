/**
 * Fabric Gateway Service
 * Handles connection to Hyperledger Fabric network and transaction submission
 * 
 * NOTE: This is a mock implementation for development/testing.
 * For production, install `@hyperledger/fabric-gateway` and switch to real implementation.
 */

export interface FabricConfig {
  connectionProfile: string;
  walletPath: string;
  userId: string;
  channelName: string;
  chaincodeId: string;
}

export interface TransactionResult {
  success: boolean;
  payload?: any;
  transactionId?: string;
  error?: string;
}

// Mock data storage (in production, this would be blockchain)
const mockStorage = new Map<string, any>();

// Mock delay to simulate blockchain latency
const BLOCKCHAIN_DELAY = 500;

export class FabricGatewayService {
  private config: FabricConfig;
  private isConnected: boolean = false;

  constructor(config: FabricConfig) {
    this.config = config;
  }

  /**
   * Connect to Fabric network (mock implementation)
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[Mock Fabric] Already connected');
      return;
    }

    console.log('[Mock Fabric] Connecting to network...', this.config);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, BLOCKCHAIN_DELAY));
    
    this.isConnected = true;
    console.log('[Mock Fabric] Connected to network');
  }

  /**
   * Submit a transaction (write operation) - mock implementation
   */
  async submitTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<TransactionResult> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log(`[Mock Fabric] Submitting transaction: ${functionName}`, args);
      
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, BLOCKCHAIN_DELAY));
      
      // Simulate storing data
      const key = `${functionName}_${args.join('_')}`;
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Handle specific transaction types
      let payload: any = null;
      
      if (functionName === 'createPartnership') {
        const partnership = {
          partnershipId: args[0],
          org1Id: args[1],
          org2Id: args[2],
          org1Name: args[3],
          org2Name: args[4],
          agreementHash: args[5],
          startDate: args[6],
          endDate: args[7],
          status: 'active',
          type: args[8],
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockStorage.set(partnership.partnershipId, partnership);
        payload = partnership;
        
        // Create some mock partnerships for demo
        if (!mockStorage.has('demo_partnership_1')) {
          mockStorage.set('demo_partnership_1', {
            partnershipId: 'demo_partnership_1',
            org1Id: 'Org1MSP',
            org2Id: 'Org2MSP',
            org1Name: 'Hedges Care',
            org2Name: 'Partner Nursery Ltd.',
            agreementHash: 'abc123',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            type: 'landscaping',
            milestones: [
              {
                milestoneId: 'm1',
                name: 'Plant 1000 trees',
                description: 'Complete initial tree planting phase',
                targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                targetValue: 1000,
                status: 'completed',
                type: 'environmental',
                actualValue: 1000,
                actualDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                evidence: [
                  {
                    evidenceId: 'e1',
                    type: 'image',
                    hash: 'hash_123',
                    uploadedBy: 'Org1MSP',
                    uploadedAt: new Date().toISOString(),
                    verified: true,
                    verifiedBy: 'VerifierMSP',
                    verifiedAt: new Date().toISOString()
                  }
                ]
              }
            ],
            payments: [],
            reputationScore: 75,
            environmentalImpact: {
              totalCO2Absorbed: 25500.50,
              treesPlanted: 1000,
              habitatCreated: 5000,
              biodiversityIndex: 85,
              waterConserved: 50000
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } else if (functionName === 'addMilestone') {
        const partnership = mockStorage.get(args[0]);
        if (partnership) {
          const newMilestone = {
            milestoneId: `m_${Date.now()}`,
            name: args[1],
            description: args[2],
            targetDate: args[3],
            targetValue: parseFloat(args[4]),
            status: 'pending',
            type: args[5],
            evidence: []
          };
          partnership.milestones.push(newMilestone);
          mockStorage.set(args[0], partnership);
          payload = partnership;
        }
      } else if (functionName === 'updateMilestone') {
        const partnership = mockStorage.get(args[0]);
        if (partnership) {
          const milestone = partnership.milestones.find((m: any) => m.milestoneId === args[1]);
          if (milestone) {
            milestone.actualValue = parseFloat(args[2]);
            milestone.status = parseFloat(args[2]) >= milestone.targetValue ? 'completed' : 'in_progress';
            milestone.actualDate = new Date().toISOString();
            if (args[3]) {
              const evidence = JSON.parse(args[3]);
              milestone.evidence.push(evidence);
            }
            mockStorage.set(args[0], partnership);
          }
        }
      }
      
      console.log(`[Mock Fabric] Transaction ${transactionId} submitted successfully`);

      return {
        success: true,
        payload,
        transactionId
      };
    } catch (error: any) {
      console.error(`[Mock Fabric] Transaction ${functionName} failed:`, error);
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  /**
   * Evaluate a transaction (read operation) - mock implementation
   */
  async evaluateTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<TransactionResult> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log(`[Mock Fabric] Evaluating transaction: ${functionName}`, args);
      
      // Simulate read delay
      await new Promise(resolve => setTimeout(resolve, BLOCKCHAIN_DELAY / 2));
      
      let payload: any = null;
      
      if (functionName === 'readPartnership') {
        payload = mockStorage.get(args[0]);
      } else if (functionName === 'queryPartnershipsByOrganization') {
        const partnerships: any[] = [];
        mockStorage.forEach((value, key) => {
          if ((value as any).org1Id === args[0] || (value as any).org2Id === args[0]) {
            partnerships.push(value);
          }
        });
        payload = partnerships;
      } else if (functionName === 'getAllPartnerships') {
        const partnerships: any[] = [];
        mockStorage.forEach((value) => {
          if (value && typeof value === 'object' && (value as any).partnershipId) {
            partnerships.push(value);
          }
        });
        payload = partnerships;
      }
      
      console.log(`[Mock Fabric] Transaction ${functionName} evaluated successfully`);

      return {
        success: true,
        payload
      };
    } catch (error: any) {
      console.error(`[Mock Fabric] Transaction evaluation ${functionName} failed:`, error);
      return {
        success: false,
        error: error.message || 'Transaction evaluation failed'
      };
    }
  }

  /**
   * Disconnect from Fabric network (mock implementation)
   */
  async disconnect(): Promise<void> {
    console.log('[Mock Fabric] Disconnecting...');
    this.isConnected = false;
    console.log('[Mock Fabric] Disconnected');
  }

  /**
   * Check if connected
   */
  isActive(): boolean {
    return this.isConnected;
  }

  /**
   * Clear mock storage (for testing)
   */
  clearStorage(): void {
    mockStorage.clear();
  }
}
