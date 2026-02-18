/**
 * Physical Constants
 *
 * Standard physical constants for scientific computing
 * Values from CODATA 2018
 */
/** Speed of light in vacuum (m/s) */
export declare const SPEED_OF_LIGHT = 299792458;
export declare const c = 299792458;
/** Planck constant (J·s) */
export declare const PLANCK = 6.62607015e-34;
export declare const h = 6.62607015e-34;
/** Reduced Planck constant (J·s) */
export declare const HBAR = 1.054571817e-34;
export declare const ħ = 1.054571817e-34;
/** Gravitational constant (m³/(kg·s²)) */
export declare const GRAVITATIONAL = 6.6743e-11;
export declare const G = 6.6743e-11;
/** Boltzmann constant (J/K) */
export declare const BOLTZMANN = 1.380649e-23;
export declare const k = 1.380649e-23;
/** Elementary charge (C) */
export declare const ELEMENTARY_CHARGE = 1.602176634e-19;
export declare const e = 1.602176634e-19;
/** Vacuum permittivity (F/m) */
export declare const VACUUM_PERMITTIVITY = 8.8541878128e-12;
export declare const ε0 = 8.8541878128e-12;
/** Vacuum permeability (H/m) */
export declare const VACUUM_PERMEABILITY = 0.00000125663706212;
export declare const μ0 = 0.00000125663706212;
/** Coulomb constant (N·m²/C²) */
export declare const COULOMB = 8987551792.3;
/** Fine-structure constant (dimensionless) */
export declare const FINE_STRUCTURE = 0.0072973525693;
export declare const α = 0.0072973525693;
/** Electron mass (kg) */
export declare const ELECTRON_MASS = 9.1093837015e-31;
export declare const m_e = 9.1093837015e-31;
/** Proton mass (kg) */
export declare const PROTON_MASS = 1.67262192369e-27;
export declare const m_p = 1.67262192369e-27;
/** Neutron mass (kg) */
export declare const NEUTRON_MASS = 1.67492749804e-27;
export declare const m_n = 1.67492749804e-27;
/** Atomic mass unit (kg) */
export declare const ATOMIC_MASS_UNIT = 1.6605390666e-27;
export declare const u = 1.6605390666e-27;
/** Bohr radius (m) */
export declare const BOHR_RADIUS = 5.29177210903e-11;
export declare const a0 = 5.29177210903e-11;
/** Rydberg constant (1/m) */
export declare const RYDBERG = 10973731.56816;
export declare const R_INF = 10973731.56816;
/** Avogadro constant (1/mol) */
export declare const AVOGADRO = 6.02214076e+23;
export declare const N_A = 6.02214076e+23;
/** Faraday constant (C/mol) */
export declare const FARADAY = 96485.33212;
export declare const F = 96485.33212;
/** Molar gas constant (J/(mol·K)) */
export declare const GAS_CONSTANT = 8.314462618;
export declare const R = 8.314462618;
/** Stefan-Boltzmann constant (W/(m²·K⁴)) */
export declare const STEFAN_BOLTZMANN = 5.670374419e-8;
export declare const σ = 5.670374419e-8;
/** Standard atmosphere (Pa) */
export declare const STANDARD_ATMOSPHERE = 101325;
export declare const atm = 101325;
/** Standard gravity (m/s²) */
export declare const STANDARD_GRAVITY = 9.80665;
export declare const g = 9.80665;
/** Pi */
export declare const PI: number;
export declare const π: number;
/** Euler's number */
export declare const E: number;
/** Golden ratio */
export declare const GOLDEN_RATIO: number;
export declare const φ: number;
/** Euler-Mascheroni constant */
export declare const EULER_MASCHERONI = 0.5772156649015329;
export declare const γ = 0.5772156649015329;
/** Astronomical unit (m) */
export declare const ASTRONOMICAL_UNIT = 149597870700;
export declare const AU = 149597870700;
/** Light year (m) */
export declare const LIGHT_YEAR = 9460730472580800;
export declare const ly = 9460730472580800;
/** Parsec (m) */
export declare const PARSEC = 30856775814913670;
export declare const pc = 30856775814913670;
/** Solar mass (kg) */
export declare const SOLAR_MASS = 1.98892e+30;
export declare const M_SUN = 1.98892e+30;
/** Solar radius (m) */
export declare const SOLAR_RADIUS = 696340000;
export declare const R_SUN = 696340000;
/** Solar luminosity (W) */
export declare const SOLAR_LUMINOSITY = 3.828e+26;
export declare const L_SUN = 3.828e+26;
/** Earth mass (kg) */
export declare const EARTH_MASS = 5.97217e+24;
export declare const M_EARTH = 5.97217e+24;
/** Earth radius (m) - mean */
export declare const EARTH_RADIUS = 6371000;
export declare const R_EARTH = 6371000;
export declare const UNITS: {
    meter: number;
    kilometer: number;
    centimeter: number;
    millimeter: number;
    micrometer: number;
    nanometer: number;
    angstrom: number;
    inch: number;
    foot: number;
    yard: number;
    mile: number;
    nauticalMile: number;
    kilogram: number;
    gram: number;
    milligram: number;
    microgram: number;
    tonne: number;
    pound: number;
    ounce: number;
    second: number;
    millisecond: number;
    microsecond: number;
    nanosecond: number;
    minute: number;
    hour: number;
    day: number;
    year: number;
    joule: number;
    electronVolt: number;
    calorie: number;
    kilocalorie: number;
    btu: number;
    pascal: number;
    bar: number;
    atmosphere: number;
    torr: number;
    psi: number;
    kelvin: number;
    celsius: number;
    fahrenheit: number;
};
/**
 * Convert between units
 */
export declare function convert(value: number, fromUnit: keyof typeof UNITS, toUnit: keyof typeof UNITS): number;
/**
 * Temperature conversion utilities
 */
export declare const Temperature: {
    celsiusToKelvin: (c: number) => number;
    kelvinToCelsius: (k: number) => number;
    celsiusToFahrenheit: (c: number) => number;
    fahrenheitToCelsius: (f: number) => number;
    kelvinToFahrenheit: (k: number) => number;
    fahrenheitToKelvin: (f: number) => number;
};
/**
 * Physical formulas
 */
export declare const Formulas: {
    /** Kinetic energy: E = ½mv² */
    kineticEnergy: (mass: number, velocity: number) => number;
    /** Gravitational potential energy: U = -GMm/r */
    gravitationalPotential: (M: number, m: number, r: number) => number;
    /** Escape velocity: v = √(2GM/r) */
    escapeVelocity: (M: number, r: number) => number;
    /** Schwarzschild radius: r_s = 2GM/c² */
    schwarzschildRadius: (M: number) => number;
    /** De Broglie wavelength: λ = h/p */
    deBroglieWavelength: (momentum: number) => number;
    /** Photon energy: E = hν */
    photonEnergy: (frequency: number) => number;
    /** Ideal gas law: PV = nRT */
    idealGasPressure: (n: number, T: number, V: number) => number;
    /** Orbital period: T = 2π√(a³/GM) */
    orbitalPeriod: (semiMajorAxis: number, centralMass: number) => number;
    /** Lorentz factor: γ = 1/√(1 - v²/c²) */
    lorentzFactor: (velocity: number) => number;
    /** Time dilation: Δt' = γΔt */
    timeDilation: (properTime: number, velocity: number) => number;
    /** Length contraction: L' = L/γ */
    lengthContraction: (properLength: number, velocity: number) => number;
};
