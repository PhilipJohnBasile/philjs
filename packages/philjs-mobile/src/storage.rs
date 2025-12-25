//! PhilJS Mobile Storage
//!
//! Persistent storage solutions for mobile applications.

use serde::{de::DeserializeOwned, Serialize};
use std::path::PathBuf;

// ============================================================================
// Secure Storage (Keychain/Keystore)
// ============================================================================

/// Secure storage using iOS Keychain or Android Keystore
pub struct SecureStorage {
    service_name: String,
}

impl SecureStorage {
    pub fn new(service_name: impl Into<String>) -> Self {
        SecureStorage {
            service_name: service_name.into(),
        }
    }

    /// Store a string value securely
    pub fn set(&self, key: &str, value: &str) -> Result<(), StorageError> {
        #[cfg(target_os = "ios")]
        {
            self.set_ios_keychain(key, value)
        }
        #[cfg(target_os = "android")]
        {
            self.set_android_keystore(key, value)
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            // Simulation - in-memory storage
            Ok(())
        }
    }

    /// Retrieve a string value
    pub fn get(&self, key: &str) -> Result<Option<String>, StorageError> {
        #[cfg(target_os = "ios")]
        {
            self.get_ios_keychain(key)
        }
        #[cfg(target_os = "android")]
        {
            self.get_android_keystore(key)
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Ok(None)
        }
    }

    /// Delete a value
    pub fn delete(&self, key: &str) -> Result<(), StorageError> {
        #[cfg(target_os = "ios")]
        {
            self.delete_ios_keychain(key)
        }
        #[cfg(target_os = "android")]
        {
            self.delete_android_keystore(key)
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Ok(())
        }
    }

    /// Store data with biometric protection
    pub fn set_with_biometrics(&self, key: &str, value: &str) -> Result<(), StorageError> {
        // Would use LAContext on iOS, BiometricPrompt on Android
        self.set(key, value)
    }

    /// Retrieve data requiring biometric authentication
    pub fn get_with_biometrics(&self, key: &str) -> Result<Option<String>, StorageError> {
        // Would prompt for biometric auth first
        self.get(key)
    }

    #[cfg(target_os = "ios")]
    fn set_ios_keychain(&self, _key: &str, _value: &str) -> Result<(), StorageError> {
        // Would use Security framework
        Ok(())
    }

    #[cfg(target_os = "ios")]
    fn get_ios_keychain(&self, _key: &str) -> Result<Option<String>, StorageError> {
        Ok(None)
    }

    #[cfg(target_os = "ios")]
    fn delete_ios_keychain(&self, _key: &str) -> Result<(), StorageError> {
        Ok(())
    }

    #[cfg(target_os = "android")]
    fn set_android_keystore(&self, _key: &str, _value: &str) -> Result<(), StorageError> {
        // Would use Android Keystore
        Ok(())
    }

    #[cfg(target_os = "android")]
    fn get_android_keystore(&self, _key: &str) -> Result<Option<String>, StorageError> {
        Ok(None)
    }

    #[cfg(target_os = "android")]
    fn delete_android_keystore(&self, _key: &str) -> Result<(), StorageError> {
        Ok(())
    }
}

// ============================================================================
// Async Storage (UserDefaults/SharedPreferences)
// ============================================================================

/// Key-value storage for non-sensitive data
pub struct AsyncStorage {
    suite_name: Option<String>,
}

impl AsyncStorage {
    /// Default storage
    pub fn standard() -> Self {
        AsyncStorage { suite_name: None }
    }

    /// App group storage (for sharing with extensions)
    pub fn group(suite_name: impl Into<String>) -> Self {
        AsyncStorage {
            suite_name: Some(suite_name.into()),
        }
    }

    /// Store a serializable value
    pub fn set<T: Serialize>(&self, key: &str, value: &T) -> Result<(), StorageError> {
        let json = serde_json::to_string(value)
            .map_err(|e| StorageError::SerializationError(e.to_string()))?;
        self.set_string(key, &json)
    }

    /// Retrieve a deserializable value
    pub fn get<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>, StorageError> {
        match self.get_string(key)? {
            Some(json) => {
                let value = serde_json::from_str(&json)
                    .map_err(|e| StorageError::DeserializationError(e.to_string()))?;
                Ok(Some(value))
            }
            None => Ok(None),
        }
    }

    /// Store a string value
    pub fn set_string(&self, key: &str, value: &str) -> Result<(), StorageError> {
        #[cfg(target_os = "ios")]
        {
            self.set_user_defaults(key, value)
        }
        #[cfg(target_os = "android")]
        {
            self.set_shared_prefs(key, value)
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            let _ = (key, value);
            Ok(())
        }
    }

    /// Retrieve a string value
    pub fn get_string(&self, key: &str) -> Result<Option<String>, StorageError> {
        #[cfg(target_os = "ios")]
        {
            self.get_user_defaults(key)
        }
        #[cfg(target_os = "android")]
        {
            self.get_shared_prefs(key)
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            let _ = key;
            Ok(None)
        }
    }

    /// Delete a value
    pub fn remove(&self, key: &str) -> Result<(), StorageError> {
        #[cfg(target_os = "ios")]
        {
            self.remove_user_defaults(key)
        }
        #[cfg(target_os = "android")]
        {
            self.remove_shared_prefs(key)
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            let _ = key;
            Ok(())
        }
    }

    /// Clear all values
    pub fn clear(&self) -> Result<(), StorageError> {
        // Would clear all keys
        Ok(())
    }

    /// Get all keys
    pub fn all_keys(&self) -> Result<Vec<String>, StorageError> {
        Ok(Vec::new())
    }

    #[cfg(target_os = "ios")]
    fn set_user_defaults(&self, _key: &str, _value: &str) -> Result<(), StorageError> {
        Ok(())
    }

    #[cfg(target_os = "ios")]
    fn get_user_defaults(&self, _key: &str) -> Result<Option<String>, StorageError> {
        Ok(None)
    }

    #[cfg(target_os = "ios")]
    fn remove_user_defaults(&self, _key: &str) -> Result<(), StorageError> {
        Ok(())
    }

    #[cfg(target_os = "android")]
    fn set_shared_prefs(&self, _key: &str, _value: &str) -> Result<(), StorageError> {
        Ok(())
    }

    #[cfg(target_os = "android")]
    fn get_shared_prefs(&self, _key: &str) -> Result<Option<String>, StorageError> {
        Ok(None)
    }

    #[cfg(target_os = "android")]
    fn remove_shared_prefs(&self, _key: &str) -> Result<(), StorageError> {
        Ok(())
    }
}

// ============================================================================
// File System
// ============================================================================

/// File system access
pub struct FileSystem;

impl FileSystem {
    /// Documents directory (backed up by iCloud/Google)
    pub fn documents_dir() -> PathBuf {
        #[cfg(target_os = "ios")]
        {
            // Would use NSSearchPathForDirectoriesInDomains
            PathBuf::from("/var/mobile/Documents")
        }
        #[cfg(target_os = "android")]
        {
            // Would use Context.getFilesDir()
            PathBuf::from("/data/data/app/files")
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            std::env::temp_dir().join("philjs_documents")
        }
    }

    /// Caches directory (not backed up, may be cleared)
    pub fn caches_dir() -> PathBuf {
        #[cfg(target_os = "ios")]
        {
            PathBuf::from("/var/mobile/Library/Caches")
        }
        #[cfg(target_os = "android")]
        {
            PathBuf::from("/data/data/app/cache")
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            std::env::temp_dir().join("philjs_cache")
        }
    }

    /// Temporary directory
    pub fn temp_dir() -> PathBuf {
        std::env::temp_dir()
    }

    /// Bundle/assets directory (read-only)
    pub fn bundle_dir() -> PathBuf {
        #[cfg(target_os = "ios")]
        {
            PathBuf::from("/var/mobile/App.app")
        }
        #[cfg(target_os = "android")]
        {
            PathBuf::from("/assets")
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            std::env::current_dir().unwrap_or_default()
        }
    }

    /// Read a file as bytes
    pub fn read(path: &PathBuf) -> Result<Vec<u8>, StorageError> {
        std::fs::read(path).map_err(|e| StorageError::IoError(e.to_string()))
    }

    /// Read a file as string
    pub fn read_string(path: &PathBuf) -> Result<String, StorageError> {
        std::fs::read_to_string(path).map_err(|e| StorageError::IoError(e.to_string()))
    }

    /// Write bytes to a file
    pub fn write(path: &PathBuf, data: &[u8]) -> Result<(), StorageError> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| StorageError::IoError(e.to_string()))?;
        }
        std::fs::write(path, data).map_err(|e| StorageError::IoError(e.to_string()))
    }

    /// Write string to a file
    pub fn write_string(path: &PathBuf, content: &str) -> Result<(), StorageError> {
        Self::write(path, content.as_bytes())
    }

    /// Delete a file or directory
    pub fn delete(path: &PathBuf) -> Result<(), StorageError> {
        if path.is_dir() {
            std::fs::remove_dir_all(path)
        } else {
            std::fs::remove_file(path)
        }
        .map_err(|e| StorageError::IoError(e.to_string()))
    }

    /// Check if path exists
    pub fn exists(path: &PathBuf) -> bool {
        path.exists()
    }

    /// Create directory
    pub fn create_dir(path: &PathBuf) -> Result<(), StorageError> {
        std::fs::create_dir_all(path).map_err(|e| StorageError::IoError(e.to_string()))
    }

    /// List directory contents
    pub fn list_dir(path: &PathBuf) -> Result<Vec<PathBuf>, StorageError> {
        let mut entries = Vec::new();
        for entry in std::fs::read_dir(path).map_err(|e| StorageError::IoError(e.to_string()))? {
            let entry = entry.map_err(|e| StorageError::IoError(e.to_string()))?;
            entries.push(entry.path());
        }
        Ok(entries)
    }

    /// Get file size
    pub fn file_size(path: &PathBuf) -> Result<u64, StorageError> {
        let metadata = std::fs::metadata(path).map_err(|e| StorageError::IoError(e.to_string()))?;
        Ok(metadata.len())
    }
}

// ============================================================================
// Errors
// ============================================================================

#[derive(Debug, Clone)]
pub enum StorageError {
    NotFound,
    AccessDenied,
    IoError(String),
    SerializationError(String),
    DeserializationError(String),
    KeychainError(String),
    BiometricError(String),
}

impl std::fmt::Display for StorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StorageError::NotFound => write!(f, "Item not found"),
            StorageError::AccessDenied => write!(f, "Access denied"),
            StorageError::IoError(e) => write!(f, "IO error: {}", e),
            StorageError::SerializationError(e) => write!(f, "Serialization error: {}", e),
            StorageError::DeserializationError(e) => write!(f, "Deserialization error: {}", e),
            StorageError::KeychainError(e) => write!(f, "Keychain error: {}", e),
            StorageError::BiometricError(e) => write!(f, "Biometric error: {}", e),
        }
    }
}

impl std::error::Error for StorageError {}
