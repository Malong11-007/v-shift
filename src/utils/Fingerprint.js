import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Singleton service for generating and caching the device fingerprint.
 * Used for identifying players across sessions and on the leaderboard.
 */
class FingerprintService {
    constructor() {
        this.visitorId = localStorage.getItem('vshift_visitor_id') || null;
        this.fpPromise = FingerprintJS.load();
    }

    async get() {
        if (this.visitorId) return this.visitorId;

        try {
            const fp = await this.fpPromise;
            const result = await fp.get();
            this.visitorId = result.visitorId;
            localStorage.setItem('vshift_visitor_id', this.visitorId);
            return this.visitorId;
        } catch (error) {
            console.error('[Fingerprint] Failed to generate:', error);
            // Fallback to a random UUID if fingerprinting fails
            const fallbackId = 'fb_' + Math.random().toString(36).substring(2, 15);
            this.visitorId = fallbackId;
            localStorage.setItem('vshift_visitor_id', fallbackId);
            return fallbackId;
        }
    }
}

const fingerprint = new FingerprintService();
export default fingerprint;
