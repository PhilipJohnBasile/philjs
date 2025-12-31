/**
 * SubscriptionManager Component
 * Manages subscription display and actions
 */
export interface SubscriptionManagerProps {
    subscriptionId?: string | undefined;
    onCancel?: (() => void) | undefined;
    onUpdate?: ((newPlanId: string) => void) | undefined;
    showBillingHistory?: boolean | undefined;
}
/**
 * SubscriptionManager component placeholder
 */
export declare const SubscriptionManager: {
    readonly displayName: "SubscriptionManager";
};
//# sourceMappingURL=SubscriptionManager.d.ts.map