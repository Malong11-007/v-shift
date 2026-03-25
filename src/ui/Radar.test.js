import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../core/Engine.js', () => ({
    default: {
        updatables: []
    }
}));

import radar from './Radar.js';
import engine from '../core/Engine.js';

describe('Radar', () => {
    let mockPlayer;

    beforeEach(() => {
        engine.updatables.length = 0;

        // Mock canvas 2d context since jsdom doesn't support it
        radar.ctx = {
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            fillStyle: '',
            strokeStyle: ''
        };

        mockPlayer = {
            isAlive: true,
            camera: { position: { x: 0, y: 5, z: 0 } },
            yaw: 0
        };

        if (!document.getElementById('radar-container')) {
            document.body.appendChild(radar.container);
        }
    });

    it('should be hidden by default on construction', () => {
        expect(radar.container.style.display).toBe('none');
    });

    it('should become visible when update is called with a live player', () => {
        radar.update(mockPlayer);
        expect(radar.container.style.display).toBe('block');
    });

    it('should hide when update is called with no player', () => {
        radar.update(mockPlayer);
        expect(radar.container.style.display).toBe('block');

        radar.update(null);
        expect(radar.container.style.display).toBe('none');
    });

    it('should hide when update is called with a dead player', () => {
        radar.update(mockPlayer);
        expect(radar.container.style.display).toBe('block');

        mockPlayer.isAlive = false;
        radar.update(mockPlayer);
        expect(radar.container.style.display).toBe('none');
    });

    it('should hide and show via explicit methods', () => {
        radar.show();
        expect(radar.container.style.display).toBe('block');

        radar.hide();
        expect(radar.container.style.display).toBe('none');
    });

    it('should render entity dots for alive entities with a group', () => {
        const bot = {
            group: { position: { x: 10, y: 0, z: 10 } },
            isAlive: true,
            constructor: { name: 'Bot' }
        };
        engine.updatables.push(bot);

        radar.update(mockPlayer);

        // Radar should be visible and have rendered (no errors thrown)
        expect(radar.container.style.display).toBe('block');
    });

    it('should skip entities without group or that are dead', () => {
        const noGroup = { isAlive: true };
        const deadBot = {
            group: { position: { x: 5, y: 0, z: 5 } },
            isAlive: false,
            constructor: { name: 'Bot' }
        };
        engine.updatables.push(noGroup, deadBot);

        // Should not throw
        radar.update(mockPlayer);
        expect(radar.container.style.display).toBe('block');
    });
});
