import { Context, Contract } from 'fabric-contract-api';
import {
  PlantCertificate,
  SupplyChainEvent,
  OriginInfo,
  Certification,
  GeoLocation,
  QualityMetric,
  EnvironmentalSnapshot,
  TransferRecord,
  generateId
} from './models';

export class SupplyChainContract extends Contract {

  /**
   * Create a new plant certificate
   */
  async createPlantCertificate(
    ctx: Context,
    certificateId: string,
    plantId: string,
    species: string,
    commonName: string,
    farmId: string,
    farmName: string,
    location: string,
    certifications: string
  ): Promise<void> {
    // Check if certificate already exists
    const exists = await this.certificateExists(ctx, certificateId);
    if (exists) {
      throw new Error(`Certificate ${certificateId} already exists`);
    }

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();

    const originInfo: OriginInfo = {
      farm: farmName,
      farmId,
      location: JSON.parse(location) as GeoLocation,
      date: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString()
    };

    const certificate: PlantCertificate = {
      certificateId,
      plantId,
      species,
      commonName,
      origin: originInfo,
      sustainabilityCertifications: JSON.parse(certifications) as Certification[],
      supplyChainEvents: [],
      currentOwner: mspId,
      status: 'created',
      createdAt: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      updatedAt: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      transferHistory: []
    };

    // Save to world state
    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);

    // Emit event
    ctx.stub.setEvent('CertificateCreated', buffer);
  }

  /**
   * Add a supply chain event
   */
  async addSupplyChainEvent(
    ctx: Context,
    certificateId: string,
    eventType: string,
    location: string,
    qualityMetrics: string,
    environmentalSnapshot: string,
    participantName: string
  ): Promise<void> {
    // Get certificate
    const certBytes = await ctx.stub.getState(certificateId);
    if (!certBytes || certBytes.length === 0) {
      throw new Error(`Certificate ${certificateId} does not exist`);
    }

    const certificate: PlantCertificate = JSON.parse(certBytes.toString());

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();

    const event: SupplyChainEvent = {
      eventId: generateId('event'),
      plantId: certificate.plantId,
      eventType: eventType as any,
      location: JSON.parse(location) as GeoLocation,
      timestamp: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      participantId: mspId,
      participantName,
      quality: JSON.parse(qualityMetrics) as QualityMetric,
      environmental: JSON.parse(environmentalSnapshot) as EnvironmentalSnapshot
    };

    certificate.supplyChainEvents.push(event);
    
    // Update status based on event type
    if (eventType === 'transported') {
      certificate.status = 'in_transit';
    } else if (eventType === 'planted') {
      certificate.status = 'planted';
      certificate.finalDestination = mspId;
    }

    certificate.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save certificate
    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);

    // Emit event
    ctx.stub.setEvent('EventAdded', buffer);
  }

  /**
   * Transfer ownership of a plant
   */
  async transferOwnership(
    ctx: Context,
    certificateId: string,
    newOwnerId: string,
    newOwnerName: string,
    reason: string
  ): Promise<void> {
    // Get certificate
    const certBytes = await ctx.stub.getState(certificateId);
    if (!certBytes || certBytes.length === 0) {
      throw new Error(`Certificate ${certificateId} does not exist`);
    }

    const certificate: PlantCertificate = JSON.parse(certBytes.toString());

    // Verify current ownership
    const clientIdentity = ctx.clientIdentity;
    const currentOwner = clientIdentity.getMSPID();
    
    if (certificate.currentOwner !== currentOwner) {
      throw new Error('Caller is not the current owner');
    }

    const previousOwner = certificate.currentOwner;
    certificate.currentOwner = newOwnerId;

    // Record transfer
    const transferRecord: TransferRecord = {
      from: previousOwner,
      to: newOwnerId,
      timestamp: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      reason
    };

    certificate.transferHistory.push(transferRecord);
    certificate.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save certificate
    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);

    // Emit event
    const eventData = Buffer.from(JSON.stringify({
      certificateId,
      plantId: certificate.plantId,
      from: previousOwner,
      to: newOwnerId,
      newOwnerName,
      reason
    }));
    ctx.stub.setEvent('OwnershipTransferred', eventData);
  }

  /**
   * Add sustainability certification to a plant
   */
  async addCertification(
    ctx: Context,
    certificateId: string,
    certId: string,
    certName: string,
    issuer: string,
    expiryDate: string
  ): Promise<void> {
    // Get certificate
    const certBytes = await ctx.stub.getState(certificateId);
    if (!certBytes || certBytes.length === 0) {
      throw new Error(`Certificate ${certificateId} does not exist`);
    }

    const certificate: PlantCertificate = JSON.parse(certBytes.toString());

    const certification: Certification = {
      certId,
      name: certName,
      issuer,
      issuedDate: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      expiryDate,
      verified: false
    };

    certificate.sustainabilityCertifications.push(certification);
    certificate.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save certificate
    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);

    // Emit event
    ctx.stub.setEvent('CertificationAdded', buffer);
  }

  /**
   * Verify a certification
   */
  async verifyCertification(
    ctx: Context,
    certificateId: string,
    certId: string,
    verified: string
  ): Promise<void> {
    // Get certificate
    const certBytes = await ctx.stub.getState(certificateId);
    if (!certBytes || certBytes.length === 0) {
      throw new Error(`Certificate ${certificateId} does not exist`);
    }

    const certificate: PlantCertificate = JSON.parse(certBytes.toString());

    // Find certification
    const certIndex = certificate.sustainabilityCertifications.findIndex(
      c => c.certId === certId
    );

    if (certIndex === -1) {
      throw new Error(`Certification ${certId} not found`);
    }

    certificate.sustainabilityCertifications[certIndex].verified = verified === 'true';
    certificate.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString();

    // Save certificate
    const buffer = Buffer.from(JSON.stringify(certificate));
    await ctx.stub.putState(certificateId, buffer);

    // Emit event
    ctx.stub.setEvent('CertificationVerified', buffer);
  }

  /**
   * Read a specific plant certificate
   */
  async readCertificate(
    ctx: Context,
    certificateId: string
  ): Promise<string> {
    const certBytes = await ctx.stub.getState(certificateId);
    if (!certBytes || certBytes.length === 0) {
      throw new Error(`Certificate ${certificateId} does not exist`);
    }
    return certBytes.toString();
  }

  /**
   * Query certificates by owner
   */
  async queryCertificatesByOwner(
    ctx: Context,
    ownerId: string
  ): Promise<string> {
    const queryString = {
      selector: {
        currentOwner: ownerId
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Query certificates by species
   */
  async queryCertificatesBySpecies(
    ctx: Context,
    species: string
  ): Promise<string> {
    const queryString = {
      selector: {
        species: species
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Query certificates by status
   */
  async queryCertificatesByStatus(
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
   * Get supply chain history for a certificate
   */
  async getSupplyChainHistory(
    ctx: Context,
    certificateId: string
  ): Promise<string> {
    const iterator = await ctx.stub.getHistoryForKey(certificateId);
    const results = await this.getAllHistoryResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Get all certificates
   */
  async getAllCertificates(ctx: Context): Promise<string> {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Helper function to check if certificate exists
   */
  async certificateExists(
    ctx: Context,
    certificateId: string
  ): Promise<boolean> {
    const certBytes = await ctx.stub.getState(certificateId);
    return certBytes && certBytes.length > 0;
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
