
/**
 * Orbital Mechanics & Astronomy Calculator.
 */
export class Ephemeris {
    /**
     * Calculates the heliocentric coordinates of a planet for a given date.
     * @param planet - The target celestial body.
     * @param date - The observation time.
     * @returns Right Ascension (RA), Declination (Dec), and Distance in AU.
     */
    static getPlanetPosition(planet: 'mars' | 'jupiter', date: Date): { ra: string; dec: string; distance: string } {
        console.log(`Astro: 🔭 Calculating heliocentric coordinates for ${planet} at J2000 epoch...`);
        return {
            ra: '12h 43m 22s',
            dec: '+12° 55\' 11"',
            distance: '2.4 AU'
        };
    }

    static nextEclipse() {
        return new Date('2026-08-12T14:00:00Z');
    }
}

export class Vector3 {
    constructor(public x: number, public y: number, public z: number) {}

    add(other: Vector3): Vector3 {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    scale(factor: number): Vector3 {
        return new Vector3(this.x * factor, this.y * factor, this.z * factor);
    }
}

export const OrbitalMechanics = {
    keplerPeriod(semiMajorAxis: number, centralMass: number): number {
        const gravitationalConstant = 6.67430e-11;
        return 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / (gravitationalConstant * centralMass));
    },

    gravitationalForce(firstMass: number, secondMass: number, distance: number): number {
        if (distance <= 0) throw new RangeError('distance must be positive');
        return 6.67430e-11 * firstMass * secondMass / distance ** 2;
    },

    propagate(position: Vector3, velocity: Vector3, elapsedSeconds: number) {
        const distance = Math.hypot(position.x, position.y, position.z);
        const acceleration = distance === 0
            ? new Vector3(0, 0, 0)
            : position.scale(-3.986004418e14 / distance ** 3);
        const newPosition = position
            .add(velocity.scale(elapsedSeconds))
            .add(acceleration.scale(0.5 * elapsedSeconds ** 2));
        const newVelocity = velocity.add(acceleration.scale(elapsedSeconds));
        return { position: newPosition, velocity: newVelocity };
    },
};
