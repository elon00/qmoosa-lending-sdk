import { test } from "node:test";
import assert from "node:assert/strict";
import { QmoosaLendingClient } from "../dist/index.js";

test("1. Deposit payload preparation & validation", () => {
  const client = new QmoosaLendingClient();
  const payload = client.buildDepositPayload("0x1111", "ETH", 10_000n);

  assert.equal(payload.action, "DEPOSIT");
  assert.equal(payload.asset, "ETH");
  assert.equal(payload.amount, 10_000n);
  assert.equal(payload.user, "0x1111");

  assert.throws(
    () => client.buildDepositPayload("0x1111", "ETH", 0n),
    /Transaction amount must be strictly greater than zero/
  );
  assert.throws(
    () => client.buildDepositPayload("", "ETH", 100n),
    /User address must not be empty/
  );
});

test("2. Borrow payload preparation", () => {
  const client = new QmoosaLendingClient();
  const payload = client.buildBorrowPayload("0x1111", "USDC", 5000n);

  assert.equal(payload.action, "BORROW");
  assert.equal(payload.asset, "USDC");
  assert.equal(payload.amount, 5000n);
});

test("3. Liquidation payload preparation & self-liquidation barrier", () => {
  const client = new QmoosaLendingClient();
  const payload = client.buildLiquidationPayload("0xliquidator", "0xborrower", "USDC", 2000n, "ETH");

  assert.equal(payload.action, "LIQUIDATE");
  assert.equal(payload.user, "0xliquidator");
  assert.equal(payload.borrower, "0xborrower");
  assert.equal(payload.asset, "USDC");
  assert.equal(payload.collateralAsset, "ETH");
  assert.equal(payload.debtToCover, 2000n);

  // Self-liquidation barrier
  assert.throws(
    () => client.buildLiquidationPayload("0xSAME", "0xsame", "USDC", 2000n, "ETH"),
    /Self-liquidation strictly prohibited/
  );
});

test("4. Fail-closed without chain adapter on broadcast", async () => {
  const client = new QmoosaLendingClient();
  const payload = client.buildDepositPayload("0x1111", "ETH", 10_000n);

  await assert.rejects(
    () => client.broadcast(payload),
    /Chain adapter not configured/
  );
});

test("5. Successful broadcast via configured adapter", async () => {
  const mockAdapter = {
    broadcast: async (payload) => ({
      txHash: "0xabcdef1234567890",
      status: "CONFIRMED"
    })
  };
  const client = new QmoosaLendingClient({ chainAdapter: mockAdapter });
  const payload = client.buildDepositPayload("0x1111", "ETH", 10_000n);
  const receipt = await client.broadcast(payload);

  assert.equal(receipt.txHash, "0xabcdef1234567890");
  assert.equal(receipt.status, "CONFIRMED");
});
