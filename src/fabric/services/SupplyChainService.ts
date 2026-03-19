/**
 * Supply Chain Service
 * High-level API for supply chain operations on Hyperledger Fabric
 */

import { FabricGatewayService } from '../gateway/FabricGateway';
import type {
  PlantCertificate,
  SupplyChainEvent,
  Certification,
  GeoLocation,
  TransferRecord
} from '../chaincode/models';

export interface CreateCertificateRequest {
  plantId: string;
  species: string;
  commonName: string;
  farmId: string;
  farmName: string;
  location: GeoLocation;
  certifications: Certification[];
}

export interface AddEventRequest {
  certificateId: string;
  eventType: 'harvested' | 'transported' | 'inspected' | 'planted' | 'transferred';
  location: GeoLocation;
  qualityMetrics: {
    healthScore: number;
    condition: string;
    size: number;
    notes?: string;
  };
  environmentalSnapshot: {
    temperature: number;
    humidity: number;
    soilMoisture?: number;
    lightLevel?: number;
    notes?: string;
  };
  participantName: string;
}

export interface TransferOwnershipRequest {
  certificateId: string;
  newOwnerId: string;
  newOwnerName: string;
  reason: string;
}

export class SupplyChainService {
  private gateway: FabricGatewayService;

  constructor(gateway: FabricGatewayService) {
    this.gateway = gateway;
  }

  /**
   * Create a new plant certificate
   */
  async createCertificate(request: CreateCertificateRequest): Promise<PlantCertificate> {
    const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await this.gateway.submitTransaction(
      'createPlantCertificate',
      certificateId,
      request.plantId,
      request.species,
      request.commonName,
      request.farmId,
      request.farmName,
      JSON.stringify(request.location),
      JSON.stringify(request.certifications)
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to create certificate');
    }

    return result.payload || { certificateId, ...request };
  }

  /**
   * Add a supply chain event
   */
  async addEvent(request: AddEventRequest): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'addSupplyChainEvent',
      request.certificateId,
      request.eventType,
      JSON.stringify(request.location),
      JSON.stringify(request.qualityMetrics),
      JSON.stringify(request.environmentalSnapshot),
      request.participantName
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to add supply chain event');
    }
  }

  /**
   * Transfer ownership of a plant
   */
  async transferOwnership(request: TransferOwnershipRequest): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'transferOwnership',
      request.certificateId,
      request.newOwnerId,
      request.newOwnerName,
      request.reason
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to transfer ownership');
    }
  }

  /**
   * Add sustainability certification
   */
  async addCertification(
    certificateId: string,
    certId: string,
    certName: string,
    issuer: string,
    expiryDate: string
  ): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'addCertification',
      certificateId,
      certId,
      certName,
      issuer,
      expiryDate
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to add certification');
    }
  }

  /**
   * Verify a certification
   */
  async verifyCertification(
    certificateId: string,
    certId: string,
    verified: boolean
  ): Promise<void> {
    const result = await this.gateway.submitTransaction(
      'verifyCertification',
      certificateId,
      certId,
      verified.toString()
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to verify certification');
    }
  }

  /**
   * Read a specific certificate
   */
  async getCertificate(certificateId: string): Promise<PlantCertificate> {
    const result = await this.gateway.evaluateTransaction(
      'readCertificate',
      certificateId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to read certificate');
    }

    return result.payload;
  }

  /**
   * Get certificates by owner
   */
  async getCertificatesByOwner(ownerId: string): Promise<PlantCertificate[]> {
    const result = await this.gateway.evaluateTransaction(
      'queryCertificatesByOwner',
      ownerId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to query certificates');
    }

    return result.payload || [];
  }

  /**
   * Get certificates by species
   */
  async getCertificatesBySpecies(species: string): Promise<PlantCertificate[]> {
    const result = await this.gateway.evaluateTransaction(
      'queryCertificatesBySpecies',
      species
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to query certificates');
    }

    return result.payload || [];
  }

  /**
   * Get certificates by status
   */
  async getCertificatesByStatus(status: string): Promise<PlantCertificate[]> {
    const result = await this.gateway.evaluateTransaction(
      'queryCertificatesByStatus',
      status
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to query certificates');
    }

    return result.payload || [];
  }

  /**
   * Get supply chain history
   */
  async getSupplyChainHistory(certificateId: string): Promise<any[]> {
    const result = await this.gateway.evaluateTransaction(
      'getSupplyChainHistory',
      certificateId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to get supply chain history');
    }

    return result.payload || [];
  }

  /**
   * Get all certificates
   */
  async getAllCertificates(): Promise<PlantCertificate[]> {
    const result = await this.gateway.evaluateTransaction('getAllCertificates');

    if (!result.success) {
      throw new Error(result.error || 'Failed to query all certificates');
    }

    return result.payload || [];
  }

  /**
   * Get transfer history for a certificate
   */
  async getTransferHistory(certificateId: string): Promise<TransferRecord[]> {
    const certificate = await this.getCertificate(certificateId);
    return certificate.transferHistory || [];
  }
}
