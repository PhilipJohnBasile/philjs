/**
 * PricingTable Component
 * Displays pricing plans and allows selection
 */
export interface PricingPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
}
export interface PricingTableProps {
    plans?: PricingPlan[] | undefined;
    onSelect?: ((planId: string) => void) | undefined;
    currentPlanId?: string | undefined;
    highlightedPlanId?: string | undefined;
}
/**
 * PricingTable component placeholder
 */
export declare const PricingTable: {
    readonly displayName: "PricingTable";
};
//# sourceMappingURL=PricingTable.d.ts.map