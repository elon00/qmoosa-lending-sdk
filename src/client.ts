import { LendingTransactionRequest, ClientConfig, UserHealthSummary } from "./types.js";

export class QmoosaLendingClient {
  public static readonly DEFAULT_POOL_ADDRESS = "0x5555555555555555555555555555555555555555";
  private config: ClientConfig;

  constructor(config: ClientConfig = {}) {
    this.config = {
      poolAddress: config.poolAddress ?? QmoosaLendingClient.DEFAULT_POOL_ADDRESS,
      chainAdapter: config.chainAdapter
    };
  }

  public buildDepositPayload(user: string, asset: string, amount: bigint): LendingTransactionRequest {
    this.validateInputs(user, asset, amount);
    return {
      action: "DEPOSIT",
      poolAddress: this.config.poolAddress!,
      asset,
      amount,
      user
    };
  }

  public buildBorrowPayload(user: string, asset: string, amount: bigint): LendingTransactionRequest {
    this.validateInputs(user, asset, amount);
    return {
      action: "BORROW",
      poolAddress: this.config.poolAddress!,
      asset,
      amount,
      user
    };
  }

  public buildRepayPayload(user: string, asset: string, amount: bigint): LendingTransactionRequest {
    this.validateInputs(user, asset, amount);
    return {
      action: "REPAY",
      poolAddress: this.config.poolAddress!,
      asset,
      amount,
      user
    };
  }

  public buildLiquidationPayload(
    liquidator: string,
    borrower: string,
    debtAsset: string,
    debtToCover: bigint,
    collateralAsset: string
  ): LendingTransactionRequest {
    this.validateInputs(liquidator, debtAsset, debtToCover);
    if (!borrower || borrower.trim().length === 0) {
      throw new Error("Borrower address must not be empty");
    }
    if (!collateralAsset || collateralAsset.trim().length === 0) {
      throw new Error("Collateral asset must not be empty");
    }
    if (liquidator.toLowerCase() === borrower.toLowerCase()) {
      throw new Error("Self-liquidation strictly prohibited");
    }

    return {
      action: "LIQUIDATE",
      poolAddress: this.config.poolAddress!,
      asset: debtAsset,
      amount: debtToCover,
      user: liquidator,
      debtToCover,
      collateralAsset,
      borrower
    };
  }

  public async broadcast(payload: LendingTransactionRequest): Promise<{ txHash: string; status: string }> {
    if (!this.config.chainAdapter) {
      throw new Error("Chain adapter not configured: cannot broadcast transaction without adapter");
    }
    return this.config.chainAdapter.broadcast(payload);
  }

  private validateInputs(user: string, asset: string, amount: bigint): void {
    if (!user || user.trim().length === 0) {
      throw new Error("User address must not be empty");
    }
    if (!asset || asset.trim().length === 0) {
      throw new Error("Asset symbol must not be empty");
    }
    if (amount <= 0n) {
      throw new Error("Transaction amount must be strictly greater than zero");
    }
  }
}
