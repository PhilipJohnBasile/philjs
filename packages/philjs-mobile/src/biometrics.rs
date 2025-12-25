//! PhilJS Mobile Biometrics
//!
//! Face ID, Touch ID, and Android biometric authentication.

/// Biometric authentication type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BiometricType {
    /// No biometrics available
    None,
    /// Touch ID / Fingerprint
    TouchID,
    /// Face ID / Face recognition
    FaceID,
    /// Iris scanner
    Iris,
}

/// Biometric authentication status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BiometricStatus {
    /// Biometrics available and enrolled
    Available,
    /// No biometric hardware
    NotAvailable,
    /// Biometrics not enrolled
    NotEnrolled,
    /// Biometrics locked out (too many failed attempts)
    LockedOut,
}

/// Check what biometric type is available
pub fn available_biometric_type() -> BiometricType {
    #[cfg(target_os = "ios")]
    {
        // Would use LAContext.biometryType
        BiometricType::FaceID
    }
    #[cfg(target_os = "android")]
    {
        // Would use BiometricManager.canAuthenticate
        BiometricType::TouchID
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        BiometricType::None
    }
}

/// Check biometric availability status
pub fn biometric_status() -> BiometricStatus {
    #[cfg(target_os = "ios")]
    {
        // Would use LAContext.canEvaluatePolicy
        BiometricStatus::Available
    }
    #[cfg(target_os = "android")]
    {
        // Would use BiometricManager.canAuthenticate
        BiometricStatus::Available
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        BiometricStatus::NotAvailable
    }
}

/// Biometric authentication request
#[derive(Debug, Clone)]
pub struct BiometricAuth {
    /// Reason shown to user (required on iOS)
    pub reason: String,
    /// Title for the dialog (Android)
    pub title: Option<String>,
    /// Subtitle (Android)
    pub subtitle: Option<String>,
    /// Negative button text (Android)
    pub cancel_title: Option<String>,
    /// Allow device passcode as fallback
    pub allow_device_credential: bool,
    /// Confirmation required (Android)
    pub confirmation_required: bool,
}

impl BiometricAuth {
    pub fn new(reason: impl Into<String>) -> Self {
        BiometricAuth {
            reason: reason.into(),
            title: None,
            subtitle: None,
            cancel_title: None,
            allow_device_credential: true,
            confirmation_required: true,
        }
    }

    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn subtitle(mut self, subtitle: impl Into<String>) -> Self {
        self.subtitle = Some(subtitle.into());
        self
    }

    pub fn cancel_title(mut self, title: impl Into<String>) -> Self {
        self.cancel_title = Some(title.into());
        self
    }

    pub fn allow_device_credential(mut self, allow: bool) -> Self {
        self.allow_device_credential = allow;
        self
    }

    pub fn confirmation_required(mut self, required: bool) -> Self {
        self.confirmation_required = required;
        self
    }

    /// Perform biometric authentication
    pub async fn authenticate(&self) -> Result<(), BiometricError> {
        authenticate(self.clone()).await
    }
}

/// Authenticate using biometrics
pub async fn authenticate(auth: BiometricAuth) -> Result<(), BiometricError> {
    #[cfg(target_os = "ios")]
    {
        authenticate_ios(auth).await
    }
    #[cfg(target_os = "android")]
    {
        authenticate_android(auth).await
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = auth;
        Err(BiometricError::NotAvailable)
    }
}

#[cfg(target_os = "ios")]
async fn authenticate_ios(auth: BiometricAuth) -> Result<(), BiometricError> {
    // Would use LAContext.evaluatePolicy
    // let context = LAContext()
    // var error: NSError?
    // if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
    //     context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
    //                            localizedReason: auth.reason) { success, error in
    //         ...
    //     }
    // }
    let _ = auth;
    Ok(())
}

#[cfg(target_os = "android")]
async fn authenticate_android(auth: BiometricAuth) -> Result<(), BiometricError> {
    // Would use BiometricPrompt
    // val promptInfo = BiometricPrompt.PromptInfo.Builder()
    //     .setTitle(auth.title)
    //     .setSubtitle(auth.subtitle)
    //     .setNegativeButtonText(auth.cancel_title)
    //     .setAllowedAuthenticators(BIOMETRIC_STRONG)
    //     .build()
    // biometricPrompt.authenticate(promptInfo)
    let _ = auth;
    Ok(())
}

/// Check if device has passcode/PIN set
pub fn is_device_secure() -> bool {
    #[cfg(target_os = "ios")]
    {
        // Would use LAContext.canEvaluatePolicy(.deviceOwnerAuthentication)
        true
    }
    #[cfg(target_os = "android")]
    {
        // Would use KeyguardManager.isDeviceSecure
        true
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        false
    }
}

/// Authenticate with device passcode/PIN
pub async fn authenticate_with_passcode(reason: &str) -> Result<(), BiometricError> {
    let auth = BiometricAuth::new(reason)
        .allow_device_credential(true);
    authenticate(auth).await
}

/// Biometric error types
#[derive(Debug, Clone)]
pub enum BiometricError {
    /// Biometrics not available
    NotAvailable,
    /// Biometrics not enrolled
    NotEnrolled,
    /// Authentication failed
    AuthenticationFailed,
    /// User cancelled
    UserCancelled,
    /// User chose fallback (passcode)
    UserFallback,
    /// Biometrics locked out
    LockedOut,
    /// System cancelled (e.g., another app came to foreground)
    SystemCancelled,
    /// Passcode not set
    PasscodeNotSet,
    /// Biometrics invalidated (e.g., new fingerprint enrolled)
    Invalidated,
    /// Unknown error
    Unknown(String),
}

impl std::fmt::Display for BiometricError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BiometricError::NotAvailable => write!(f, "Biometrics not available"),
            BiometricError::NotEnrolled => write!(f, "Biometrics not enrolled"),
            BiometricError::AuthenticationFailed => write!(f, "Authentication failed"),
            BiometricError::UserCancelled => write!(f, "User cancelled"),
            BiometricError::UserFallback => write!(f, "User chose fallback"),
            BiometricError::LockedOut => write!(f, "Biometrics locked out"),
            BiometricError::SystemCancelled => write!(f, "System cancelled"),
            BiometricError::PasscodeNotSet => write!(f, "Passcode not set"),
            BiometricError::Invalidated => write!(f, "Biometrics invalidated"),
            BiometricError::Unknown(e) => write!(f, "Unknown error: {}", e),
        }
    }
}

impl std::error::Error for BiometricError {}
