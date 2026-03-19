# Hyperledger Fabric Implementation Plan - Hedges Care

## Executive Summary

This document outlines the strategic implementation of Hyperledger Fabric (permissioned blockchain) as a complementary system to the existing Polygon-based NFT infrastructure. While Polygon handles public NFT trading, Hyperledger Fabric will provide a secure, private ledger for B2B partnerships, supply chain tracking, and enterprise-level transparency.

---

## Table of Contents
1. [Why Hyperledger Fabric for Hedges Care](#why-hyperledger-fabric-for-hedges-care)
2. [Partnership Page Implementation](#partnership-page-implementation)
3. [Additional Permissioned Blockchain Use Cases](#additional-permissioned-blockchain-use-cases)
4. [Technical Architecture](#technical-architecture)
5. [Smart Contract Design](#smart-contract-design)
6. [Integration Strategy](#integration-strategy)
7. [Security & Privacy Considerations](#security--privacy-considerations)
8. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Why Hyperledger Fabric for Hedges Care

### Comparison: Public vs. Permissioned Blockchain

| Aspect | Polygon (Public) | Hyperledger Fabric (Permissioned) |
|--------|------------------|-----------------------------------|
| **Access Control** | Anyone can participate | Pre-approved participants only |
| **Privacy** | All transactions are public | Private channels & data collections |
| **Performance** | ~15 TPS (Mainnet), ~7000 (L2) | 1000-2000+ TPS |
| **Transaction Cost** | Gas fees required No gas fees | No gas fees |
| **Consensus** | PoS (Proof of Stake) | Pluggable (Raft, Kafka, etc.) |
| **Use Case** | Public NFT marketplace | Private enterprise data |
| **Smart Contracts** | Solidity (EVM) | Chaincode (Go, Java, Node.js, TypeScript) |
| **Finality** | ~1-2 minutes < 1 second | Instant |

### Benefits for Hedges Care

1. **Enterprise-Grade Privacy**: Protect sensitive partnership data and supply chain information
2. **Regulatory Compliance**: Meet GDPR, ISO, and other compliance requirements for business data
3. **Instant Finality**: Real-time verification of transactions without waiting for block confirmations
4. **Cost Efficiency**: No gas fees for enterprise transactions
5. **Scalability**: Handle high-volume business operations
6. **Auditing**: Immutable audit trails for regulatory compliance
7. **Identity Management**: Strong cryptographic identity for all participants

---

## 2. Partnership Page Implementation

### 2.1 Current Partnerships Page Structure

The partnerships page currently displays B2B partnerships but lacks transparency and verification. Hyperledger Fabric will provide:

- **Immutable Partnership Records**: Record partnership agreements on-chain
- **Smart Contract Milestones**: Automatic tracking of partnership KPIs and deliverables
- **Reputation System**: Trust scores based on partnership performance
- **Supply Chain Integration**: Track plant sourcing and environmental impact
- **Payment Automation**: Automated milestone-based payments in fiat or tokens

### 2.2 Partnership Data Model for Fabric

```typescript
// Chaincode data structures
interface Partnership {
  partnershipId: string;              // Unique partnership ID
  org1Id: string;                     // Organization 1 ID
  org2Id: string;                     // Organization 2 ID
  agreementHash: string;              // Hash of PDF agreement
  startDate: Date;                    // Partnership start date
  endDate: Date;                      // Partnership end date
  status: 'active' | 'paused' | 'completed' | 'terminated';
  type: PartnershipType;              // Type of partnership
  milestones: Milestone[];           // Partnership milestones
  payments: Payment[];                // Payment records
  reputationScore: number;            // 0-100 score
  environmentalImpact: EnvironmentalMetrics;
}

interface Milestone {
  milestoneId: string;
  name: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  targetValue: number;
  actualValue?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  evidence: Evidence[];
}

interface EnvironmentalMetrics {
  totalCO2Absorbed: number;
  treesPlanted: number;
  habitatCreated: number;
  biodiversityIndex: number;
  waterConserved: number;
}

interface Evidence {
  evidenceId: string;
  type: 'image' | 'document' | 'sensor_data' | 'satellite';
  hash: string;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
}
```

### 2.3 Partnership Smart Contract Functions (Chaincode)

```go
// Key Chaincode Functions for Partnership Management

// CreatePartnership: Initialize new partnership on blockchain
func (s *SmartContract) CreatePartnership(ctx contractapi.TransactionContextInterface, 
    partnershipId string, org1Id string, org2Id string, 
    agreementDetails PartnershipDetails) error

// UpdateMilestone: Record milestone completion with evidence
func (s *SmartContract) UpdateMilestone(ctx contractapi.TransactionContextInterface,
    partnershipId string, milestoneId string, 
    details MilestoneUpdate) error

// VerifyEvidence: Verify and timestamp evidence submissions
func (s *SmartContract) VerifyEvidence(ctx contractapi.TransactionContextInterface,
    partnershipId string, milestoneId string,
    evidenceId string, verifierOrg string) error

// UpdateReputation: Update reputation scores based on performance
func (s *SmartContract) UpdateReputation(ctx contractapi.TransactionContextInterface,
    orgId string, scoreChange number, reason string) error

// GetPartnershipHistory: Get full audit trail of partnership changes
func (s *SmartContract) GetPartnershipHistory(ctx contractapi.TransactionContextInterface,
    partnershipId string) ([]HistoryRecord, error)

// QueryActivePartnerships: Get all active partnerships for an organization
func (s *SmartContract) QueryActivePartnerships(ctx contractapi.TransactionContextInterface,
    orgId string) ([]Partnership, error)
```

### 2.4 Frontend Integration for Partnerships Page

```typescript
// React component for partnership management
const PartnershipDashboard = () => {
  const { data: partnerships } = useQuery({
    queryKey: ['partnerships'],
    queryFn: () => fabricService.getActivePartnerships(user.organizationId)
  });

  return (
    <div className="partnership-dashboard">
      {/* Partnership Cards with Blockchain Verification */}
      {partnerships?.map(partnership => (
        <PartnershipCard 
          key={partnership.partnershipId}
          partnership={partnership}
          onMilestoneUpdate={handleMilestoneUpdate}
          onEvidenceUpload={handleEvidenceUpload}
        />
      ))}
    </div>
  );
};

// Partnership Card Component
const PartnershipCard = ({ partnership, onMilestoneUpdate, onEvidenceUpload }) => {
  return (
    <Card className="partnership-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          {partnership.org1Id === user.orgId ? (
            <PartnerLogo orgId={partnership.org2Id} />
          ) : (
            <PartnerLogo orgId={partnership.org1Id} />
          )}
          <div>
            <h3>{partnership.org2Name}</h3>
            <p className="text-sm text-gray-500">
              {partnership.type} • {partnership.status}
            </p>
          </div>
          <VerifiedBadge blockchainVerified={true} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Milestone Progress */}
        <MilestoneProgress milestones={partnership.milestones} />
        
        {/* Environmental Impact */}
        <EnvironmentalMetrics metrics={partnership.environmentalImpact} />
        
        {/* Reputation Score */}
        <ReputationBadge score={partnership.reputationScore} />
      </CardContent>
      <CardFooter>
        <Button onClick={() => onMilestoneUpdate(partnership.partnershipId)}>
          Update Milestone
        </Button>
        <Button onClick={() => onEvidenceUpload(partnership.partnershipId)}>
          Upload Evidence
        </Button>
      </CardFooter>
    </Card>
  );
};
```

---

## 3. Additional Permissioned Blockchain Use Cases

### 3.1 Supply Chain Management

**Use Case**: Track plant sourcing from nurseries to end users

**Benefits**:
- Verify plant authenticity and health at every stage
- Track environmental impact from nursery to planting
- Ensure compliance with sustainability certifications
- Prevent counterfeit plants and fraudulent claims

**Data Models**:
```typescript
interface SupplyChainEvent {
  eventId: string;
  plantId: string;                    // Unique plant identifier
  eventType: 'harvested' | 'transported' | 'inspected' | 'planted';
  location: GeoLocation;
  timestamp: Date;
  participantId: string;              // Organization ID
  quality: QualityMetric;
  environmental: EnvironmentalSnapshot;
}

interface PlantCertificate {
  certificateId: string;
  plantId: string;
  species: string;
  origin: OriginInfo;
  sustainabilityCertifications: Certification[];
  supplyChainEvents: SupplyChainEvent[];
  currentOwner: string;
  finalDestination?: string;
}
```

### 3.2 Carbon Credit Trading (B2B)

**Use Case**: Internal carbon credit system for businesses

**Benefits**:
- Private carbon credit marketplace for enterprise clients
- Verified CO2 absorption from plant monitoring
- Tokenize environmental impact for B2B trading
- Regulatory compliance for carbon offset requirements

**Smart Contract Functions**:
```go
// Mint Carbon Credits: Issue verified carbon credits
func (s *SmartContract) MintCarbonCredits(ctx contractapi.TransactionContextInterface,
    creditId string, orgId string, amount number, 
    verificationData VerificationData) error

// Transfer Credits: Transfer credits between organizations
func (s *SmartContract) TransferCredits(ctx contractapi.TransactionContextInterface,
    fromOrg string, toOrg string, amount number, 
    purpose string) error

// Retire Credits: Retire credits for carbon offset claims
func (s *SmartContract) RetireCredits(ctx contractapi.TransactionContextInterface,
    orgId string, amount number, retirementClaim string) error

// GetCarbonBalance: Query organization's carbon credit balance
func (s *SmartContract) GetCarbonBalance(ctx contractapi.TransactionContextInterface,
    orgId string) (CarbonBalance, error)
```

### 3.3 Environmental Impact Verification

**Use Case**: Third-party verification of environmental claims

**Benefits**:
- Immutable record of environmental measurements
- Third-party auditor verification on blockchain
- Prevent greenwashing with verified data
- Compliance with ESG reporting requirements

**Data Models**:
```typescript
interface EnvironmentalClaim {
  claimId: string;
  orgId: string;
  claimType: 'co2_absorption' | 'biodiversity' | 'water_conservation';
  claimedValue: number;
  period: { start: Date; end: Date };
  evidence: Evidence[];
  verification: VerificationStatus;
  auditTrail: AuditEntry[];
}

interface VerificationStatus {
  status: 'pending' | 'verified' | 'rejected' | 'disputed';
  verifiedBy?: string;              // Third-party auditor ID
  verifiedAt?: Date;
  confidenceScore?: number;
  comments?: string;
}
```

### 3.4 Professional Certification Tracking

**Use Case**: Track and verify professional certifications for landscapers

**Benefits**:
- Immutable certification records for professionals
- Verifiable credentials on blockchain
- Prevent certificate fraud
- Streamline hiring and verification processes

**Data Models**:
```typescript
interface ProfessionalCertification {
  certificationId: string;
  professionalId: string;
  certifyingBody: string;
  certificationType: string;
  issueDate: Date;
  expiryDate: Date;
  skills: Skill[];
  projectsCompleted: number;
  clientRating: number;
  verificationStatus: VerificationStatus;
  auditTrail: AuditEntry[];
}
```

### 3.5 Grant & Funding Tracking

**Use Case**: Track environmental grants and funding disbursement

**Benefits**:
- Transparent fund allocation and usage
- Milestone-based fund release
- Audit trail for grant compliance
- Reduce fraudulent claims

**Smart Contract Functions**:
```go
// GrantFunds: Allocate funds for environmental projects
func (s *SmartContract) GrantFunds(ctx contractapi.TransactionContextInterface,
    grantId string, grantorId string, recipientId string,
    amount number, disbursementSchedule DisbursementSchedule) error

// ReleaseMilestoneFunds: Release funds based on milestone completion
func (s *SmartContract) ReleaseMilestoneFunds(ctx contractapi.TransactionContextInterface,
    grantId string, milestoneId string) error

// ReportGrantProgress: Report progress and evidence
func (s *SmartContract) ReportGrantProgress(ctx contractapi.TransactionContextInterface,
    grantId string, progressReport ProgressReport) error
```

### 3.6 Insurance & Warranty Management

**Use Case**: Plant health insurance and warranty tracking

**Benefits**:
- Immutable plant health records
- Automated warranty claims processing
- Fraud prevention for false claims
- Evidence-based claim verification

**Data Models**:
```typescript
interface PlantInsurancePolicy {
  policyId: string;
  plantId: string;
  policyHolderId: string;
  insurerId: string;
  premium: number;
  coverage: CoverageDetails;
  startDate: Date;
  expiryDate: Date;
  healthRecords: PlantHealthRecord[];
  claims: InsuranceClaim[];
}

interface InsuranceClaim {
  claimId: string;
  policyId: string;
  claimDate: Date;
  reason: string;
  evidence: Evidence[];
  assessment: ClaimAssessment;
  payout?: number;
  payoutDate?: Date;
}
```

### 3.7 Research Data Provenance

**Use Case**: Track plant research data and scientific contributions

**Benefits**:
- Immutable research data records
- Citation tracking on blockchain
- Prevent data manipulation
- Verify research contributions

**Data Models**:
```typescript
interface ResearchData {
  dataId: string;
  researcherId: string;
  institutionId: string;
  dataType: 'specimen' | 'observation' | 'experiment' | 'genetic';
  dataHash: string;
  metadata: ResearchMetadata;
  citations: string[];              // Data IDs that cite this data
  timestamp: Date;
  verified: boolean;
}
```

---

## 4. Technical Architecture

### 4.1 Hyperledger Fabric Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Hedges Care Fabric Network              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Organization│      │ Organization│      │ Organization│
│     1       │      │     2       │      │     3       │
│  (Nurseries)│      │ (Landscapers│      │ (Enterprises│
│             │      │   Pros)     │      │ & Corps)    │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       │     ┌──────────────┤──────────────┐     │
       │     │              │              │     │
       │     ▼              ▼              ▼     │
       │ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
       │ │  Peer 1  │ │  Peer 2  │ │  Peer 3  │ │
       │ │ (Anchor) │ │ (Anchor) │ │ (Anchor) │ │
       │ └────┬─────┘ └─────┬────┘ └─────┬────┘ │
       │      │             │             │     │
       │      └─────────────┼─────────────┘     │
       │                    │                   │
       │                    ▼                   │
       │            ┌──────────────┐            │
       │            │ Channel 1    │            │
       │            │ (Partnerships│            │
       │            │  Management) │            │
       │            └──────────────┘            │
       │                    │                   │
       │                    ▼                   │
       │            ┌──────────────┐            │
       │            │  Orderer 1   │            │
       │            │ (Raft Cons.) │            │
       │            └──────────────┘            │
       │                                        │
       └────────────────────────────────────────┘
        
┌─────────────────────────────────────────────────────────────┐
│                 Channels & Applications                      │
├─────────────────────────────────────────────────────────────┤
│ Channel 1: Partnership Management                           │
│   - Organization 1, 2, 3                                      │
│   - Chaincode: Partnership Management                        │
│                                                             │
│ Channel 2: Supply Chain Tracking                            │
│   - Organization 1, 2, Certifier                            │
│   - Chaincode: Supply Chain & Tracking                      │
│                                                             │
│ Channel 3: Carbon Credits                                   │
│   - Organization 2, 3, Regulator                           │
│   - Chaincode: Carbon Credit Trading                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Fabric Network Components

#### Ordering Service
- **Type**: Raft consensus protocol
- **Nodes**: 3-5 ordering nodes for fault tolerance
- **Function**: Order transactions into blocks and provide consensus

#### Peers
- **Organization 1 (Nurseries)**: 2 peers (1 anchor peer)
- **Organization 2 (Landscaping Professionals)**: 2 peers (1 anchor peer)
- **Organization 3 (Enterprise Clients)**: 2 peers (1 anchor peer)
- **Total**: 6 peers across organizations

#### Channels
1. **PartnerChannel**: All organizations for partnership management
2. **SupplyChainChannel**: Nurseries, landscapers, third-party verifiers
3. **FinanceChannel**: Creditors, insurance providers, enterprises
4. **RegulatoryChannel**: Regulators, enterprises, Hedges Care

### 4.3 Application Gateway Architecture

```typescript
// Fabric Application Gateway Service
class FabricGatewayService {
  private gateway: Gateway;
  private network: Network;
  private contract: Contract;

  async initialize(config: FabricConfig): Promise<void> {
    // Load connection profile
    const ccp = await this.loadConnectionProfile(config.ccpPath);
    
    // Create wallet identity
    const wallet = await Wallets.newFileSystemWallet(config.walletPath);
    const identity = await wallet.get(config.userId);
    
    // Create gateway connection
    this.gateway = new Gateway();
    await this.gateway.connect(ccp, {
      wallet,
      identity: config.userId,
      discovery: { enabled: true, asLocalhost: false }
    });

    // Get network and contract
    this.network = await this.gateway.getNetwork(config.channelName);
    this.contract = await this.network.getContract(config.chaincodeId);
  }

  // Submit transaction
  async submitTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<Buffer> {
    try {
      const result = await this.contract.submitTransaction(
        functionName,
        ...args
      );
      return result;
    } catch (error) {
      console.error(`Transaction ${functionName} failed:`, error);
      throw error;
    }
  }

  // Evaluate transaction (query)
  async evaluateTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<Buffer> {
    try {
      const result = await this.contract.evaluateTransaction(
        functionName,
        ...args
      );
      return result;
    } catch (error) {
      console.error(`Query ${functionName} failed:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.gateway.disconnect();
  }
}
```

### 4.4 API Layer

```typescript
// Fabric API Service
export const fabricApiService = {
  // Partnership Management
  createPartnership: async (partnershipData: PartnershipCreateRequest) => {
    const gateway = new FabricGatewayService();
    await gateway.initialize(FABRIC_CONFIG);
    
    try {
      const result = await gateway.submitTransaction(
        'CreatePartnership',
        JSON.stringify(partnershipData)
      );
      
      return JSON.parse(result.toString());
    } finally {
      await gateway.disconnect();
    }
  },

  updateMilestone: async (partnershipId: string, milestoneData: MilestoneUpdate) => {
    const gateway = new FabricGatewayService();
    await gateway.initialize(FABRIC_CONFIG);
    
    try {
      await gateway.submitTransaction(
        'UpdateMilestone',
        partnershipId,
        JSON.stringify(milestoneData)
      );
      
      return { success: true };
    } finally {
      await gateway.disconnect();
    }
  },

  getPartnership: async (partnershipId: string): Promise<Partnership> => {
    const gateway = new FabricGatewayService();
    await gateway.initialize(FABRIC_CONFIG);
    
    try {
      const result = await gateway.evaluateTransaction(
        'ReadPartnership',
        partnershipId
      );
      
      return JSON.parse(result.toString());
    } finally {
      await gateway.disconnect();
    }
  }
};
```

---

## 5. Smart Contract Design

### 5.1 Partnership Management Chaincode (TypeScript)

```typescript
// src/chaincode/partnership.ts
import { Context, Contract } from 'fabric-contract-api';

export class PartnershipContract extends Contract {
  
  // Create Partnership
  async createPartnership(
    ctx: Context,
    partnershipId: string,
    org1Id: string,
    org2Id: string,
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
      agreementHash,
      startDate,
      endDate,
      status: 'active',
      type: partnershipType,
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
      createdAt: ctx.stub.getTxTimestamp().toString(),
      updatedAt: ctx.stub.getTxTimestamp().toString()
    };

    // Save to world state
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    ctx.stub.setEvent('PartnershipCreated', buffer);
  }

  // Update Milestone
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

    // Find milestone
    const milestone = partnership.milestones.find(
      m => m.milestoneId === milestoneId
    );

    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    // Update milestone
    milestone.actualValue = parseFloat(actualValue);
    milestone.actualDate = new Date().toISOString();
    milestone.status = parseFloat(actualValue) >= milestone.targetValue 
      ? 'completed' 
      : 'in_progress';

    // Parse evidence
    const evidenceData: Evidence = JSON.parse(evidence);
    milestone.evidence.push(evidenceData);

    // Update partnership environmental impact
    if (milestone.type === 'environmental') {
      partnership.environmentalImpact.totalCO2Absorbed += 
        parseFloat(actualValue);
    }

    // Update reputation based on milestone completion
    if (milestone.status === 'completed') {
      partnership.reputationScore = Math.min(100, 
        partnership.reputationScore + 5
      );
    }

    // Update timestamp
    partnership.updatedAt = ctx.stub.getTxTimestamp().toString();

    // Save partnership
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    ctx.stub.setEvent('MilestoneUpdated', buffer);
  }

  // Verify Evidence
  async verifyEvidence(
    ctx: Context,
    partnershipId: string,
    milestoneId: string,
    evidenceId: string,
    verified: boolean,
    comments?: string
  ): Promise<void> {
    // Get partnership
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    if (!partnershipBytes || partnershipBytes.length === 0) {
      throw new Error(`Partnership ${partnershipId} does not exist`);
    }

    const partnership: Partnership = JSON.parse(partnershipBytes.toString());

    // Find milestone and evidence
    const milestone = partnership.milestones.find(
      m => m.milestoneId === milestoneId
    );

    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    const evidence = milestone.evidence.find(
      e => e.evidenceId === evidenceId
    );

    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }

    // Update evidence verification
    const clientIdentity = ctx.clientIdentity;
    evidence.verified = verified;
    evidence.verifiedBy = clientIdentity.getMSPID();
    evidence.verifiedAt = new Date().toISOString();
    evidence.verificationComments = comments;

    // Update timestamp
    partnership.updatedAt = ctx.stub.getTxTimestamp().toString();

    // Save partnership
    const buffer = Buffer.from(JSON.stringify(partnership));
    await ctx.stub.putState(partnershipId, buffer);

    // Emit event
    ctx.stub.setEvent('EvidenceVerified', buffer);
  }

  // Query Functions
  async queryPartnership(
    ctx: Context,
    partnershipId: string
  ): Promise<string> {
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    if (!partnershipBytes || partnershipBytes.length === 0) {
      throw new Error(`Partnership ${partnershipId} does not exist`);
    }
    return partnershipBytes.toString();
  }

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

    const iterator = await ctx.stub.getQueryResult(
      JSON.stringify(queryString)
    );
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  // Helper function to check existence
  async partnershipExists(
    ctx: Context,
    partnershipId: string
  ): Promise<boolean> {
    const partnershipBytes = await ctx.stub.getState(partnershipId);
    return partnershipBytes && partnershipBytes.length > 0;
  }

  // Helper function to get all query results
  async getAllResults(iterator: any): Promise<any[]> {
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
}

// Data model interfaces
export interface Partnership {
  partnershipId: string;
  org1Id: string;
  org2Id: string;
  agreementHash: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  milestones: Milestone[];
  payments: Payment[];
  reputationScore: number;
  environmentalImpact: EnvironmentalMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  milestoneId: string;
  name: string;
  targetValue: number;
  targetDate: string;
  actualValue?: number;
  actualDate?: string;
  status: string;
  type: string;
  evidence: Evidence[];
}

export interface Evidence {
  evidenceId: string;
  type: string;
  hash: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationComments?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface EnvironmentalMetrics {
  totalCO2Absorbed: number;
  treesPlanted: number;
  habitatCreated: number;
  biodiversityIndex: number;
  waterConserved: number;
}
```

### 5.2 Supply Chain Chaincode (TypeScript)

```typescript
// src/chaincode/supplychain.ts
export class SupplyChainContract extends Contract {
  
  // Create Plant Certificate
  async createPlantCertificate(
    ctx: Context,
    certificateId: string,
    plantId: string,
    species: string,
    originFarm: string,
    certifications: string
  ): Promise<void> {
    const certificate: PlantCertificate = {
      certificateId,
      plantId,
      species,
      origin: { farm: originFarm, date: new Date().toISOString() },
      sustainabilityCertifications: JSON.parse(certifications),
      supplyChainEvents: [],
      currentOwner: ctx.clientIdentity.getMSPID(),
      status: 'created'
    };

    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);
    ctx.stub.setEvent('CertificateCreated', buffer);
  }

  // Add Supply Chain Event
  async addSupplyChainEvent(
    ctx: Context,
    certificateId: string,
    eventType: string,
    location: string,
    qualityMetrics: string,
    environmentalSnapshot: string
  ): Promise<void> {
    const certBytes = await ctx.stub.getState(certificateId);
    const certificate: PlantCertificate = JSON.parse(certBytes.toString());

    const event: SupplyChainEvent = {
      eventId: generateEventId(),
      plantId: certificate.plantId,
      eventType,
      location: JSON.parse(location),
      timestamp: ctx.stub.getTxTimestamp().toString(),
      participantId: ctx.clientIdentity.getMSPID(),
      quality: JSON.parse(qualityMetrics),
      environmental: JSON.parse(environmentalSnapshot)
    };

    certificate.supplyChainEvents.push(event);

    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);
    ctx.stub.setEvent('EventAdded', buffer);
  }

  // Transfer Plant Ownership
  async transferOwnership(
    ctx: Context,
    certificateId: string,
    newOwnerId: string
  ): Promise<void> {
    const certBytes = await ctx.stub.getState(certificateId);
    const certificate: PlantCertificate = JSON.parse(certBytes.toString());

    const previousOwner = certificate.currentOwner;
    certificate.currentOwner = newOwnerId;
    certificate.transferHistory = certificate.transferHistory || [];
    certificate.transferHistory.push({
      from: previousOwner,
      to: newOwnerId,
      timestamp: ctx.stub.getTxTimestamp().toString()
    });

    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);
    ctx.stub.setEvent('OwnershipTransferred', buffer);
  }

  // Get Supply Chain History
  async getSupplyChainHistory(
    ctx: Context,
    certificateId: string
  ): Promise<string> {
    const iterator = await ctx.stub.getHistoryForKey(certificateId);
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }
}
```

### 5.3 Carbon Credit Chaincode (TypeScript)

```typescript
// src/chaincode/carboncredits.ts
export class CarbonCreditContract extends Contract {
  
  // Mint Carbon Credits
  async mintCarbonCredits(
    ctx: Context,
    creditId: string,
    orgId: string,
    amount: string,
    verificationData: string
  ): Promise<void> {
    const credits: CarbonCredits = {
      creditId,
      orgId,
      amount: parseFloat(amount),
      verificationData: JSON.parse(verificationData),
      mintedAt: ctx.stub.getTxTimestamp().toString(),
      transfers: [],
      retired: false
    };

    const buffer = Buffer.from(JSON.stringify(credits));
    await ctx.stub.putState(creditId, buffer);
    ctx.stub.setEvent('CreditsMinted', buffer);
  }

  // Transfer Credits
  async transferCredits(
    ctx: Context,
    creditId: string,
    fromOrg: string,
    toOrg: string,
    amount: string,
    purpose: string
  ): Promise<void> {
    const creditBytes = await ctx.stub.getState(creditId);
    const credit: CarbonCredits = JSON.parse(creditBytes.toString());

    if (credit.orgId !== fromOrg) {
      throw new Error('Transfer not from credit owner');
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount > credit.amount) {
      throw new Error('Insufficient credit balance');
    }

    credit.amount -= transferAmount;

    // Create new credit for recipient
    const newCreditId = `${toOrg}_${Date.now()}`;
    const newCredit: CarbonCredits = {
      creditId: newCreditId,
      orgId: toOrg,
      amount: transferAmount,
      sourceCredit: creditId,
      purpose,
      mintedAt: ctx.stub.getTxTimestamp().toString(),
      transfers: [],
      retired: false
    };

    // Update original credit
    credit.transfers.push({
      to: toOrg,
      amount: transferAmount,
      timestamp: ctx.stub.getTxTimestamp().toString(),
      purpose
    });

    // Save both credits
    await ctx.stub.putState(creditId, Buffer.from(JSON.stringify(credit)));
    await ctx.stub.putState(newCreditId, Buffer.from(JSON.stringify(newCredit)));
    
    ctx.stub.setEvent('CreditsTransferred', Buffer.from(JSON.stringify({
      from: fromOrg,
      to: toOrg,
      amount: transferAmount
    })));
  }

  // Retire Credits
  async retireCredits(
    ctx: Context,
    creditId: string,
    amount: string,
    retirementClaim: string
  ): Promise<void> {
    const creditBytes = await ctx.stub.getState(creditId);
    const credit: CarbonCredits = JSON.parse(creditBytes.toString());

    const retireAmount = parseFloat(amount);
    if (retireAmount > credit.amount) {
      throw new Error('Insufficient credits to retire');
    }

    credit.amount -= retireAmount;
    credit.retiredAmount = (credit.retiredAmount || 0) + retireAmount;
    credit.retirementClaims = credit.retirementClaims || [];
    credit.retirementClaims.push({
      amount: retireAmount,
      claim: retirementClaim,
      timestamp: ctx.stub.getTxTimestamp().toString()
    });

    const buffer = Buffer.from(JSON.stringify(credit));
    await ctx.stub.putState(creditId, buffer);
    ctx.stub.setEvent('CreditsRetired', buffer);
  }

  // Get Organization Balance
  async getOrganizationBalance(
    ctx: Context,
    orgId: string
  ): Promise<number> {
    const queryString = {
      selector: { orgId, retired: false }
    };

    const iterator = await ctx.stub.getQueryResult(
      JSON.stringify(queryString)
    );
    const results = await this.getAllResults(iterator);
    
    return results.reduce((total: number, credit: CarbonCredits) => {
      return total + credit.amount;
    }, 0);
  }
}
```

---

## 6. Integration Strategy

### 6.1 Dual Blockchain Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Hedges Care Platform                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌────────────────────────┐    ┌─────────────────────────┐
│   Polygon Network       │    │ Hyperledger Fabric      │
│   (Public Layer)        │    │ (Permissioned Layer)    │
├────────────────────────┤    ├─────────────────────────┤
│ • Public NFTs           │    │ • Partnership Records    │
│ • Marketplace Trading   │    │ • Supply Chain          │
│ • Individual Assets     │    │ • Carbon Credits (B2B)  │
│ • Community Features    │    │ • Corporate Data        │
│ • Ethereum Wallets      │    │ • Enterprise Identities │
│ • Gas-based Transactions│    │ • No Transaction Fees   │
│ • Public Transparency   │    │ • Private Channels      │
│ • EVM Smart Contracts   │    │ • Business Logic        │
│ • Solidity              │    │ • TypeScript Chaincode  │
└────────────────────────┘    └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Application API  │
                    │  Layer            │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  React Frontend    │
                    │  (User Interface) │
                    └───────────────────┘
```

### 6.2 Integration Points

#### A. Plant Analysis Result
- **Polygon**: Mint NFT for individual users
- **Fabric**: Record on supply chain if plant sourced through network

#### B. Environmental Impact
- **Polygon**: Display to users and NFT metadata
- **Fabric**: Track for carbon credit verification and B2B trading

#### C. Partnership Milestones
- **Polygon**: Announce achievements publicly
- **Fabric**: Record detailed milestone data evidence privately

### 6.3 User Identity Mapping

```typescript
// Identity mapping between Polygon and Fabric
interface UnifiedUser {
  userId: string;
  
  // Polygon Identity
  polygonWallet?: string;
  polygonNFTs?: PlantNFT[];
  
  // Fabric Identity
  fabricOrgId?: string;
  fabricCertificates?: string[];
  
  // Application Data
  profile: UserProfile;
  partnerships: Partnership[];
  permissions: Permission[];
}

// Permission System
type Permission = 
  | 'view_partnerships'
  | 'create_partnership'
  | 'verify_milestones'
  | 'mint_carbon_credits'
  | 'trade_carbon_credits'
  | 'supply_chain_access'
  | 'audit_access';
```

### 6.4 API Gateway Integration

```typescript
// Unified API Gateway
export const unifiedApiGateway = {
  // Plant Analysis - Uses both blockchains
  analyzePlant: async (imageData: string) => {
    // 1. Get AI analysis
    const analysis = await plantAnalysisService.analyzeImage(imageData);
    
    // 2. Mint NFT on Polygon (for individual display)
    const nftResult = await nftService.mintNFT(analysis);
    
    // 3. Check if plant should be tracked on Fabric
    if (analysis.plantData.source === 'verified_nursery') {
      // Record on Fabric supply chain
      await fabricApiService.recordPlant(
        analysis.plantData.id,
        analysis.plantData
      );
    }
    
    return {
      analysis,
      nft: nftResult.nft,
      blockchainTracking: analysis.plantData.source === 'verified_nursery'
    };
  },

  // Partnership Management - Fabric only
  createPartnership: async (partnershipData: PartnershipCreateRequest) => {
    return fabricApiService.createPartnership(partnershipData);
  },

  // Get Partnership View - Combines data
  getPartnershipView: async (partnershipId: string) => {
    // Get partnership data from Fabric
    const partnership = await fabricApiService.getPartnership(partnershipId);
    
    // Get related NFTs from Polygon (public milestones)
    const relatedNFTs = await nftService.getRelatedNFTs(partnershipId);
    
    return {
      partnership,
      publicMilestones: relatedNFTs
    };
  }
};
```

---

## 7. Security & Privacy Considerations

### 7.1 Access Control

#### Organization-Based Access
- Each organization has its own MSP (Membership Service Provider)
- Users registered under their organization
- Access control lists (ACL) for private data collections

#### Role-Based Access Control (RBAC)
```typescript
interface FabricRole {
  name: string;
  permissions: Permission[];
}

const fabricRoles: FabricRole[] = [
  {
    name: 'partner_admin',
    permissions: [
      'create_partnership',
      'update_milestone',
      'view_partnerships'
    ]
  },
  {
    name: 'verifier',
    permissions: [
      'verify_milestones',
      'view_evidence',
      'audit_access'
    ]
  },
  {
    name: 'observer',
    permissions: [
      'view_partnerships',
      'view_milestones'
    ]
  }
];
```

### 7.2 Private Data Collections

```typescript
// Private data collection configuration
const privateCollections = {
  // Evidence Collection - Only visible to verifiers and partnership organizations
  evidenceCollection: {
    name: 'coll_evidence',
    policy: `
      OR('Org1MSP.member', 'Org2MSP.member', 'VerifierMSP.member')
    `,
    requiredPeerCount: 0,
    maxPeerCount: 3,
    blockToLive: 0, // Live forever
    memberOnlyRead: true
  },
  
  // Financial Data Collection - Only visible to participating organizations
  financialCollection: {
    name: 'coll_financial',
    policy: `
      OR('Org1MSP.member', 'Org2MSP.member')
    `,
    requiredPeerCount: 1,
    maxPeerCount: 2,
    blockToLive: 315360000, // 10 years
    memberOnlyRead: true
  }
};
```

### 7.3 Data Privacy

#### Sensitive Data Protection
```typescript
// Sensitive data fields to store in private collections
const sensitiveDataFields = {
  partnership: [
    'paymentDetails',
    'contractTerms',
    'internalNotes',
    'financialDetails'
  ],
  
  milestone: [
    'evidenceDetails',
    'rawSensorData',
    'internalCommunication'
  ]
};

// hashing for verification without exposure
function hashSensitiveData(data: any): string {
  const jsonString = JSON.stringify(data);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}
```

### 7.4 Audit Logging

```typescript
// Comprehensive audit logging
interface AuditLog {
  logId: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

// Chaincode function to log all actions
async logAction(
  ctx: Context,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: string
): Promise<void> {
  const log: AuditLog = {
    logId: generateLogId(),
    timestamp: new Date(ctx.stub.getTxTimestamp().toString()),
    userId,
    organizationId: ctx.clientIdentity.getMSPID(),
    action,
    resourceType,
    resourceId,
    details: JSON.parse(details),
    txnId: ctx.stub.getTxID(),
    success: true
  };

  // Save to audit history
  await ctx.stub.putState(
    `AUDIT_${log.logId}`,
    Buffer.from(JSON.stringify(log))
  );
}
```

### 7.5 Regulatory Compliance

#### GDPR Compliance
- Right to be forgotten: Mark records as deleted (immutable audit trail remains)
- Data portability: Export user data from Fabric
- Consent management: Explicit consent for blockchain data storage

#### ISO 27001
- Information security policies
- Access control management
- Cryptographic controls
- Supplier relationships

#### Environmental Regulations
- ESG (Environmental, Social, Governance) reporting
- Carbon credit verification
- Sustainability certification tracking

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1-2: Fabric Network Setup**
- Set up development network (3 organizations)
- Configure channels and private collections
- Deploy chaincode for partnership management
- Set up application gateway
- Create user identities and wallets

**Week 3: Core Integration**
- Integrate Fabric gateway with React application
- Create UI components for partnership management
- Implement basic partnership creation and querying
- Set up API endpoints for Fabric operations

**Week 4: Testing & Validation**
- Write unit tests for chaincode
- Test partnership creation and updates
- Validate milestone tracking
- Test evidence upload and verification

### Phase 2: Partnership Page (Weeks 5-8)

**Week 5-6: Partnership UI Development**
- Build partnership dashboard component
- Implement milestone progress tracking
- Add evidence upload functionality
- Create reputation system display

**Week 7: Verification Features**
- Implement evidence verification workflow
- Add third-party auditor integration
- Create verification status display
- Build audit trail viewer

**Week 8: Advanced Features**
- Add automated milestone notifications
- Implement payment tracking
- Create environmental impact dashboards
- Add export reports functionality

### Phase 3: Supply Chain Integration (Weeks 9-12)

**Week 9-10: Supply Chain Chaincode**
- Develop supply chain tracking chaincode
- Implement plant certificate creation
- Add supply chain event recording
- Create ownership transfer functions

**Week 11: Supply Chain UI**
- Build supply chain tracking interface
- Add plant provenance visualization
- Implement certificate viewer
- Create supply chain history view

**Week 12: IoT Integration Planning**
- Design IoT sensor integration
- Plan automated data collection
- Define sensor data standards
- Create data ingestion pipeline

### Phase 4: Carbon Credits (Weeks 13-16)

**Week 13-14: Carbon Credit Chaincode**
- Develop carbon credit minting functions
- Implement credit transfer logic
- Add credit retirement functions
- Create verification mechanisms

**Week 15-16: Carbon Credit UI**
- Build carbon credit dashboard
- Implement B2B trading interface
- Add retirement workflow
- Create carbon balance display

### Phase 5: Testing & Deployment (Weeks 17-20)

**Week 17-18: Integration Testing**
- Test end-to-end workflows
- Validate blockchain consensus
- Test multi-organization operations
- Performance testing

**Week 19: Security Audit**
- Code review and security audit
- Penetration testing
- Access control validation
- Regulatory compliance review

**Week 20: Production Deployment**
- Deploy to production Fabric network
- Monitor transaction performance
- Train users and partners
- Create documentation

---

## Conclusion

This implementation plan outlines a comprehensive approach to integrating Hyperledger Fabric into the Hedges Care platform. The permissioned blockchain will transform the partnerships page from a simple display into a secure, verifiable, and transparent management system.

The dual blockchain architecture leverages the strengths of both systems:
- **Polygon** for public NFTs, marketplace trading, and community features
- **Fabric** for private business operations, supply chain tracking, and B2B transactions

This approach provides:
- Enhanced security and privacy for business data
- Immutable audit trails for regulatory compliance
- Real-time verification of partnerships and milestones
- Reduced transaction costs for enterprise operations
- Scalable infrastructure for B2B growth

The additional use cases (supply chain, carbon credits, certification tracking, etc.) extend the platform's capabilities and create new revenue streams while reinforcing the mission of environmental sustainability through blockchain technology.

---

*Document Version: 1.0*
*Last Updated: 2025-03-18*
