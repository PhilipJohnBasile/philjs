/**
 * Physical Constants
 *
 * Standard physical constants for scientific computing
 * Values from CODATA 2018
 */
// ============================================================================
// Universal Constants
// ============================================================================
/** Speed of light in vacuum (m/s) */
export const SPEED_OF_LIGHT = 299792458;
export const c = SPEED_OF_LIGHT;
/** Planck constant (J·s) */
export const PLANCK = 6.62607015e-34;
export const h = PLANCK;
/** Reduced Planck constant (J·s) */
export const HBAR = 1.054571817e-34;
export const ħ = HBAR;
/** Gravitational constant (m³/(kg·s²)) */
export const GRAVITATIONAL = 6.67430e-11;
export const G = GRAVITATIONAL;
/** Boltzmann constant (J/K) */
export const BOLTZMANN = 1.380649e-23;
export const k = BOLTZMANN;
// ============================================================================
// Electromagnetic Constants
// ============================================================================
/** Elementary charge (C) */
export const ELEMENTARY_CHARGE = 1.602176634e-19;
export const e = ELEMENTARY_CHARGE;
/** Vacuum permittivity (F/m) */
export const VACUUM_PERMITTIVITY = 8.8541878128e-12;
export const ε0 = VACUUM_PERMITTIVITY;
/** Vacuum permeability (H/m) */
export const VACUUM_PERMEABILITY = 1.25663706212e-6;
export const μ0 = VACUUM_PERMEABILITY;
/** Coulomb constant (N·m²/C²) */
export const COULOMB = 8.9875517923e9;
/** Fine-structure constant (dimensionless) */
export const FINE_STRUCTURE = 7.2973525693e-3;
export const α = FINE_STRUCTURE;
// ============================================================================
// Atomic and Nuclear Constants
// ============================================================================
/** Electron mass (kg) */
export const ELECTRON_MASS = 9.1093837015e-31;
export const m_e = ELECTRON_MASS;
/** Proton mass (kg) */
export const PROTON_MASS = 1.67262192369e-27;
export const m_p = PROTON_MASS;
/** Neutron mass (kg) */
export const NEUTRON_MASS = 1.67492749804e-27;
export const m_n = NEUTRON_MASS;
/** Atomic mass unit (kg) */
export const ATOMIC_MASS_UNIT = 1.66053906660e-27;
export const u = ATOMIC_MASS_UNIT;
/** Bohr radius (m) */
export const BOHR_RADIUS = 5.29177210903e-11;
export const a0 = BOHR_RADIUS;
/** Rydberg constant (1/m) */
export const RYDBERG = 10973731.568160;
export const R_INF = RYDBERG;
/** Avogadro constant (1/mol) */
export const AVOGADRO = 6.02214076e23;
export const N_A = AVOGADRO;
/** Faraday constant (C/mol) */
export const FARADAY = 96485.33212;
export const F = FARADAY;
// ============================================================================
// Thermodynamic Constants
// ============================================================================
/** Molar gas constant (J/(mol·K)) */
export const GAS_CONSTANT = 8.314462618;
export const R = GAS_CONSTANT;
/** Stefan-Boltzmann constant (W/(m²·K⁴)) */
export const STEFAN_BOLTZMANN = 5.670374419e-8;
export const σ = STEFAN_BOLTZMANN;
/** Standard atmosphere (Pa) */
export const STANDARD_ATMOSPHERE = 101325;
export const atm = STANDARD_ATMOSPHERE;
/** Standard gravity (m/s²) */
export const STANDARD_GRAVITY = 9.80665;
export const g = STANDARD_GRAVITY;
// ============================================================================
// Mathematical Constants
// ============================================================================
/** Pi */
export const PI = Math.PI;
export const π = PI;
/** Euler's number */
export const E = Math.E;
/** Golden ratio */
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
export const φ = GOLDEN_RATIO;
/** Euler-Mascheroni constant */
export const EULER_MASCHERONI = 0.5772156649015329;
export const γ = EULER_MASCHERONI;
// ============================================================================
// Astronomical Constants
// ============================================================================
/** Astronomical unit (m) */
export const ASTRONOMICAL_UNIT = 1.495978707e11;
export const AU = ASTRONOMICAL_UNIT;
/** Light year (m) */
export const LIGHT_YEAR = 9.4607304725808e15;
export const ly = LIGHT_YEAR;
/** Parsec (m) */
export const PARSEC = 3.0856775814913673e16;
export const pc = PARSEC;
/** Solar mass (kg) */
export const SOLAR_MASS = 1.98892e30;
export const M_SUN = SOLAR_MASS;
/** Solar radius (m) */
export const SOLAR_RADIUS = 6.9634e8;
export const R_SUN = SOLAR_RADIUS;
/** Solar luminosity (W) */
export const SOLAR_LUMINOSITY = 3.828e26;
export const L_SUN = SOLAR_LUMINOSITY;
/** Earth mass (kg) */
export const EARTH_MASS = 5.97217e24;
export const M_EARTH = EARTH_MASS;
/** Earth radius (m) - mean */
export const EARTH_RADIUS = 6.371e6;
export const R_EARTH = EARTH_RADIUS;
// ============================================================================
// Unit Conversion Factors
// ============================================================================
export const UNITS = {
    // Length
    meter: 1,
    kilometer: 1000,
    centimeter: 0.01,
    millimeter: 0.001,
    micrometer: 1e-6,
    nanometer: 1e-9,
    angstrom: 1e-10,
    inch: 0.0254,
    foot: 0.3048,
    yard: 0.9144,
    mile: 1609.344,
    nauticalMile: 1852,
    // Mass
    kilogram: 1,
    gram: 0.001,
    milligram: 1e-6,
    microgram: 1e-9,
    tonne: 1000,
    pound: 0.45359237,
    ounce: 0.028349523125,
    // Time
    second: 1,
    millisecond: 0.001,
    microsecond: 1e-6,
    nanosecond: 1e-9,
    minute: 60,
    hour: 3600,
    day: 86400,
    year: 31557600, // Julian year
    // Energy
    joule: 1,
    electronVolt: 1.602176634e-19,
    calorie: 4.184,
    kilocalorie: 4184,
    btu: 1055.06,
    // Pressure
    pascal: 1,
    bar: 100000,
    atmosphere: 101325,
    torr: 133.322,
    psi: 6894.76,
    // Temperature conversions (relative)
    kelvin: 1,
    celsius: 1, // Same magnitude
    fahrenheit: 5 / 9, // Relative to Celsius magnitude
};
/**
 * Convert between units
 */
export function convert(value, fromUnit, toUnit) {
    const fromFactor = UNITS[fromUnit];
    const toFactor = UNITS[toUnit];
    return (value * fromFactor) / toFactor;
}
/**
 * Temperature conversion utilities
 */
export const Temperature = {
    celsiusToKelvin: (c) => c + 273.15,
    kelvinToCelsius: (k) => k - 273.15,
    celsiusToFahrenheit: (c) => (c * 9) / 5 + 32,
    fahrenheitToCelsius: (f) => ((f - 32) * 5) / 9,
    kelvinToFahrenheit: (k) => ((k - 273.15) * 9) / 5 + 32,
    fahrenheitToKelvin: (f) => ((f - 32) * 5) / 9 + 273.15,
};
/**
 * Physical formulas
 */
export const Formulas = {
    /** Kinetic energy: E = ½mv² */
    kineticEnergy: (mass, velocity) => 0.5 * mass * velocity ** 2,
    /** Gravitational potential energy: U = -GMm/r */
    gravitationalPotential: (M, m, r) => -G * M * m / r,
    /** Escape velocity: v = √(2GM/r) */
    escapeVelocity: (M, r) => Math.sqrt((2 * G * M) / r),
    /** Schwarzschild radius: r_s = 2GM/c² */
    schwarzschildRadius: (M) => (2 * G * M) / c ** 2,
    /** De Broglie wavelength: λ = h/p */
    deBroglieWavelength: (momentum) => h / momentum,
    /** Photon energy: E = hν */
    photonEnergy: (frequency) => h * frequency,
    /** Ideal gas law: PV = nRT */
    idealGasPressure: (n, T, V) => (n * R * T) / V,
    /** Orbital period: T = 2π√(a³/GM) */
    orbitalPeriod: (semiMajorAxis, centralMass) => 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / (G * centralMass)),
    /** Lorentz factor: γ = 1/√(1 - v²/c²) */
    lorentzFactor: (velocity) => 1 / Math.sqrt(1 - (velocity / c) ** 2),
    /** Time dilation: Δt' = γΔt */
    timeDilation: (properTime, velocity) => Formulas.lorentzFactor(velocity) * properTime,
    /** Length contraction: L' = L/γ */
    lengthContraction: (properLength, velocity) => properLength / Formulas.lorentzFactor(velocity),
};
//# sourceMappingURL=constants.js.map