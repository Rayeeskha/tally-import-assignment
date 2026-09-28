export type Summary = {
  vouchers: number;
  ledgerEntries: number;
  inventoryEntries: number;
  warnings: number;
  errors: number;
};
export type RateDetail = { dutyHead: string | null; rate: string | null };

export type BillAllocation = {
  name: string | null;
  billType: string | null;
  amount: string | null;
};

export type BankAllocation = {
  date: string | null;
  name: string | null;
  transactionType: string | null;
  amount: string | null;
};

export type BatchAllocation = {
  godownName: string | null;
  batchName: string | null;
  actualQty: string | null;
  billedQty: string | null;
  amount: string | null;
};

export type LedgerEntry = {
  sourceTag: "ALLLEDGERENTRIES.LIST" | "LEDGERENTRIES.LIST";
  ledgerName: string | null;
  isDeemedPositive: string | null;
  amount: string | null;
  billAllocations: BillAllocation[];
  bankAllocations: BankAllocation[];
  rateDetails: RateDetail[];
};

export type AccountingAllocation = {
  ledgerName: string | null;
  isDeemedPositive: string | null;
  amount: string | null;
  rateDetails: RateDetail[];
};

export type InventoryEntry = {
  sourceTag: "ALLINVENTORYENTRIES.LIST";
  stockItemName: string | null;
  isDeemedPositive: string | null;
  actualQty: string | null;
  billedQty: string | null;
  rate: string | null;
  amount: string | null;
  batchAllocations: BatchAllocation[];
  accountingAllocations: AccountingAllocation[];
  rateDetails: RateDetail[];
};

export type Voucher = {
  source: { importId: string; contentHash: string; voucherIndex: number };
  attributes: Record<string, string>;
  date: string | null;
  voucherType: string | null;
  voucherNumber: string | null;
  partyLedgerName: string | null;
  narration: string | null;
  ledgerEntries: LedgerEntry[];
  inventoryEntries: InventoryEntry[];
  warnings: string[];
};

export type ParsedImport = {
  documentType: "voucherExport" | "tallyResponse";
  detectedEncoding: string;
  warnings: string[];
  errors: string[];
  summary: Summary;
  vouchers: Omit<Voucher, "source">[];
  tallyResponse?: {
    businessStatus: "succeeded" | "failed";
    counters: Record<string, string>;
    lineError: string | null;
  };
};
