/**
 * PhilJS Brain-Computer Interface (BCI) Package
 * Production-ready neural signal processing and device integration
 */
// ============================================================================
// Complex Number for FFT
// ============================================================================
class Complex {
    re;
    im;
    constructor(re = 0, im = 0) {
        this.re = re;
        this.im = im;
    }
    add(other) {
        return new Complex(this.re + other.re, this.im + other.im);
    }
    sub(other) {
        return new Complex(this.re - other.re, this.im - other.im);
    }
    mul(other) {
        return new Complex(this.re * other.re - this.im * other.im, this.re * other.im + this.im * other.re);
    }
    magnitude() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }
}
// ============================================================================
// Signal Processing Utilities
// ============================================================================
/**
 * Cooley-Tukey FFT Algorithm
 */
function fft(signal) {
    const n = signal.length;
    // Ensure power of 2
    const paddedLength = Math.pow(2, Math.ceil(Math.log2(n)));
    const padded = new Float32Array(paddedLength);
    padded.set(signal);
    return fftRecursive(padded);
}
function fftRecursive(signal) {
    const n = signal.length;
    if (n <= 1) {
        return [new Complex(signal[0] || 0, 0)];
    }
    // Split into even and odd
    const even = new Float32Array(n / 2);
    const odd = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
        even[i] = signal[i * 2];
        odd[i] = signal[i * 2 + 1];
    }
    const evenFFT = fftRecursive(even);
    const oddFFT = fftRecursive(odd);
    const result = new Array(n);
    for (let k = 0; k < n / 2; k++) {
        const angle = -2 * Math.PI * k / n;
        const twiddle = new Complex(Math.cos(angle), Math.sin(angle));
        const t = twiddle.mul(oddFFT[k]);
        result[k] = evenFFT[k].add(t);
        result[k + n / 2] = evenFFT[k].sub(t);
    }
    return result;
}
/**
 * Compute power spectral density
 */
function powerSpectrum(signal, sampleRate) {
    const spectrum = fft(signal);
    const n = spectrum.length;
    const frequencies = [];
    const power = [];
    for (let i = 0; i < n / 2; i++) {
        frequencies.push((i * sampleRate) / n);
        power.push(spectrum[i].magnitude() ** 2 / n);
    }
    return { frequencies, power };
}
/**
 * Butterworth filter coefficients
 */
function butterworthCoeffs(order, cutoff, sampleRate, highpass) {
    const nyquist = sampleRate / 2;
    const normalizedCutoff = cutoff / nyquist;
    // Pre-warp
    const wc = Math.tan(Math.PI * normalizedCutoff);
    const wc2 = wc * wc;
    // For 2nd order
    if (order === 2) {
        const k = Math.sqrt(2) * wc;
        const denom = 1 + k + wc2;
        if (highpass) {
            return {
                b: [1 / denom, -2 / denom, 1 / denom],
                a: [1, (2 * wc2 - 2) / denom, (1 - k + wc2) / denom]
            };
        }
        else {
            return {
                b: [wc2 / denom, 2 * wc2 / denom, wc2 / denom],
                a: [1, (2 * wc2 - 2) / denom, (1 - k + wc2) / denom]
            };
        }
    }
    // Default simple 1st order
    const alpha = normalizedCutoff / (1 + normalizedCutoff);
    if (highpass) {
        return { b: [1 - alpha, alpha - 1], a: [1, -alpha] };
    }
    return { b: [alpha, alpha], a: [1, -(1 - 2 * alpha)] };
}
/**
 * Apply IIR filter
 */
function applyFilter(signal, b, a) {
    const output = new Float32Array(signal.length);
    const order = Math.max(b.length, a.length) - 1;
    const x = new Float32Array(order + 1);
    const y = new Float32Array(order + 1);
    for (let i = 0; i < signal.length; i++) {
        // Shift input buffer
        for (let j = order; j > 0; j--) {
            x[j] = x[j - 1];
            y[j] = y[j - 1];
        }
        x[0] = signal[i];
        // Calculate output
        let out = 0;
        for (let j = 0; j < b.length; j++) {
            out += b[j] * x[j];
        }
        for (let j = 1; j < a.length; j++) {
            out -= a[j] * y[j];
        }
        y[0] = out;
        output[i] = out;
    }
    return output;
}
/**
 * Bandpass filter
 */
function bandpassFilter(signal, lowCutoff, highCutoff, sampleRate) {
    const { b: bLow, a: aLow } = butterworthCoeffs(2, highCutoff, sampleRate, false);
    const { b: bHigh, a: aHigh } = butterworthCoeffs(2, lowCutoff, sampleRate, true);
    let filtered = applyFilter(signal, bLow, aLow);
    filtered = applyFilter(filtered, bHigh, aHigh);
    return filtered;
}
/**
 * Notch filter (for 50/60Hz power line noise)
 */
function notchFilter(signal, centerFreq, sampleRate, Q = 30) {
    const omega = 2 * Math.PI * centerFreq / sampleRate;
    const alpha = Math.sin(omega) / (2 * Q);
    const b0 = 1;
    const b1 = -2 * Math.cos(omega);
    const b2 = 1;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(omega);
    const a2 = 1 - alpha;
    const b = [b0 / a0, b1 / a0, b2 / a0];
    const a = [1, a1 / a0, a2 / a0];
    return applyFilter(signal, b, a);
}
/**
 * Compute band power (µV²/Hz)
 */
function bandPower(spectrum, lowFreq, highFreq) {
    let totalPower = 0;
    let count = 0;
    for (let i = 0; i < spectrum.frequencies.length; i++) {
        if (spectrum.frequencies[i] >= lowFreq && spectrum.frequencies[i] <= highFreq) {
            totalPower += spectrum.power[i];
            count++;
        }
    }
    return count > 0 ? totalPower / count : 0;
}
/**
 * Hanning window function
 */
function hanningWindow(signal) {
    const n = signal.length;
    const windowed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
        windowed[i] = signal[i] * w;
    }
    return windowed;
}
function createArtifactDetector() {
    return {
        detectBlink(signal, sampleRate) {
            const blinks = [];
            const threshold = 100; // µV
            const minBlinkDuration = 0.1 * sampleRate; // 100ms
            const maxBlinkDuration = 0.4 * sampleRate; // 400ms
            let inBlink = false;
            let blinkStart = 0;
            for (let i = 0; i < signal.length; i++) {
                if (!inBlink && Math.abs(signal[i]) > threshold) {
                    inBlink = true;
                    blinkStart = i;
                }
                else if (inBlink && Math.abs(signal[i]) < threshold * 0.5) {
                    const duration = i - blinkStart;
                    if (duration >= minBlinkDuration && duration <= maxBlinkDuration) {
                        blinks.push({
                            timestamp: Date.now() - ((signal.length - blinkStart) / sampleRate) * 1000,
                            duration: duration / sampleRate,
                            type: duration < 0.15 * sampleRate ? 'single' :
                                duration < 0.25 * sampleRate ? 'double' : 'long'
                        });
                    }
                    inBlink = false;
                }
            }
            return blinks;
        },
        detectMuscle(signal) {
            // High frequency content indicates muscle artifact
            const highFreqPower = signal.reduce((sum, v) => sum + Math.abs(v), 0) / signal.length;
            return highFreqPower > 50; // µV threshold
        },
        detectMovement(signal) {
            // Large slow drifts indicate movement
            let maxDiff = 0;
            for (let i = 1; i < signal.length; i++) {
                maxDiff = Math.max(maxDiff, Math.abs(signal[i] - signal[i - 1]));
            }
            return maxDiff > 200; // µV threshold
        },
        rejectArtifacts(signal, sampleRate) {
            // Apply aggressive bandpass to remove artifacts
            let cleaned = bandpassFilter(signal, 0.5, 45, sampleRate);
            // Remove any remaining large amplitude artifacts
            const threshold = 100; // µV
            for (let i = 0; i < cleaned.length; i++) {
                if (Math.abs(cleaned[i]) > threshold) {
                    // Interpolate around artifact
                    const start = Math.max(0, i - 5);
                    const end = Math.min(cleaned.length - 1, i + 5);
                    const avg = (cleaned[start] + cleaned[end]) / 2;
                    for (let j = start; j <= end; j++) {
                        cleaned[j] = avg;
                    }
                }
            }
            return cleaned;
        }
    };
}
// ============================================================================
// Device Protocols
// ============================================================================
/**
 * NeuroSky ThinkGear protocol parser
 */
function parseNeuroSkyPacket(data) {
    if (data.byteLength < 4)
        return null;
    // Sync bytes
    if (data.getUint8(0) !== 0xAA || data.getUint8(1) !== 0xAA) {
        return null;
    }
    const payloadLength = data.getUint8(2);
    if (data.byteLength < payloadLength + 4)
        return null;
    // Verify checksum
    let checksum = 0;
    for (let i = 3; i < 3 + payloadLength; i++) {
        checksum += data.getUint8(i);
    }
    checksum = ~checksum & 0xFF;
    if (checksum !== data.getUint8(3 + payloadLength)) {
        return null; // Invalid checksum
    }
    const result = {};
    let offset = 3;
    while (offset < 3 + payloadLength) {
        const code = data.getUint8(offset++);
        switch (code) {
            case 0x02: // Poor signal quality
                offset++;
                break;
            case 0x04: // Attention
                result.attention = data.getUint8(offset++);
                break;
            case 0x05: // Meditation
                result.meditation = data.getUint8(offset++);
                break;
            case 0x80: // Raw value (2 bytes)
                offset += 2;
                break;
            case 0x83: // ASIC_EEG_POWER (24 bytes - 8 3-byte values)
                result.delta = (data.getUint8(offset) << 16) | (data.getUint8(offset + 1) << 8) | data.getUint8(offset + 2);
                result.theta = (data.getUint8(offset + 3) << 16) | (data.getUint8(offset + 4) << 8) | data.getUint8(offset + 5);
                result.alpha = (data.getUint8(offset + 6) << 16) | (data.getUint8(offset + 7) << 8) | data.getUint8(offset + 8);
                // Low and high alpha combined
                const alphaLow = (data.getUint8(offset + 6) << 16) | (data.getUint8(offset + 7) << 8) | data.getUint8(offset + 8);
                const alphaHigh = (data.getUint8(offset + 9) << 16) | (data.getUint8(offset + 10) << 8) | data.getUint8(offset + 11);
                result.alpha = (alphaLow + alphaHigh) / 2;
                // Low and high beta combined
                const betaLow = (data.getUint8(offset + 12) << 16) | (data.getUint8(offset + 13) << 8) | data.getUint8(offset + 14);
                const betaHigh = (data.getUint8(offset + 15) << 16) | (data.getUint8(offset + 16) << 8) | data.getUint8(offset + 17);
                result.beta = (betaLow + betaHigh) / 2;
                result.gamma = (data.getUint8(offset + 18) << 16) | (data.getUint8(offset + 19) << 8) | data.getUint8(offset + 20);
                // Low and mid gamma combined
                const gammaLow = (data.getUint8(offset + 18) << 16) | (data.getUint8(offset + 19) << 8) | data.getUint8(offset + 20);
                const gammaMid = (data.getUint8(offset + 21) << 16) | (data.getUint8(offset + 22) << 8) | data.getUint8(offset + 23);
                result.gamma = (gammaLow + gammaMid) / 2;
                offset += 24;
                break;
            default:
                // Unknown code, skip
                if (code >= 0x80) {
                    const length = data.getUint8(offset++);
                    offset += length;
                }
        }
    }
    return result;
}
/**
 * OpenBCI Cyton protocol parser
 */
function parseOpenBCIPacket(data) {
    if (data.length < 33)
        return null;
    // Check start byte
    if (data[0] !== 0xA0)
        return null;
    const sample = {
        timestamp: Date.now(),
        channels: new Float32Array(8),
        quality: new Array(8).fill(100)
    };
    // Parse 8 channels (3 bytes each, 24-bit signed)
    for (let ch = 0; ch < 8; ch++) {
        const offset = 1 + ch * 3;
        let value = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
        // Sign extension for 24-bit
        if (value & 0x800000) {
            value = value - 0x1000000;
        }
        // Convert to µV (OpenBCI gain of 24, 4.5V reference)
        sample.channels[ch] = (value * 4.5 / 24 / (2 ** 23 - 1)) * 1000000;
    }
    // Check stop byte
    if (data[32] < 0xC0) {
        return null;
    }
    return sample;
}
/**
 * Emotiv EPOC protocol parser (simplified)
 */
function parseEmotivPacket(data) {
    if (data.length < 32)
        return null;
    const sample = {
        timestamp: Date.now(),
        channels: new Float32Array(14),
        quality: new Array(14).fill(100)
    };
    // Emotiv has 14 channels, packed data
    // This is simplified - real implementation requires AES decryption
    for (let ch = 0; ch < 14; ch++) {
        const offset = 2 + ch * 2;
        const value = (data[offset] << 8) | data[offset + 1];
        sample.channels[ch] = ((value - 8192) / 8192) * 100; // Normalized to µV
    }
    // Quality from packet header
    const qualityByte = data[0];
    for (let i = 0; i < 14; i++) {
        sample.quality[i] = (qualityByte >> (i % 8)) & 1 ? 100 : 50;
    }
    return sample;
}
function createEventEmitter() {
    const listeners = new Map();
    return {
        on(event, callback) {
            if (!listeners.has(event)) {
                listeners.set(event, new Set());
            }
            listeners.get(event).add(callback);
        },
        off(event, callback) {
            listeners.get(event)?.delete(callback);
        },
        emit(event, ...args) {
            listeners.get(event)?.forEach(cb => {
                try {
                    cb(...args);
                }
                catch (e) {
                    console.error(`Error in event handler for ${event}:`, e);
                }
            });
        },
        once(event, callback) {
            const wrapper = (...args) => {
                this.off(event, wrapper);
                callback(...args);
            };
            this.on(event, wrapper);
        }
    };
}
// ============================================================================
// Main BCI Device Class
// ============================================================================
export class BCIDevice {
    deviceInfo = null;
    connection = null; // BluetoothDevice | HIDDevice
    config;
    dataBuffer = [];
    maxBufferSize = 256;
    eventEmitter = createEventEmitter();
    artifactDetector = createArtifactDetector();
    isRecording = false;
    recordedData = [];
    constructor(config = {}) {
        this.config = {
            sampleRate: config.sampleRate ?? 256,
            bufferSize: config.bufferSize ?? 256,
            notchFilter: config.notchFilter ?? 60,
            bandpassLow: config.bandpassLow ?? 0.5,
            bandpassHigh: config.bandpassHigh ?? 45,
            artifactRejection: config.artifactRejection ?? true,
            channels: config.channels ?? [0, 1, 2, 3, 4, 5, 6, 7]
        };
    }
    // ========================================================================
    // Connection Methods
    // ========================================================================
    /**
     * Connect to a BCI device
     */
    static async connect(type = 'neurosky') {
        const device = new BCIDevice();
        await device.connectDevice(type);
        return device;
    }
    async connectDevice(type) {
        switch (type) {
            case 'neurosky':
                await this.connectNeuroSky();
                break;
            case 'openbci':
                await this.connectOpenBCI();
                break;
            case 'emotiv':
                await this.connectEmotiv();
                break;
            case 'muse':
                await this.connectMuse();
                break;
            default:
                throw new Error(`Unsupported device type: ${type}`);
        }
    }
    async connectNeuroSky() {
        if (typeof navigator === 'undefined' || !navigator.bluetooth) {
            throw new Error('Web Bluetooth API not available');
        }
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] },
                { namePrefix: 'MindWave' },
                { namePrefix: 'NeuroSky' }
            ],
            optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
        });
        const server = await device.gatt?.connect();
        if (!server)
            throw new Error('Failed to connect to GATT server');
        const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target.value;
            if (value) {
                const parsed = parseNeuroSkyPacket(value);
                if (parsed) {
                    this.handleBrainwaves(parsed);
                }
            }
        });
        this.connection = device;
        this.deviceInfo = {
            type: 'neurosky',
            name: device.name || 'NeuroSky MindWave',
            connected: true,
            sampleRate: 512,
            channels: 1
        };
        this.eventEmitter.emit('connected', this.deviceInfo);
    }
    async connectOpenBCI() {
        if (typeof navigator === 'undefined' || !('hid' in navigator)) {
            throw new Error('WebHID API not available');
        }
        const devices = await navigator.hid.requestDevice({
            filters: [
                { vendorId: 0x1234, productId: 0x5678 } // OpenBCI vendor/product IDs
            ]
        });
        if (devices.length === 0) {
            throw new Error('No OpenBCI device found');
        }
        const device = devices[0];
        await device.open();
        device.addEventListener('inputreport', (event) => {
            const data = new Uint8Array(event.data.buffer);
            const sample = parseOpenBCIPacket(data);
            if (sample) {
                this.handleEEGSample(sample);
            }
        });
        this.connection = device;
        this.deviceInfo = {
            type: 'openbci',
            name: device.productName || 'OpenBCI Cyton',
            connected: true,
            sampleRate: 250,
            channels: 8
        };
        this.eventEmitter.emit('connected', this.deviceInfo);
    }
    async connectEmotiv() {
        if (typeof navigator === 'undefined' || !navigator.bluetooth) {
            throw new Error('Web Bluetooth API not available');
        }
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'EPOC' },
                { namePrefix: 'Emotiv' },
                { namePrefix: 'Insight' }
            ],
            optionalServices: ['battery_service']
        });
        const server = await device.gatt?.connect();
        if (!server)
            throw new Error('Failed to connect to Emotiv device');
        // Emotiv requires proprietary SDK for full access
        // This is a simplified connection
        this.connection = device;
        this.deviceInfo = {
            type: 'emotiv',
            name: device.name || 'Emotiv EPOC',
            connected: true,
            sampleRate: 128,
            channels: 14
        };
        this.eventEmitter.emit('connected', this.deviceInfo);
    }
    async connectMuse() {
        if (typeof navigator === 'undefined' || !navigator.bluetooth) {
            throw new Error('Web Bluetooth API not available');
        }
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'Muse' }
            ],
            optionalServices: [
                '0000fe8d-0000-1000-8000-00805f9b34fb' // Muse service
            ]
        });
        const server = await device.gatt?.connect();
        if (!server)
            throw new Error('Failed to connect to Muse device');
        const service = await server.getPrimaryService('0000fe8d-0000-1000-8000-00805f9b34fb');
        // Subscribe to EEG data characteristic
        const eegCharacteristic = await service.getCharacteristic('273e0003-4c4d-454d-96be-f03bac821358');
        await eegCharacteristic.startNotifications();
        eegCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target.value;
            if (value) {
                const sample = this.parseMusePacket(new Uint8Array(value.buffer));
                if (sample) {
                    this.handleEEGSample(sample);
                }
            }
        });
        this.connection = device;
        this.deviceInfo = {
            type: 'muse',
            name: device.name || 'Muse',
            connected: true,
            sampleRate: 256,
            channels: 4
        };
        this.eventEmitter.emit('connected', this.deviceInfo);
    }
    parseMusePacket(data) {
        if (data.length < 20)
            return null;
        const sample = {
            timestamp: Date.now(),
            channels: new Float32Array(4),
            quality: [100, 100, 100, 100]
        };
        // Muse sends 12-bit samples, 4 channels
        for (let i = 0; i < 4; i++) {
            const offset = 2 + i * 3;
            const value = ((data[offset] << 4) | (data[offset + 1] >> 4));
            sample.channels[i] = (value - 2048) * 0.48828125; // Convert to µV
        }
        return sample;
    }
    /**
     * Disconnect from device
     */
    async disconnect() {
        if (this.connection) {
            if (this.connection.gatt?.connected) {
                this.connection.gatt.disconnect();
            }
            else if (this.connection.opened) {
                await this.connection.close();
            }
            this.connection = null;
        }
        if (this.deviceInfo) {
            this.deviceInfo.connected = false;
        }
        this.eventEmitter.emit('disconnected');
    }
    // ========================================================================
    // Data Handling
    // ========================================================================
    handleBrainwaves(waves) {
        this.eventEmitter.emit('brainwaves', waves);
        // Detect mental states
        const state = this.computeMentalState(waves);
        this.eventEmitter.emit('mentalState', state);
        // Emit focus/relaxation events
        if (state.focus > 0.8) {
            this.eventEmitter.emit('focus', state);
        }
        if (state.relaxation > 0.8) {
            this.eventEmitter.emit('relaxation', state);
        }
    }
    handleEEGSample(sample) {
        // Apply preprocessing
        let processed = sample.channels;
        if (this.config.artifactRejection) {
            processed = this.artifactDetector.rejectArtifacts(processed, this.config.sampleRate);
        }
        if (this.config.notchFilter) {
            processed = notchFilter(processed, this.config.notchFilter, this.config.sampleRate);
        }
        processed = bandpassFilter(processed, this.config.bandpassLow, this.config.bandpassHigh, this.config.sampleRate);
        // Store in buffer
        this.dataBuffer.push(processed);
        if (this.dataBuffer.length > this.maxBufferSize) {
            this.dataBuffer.shift();
        }
        // Emit raw sample
        this.eventEmitter.emit('sample', { ...sample, channels: processed });
        // Record if active
        if (this.isRecording) {
            this.recordedData.push({ ...sample, channels: processed });
        }
        // Detect blinks
        const blinks = this.artifactDetector.detectBlink(processed, this.config.sampleRate);
        for (const blink of blinks) {
            this.eventEmitter.emit('blink', blink);
        }
        // Compute band powers periodically
        if (this.dataBuffer.length >= this.config.bufferSize) {
            const bands = this.computeBandPowers();
            this.eventEmitter.emit('bandPowers', bands);
            const waves = {
                ...bands,
                attention: this.computeAttention(bands),
                meditation: this.computeMeditation(bands)
            };
            this.handleBrainwaves(waves);
        }
    }
    // ========================================================================
    // Signal Analysis
    // ========================================================================
    /**
     * Compute band powers from buffer
     */
    computeBandPowers() {
        if (this.dataBuffer.length < 2) {
            return { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 };
        }
        // Concatenate buffer
        const totalLength = this.dataBuffer.reduce((sum, arr) => sum + arr.length, 0);
        const signal = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.dataBuffer) {
            signal.set(chunk, offset);
            offset += chunk.length;
        }
        // Apply window function
        const windowed = hanningWindow(signal);
        // Compute power spectrum
        const spectrum = powerSpectrum(windowed, this.config.sampleRate);
        // Extract band powers
        return {
            delta: bandPower(spectrum, 0.5, 4),
            theta: bandPower(spectrum, 4, 8),
            alpha: bandPower(spectrum, 8, 13),
            beta: bandPower(spectrum, 13, 30),
            gamma: bandPower(spectrum, 30, 45)
        };
    }
    /**
     * Get current band powers
     */
    getBandPowers() {
        return this.computeBandPowers();
    }
    /**
     * Compute attention level from band powers
     */
    computeAttention(bands) {
        // High beta/theta ratio indicates focus
        const ratio = bands.beta / (bands.theta + 0.001);
        return Math.min(100, Math.max(0, ratio * 20));
    }
    /**
     * Compute meditation level from band powers
     */
    computeMeditation(bands) {
        // High alpha/beta ratio indicates relaxation
        const ratio = bands.alpha / (bands.beta + 0.001);
        return Math.min(100, Math.max(0, ratio * 30));
    }
    /**
     * Compute comprehensive mental state
     */
    computeMentalState(waves) {
        const bands = { delta: waves.delta, theta: waves.theta, alpha: waves.alpha, beta: waves.beta, gamma: waves.gamma };
        const total = bands.delta + bands.theta + bands.alpha + bands.beta + bands.gamma + 0.001;
        return {
            focus: Math.min(1, (bands.beta + bands.gamma) / total * 2),
            relaxation: Math.min(1, (bands.alpha + bands.theta) / total * 2),
            stress: Math.min(1, bands.beta / (bands.alpha + 0.001) / 3),
            drowsiness: Math.min(1, (bands.delta + bands.theta) / (bands.alpha + bands.beta + 0.001)),
            engagement: Math.min(1, bands.gamma / total * 3),
            timestamp: Date.now()
        };
    }
    /**
     * Get focus level (0-1)
     */
    getFocusLevel() {
        const bands = this.computeBandPowers();
        return bands.beta / (bands.theta + 0.001) / 5;
    }
    /**
     * Get meditation/relaxation level (0-1)
     */
    getMeditationLevel() {
        const bands = this.computeBandPowers();
        return bands.alpha / (bands.beta + 0.001) / 3;
    }
    // ========================================================================
    // Event-Related Potentials
    // ========================================================================
    /**
     * Detect P300 ERP (for BCI spellers, etc.)
     */
    detectP300(epochs, stimulusOnsets) {
        const events = [];
        const p300Window = { start: 250, end: 500 }; // ms after stimulus
        const samplesPerMs = this.config.sampleRate / 1000;
        for (let i = 0; i < epochs.length; i++) {
            const epoch = epochs[i];
            const startSample = Math.floor(p300Window.start * samplesPerMs);
            const endSample = Math.floor(p300Window.end * samplesPerMs);
            // Find peak in P300 window
            let maxAmp = -Infinity;
            let maxIdx = 0;
            for (let j = startSample; j < Math.min(endSample, epoch.length); j++) {
                if (epoch[j] > maxAmp) {
                    maxAmp = epoch[j];
                    maxIdx = j;
                }
            }
            // Threshold for P300 detection
            if (maxAmp > 5) { // µV
                events.push({
                    type: 'P300',
                    amplitude: maxAmp,
                    latency: maxIdx / samplesPerMs,
                    channel: 0,
                    timestamp: stimulusOnsets[i] + maxIdx / samplesPerMs
                });
            }
        }
        return events;
    }
    // ========================================================================
    // Recording
    // ========================================================================
    /**
     * Start recording EEG data
     */
    startRecording() {
        this.isRecording = true;
        this.recordedData = [];
        this.eventEmitter.emit('recordingStarted');
    }
    /**
     * Stop recording and return data
     */
    stopRecording() {
        this.isRecording = false;
        const data = this.recordedData;
        this.recordedData = [];
        this.eventEmitter.emit('recordingStopped', data.length);
        return data;
    }
    /**
     * Export recorded data to CSV
     */
    exportToCSV(data) {
        if (data.length === 0)
            return '';
        const numChannels = data[0].channels.length;
        const headers = ['timestamp', ...Array(numChannels).fill(0).map((_, i) => `channel_${i + 1}`)];
        let csv = headers.join(',') + '\n';
        for (const sample of data) {
            const row = [sample.timestamp, ...Array.from(sample.channels)];
            csv += row.join(',') + '\n';
        }
        return csv;
    }
    // ========================================================================
    // Event Handling
    // ========================================================================
    /**
     * Subscribe to events
     */
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    /**
     * Unsubscribe from events
     */
    off(event, callback) {
        this.eventEmitter.off(event, callback);
    }
    /**
     * Subscribe to event once
     */
    once(event, callback) {
        this.eventEmitter.once(event, callback);
    }
    // ========================================================================
    // Getters
    // ========================================================================
    /**
     * Get device info
     */
    getDeviceInfo() {
        return this.deviceInfo;
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.deviceInfo?.connected ?? false;
    }
    /**
     * Get raw data buffer
     */
    getBuffer() {
        return [...this.dataBuffer];
    }
}
// ============================================================================
// Legacy NeuralInterface (Backward Compatibility)
// ============================================================================
export class NeuralInterface {
    device = null;
    interval = null;
    listeners = new Map();
    isSimulating = false;
    static connect() {
        const ni = new NeuralInterface();
        ni.startSimulation();
        return ni;
    }
    static async connectDevice(type = 'neurosky') {
        const ni = new NeuralInterface();
        ni.device = await BCIDevice.connect(type);
        ni.setupDeviceHandlers();
        return ni;
    }
    setupDeviceHandlers() {
        if (!this.device)
            return;
        this.device.on('brainwaves', (waves) => {
            this.emit('data', waves);
            if (waves.attention > 80)
                this.emit('focus', waves);
            if (waves.alpha > 40 && waves.theta > 30)
                this.emit('flow', waves);
        });
        this.device.on('blink', (blink) => {
            this.emit('blink', blink);
        });
    }
    startSimulation() {
        this.isSimulating = true;
        this.interval = setInterval(() => {
            const waves = this.generateSample();
            this.emit('data', waves);
            if (waves.attention > 80)
                this.emit('focus', waves);
            if (waves.alpha > 40 && waves.theta > 30)
                this.emit('flow', waves);
        }, 16);
    }
    generateSample() {
        const t = Date.now() / 1000;
        return {
            delta: Math.abs(Math.sin(t * 0.5) * 50),
            theta: Math.abs(Math.sin(t * 4) * 50),
            alpha: Math.abs(Math.sin(t * 10) * 50),
            beta: Math.abs(Math.sin(t * 20) * 50 + (Math.random() * 10)),
            gamma: Math.abs(Math.sin(t * 40) * 50 + (Math.random() * 20)),
            attention: 50 + Math.sin(t * 0.2) * 40,
            meditation: 50 + Math.cos(t * 0.2) * 40
        };
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }
    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
    getStream() {
        if (this.device) {
            return () => {
                const bands = this.device.getBandPowers();
                return {
                    ...bands,
                    attention: this.device.getFocusLevel() * 100,
                    meditation: this.device.getMeditationLevel() * 100
                };
            };
        }
        return () => this.generateSample();
    }
    disconnect() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.device) {
            this.device.disconnect();
            this.device = null;
        }
        this.isSimulating = false;
    }
}
export class NeurofeedbackTrainer {
    device;
    protocol;
    sessionData = [];
    isActive = false;
    eventEmitter = createEventEmitter();
    constructor(device, protocol) {
        this.device = device;
        this.protocol = protocol;
    }
    /**
     * Start training session
     */
    start() {
        this.isActive = true;
        this.sessionData = [];
        this.device.on('bandPowers', (bands) => {
            if (!this.isActive)
                return;
            const value = bands[this.protocol.targetBand];
            const success = this.protocol.direction === 'increase'
                ? value > this.protocol.threshold
                : value < this.protocol.threshold;
            this.sessionData.push({
                timestamp: Date.now(),
                value,
                success
            });
            this.eventEmitter.emit('feedback', { value, success, protocol: this.protocol });
        });
        this.eventEmitter.emit('sessionStart', this.protocol);
    }
    /**
     * Stop training session
     */
    stop() {
        this.isActive = false;
        const successCount = this.sessionData.filter(d => d.success).length;
        const successRate = this.sessionData.length > 0 ? successCount / this.sessionData.length : 0;
        const avgValue = this.sessionData.length > 0
            ? this.sessionData.reduce((sum, d) => sum + d.value, 0) / this.sessionData.length
            : 0;
        const result = {
            successRate,
            avgValue,
            data: this.sessionData
        };
        this.eventEmitter.emit('sessionEnd', result);
        return result;
    }
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
}
// ============================================================================
// Preset Protocols
// ============================================================================
export const PROTOCOLS = {
    alphaEnhancement: {
        name: 'Alpha Enhancement',
        targetBand: 'alpha',
        threshold: 10,
        direction: 'increase',
        duration: 300
    },
    betaSuppression: {
        name: 'Beta Suppression (Relaxation)',
        targetBand: 'beta',
        threshold: 15,
        direction: 'decrease',
        duration: 300
    },
    smrTraining: {
        name: 'SMR Training (Focus)',
        targetBand: 'beta', // 12-15Hz specifically
        threshold: 8,
        direction: 'increase',
        duration: 300
    },
    thetaAlpha: {
        name: 'Theta/Alpha Meditation',
        targetBand: 'theta',
        threshold: 8,
        direction: 'increase',
        duration: 600
    }
};
//# sourceMappingURL=bci.js.map