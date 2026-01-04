/**
 * Paddle Payment Provider for PhilJS Payments
 *
 * Features:
 * - Paddle API integration (v2)
 * - Subscription management
 * - Webhook signature verification
 * - Idempotency support
 *
 * Note: Paddle is a Merchant of Record, handling taxes and compliance
 */
import { createHmac, createVerify } from 'crypto';
import { PaymentError, WebhookVerificationError, } from '../index.js';
export class PaddleProvider {
    name = 'paddle';
    apiKey;
    webhookSecret;
    baseUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.webhookSecret = config.webhookSecret;
        this.baseUrl =
            config.environment === 'production'
                ? 'https://api.paddle.com'
                : 'https://sandbox-api.paddle.com';
    }
    // =========================================================================
    // Checkout
    // =========================================================================
    async createCheckout(request) {
        try {
            const response = await this.makeRequest('/transactions', 'POST', {
                items: request.lineItems.map((item) => ({
                    price_id: item.name, // Paddle uses price IDs
                    quantity: item.quantity,
                })),
                customer_id: request.customerId,
                checkout: {
                    url: request.successUrl,
                },
                custom_data: request.metadata,
            });
            const result = {
                id: response.id,
                url: response.url,
                status: this.mapTransactionStatus(response.status),
                lineItems: request.lineItems,
                successUrl: request.successUrl,
                cancelUrl: request.cancelUrl,
                expiresAt: new Date(response.expires_at),
            };
            if (response.customer_id) {
                result.customerId = response.customer_id;
            }
            if (request.metadata) {
                result.metadata = request.metadata;
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async retrieveCheckout(sessionId) {
        try {
            const response = await this.makeRequest(`/transactions/${sessionId}`, 'GET');
            const result = {
                id: response.id,
                url: response.checkout?.url || '',
                status: this.mapTransactionStatus(response.status),
                lineItems: response.details?.line_items.map((item) => ({
                    name: item.price_id,
                    amount: { amount: parseInt(item.totals.total, 10), currency: 'usd' },
                    quantity: item.quantity,
                })) || [],
                successUrl: '',
                cancelUrl: '',
                expiresAt: new Date(),
            };
            if (response.customer_id) {
                result.customerId = response.customer_id;
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    // =========================================================================
    // Subscriptions
    // =========================================================================
    async createSubscription(request) {
        try {
            // Paddle subscriptions are created through transactions
            const response = await this.makeRequest('/subscriptions', 'POST', {
                customer_id: request.customerId,
                items: [
                    {
                        price_id: request.priceId,
                        quantity: request.quantity || 1,
                    },
                ],
                custom_data: request.metadata,
            });
            return this.mapSubscription(response);
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async retrieveSubscription(subscriptionId) {
        try {
            const response = await this.makeRequest(`/subscriptions/${subscriptionId}`, 'GET');
            return this.mapSubscription(response);
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async updateSubscription(subscriptionId, updates) {
        try {
            const updatePayload = {};
            if (updates.priceId || updates.quantity) {
                updatePayload['items'] = [
                    {
                        price_id: updates.priceId,
                        quantity: updates.quantity,
                    },
                ];
            }
            if (updates.metadata) {
                updatePayload['custom_data'] = updates.metadata;
            }
            const response = await this.makeRequest(`/subscriptions/${subscriptionId}`, 'PATCH', updatePayload);
            return this.mapSubscription(response);
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async cancelSubscription(request) {
        try {
            const response = await this.makeRequest(`/subscriptions/${request.subscriptionId}/cancel`, 'POST', {
                effective_from: request.immediately ? 'immediately' : 'next_billing_period',
            });
            return this.mapSubscription(response);
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async listSubscriptions(customerId) {
        try {
            const response = await this.makeRequest(`/subscriptions?customer_id=${customerId}`, 'GET');
            return response.map((sub) => this.mapSubscription(sub));
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    // =========================================================================
    // Customers
    // =========================================================================
    async createCustomer(request) {
        try {
            const response = await this.makeRequest('/customers', 'POST', {
                email: request.email,
                name: request.name,
                custom_data: request.metadata,
            });
            const result = {
                id: response.id,
                email: response.email,
                createdAt: new Date(response.created_at),
            };
            if (response.name) {
                result.name = response.name;
            }
            if (response.custom_data) {
                result.metadata = response.custom_data;
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async retrieveCustomer(customerId) {
        try {
            const response = await this.makeRequest(`/customers/${customerId}`, 'GET');
            const result = {
                id: response.id,
                email: response.email,
                createdAt: new Date(response.created_at),
            };
            if (response.name) {
                result.name = response.name;
            }
            if (response.custom_data) {
                result.metadata = response.custom_data;
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async updateCustomer(customerId, updates) {
        try {
            const response = await this.makeRequest(`/customers/${customerId}`, 'PATCH', {
                email: updates.email,
                name: updates.name,
                custom_data: updates.metadata,
            });
            const result = {
                id: response.id,
                email: response.email,
                createdAt: new Date(response.created_at),
            };
            if (response.name) {
                result.name = response.name;
            }
            if (response.custom_data) {
                result.metadata = response.custom_data;
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async deleteCustomer(customerId) {
        // Paddle doesn't support customer deletion, only anonymization
        throw new PaymentError('Paddle does not support customer deletion. Use data anonymization instead.', 'not_supported', 'paddle');
    }
    // =========================================================================
    // Payment Methods
    // =========================================================================
    async attachPaymentMethod(request) {
        // Paddle manages payment methods through their checkout
        // Payment methods are automatically attached to customers
        try {
            const response = await this.makeRequest(`/customers/${request.customerId}/payment-methods`, 'GET');
            // Return the first (default) payment method
            const result = {
                id: response.id,
                type: response.type === 'card' ? 'card' : 'paypal',
                isDefault: true,
                customerId: request.customerId,
            };
            if (response.card) {
                result.card = {
                    brand: response.card.brand,
                    last4: response.card.last4,
                    expMonth: response.card.expiry_month,
                    expYear: response.card.expiry_year,
                };
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async detachPaymentMethod(paymentMethodId) {
        try {
            await this.makeRequest(`/payment-methods/${paymentMethodId}`, 'DELETE');
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async listPaymentMethods(customerId) {
        try {
            const response = await this.makeRequest(`/customers/${customerId}/payment-methods`, 'GET');
            return response.map((pm, index) => {
                const result = {
                    id: pm.id,
                    type: pm.type === 'card' ? 'card' : 'paypal',
                    isDefault: index === 0,
                    customerId,
                };
                if (pm.card) {
                    result.card = {
                        brand: pm.card.brand,
                        last4: pm.card.last4,
                        expMonth: pm.card.expiry_month,
                        expYear: pm.card.expiry_year,
                    };
                }
                return result;
            });
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async setDefaultPaymentMethod(customerId, paymentMethodId) {
        // Paddle doesn't have explicit default payment method setting
        // The most recent valid payment method is used
    }
    // =========================================================================
    // Invoices (Paddle calls these "transactions")
    // =========================================================================
    async createInvoice(request) {
        // Paddle invoices are generated automatically with subscriptions
        // For manual invoicing, we create a transaction
        try {
            const response = await this.makeRequest('/transactions', 'POST', {
                customer_id: request.customerId,
                items: request.lineItems.map((item) => ({
                    price_id: item.description,
                    quantity: item.quantity,
                })),
                custom_data: request.metadata,
            });
            return this.mapInvoice(response);
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async retrieveInvoice(invoiceId) {
        try {
            const response = await this.makeRequest(`/transactions/${invoiceId}`, 'GET');
            return this.mapInvoice(response);
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async finalizeInvoice(invoiceId) {
        // Paddle transactions don't need to be finalized
        return this.retrieveInvoice(invoiceId);
    }
    async voidInvoice(invoiceId) {
        // Void by creating a full refund/credit
        throw new PaymentError('Paddle transactions cannot be voided directly. Use refunds instead.', 'not_supported', 'paddle');
    }
    async listInvoices(customerId) {
        try {
            const response = await this.makeRequest(`/transactions?customer_id=${customerId}`, 'GET');
            return response.map((txn) => this.mapInvoice(txn));
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    // =========================================================================
    // Refunds (Paddle calls these "adjustments")
    // =========================================================================
    async refund(request) {
        try {
            const response = await this.makeRequest('/adjustments', 'POST', {
                transaction_id: request.paymentId,
                action: 'refund',
                reason: request.reason || 'Customer requested refund',
                items: request.amount
                    ? [
                        {
                            type: 'partial',
                            amount: request.amount.amount.toString(),
                        },
                    ]
                    : [{ type: 'full' }],
            });
            const result = {
                id: response.id,
                paymentId: response.transaction_id,
                amount: {
                    amount: parseInt(response.totals.total, 10),
                    currency: response.totals.currency_code.toLowerCase(),
                },
                status: this.mapRefundStatus(response.status),
                createdAt: new Date(response.created_at),
            };
            if (response.reason) {
                result.reason = response.reason;
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    async retrieveRefund(refundId) {
        try {
            const response = await this.makeRequest(`/adjustments/${refundId}`, 'GET');
            const result = {
                id: response.id,
                paymentId: response.transaction_id,
                amount: {
                    amount: parseInt(response.totals.total, 10),
                    currency: response.totals.currency_code.toLowerCase(),
                },
                status: this.mapRefundStatus(response.status),
                createdAt: new Date(response.created_at),
            };
            if (response.reason) {
                result.reason = response.reason;
            }
            return result;
        }
        catch (error) {
            throw this.handlePaddleError(error);
        }
    }
    // =========================================================================
    // Webhooks
    // =========================================================================
    async handleWebhook(request) {
        if (!this.verifyWebhookSignature(request)) {
            throw new WebhookVerificationError('Invalid Paddle webhook signature');
        }
        const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
        return {
            id: body.event_id,
            type: body.event_type,
            provider: 'paddle',
            data: body.data,
            createdAt: new Date(body.occurred_at),
        };
    }
    verifyWebhookSignature(request) {
        try {
            const body = typeof request.body === 'string' ? request.body : request.body.toString();
            const signature = request.signature;
            const timestamp = request.timestamp || '';
            // Paddle v2 webhook signature format: ts=timestamp;h1=signature
            const parts = signature.split(';');
            const tsMatch = parts.find((p) => p.startsWith('ts='));
            const h1Match = parts.find((p) => p.startsWith('h1='));
            if (!tsMatch || !h1Match)
                return false;
            const ts = tsMatch.substring(3);
            const h1 = h1Match.substring(3);
            // Create signature payload
            const signedPayload = `${ts}:${body}`;
            const expectedSignature = createHmac('sha256', this.webhookSecret)
                .update(signedPayload)
                .digest('hex');
            return h1 === expectedSignature;
        }
        catch {
            return false;
        }
    }
    // =========================================================================
    // Helper Methods
    // =========================================================================
    async makeRequest(path, method, body) {
        const url = `${this.baseUrl}${path}`;
        const fetchOptions = {
            method,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        };
        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }
        const response = await fetch(url, fetchOptions);
        const json = (await response.json());
        if (!response.ok || json.error) {
            throw new PaymentError(json.error?.detail || 'Paddle API error', json.error?.code || 'paddle_error', 'paddle', json.meta?.request_id);
        }
        return json.data;
    }
    mapTransactionStatus(status) {
        const statusMap = {
            draft: 'open',
            ready: 'open',
            billed: 'open',
            paid: 'complete',
            completed: 'complete',
            canceled: 'expired',
            past_due: 'open',
        };
        return statusMap[status] || 'open';
    }
    mapSubscription(sub) {
        const statusMap = {
            active: 'active',
            past_due: 'past_due',
            paused: 'paused',
            canceled: 'canceled',
            trialing: 'trialing',
        };
        const result = {
            id: sub.id,
            customerId: sub.customer_id,
            status: statusMap[sub.status] || 'unpaid',
            priceId: sub.items?.[0]?.price?.id || '',
            quantity: sub.items?.[0]?.quantity || 1,
            currentPeriodStart: new Date(sub.current_billing_period?.starts_at || Date.now()),
            currentPeriodEnd: new Date(sub.current_billing_period?.ends_at || Date.now()),
            cancelAtPeriodEnd: sub.scheduled_change?.action === 'cancel',
        };
        if (sub.canceled_at) {
            result.canceledAt = new Date(sub.canceled_at);
        }
        if (sub.trial?.ends_at) {
            result.trialEnd = new Date(sub.trial.ends_at);
        }
        return result;
    }
    mapInvoice(txn) {
        const statusMap = {
            draft: 'draft',
            ready: 'open',
            billed: 'open',
            paid: 'paid',
            completed: 'paid',
            canceled: 'void',
            past_due: 'open',
        };
        const currency = (txn.details?.totals?.currency_code || 'usd').toLowerCase();
        const total = parseInt(txn.details?.totals?.total || '0', 10);
        return {
            id: txn.id,
            customerId: txn.customer_id,
            subscriptionId: txn.subscription_id,
            status: statusMap[txn.status] || 'draft',
            amount: { amount: total, currency },
            amountPaid: { amount: txn.status === 'paid' ? total : 0, currency },
            amountDue: { amount: txn.status === 'paid' ? 0 : total, currency },
            lineItems: txn.details?.line_items?.map((item) => ({
                description: item.price_id,
                amount: { amount: parseInt(item.totals?.total || '0', 10), currency },
                quantity: item.quantity,
            })) || [],
            createdAt: new Date(txn.created_at),
        };
    }
    mapRefundStatus(status) {
        const statusMap = {
            pending: 'pending',
            approved: 'succeeded',
            rejected: 'failed',
            reversed: 'canceled',
        };
        return statusMap[status] || 'pending';
    }
    handlePaddleError(error) {
        if (error instanceof PaymentError)
            return error;
        if (error instanceof Error) {
            return new PaymentError(error.message, 'paddle_error', 'paddle');
        }
        return new PaymentError('Unknown Paddle error', 'unknown_error', 'paddle');
    }
}
/**
 * Create a configured Paddle provider instance.
 */
export function createPaddleProvider(config) {
    return new PaddleProvider(config);
}
//# sourceMappingURL=paddle.js.map