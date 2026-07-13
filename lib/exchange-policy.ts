export type ExchangeSettlementPreview = {
  cashAmount?: number
  bankAmount?: number
  creditAmount?: number
  remainingToAllocate?: number
  isValid?: boolean
}

export type ExchangeCustomerFacingPolicyInput = {
  currency?: string
  returnedValue?: number
  newSubtotal?: number
  newTax?: number
  newGross?: number
  amountDueFromCustomer?: number
  arRelief?: number
  excessDueToCustomer?: number
  settlementPreview?: ExchangeSettlementPreview | null
}

export type ExchangeCustomerFacingPolicy = {
  showNegativeLines: false
  showNegativeTotal: false
  balanceDueLabel: "Balance due to customer" | "Balance due from customer"
  policyNote: string
  currency: string
  displayTotal: number
  lines: Array<{
    key: string
    label: string
    amount: number
    displayAs:
      | "exchange_credit"
      | "sale_subtotal"
      | "tax"
      | "sale_gross"
      | "customer_due"
      | "ar_relief"
      | "customer_refund_or_credit"
  }>
  settlementSummary: {
    cashAmount: number
    bankAmount: number
    creditAmount: number
    remainingToAllocate: number
    isValid: boolean
  } | null
}

const money = (value: unknown) => Math.round((Number(value) || 0) * 100) / 100
const positiveMoney = (value: unknown) => Math.max(0, money(value))

export function buildExchangeCustomerFacingPolicy(input: ExchangeCustomerFacingPolicyInput): ExchangeCustomerFacingPolicy {
  const amountDueFromCustomer = positiveMoney(input.amountDueFromCustomer)
  const excessDueToCustomer = positiveMoney(input.excessDueToCustomer)

  return {
    showNegativeLines: false,
    showNegativeTotal: false,
    balanceDueLabel: excessDueToCustomer > 0 ? "Balance due to customer" : "Balance due from customer",
    policyNote: "VAT applies to the new replacement items only. Remaining balance due to customer is not taxed again.",
    currency: input.currency || "AED",
    displayTotal: amountDueFromCustomer > 0 ? amountDueFromCustomer : excessDueToCustomer,
    lines: [
      { key: "returnedValue", label: "Returned item value", amount: positiveMoney(input.returnedValue), displayAs: "exchange_credit" },
      { key: "newSubtotal", label: "New replacement items subtotal", amount: positiveMoney(input.newSubtotal), displayAs: "sale_subtotal" },
      { key: "newTax", label: "VAT on new replacement items", amount: positiveMoney(input.newTax), displayAs: "tax" },
      { key: "newGross", label: "New replacement items gross", amount: positiveMoney(input.newGross), displayAs: "sale_gross" },
      { key: "amountDueFromCustomer", label: "Amount due from customer", amount: amountDueFromCustomer, displayAs: "customer_due" },
      { key: "arRelief", label: "Receivable relief", amount: positiveMoney(input.arRelief), displayAs: "ar_relief" },
      { key: "excessDueToCustomer", label: "Balance due to customer", amount: excessDueToCustomer, displayAs: "customer_refund_or_credit" },
    ],
    settlementSummary: input.settlementPreview
      ? {
          cashAmount: positiveMoney(input.settlementPreview.cashAmount),
          bankAmount: positiveMoney(input.settlementPreview.bankAmount),
          creditAmount: positiveMoney(input.settlementPreview.creditAmount),
          remainingToAllocate: positiveMoney(input.settlementPreview.remainingToAllocate),
          isValid: Boolean(input.settlementPreview.isValid),
        }
      : null,
  }
}
