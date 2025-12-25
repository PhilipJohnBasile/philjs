//! PhilJS Mobile In-App Purchases
//!
//! StoreKit (iOS) and Google Play Billing integration.

use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Product types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProductType {
    /// One-time purchase
    Consumable,
    /// Permanent purchase
    NonConsumable,
    /// Recurring subscription
    AutoRenewableSubscription,
    /// Non-renewing subscription (manual renewal)
    NonRenewingSubscription,
}

/// Product information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    /// Product identifier
    pub id: String,
    /// Product type
    pub product_type: ProductType,
    /// Display name
    pub display_name: String,
    /// Description
    pub description: String,
    /// Formatted price with currency
    pub display_price: String,
    /// Price in minor units (cents)
    pub price: i64,
    /// Currency code (e.g., "USD")
    pub currency_code: String,
    /// Subscription info (if applicable)
    pub subscription: Option<SubscriptionInfo>,
}

/// Subscription information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionInfo {
    /// Subscription group identifier
    pub group_id: String,
    /// Subscription period
    pub period: SubscriptionPeriod,
    /// Introductory offer
    pub introductory_offer: Option<SubscriptionOffer>,
    /// Promotional offers
    pub promotional_offers: Vec<SubscriptionOffer>,
}

/// Subscription period
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionPeriod {
    pub unit: PeriodUnit,
    pub value: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PeriodUnit {
    Day,
    Week,
    Month,
    Year,
}

/// Subscription offer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionOffer {
    pub id: Option<String>,
    pub offer_type: OfferType,
    pub display_price: String,
    pub period: SubscriptionPeriod,
    pub period_count: u32,
    pub payment_mode: PaymentMode,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OfferType {
    Introductory,
    Promotional,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaymentMode {
    /// Pay nothing for period
    FreeTrial,
    /// Pay reduced price
    PayAsYouGo,
    /// Pay upfront for all periods
    PayUpFront,
}

/// Purchase transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    /// Transaction identifier
    pub id: String,
    /// Original transaction ID (for renewals)
    pub original_id: String,
    /// Product identifier
    pub product_id: String,
    /// Purchase date
    pub purchase_date: String,
    /// Expiration date (for subscriptions)
    pub expiration_date: Option<String>,
    /// Whether purchase was restored
    pub is_restored: bool,
    /// Receipt data
    pub receipt_data: Option<String>,
}

/// Purchase result
#[derive(Debug, Clone)]
pub enum PurchaseResult {
    Success(Transaction),
    Pending,
    Cancelled,
    Failed(PurchaseError),
}

/// Store manager for in-app purchases
pub struct Store {
    products: Vec<Product>,
    on_transaction: Option<Arc<dyn Fn(Transaction) + Send + Sync>>,
}

impl Store {
    pub fn new() -> Self {
        Store {
            products: Vec::new(),
            on_transaction: None,
        }
    }

    /// Fetch products from the store
    pub async fn fetch_products(&mut self, product_ids: &[&str]) -> Result<Vec<Product>, PurchaseError> {
        #[cfg(target_os = "ios")]
        {
            self.fetch_products_ios(product_ids).await
        }
        #[cfg(target_os = "android")]
        {
            self.fetch_products_android(product_ids).await
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            let _ = product_ids;
            Err(PurchaseError::StoreNotAvailable)
        }
    }

    /// Purchase a product
    pub async fn purchase(&self, product_id: &str) -> PurchaseResult {
        #[cfg(target_os = "ios")]
        {
            self.purchase_ios(product_id).await
        }
        #[cfg(target_os = "android")]
        {
            self.purchase_android(product_id).await
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            let _ = product_id;
            PurchaseResult::Failed(PurchaseError::StoreNotAvailable)
        }
    }

    /// Restore previous purchases
    pub async fn restore_purchases(&self) -> Result<Vec<Transaction>, PurchaseError> {
        #[cfg(target_os = "ios")]
        {
            self.restore_ios().await
        }
        #[cfg(target_os = "android")]
        {
            self.restore_android().await
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Err(PurchaseError::StoreNotAvailable)
        }
    }

    /// Get current entitlements
    pub async fn current_entitlements(&self) -> Result<Vec<Transaction>, PurchaseError> {
        #[cfg(target_os = "ios")]
        {
            self.entitlements_ios().await
        }
        #[cfg(target_os = "android")]
        {
            self.entitlements_android().await
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Err(PurchaseError::StoreNotAvailable)
        }
    }

    /// Finish a transaction (acknowledge)
    pub async fn finish_transaction(&self, transaction: &Transaction) -> Result<(), PurchaseError> {
        #[cfg(target_os = "ios")]
        {
            // Would call finish() on SKPaymentTransaction
            let _ = transaction;
            Ok(())
        }
        #[cfg(target_os = "android")]
        {
            // Would call acknowledgePurchase or consumePurchase
            let _ = transaction;
            Ok(())
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            let _ = transaction;
            Err(PurchaseError::StoreNotAvailable)
        }
    }

    /// Listen for transaction updates
    pub fn on_transaction<F: Fn(Transaction) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_transaction = Some(Arc::new(callback));
    }

    #[cfg(target_os = "ios")]
    async fn fetch_products_ios(&mut self, product_ids: &[&str]) -> Result<Vec<Product>, PurchaseError> {
        // Would use StoreKit 2 Product.products(for:)
        let _ = product_ids;
        Ok(Vec::new())
    }

    #[cfg(target_os = "ios")]
    async fn purchase_ios(&self, product_id: &str) -> PurchaseResult {
        // Would use product.purchase()
        let _ = product_id;
        PurchaseResult::Cancelled
    }

    #[cfg(target_os = "ios")]
    async fn restore_ios(&self) -> Result<Vec<Transaction>, PurchaseError> {
        // Would use AppStore.sync()
        Ok(Vec::new())
    }

    #[cfg(target_os = "ios")]
    async fn entitlements_ios(&self) -> Result<Vec<Transaction>, PurchaseError> {
        // Would iterate Transaction.currentEntitlements
        Ok(Vec::new())
    }

    #[cfg(target_os = "android")]
    async fn fetch_products_android(&mut self, product_ids: &[&str]) -> Result<Vec<Product>, PurchaseError> {
        // Would use BillingClient.queryProductDetailsAsync
        let _ = product_ids;
        Ok(Vec::new())
    }

    #[cfg(target_os = "android")]
    async fn purchase_android(&self, product_id: &str) -> PurchaseResult {
        // Would use BillingClient.launchBillingFlow
        let _ = product_id;
        PurchaseResult::Cancelled
    }

    #[cfg(target_os = "android")]
    async fn restore_android(&self) -> Result<Vec<Transaction>, PurchaseError> {
        // Would use BillingClient.queryPurchasesAsync
        Ok(Vec::new())
    }

    #[cfg(target_os = "android")]
    async fn entitlements_android(&self) -> Result<Vec<Transaction>, PurchaseError> {
        // Would use BillingClient.queryPurchasesAsync
        Ok(Vec::new())
    }
}

impl Default for Store {
    fn default() -> Self {
        Self::new()
    }
}

/// Check if user can make payments
pub fn can_make_payments() -> bool {
    #[cfg(target_os = "ios")]
    {
        // Would use SKPaymentQueue.canMakePayments()
        true
    }
    #[cfg(target_os = "android")]
    {
        // Always true on Android (billing checks happen later)
        true
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        false
    }
}

/// Present subscription management UI
pub fn manage_subscriptions() {
    #[cfg(target_os = "ios")]
    {
        // Would open App Store subscription management
    }
    #[cfg(target_os = "android")]
    {
        // Would open Google Play subscription management
    }
}

/// Present refund request (iOS 15+)
#[cfg(target_os = "ios")]
pub async fn begin_refund_request(transaction_id: &str) -> Result<RefundRequestResult, PurchaseError> {
    // Would use Transaction.beginRefundRequest
    let _ = transaction_id;
    Ok(RefundRequestResult::Success)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RefundRequestResult {
    Success,
    Cancelled,
}

/// Purchase error types
#[derive(Debug, Clone)]
pub enum PurchaseError {
    /// Store not available
    StoreNotAvailable,
    /// Product not found
    ProductNotFound,
    /// Purchase failed
    PurchaseFailed(String),
    /// Payment cancelled
    PaymentCancelled,
    /// Payment pending
    PaymentPending,
    /// Network error
    NetworkError,
    /// Not authorized
    NotAuthorized,
    /// Already purchased
    AlreadyPurchased,
    /// Subscription expired
    SubscriptionExpired,
    /// Unknown error
    Unknown(String),
}

impl std::fmt::Display for PurchaseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PurchaseError::StoreNotAvailable => write!(f, "Store not available"),
            PurchaseError::ProductNotFound => write!(f, "Product not found"),
            PurchaseError::PurchaseFailed(e) => write!(f, "Purchase failed: {}", e),
            PurchaseError::PaymentCancelled => write!(f, "Payment cancelled"),
            PurchaseError::PaymentPending => write!(f, "Payment pending"),
            PurchaseError::NetworkError => write!(f, "Network error"),
            PurchaseError::NotAuthorized => write!(f, "Not authorized"),
            PurchaseError::AlreadyPurchased => write!(f, "Already purchased"),
            PurchaseError::SubscriptionExpired => write!(f, "Subscription expired"),
            PurchaseError::Unknown(e) => write!(f, "Unknown error: {}", e),
        }
    }
}

impl std::error::Error for PurchaseError {}
