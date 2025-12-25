//! PhilJS Mobile Sensors
//!
//! Device sensor access (accelerometer, gyroscope, etc.)

use std::sync::Arc;

/// 3D vector for sensor data
#[derive(Debug, Clone, Copy, Default)]
pub struct Vector3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Vector3 {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Vector3 { x, y, z }
    }

    pub fn magnitude(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2) + self.z.powi(2)).sqrt()
    }

    pub fn normalized(&self) -> Self {
        let mag = self.magnitude();
        if mag > 0.0 {
            Vector3 {
                x: self.x / mag,
                y: self.y / mag,
                z: self.z / mag,
            }
        } else {
            *self
        }
    }
}

/// Accelerometer data
#[derive(Debug, Clone, Copy)]
pub struct AccelerometerData {
    /// Acceleration in g-forces
    pub acceleration: Vector3,
    /// Timestamp
    pub timestamp: f64,
}

/// Gyroscope data
#[derive(Debug, Clone, Copy)]
pub struct GyroscopeData {
    /// Rotation rate in radians/second
    pub rotation_rate: Vector3,
    /// Timestamp
    pub timestamp: f64,
}

/// Magnetometer data
#[derive(Debug, Clone, Copy)]
pub struct MagnetometerData {
    /// Magnetic field in microteslas
    pub magnetic_field: Vector3,
    /// Timestamp
    pub timestamp: f64,
}

/// Device motion (fused sensor data)
#[derive(Debug, Clone, Copy)]
pub struct DeviceMotion {
    /// Attitude (rotation from reference frame)
    pub attitude: Attitude,
    /// Rotation rate
    pub rotation_rate: Vector3,
    /// Gravity vector
    pub gravity: Vector3,
    /// User acceleration (excluding gravity)
    pub user_acceleration: Vector3,
    /// Magnetic field
    pub magnetic_field: Option<Vector3>,
    /// Heading
    pub heading: f64,
    /// Timestamp
    pub timestamp: f64,
}

/// Device attitude/orientation
#[derive(Debug, Clone, Copy)]
pub struct Attitude {
    /// Roll (rotation around x-axis)
    pub roll: f64,
    /// Pitch (rotation around y-axis)
    pub pitch: f64,
    /// Yaw (rotation around z-axis)
    pub yaw: f64,
    /// Quaternion representation
    pub quaternion: Quaternion,
}

#[derive(Debug, Clone, Copy)]
pub struct Quaternion {
    pub w: f64,
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

/// Sensor update interval
#[derive(Debug, Clone, Copy)]
pub enum SensorInterval {
    /// Fastest possible (may drain battery)
    Fastest,
    /// Game-level updates (~60Hz)
    Game,
    /// UI-level updates (~30Hz)
    UI,
    /// Normal updates (~10Hz)
    Normal,
    /// Custom interval
    Custom(std::time::Duration),
}

impl SensorInterval {
    pub fn as_duration(&self) -> std::time::Duration {
        match self {
            SensorInterval::Fastest => std::time::Duration::from_millis(1),
            SensorInterval::Game => std::time::Duration::from_millis(16),
            SensorInterval::UI => std::time::Duration::from_millis(33),
            SensorInterval::Normal => std::time::Duration::from_millis(100),
            SensorInterval::Custom(d) => *d,
        }
    }
}

/// Accelerometer sensor
pub struct Accelerometer {
    interval: SensorInterval,
    on_update: Option<Arc<dyn Fn(AccelerometerData) + Send + Sync>>,
}

impl Accelerometer {
    pub fn new() -> Self {
        Accelerometer {
            interval: SensorInterval::Normal,
            on_update: None,
        }
    }

    pub fn interval(mut self, interval: SensorInterval) -> Self {
        self.interval = interval;
        self
    }

    /// Check if accelerometer is available
    pub fn is_available() -> bool {
        #[cfg(target_os = "ios")]
        {
            // Would check CMMotionManager.isAccelerometerAvailable
            true
        }
        #[cfg(target_os = "android")]
        {
            // Would check SensorManager.getDefaultSensor
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }

    /// Start receiving updates
    pub fn start<F: Fn(AccelerometerData) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
        // Would start CMMotionManager.startAccelerometerUpdates on iOS
        // Would register SensorEventListener on Android
    }

    /// Stop receiving updates
    pub fn stop(&mut self) {
        self.on_update = None;
    }
}

impl Default for Accelerometer {
    fn default() -> Self {
        Self::new()
    }
}

/// Gyroscope sensor
pub struct Gyroscope {
    interval: SensorInterval,
    on_update: Option<Arc<dyn Fn(GyroscopeData) + Send + Sync>>,
}

impl Gyroscope {
    pub fn new() -> Self {
        Gyroscope {
            interval: SensorInterval::Normal,
            on_update: None,
        }
    }

    pub fn interval(mut self, interval: SensorInterval) -> Self {
        self.interval = interval;
        self
    }

    pub fn is_available() -> bool {
        #[cfg(target_os = "ios")]
        {
            true
        }
        #[cfg(target_os = "android")]
        {
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }

    pub fn start<F: Fn(GyroscopeData) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
    }

    pub fn stop(&mut self) {
        self.on_update = None;
    }
}

impl Default for Gyroscope {
    fn default() -> Self {
        Self::new()
    }
}

/// Magnetometer sensor
pub struct Magnetometer {
    interval: SensorInterval,
    on_update: Option<Arc<dyn Fn(MagnetometerData) + Send + Sync>>,
}

impl Magnetometer {
    pub fn new() -> Self {
        Magnetometer {
            interval: SensorInterval::Normal,
            on_update: None,
        }
    }

    pub fn interval(mut self, interval: SensorInterval) -> Self {
        self.interval = interval;
        self
    }

    pub fn is_available() -> bool {
        #[cfg(target_os = "ios")]
        {
            true
        }
        #[cfg(target_os = "android")]
        {
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }

    pub fn start<F: Fn(MagnetometerData) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
    }

    pub fn stop(&mut self) {
        self.on_update = None;
    }
}

impl Default for Magnetometer {
    fn default() -> Self {
        Self::new()
    }
}

/// Device motion (fused sensors)
pub struct MotionManager {
    interval: SensorInterval,
    on_update: Option<Arc<dyn Fn(DeviceMotion) + Send + Sync>>,
}

impl MotionManager {
    pub fn new() -> Self {
        MotionManager {
            interval: SensorInterval::Normal,
            on_update: None,
        }
    }

    pub fn interval(mut self, interval: SensorInterval) -> Self {
        self.interval = interval;
        self
    }

    pub fn is_available() -> bool {
        #[cfg(target_os = "ios")]
        {
            // Would check CMMotionManager.isDeviceMotionAvailable
            true
        }
        #[cfg(target_os = "android")]
        {
            // Would check for TYPE_GAME_ROTATION_VECTOR or similar
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }

    pub fn start<F: Fn(DeviceMotion) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
    }

    pub fn stop(&mut self) {
        self.on_update = None;
    }
}

impl Default for MotionManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Barometer (pressure sensor)
pub struct Barometer {
    on_update: Option<Arc<dyn Fn(BarometerData) + Send + Sync>>,
}

#[derive(Debug, Clone, Copy)]
pub struct BarometerData {
    /// Pressure in kilopascals
    pub pressure: f64,
    /// Relative altitude change in meters
    pub relative_altitude: f64,
    /// Timestamp
    pub timestamp: f64,
}

impl Barometer {
    pub fn new() -> Self {
        Barometer { on_update: None }
    }

    pub fn is_available() -> bool {
        #[cfg(target_os = "ios")]
        {
            // Would check CMAltimeter.isRelativeAltitudeAvailable
            true
        }
        #[cfg(target_os = "android")]
        {
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }

    pub fn start<F: Fn(BarometerData) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
    }

    pub fn stop(&mut self) {
        self.on_update = None;
    }
}

impl Default for Barometer {
    fn default() -> Self {
        Self::new()
    }
}

/// Pedometer (step counter)
pub struct Pedometer {
    on_update: Option<Arc<dyn Fn(PedometerData) + Send + Sync>>,
}

#[derive(Debug, Clone)]
pub struct PedometerData {
    /// Number of steps
    pub steps: u64,
    /// Distance in meters
    pub distance: Option<f64>,
    /// Floors ascended
    pub floors_ascended: Option<u32>,
    /// Floors descended
    pub floors_descended: Option<u32>,
    /// Current pace (seconds per meter)
    pub current_pace: Option<f64>,
    /// Average active pace
    pub average_active_pace: Option<f64>,
    /// Current cadence (steps per second)
    pub current_cadence: Option<f64>,
}

impl Pedometer {
    pub fn new() -> Self {
        Pedometer { on_update: None }
    }

    pub fn is_available() -> bool {
        #[cfg(target_os = "ios")]
        {
            // Would check CMPedometer.isStepCountingAvailable
            true
        }
        #[cfg(target_os = "android")]
        {
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }

    pub fn start<F: Fn(PedometerData) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
    }

    pub fn stop(&mut self) {
        self.on_update = None;
    }

    /// Query historical step data
    pub async fn query_steps(
        from: std::time::SystemTime,
        to: std::time::SystemTime,
    ) -> Result<PedometerData, SensorError> {
        let _ = (from, to);
        Err(SensorError::NotAvailable)
    }
}

impl Default for Pedometer {
    fn default() -> Self {
        Self::new()
    }
}

/// Proximity sensor
pub struct ProximitySensor {
    on_update: Option<Arc<dyn Fn(bool) + Send + Sync>>,
}

impl ProximitySensor {
    pub fn new() -> Self {
        ProximitySensor { on_update: None }
    }

    /// Start monitoring proximity (true = something close)
    pub fn start<F: Fn(bool) + Send + Sync + 'static>(&mut self, callback: F) {
        self.on_update = Some(Arc::new(callback));
    }

    pub fn stop(&mut self) {
        self.on_update = None;
    }
}

impl Default for ProximitySensor {
    fn default() -> Self {
        Self::new()
    }
}

/// Sensor error types
#[derive(Debug, Clone)]
pub enum SensorError {
    NotAvailable,
    PermissionDenied,
    Unknown(String),
}

impl std::fmt::Display for SensorError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SensorError::NotAvailable => write!(f, "Sensor not available"),
            SensorError::PermissionDenied => write!(f, "Sensor permission denied"),
            SensorError::Unknown(e) => write!(f, "Sensor error: {}", e),
        }
    }
}

impl std::error::Error for SensorError {}
