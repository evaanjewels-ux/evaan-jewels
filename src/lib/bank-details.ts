/** Public receiving-account details shown at checkout (not secrets). */
export const BANK_DETAILS = {
  accountHolder:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER || "AAKASH GUPTA",
  accountNumber:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "50100248836339",
  ifsc: process.env.NEXT_PUBLIC_BANK_IFSC || "HDFC0000924",
  branch: process.env.NEXT_PUBLIC_BANK_BRANCH || "DWARKA SECTOR 23",
  accountType:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_TYPE || "Savings Account",
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || "HDFC Bank",
} as const;
