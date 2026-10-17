export interface LendingTransactionRequest {
  action: "DEPOSIT" | "BORROW" | "REPAY" | "LIQUIDATE";
  poolAddress: string;
  asset: string;
  amount: bigint;
  user: string;
  debtToCover?: bigint;
  collateralAsset?: string;
  borrower?: string;
}

export interface ClientConfig {
  poolAddress?: string;
  chainAdapter?: {
    broadcast(payload: any): Promise<{ txHash: string; status: string }>;
  };
}

export interface UserHealthSummary {
  user: string;
  totalCollateralUsd: bigint;
  totalDebtUsd: bigint;
  maxBorrowUsd: bigint;
  healthFactor: number;
  isLiquidatable: boolean;
}
