//! PhilJS Mobile Share
//!
//! Native sharing and app links.

use std::path::PathBuf;

/// Content to share
#[derive(Debug, Clone)]
pub struct ShareContent {
    /// Text to share
    pub text: Option<String>,
    /// URL to share
    pub url: Option<String>,
    /// Title (for previews)
    pub title: Option<String>,
    /// Images to share
    pub images: Vec<ShareImage>,
    /// Files to share
    pub files: Vec<PathBuf>,
    /// Subject line (for email)
    pub subject: Option<String>,
}

impl ShareContent {
    pub fn new() -> Self {
        ShareContent {
            text: None,
            url: None,
            title: None,
            images: Vec::new(),
            files: Vec::new(),
            subject: None,
        }
    }

    pub fn text(mut self, text: impl Into<String>) -> Self {
        self.text = Some(text.into());
        self
    }

    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = Some(url.into());
        self
    }

    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn subject(mut self, subject: impl Into<String>) -> Self {
        self.subject = Some(subject.into());
        self
    }

    pub fn image(mut self, image: ShareImage) -> Self {
        self.images.push(image);
        self
    }

    pub fn file(mut self, path: PathBuf) -> Self {
        self.files.push(path);
        self
    }

    /// Share this content
    pub async fn share(&self) -> Result<ShareResult, ShareError> {
        share(self.clone()).await
    }
}

impl Default for ShareContent {
    fn default() -> Self {
        Self::new()
    }
}

/// Image to share
#[derive(Debug, Clone)]
pub enum ShareImage {
    /// File path
    Path(PathBuf),
    /// Raw image data
    Data(Vec<u8>),
    /// URL to image
    Url(String),
}

/// Result of share action
#[derive(Debug, Clone)]
pub struct ShareResult {
    /// Whether the share was completed
    pub completed: bool,
    /// The activity type used (e.g., "com.apple.UIKit.activity.CopyToPasteboard")
    pub activity_type: Option<String>,
}

/// Share content using system share sheet
pub async fn share(content: ShareContent) -> Result<ShareResult, ShareError> {
    #[cfg(target_os = "ios")]
    {
        share_ios(content).await
    }
    #[cfg(target_os = "android")]
    {
        share_android(content).await
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = content;
        Err(ShareError::NotAvailable)
    }
}

#[cfg(target_os = "ios")]
async fn share_ios(content: ShareContent) -> Result<ShareResult, ShareError> {
    // Would use UIActivityViewController
    let _ = content;
    Ok(ShareResult {
        completed: true,
        activity_type: None,
    })
}

#[cfg(target_os = "android")]
async fn share_android(content: ShareContent) -> Result<ShareResult, ShareError> {
    // Would use Intent.ACTION_SEND
    let _ = content;
    Ok(ShareResult {
        completed: true,
        activity_type: None,
    })
}

/// Open a URL (web or app URL scheme)
pub fn open_url(url: &str) -> Result<(), ShareError> {
    #[cfg(target_os = "ios")]
    {
        // Would use UIApplication.open
        let _ = url;
        Ok(())
    }
    #[cfg(target_os = "android")]
    {
        // Would use Intent.ACTION_VIEW
        let _ = url;
        Ok(())
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = url;
        Err(ShareError::NotAvailable)
    }
}

/// Check if a URL can be opened
pub fn can_open_url(url: &str) -> bool {
    #[cfg(target_os = "ios")]
    {
        // Would use UIApplication.canOpenURL
        let _ = url;
        true
    }
    #[cfg(target_os = "android")]
    {
        // Would check if Intent can be resolved
        let _ = url;
        true
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = url;
        false
    }
}

/// Open app settings
pub fn open_settings() -> Result<(), ShareError> {
    #[cfg(target_os = "ios")]
    {
        // Would use UIApplication.openSettingsURLString
        Ok(())
    }
    #[cfg(target_os = "android")]
    {
        // Would use Settings.ACTION_APPLICATION_DETAILS_SETTINGS
        Ok(())
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        Err(ShareError::NotAvailable)
    }
}

/// Send email
pub async fn send_email(email: Email) -> Result<(), ShareError> {
    #[cfg(target_os = "ios")]
    {
        // Would use MFMailComposeViewController or mailto URL
        let _ = email;
        Ok(())
    }
    #[cfg(target_os = "android")]
    {
        // Would use Intent.ACTION_SENDTO
        let _ = email;
        Ok(())
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = email;
        Err(ShareError::NotAvailable)
    }
}

/// Email content
#[derive(Debug, Clone)]
pub struct Email {
    pub to: Vec<String>,
    pub cc: Vec<String>,
    pub bcc: Vec<String>,
    pub subject: Option<String>,
    pub body: Option<String>,
    pub is_html: bool,
    pub attachments: Vec<PathBuf>,
}

impl Email {
    pub fn new() -> Self {
        Email {
            to: Vec::new(),
            cc: Vec::new(),
            bcc: Vec::new(),
            subject: None,
            body: None,
            is_html: false,
            attachments: Vec::new(),
        }
    }

    pub fn to(mut self, recipient: impl Into<String>) -> Self {
        self.to.push(recipient.into());
        self
    }

    pub fn cc(mut self, recipient: impl Into<String>) -> Self {
        self.cc.push(recipient.into());
        self
    }

    pub fn bcc(mut self, recipient: impl Into<String>) -> Self {
        self.bcc.push(recipient.into());
        self
    }

    pub fn subject(mut self, subject: impl Into<String>) -> Self {
        self.subject = Some(subject.into());
        self
    }

    pub fn body(mut self, body: impl Into<String>) -> Self {
        self.body = Some(body.into());
        self
    }

    pub fn html_body(mut self, body: impl Into<String>) -> Self {
        self.body = Some(body.into());
        self.is_html = true;
        self
    }

    pub fn attachment(mut self, path: PathBuf) -> Self {
        self.attachments.push(path);
        self
    }
}

impl Default for Email {
    fn default() -> Self {
        Self::new()
    }
}

/// Send SMS
pub async fn send_sms(sms: Sms) -> Result<(), ShareError> {
    #[cfg(target_os = "ios")]
    {
        // Would use MFMessageComposeViewController
        let _ = sms;
        Ok(())
    }
    #[cfg(target_os = "android")]
    {
        // Would use Intent.ACTION_SENDTO with sms: URI
        let _ = sms;
        Ok(())
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = sms;
        Err(ShareError::NotAvailable)
    }
}

/// SMS content
#[derive(Debug, Clone)]
pub struct Sms {
    pub recipients: Vec<String>,
    pub body: Option<String>,
}

impl Sms {
    pub fn new() -> Self {
        Sms {
            recipients: Vec::new(),
            body: None,
        }
    }

    pub fn to(mut self, number: impl Into<String>) -> Self {
        self.recipients.push(number.into());
        self
    }

    pub fn body(mut self, body: impl Into<String>) -> Self {
        self.body = Some(body.into());
        self
    }
}

impl Default for Sms {
    fn default() -> Self {
        Self::new()
    }
}

/// Make phone call
pub fn call(number: &str) -> Result<(), ShareError> {
    #[cfg(target_os = "ios")]
    {
        // Would use tel: URL
        let _ = number;
        Ok(())
    }
    #[cfg(target_os = "android")]
    {
        // Would use Intent.ACTION_CALL
        let _ = number;
        Ok(())
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = number;
        Err(ShareError::NotAvailable)
    }
}

/// Copy text to clipboard
pub fn copy_to_clipboard(text: &str) -> Result<(), ShareError> {
    #[cfg(target_os = "ios")]
    {
        // Would use UIPasteboard.general.string
        let _ = text;
        Ok(())
    }
    #[cfg(target_os = "android")]
    {
        // Would use ClipboardManager
        let _ = text;
        Ok(())
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = text;
        Err(ShareError::NotAvailable)
    }
}

/// Read text from clipboard
pub fn read_from_clipboard() -> Result<Option<String>, ShareError> {
    #[cfg(target_os = "ios")]
    {
        // Would use UIPasteboard.general.string
        Ok(None)
    }
    #[cfg(target_os = "android")]
    {
        // Would use ClipboardManager
        Ok(None)
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        Err(ShareError::NotAvailable)
    }
}

/// Share error types
#[derive(Debug, Clone)]
pub enum ShareError {
    NotAvailable,
    Cancelled,
    Failed(String),
}

impl std::fmt::Display for ShareError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ShareError::NotAvailable => write!(f, "Share not available"),
            ShareError::Cancelled => write!(f, "Share cancelled"),
            ShareError::Failed(e) => write!(f, "Share failed: {}", e),
        }
    }
}

impl std::error::Error for ShareError {}
