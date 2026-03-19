import { Context, Contract } from 'fabric-contract-api';
import {
  CarbonCredits,
  CarbonBalance,
  CarbonVerificationData,
  CarbonTransfer,
  RetirementClaim,
  generateId
} from './models';

export class CarbonCreditContract extends Contract {

  /**
   * Mint new carbon credits
   */
  async mintCarbonCredits(
    ctx: Context,
    creditId: string,
    orgId: string,
    orgName: string,
    amount: string,
    verificationData: string
  ): Promise<void> {
    // Check if credits already exist
    const exists = await this.creditExists(ctx, creditId);
    if (exists) {
      throw new Error(`Carbon credits ${creditId} already exist`);
    }

    // Get client identity
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    // Verify caller is authorized (can be the org itself or a verifier)
    if (mspId !== orgId && mspId !== 'VerifierMSP') {
      throw new Error('Caller is not authorized to mint credits');
    }

    const credits: CarbonCredits = {
      creditId,
      orgId,
      orgName,
      amount: parseFloat(amount),
      verificationData: JSON.parse(verificationData) as CarbonVerificationData,
      mintedAt: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      transfers: [],
      retired: false,
      retirementClaims: []
    };

    // Save to world state
    const buffer = Buffer.from(JSON.stringify(credits));
    await ctx.stub.putState(creditId, buffer);

    // Emit event
    const eventData = Buffer.from(JSON.stringify({
      creditId,
      orgId,
      orgName,
      amount: credits.amount,
      mintedAt: credits.mintedAt
    }));
    ctx.stub.setEvent('CreditsMinted', eventData);
  }

  /**
   * Transfer carbon credits between organizations
   */
  async transferCredits(
    ctx: Context,
    creditId: string,
    fromOrg: string,
    toOrg: string,
    toOrgName: string,
    amount: string,
    purpose: string
  ): Promise<void> {
    // Get credits
    const creditBytes = await ctx.stub.getState(creditId);
    if (!creditBytes || creditBytes.length === 0) {
      throw new Error(`Carbon credits ${creditId} do not exist`);
    }

    const credit: CarbonCredits = JSON.parse(creditBytes.toString());

    // Verify caller is the owner
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    if (mspId !== credit.orgId) {
      throw new Error('Caller is not the owner of these credits');
    }

    if (credit.orgId !== fromOrg) {
      throw new Error('Transfer not from credit owner');
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount > credit.amount) {
      throw new Error('Insufficient credit balance');
    }

    if (credit.retired) {
      throw new Error('Cannot transfer retired credits');
    }

    // Reduce original credit amount
    credit.amount -= transferAmount;

    // Record transfer
    const transfer: CarbonTransfer = {
      to: toOrg,
      toName: toOrgName,
      amount: transferAmount,
      timestamp: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      purpose
    };

    credit.transfers.push(transfer);

    // Create new credit for recipient
    const newCreditId = generateId('credit');
    const newCredit: CarbonCredits = {
      creditId: newCreditId,
      orgId: toOrg,
      orgName: toOrgName,
      amount: transferAmount,
      verificationData: credit.verificationData,
      sourceCredit: creditId,
      purpose,
      mintedAt: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      transfers: [],
      retired: false
    };

    // Save both credits
    await ctx.stub.putState(creditId, Buffer.from(JSON.stringify(credit)));
    await ctx.stub.putState(newCreditId, Buffer.from(JSON.stringify(newCredit)));
    
    // Emit event
    const eventData = Buffer.from(JSON.stringify({
      from: fromOrg,
      to: toOrg,
      toOrgName,
      amount: transferAmount,
      purpose,
      timestamp: transfer.timestamp,
      newCreditId
    }));
    ctx.stub.setEvent('CreditsTransferred', eventData);
  }

  /**
   * Retire carbon credits (used for carbon offset claims)
   */
  async retireCredits(
    ctx: Context,
    creditId: string,
    amount: string,
    retirementClaim: string
  ): Promise<void> {
    // Get credits
    const creditBytes = await ctx.stub.getState(creditId);
    if (!creditBytes || creditBytes.length === 0) {
      throw new Error(`Carbon credits ${creditId} do not exist`);
    }

    const credit: CarbonCredits = JSON.parse(creditBytes.toString());

    // Verify caller is the owner
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    if (mspId !== credit.orgId) {
      throw new Error('Caller is not the owner of these credits');
    }

    const retireAmount = parseFloat(amount);
    if (retireAmount > credit.amount) {
      throw new Error('Insufficient credits to retire');
    }

    // Update credit
    credit.amount -= retireAmount;
    credit.retiredAmount = (credit.retiredAmount || 0) + retireAmount;
    
    // Calculate retirement status
    if (credit.amount === 0) {
      credit.retired = true;
    }

    // Record retirement claim
    const retirement: RetirementClaim = {
      amount: retireAmount,
      claim: retirementClaim,
      timestamp: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString(),
      verified: false
    };

    credit.retirementClaims = credit.retirementClaims || [];
    credit.retirementClaims.push(retirement);

    // Save credit
    const buffer = Buffer.from(JSON.stringify(credit));
    await ctx.stub.putState(creditId, buffer);

    // Emit event
    const eventData = Buffer.from(JSON.stringify({
      creditId,
      orgId: credit.orgId,
      orgName: credit.orgName,
      amount: retireAmount,
      retirementClaim,
      retired: credit.retired,
      timestamp: retirement.timestamp
    }));
    ctx.stub.setEvent('CreditsRetired', eventData);
  }

  /**
   * Verify a retirement claim
   */
  async verifyRetirementClaim(
    ctx: Context,
    creditId: string,
    claimIndex: string,
    verified: string
  ): Promise<void> {
    // Get credits
    const creditBytes = await ctx.stub.getState(creditId);
    if (!creditBytes || creditBytes.length === 0) {
      throw new Error(`Carbon credits ${creditId} do not exist`);
    }

    const credit: CarbonCredits = JSON.parse(creditBytes.toString());

    // Verify caller is authorized (verifier)
    const clientIdentity = ctx.clientIdentity;
    const mspId = clientIdentity.getMSPID();
    
    if (mspId !== 'VerifierMSP') {
      throw new Error('Caller is not authorized to verify retirement claims');
    }

    if (!credit.retirementClaims) {
      throw new Error('No retirement claims found');
    }

    const index = parseInt(claimIndex);
    if (index < 0 || index >= credit.retirementClaims.length) {
      throw new Error('Invalid claim index');
    }

    credit.retirementClaims[index].verified = verified === 'true';

    // Save credit
    const buffer = Buffer.from(JSON.stringify(credit));
    await ctx.stub.putState(creditId, buffer);

    // Emit event
    ctx.stub.setEvent('RetirementClaimVerified', buffer);
  }

  /**
   * Read specific carbon credits
   */
  async readCredits(
    ctx: Context,
    creditId: string
  ): Promise<string> {
    const creditBytes = await ctx.stub.getState(creditId);
    if (!creditBytes || creditBytes.length === 0) {
      throw new Error(`Carbon credits ${creditId} do not exist`);
    }
    return creditBytes.toString();
  }

  /**
   * Query credits by organization
   */
  async queryCreditsByOrganization(
    ctx: Context,
    orgId: string
  ): Promise<string> {
    const queryString = {
      selector: {
        orgId: orgId,
        retired: false
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Get carbon balance for an organization
   */
  async getCarbonBalance(
    ctx: Context,
    orgId: string,
    orgName: string
  ): Promise<string> {
    // Query all credits for the organization
    const queryString = {
      selector: {
        orgId: orgId
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const credits = await this.getAllResults(iterator);

    let totalMinted = 0;
    let totalRetired = 0;
    let totalTransferred = 0;

    credits.forEach((credit: CarbonCredits) => {
      totalMinted += credit.amount;
      totalRetired += credit.retiredAmount || 0;
      
      // Calculate transfers
      credit.transfers.forEach((transfer: CarbonTransfer) => {
        totalTransferred += transfer.amount;
      });
    });

    const balance: CarbonBalance = {
      orgId,
      orgName,
      availableCredits: totalMinted - totalRetired,
      totalMinted,
      totalRetired,
      totalTransferred,
      certifications: []
    };

    return JSON.stringify(balance);
  }

  /**
   * Query all available credits (not retired)
   */
  async queryAvailableCredits(ctx: Context): Promise<string> {
    const queryString = {
      selector: {
        retired: false,
        amount: { $gt: 0 }
      }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Get credit history
   */
  async getCreditHistory(
    ctx: Context,
    creditId: string
  ): Promise<string> {
    const iterator = await ctx.stub.getHistoryForKey(creditId);
    const results = await this.getAllHistoryResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Get all carbon credits
   */
  async getAllCredits(ctx: Context): Promise<string> {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = await this.getAllResults(iterator);
    return JSON.stringify(results);
  }

  /**
   * Helper function to check if credits exist
   */
  async creditExists(
    ctx: Context,
    creditId: string
  ): Promise<boolean> {
    const creditBytes = await ctx.stub.getState(creditId);
    return creditBytes && creditBytes.length > 0;
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
