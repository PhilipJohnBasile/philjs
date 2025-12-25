//! PhilJS Mobile Location
//!
//! Location services and geofencing.

use std::sync::Arc;

/// Geographic coordinate
#[derive(Debug, Clone, Copy, Default)]
pub struct Coordinate {
    /// Latitude in degrees
    pub latitude: f64,
    /// Longitude in degrees
    pub longitude: f64,
}

impl Coordinate {
    pub fn new(latitude: f64, longitude: f64) -> Self {
        Coordinate { latitude, longitude }
    }

    /// Distance to another coordinate in meters
    pub fn distance_to(&self, other: &Coordinate) -> f64 {
        const EARTH_RADIUS: f64 = 6371000.0; // meters

        let lat1 = self.latitude.to_radians();
        let lat2 = other.latitude.to_radians();
        let delta_lat = (other.latitude - self.latitude).to_radians();
        let delta_lon = (other.longitude - self.longitude).to_radians();

        let a = (delta_lat / 2.0).sin().powi(2)
            + lat1.cos() * lat2.cos() * (delta_lon / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());

        EARTH_RADIUS * c
    }
}

/// Location with additional data
#[derive(Debug, Clone)]
pub struct Location {
    /// Geographic coordinate
    pub coordinate: Coordinate,
    /// Altitude in meters
    pub altitude: Option<f64>,
    /// Horizontal accuracy in meters
    pub horizontal_accuracy: f64,
    /// Vertical accuracy in meters
    pub vertical_accuracy: Option<f64>,
    /// Speed in meters per second
    pub speed: Option<f64>,
    /// Course/heading in degrees (0-360)
    pub course: Option<f64>,
    /// Timestamp
    pub timestamp: std::time::SystemTime,
    /// Floor level (if available)
    pub floor: Option<i32>,
}

/// Location accuracy level
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LocationAccuracy {
    /// Best possible accuracy (GPS)
    Best,
    /// Navigation-level accuracy
    Navigation,
    /// 10 meter accuracy
    NearestTenMeters,
    /// 100 meter accuracy
    HundredMeters,
    /// Kilometer accuracy
    Kilometer,
    /// 3 kilometer accuracy (cell tower)
    ThreeKilometers,
}

/// Location manager
pub struct LocationManager {
    accuracy: LocationAccuracy,
    distance_filter: f64,
    listeners: Vec<Arc<dyn Fn(Location) + Send + Sync>>,
}

impl LocationManager {
    pub fn new() -> Self {
        LocationManager {
            accuracy: LocationAccuracy::Best,
            distance_filter: 0.0,
            listeners: Vec::new(),
        }
    }

    /// Set desired accuracy
    pub fn accuracy(mut self, accuracy: LocationAccuracy) -> Self {
        self.accuracy = accuracy;
        self
    }

    /// Set minimum distance (meters) before update
    pub fn distance_filter(mut self, meters: f64) -> Self {
        self.distance_filter = meters;
        self
    }

    /// Get current location once
    pub async fn get_current_location(&self) -> Result<Location, LocationError> {
        #[cfg(target_os = "ios")]
        {
            self.get_location_ios().await
        }
        #[cfg(target_os = "android")]
        {
            self.get_location_android().await
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Err(LocationError::NotAvailable)
        }
    }

    /// Start receiving location updates
    pub fn start_updates<F: Fn(Location) + Send + Sync + 'static>(&mut self, callback: F) {
        self.listeners.push(Arc::new(callback));

        #[cfg(target_os = "ios")]
        {
            // Would use CLLocationManager.startUpdatingLocation
        }
        #[cfg(target_os = "android")]
        {
            // Would use FusedLocationProviderClient.requestLocationUpdates
        }
    }

    /// Stop receiving location updates
    pub fn stop_updates(&mut self) {
        self.listeners.clear();

        #[cfg(target_os = "ios")]
        {
            // Would use CLLocationManager.stopUpdatingLocation
        }
        #[cfg(target_os = "android")]
        {
            // Would use FusedLocationProviderClient.removeLocationUpdates
        }
    }

    /// Check if location services are enabled
    pub fn is_enabled() -> bool {
        #[cfg(target_os = "ios")]
        {
            // Would check CLLocationManager.locationServicesEnabled
            true
        }
        #[cfg(target_os = "android")]
        {
            // Would check LocationManager.isLocationEnabled
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }

    #[cfg(target_os = "ios")]
    async fn get_location_ios(&self) -> Result<Location, LocationError> {
        // Would use CLLocationManager.requestLocation
        Err(LocationError::NotAvailable)
    }

    #[cfg(target_os = "android")]
    async fn get_location_android(&self) -> Result<Location, LocationError> {
        // Would use FusedLocationProviderClient.lastLocation
        Err(LocationError::NotAvailable)
    }
}

impl Default for LocationManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Geofence region
#[derive(Debug, Clone)]
pub struct GeofenceRegion {
    /// Unique identifier
    pub id: String,
    /// Center coordinate
    pub center: Coordinate,
    /// Radius in meters
    pub radius: f64,
    /// Notify on entry
    pub notify_on_entry: bool,
    /// Notify on exit
    pub notify_on_exit: bool,
}

impl GeofenceRegion {
    pub fn new(id: impl Into<String>, center: Coordinate, radius: f64) -> Self {
        GeofenceRegion {
            id: id.into(),
            center,
            radius,
            notify_on_entry: true,
            notify_on_exit: true,
        }
    }

    pub fn entry_only(mut self) -> Self {
        self.notify_on_exit = false;
        self
    }

    pub fn exit_only(mut self) -> Self {
        self.notify_on_entry = false;
        self
    }
}

/// Geofence event
#[derive(Debug, Clone)]
pub struct GeofenceEvent {
    pub region: GeofenceRegion,
    pub event_type: GeofenceEventType,
    pub timestamp: std::time::SystemTime,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GeofenceEventType {
    Enter,
    Exit,
    Dwell,
}

/// Geofence manager
pub struct GeofenceManager {
    regions: Vec<GeofenceRegion>,
    on_event: Option<Arc<dyn Fn(GeofenceEvent) + Send + Sync>>,
}

impl GeofenceManager {
    pub fn new() -> Self {
        GeofenceManager {
            regions: Vec::new(),
            on_event: None,
        }
    }

    /// Add a geofence region
    pub fn add_region(&mut self, region: GeofenceRegion) -> Result<(), LocationError> {
        self.regions.push(region);
        // Would register with platform
        Ok(())
    }

    /// Remove a geofence region
    pub fn remove_region(&mut self, id: &str) -> Result<(), LocationError> {
        self.regions.retain(|r| r.id != id);
        // Would unregister from platform
        Ok(())
    }

    /// Remove all regions
    pub fn remove_all_regions(&mut self) {
        self.regions.clear();
    }

    /// Set geofence event handler
    pub fn on_event<F: Fn(GeofenceEvent) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_event = Some(Arc::new(callback));
    }
}

impl Default for GeofenceManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Heading/compass information
#[derive(Debug, Clone, Copy)]
pub struct Heading {
    /// Magnetic heading (degrees from magnetic north)
    pub magnetic_heading: f64,
    /// True heading (degrees from true north)
    pub true_heading: f64,
    /// Heading accuracy (degrees)
    pub accuracy: f64,
    /// Raw x magnetometer value
    pub x: f64,
    /// Raw y magnetometer value
    pub y: f64,
    /// Raw z magnetometer value
    pub z: f64,
}

/// Heading manager
pub struct HeadingManager {
    on_update: Option<Arc<dyn Fn(Heading) + Send + Sync>>,
}

impl HeadingManager {
    pub fn new() -> Self {
        HeadingManager { on_update: None }
    }

    /// Start receiving heading updates
    pub fn start_updates<F: Fn(Heading) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
        // Would start CLLocationManager.startUpdatingHeading on iOS
    }

    /// Stop receiving heading updates
    pub fn stop_updates(&mut self) {
        self.on_update = None;
        // Would stop updates
    }

    /// Check if heading is available
    pub fn is_available() -> bool {
        #[cfg(target_os = "ios")]
        {
            // Would check CLLocationManager.headingAvailable
            true
        }
        #[cfg(not(target_os = "ios"))]
        {
            false
        }
    }
}

impl Default for HeadingManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Location error types
#[derive(Debug, Clone)]
pub enum LocationError {
    NotAvailable,
    PermissionDenied,
    Timeout,
    NetworkError,
    Unknown(String),
}

impl std::fmt::Display for LocationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LocationError::NotAvailable => write!(f, "Location services not available"),
            LocationError::PermissionDenied => write!(f, "Location permission denied"),
            LocationError::Timeout => write!(f, "Location request timed out"),
            LocationError::NetworkError => write!(f, "Network error"),
            LocationError::Unknown(e) => write!(f, "Unknown error: {}", e),
        }
    }
}

impl std::error::Error for LocationError {}

/// Geocoding services
pub struct Geocoder;

impl Geocoder {
    /// Convert coordinate to address
    pub async fn reverse_geocode(coordinate: Coordinate) -> Result<Address, LocationError> {
        // Would use CLGeocoder on iOS, Geocoder on Android
        let _ = coordinate;
        Err(LocationError::NotAvailable)
    }

    /// Convert address to coordinate
    pub async fn forward_geocode(address: &str) -> Result<Vec<Coordinate>, LocationError> {
        // Would use CLGeocoder on iOS, Geocoder on Android
        let _ = address;
        Err(LocationError::NotAvailable)
    }
}

/// Physical address
#[derive(Debug, Clone, Default)]
pub struct Address {
    pub street: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub country_code: Option<String>,
    pub formatted: Option<String>,
}
