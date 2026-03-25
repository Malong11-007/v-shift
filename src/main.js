import engine from './core/Engine.js';
import physics from './physics/PhysicsWorld.js';
import gameState, { STATES } from './core/GameState.js';
import audioManager from './core/AudioManager.js';
import BulletTracer from './game/BulletTracer.js';
import collision from './physics/Collision.js';
import inputManager from './core/InputManager.js';
import gamepadManager from './core/GamepadManager.js';
import touchControls from './core/TouchControls.js';
import arena from './world/Arena.js';
import skybox from './world/Skybox.js';
import decorations from './world/Decorations.js';
import TestRoom from './world/TestRoom.js';
import Player from './entities/Player.js';
import roundManager from './game/RoundManager.js';
import economyManager from './game/EconomyManager.js';
import matchManager, { GAME_MODES } from './game/MatchManager.js';
import competitiveFlow from './game/CompetitiveFlow.js';
import hud from './ui/HUD.js';
import uiManager from './ui/UIManager.js';
import tutorial from './ui/Tutorial.js';
import feedbackSystem from './game/FeedbackSystem.js';
import Bot from './entities/Bot.js';
import * as THREE from 'three';

console.log('V-SHIFT Initializing...');


const init = async () => {
    gameState.transition(STATES.LOADING);

    engine.camera.position.set(0, 2, 0); // Will be overridden by player
    engine.camera.lookAt(0, 1, 0);

    await physics.init();
    engine.addUpdatable(physics);
    engine.addUpdatable(gamepadManager);
    
    const urlParams = new URLSearchParams(window.location.search);
    const isTestRoom = urlParams.has('test');
    
    if (isTestRoom) {
        const testRoom = new TestRoom();
        testRoom.init();
        engine.scene.add(testRoom.group);
        engine.scene.add(skybox.mesh);
        
        // Extra light for test room
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        engine.scene.add(ambient);
    } else {
        // Generate Arena & Decorations
        arena.init();
        await decorations.init();
        engine.scene.add(arena.group);
        engine.scene.add(skybox.mesh);
        engine.scene.add(decorations.group);
    }


    // Spawn Player
    const localId = 'player_' + Math.floor(Math.random() * 10000);
    const localPlayer = new Player(localId, { isLocal: true });
    window.localPlayer = localPlayer;
    engine.addUpdatable(localPlayer);

    engine.onUpdate((dt) => {
        const player = window.localPlayer;
        if (player) {
            hud.update(player, dt);
            tutorial.update(dt);
        }
    });

    if (isTestRoom) {
        // Spawn 1 bot directly in front of player
        window.bots = [
            new Bot('bot_test', new THREE.Vector3(0, 2, 10))
        ];
        // Skip right to playing — use optional chaining since these elements may not exist
        const menuEl = document.getElementById('menu');
        if (menuEl) menuEl.style.display = 'none';
        const hudEl = document.getElementById('hud');
        if (hudEl) hudEl.style.display = 'block';
        gameState.transition(STATES.PLAYING);
    } else {
        // Configure team size from URL param (e.g. ?team=3 for 3v3, max 10v10)
        const teamSize = Math.min(Math.max(1, parseInt(urlParams.get('team')) || 5), 10);
        competitiveFlow.configureTeams({ attackers: teamSize, defenders: teamSize });

        // Spawn bots based on configured defender team size
        const botSpawns = arena.getBotSpawns(teamSize);
        window.bots = botSpawns.map((pos, i) =>
            new Bot(`bot_${i + 1}`, pos)
        );
        // Don't transition here yet, wait for assets to load fully.
    }
    window.bots.forEach(bot => engine.addUpdatable(bot));

    // Initialize Game Managers
    engine.addUpdatable(roundManager);
    engine.addUpdatable(competitiveFlow);
    
    // Default to competitive match start
    matchManager.setMode(GAME_MODES.COMPETITIVE);

    console.log('[main.js] Engine starting render loop...');
    engine.start();
    console.log('[main.js] Render loop started. Game is LIVE.');
    
    // Ambient audio on game state change + render throttle
    window.addEventListener('gameStateChange', (e) => {
        if (e.detail.current === 'PLAYING') {
            audioManager.playAmbient();
            engine.setFullSpeed(true);
        } else {
            audioManager.stopAmbient();
            engine.setFullSpeed(false);
        }
    });
    
    // FPS Counter (toggle with F3)
    const fpsEl = document.createElement('div');
    fpsEl.style.position = 'fixed';
    fpsEl.style.top = '5px';
    fpsEl.style.right = '5px';
    fpsEl.style.color = '#00ff66';
    fpsEl.style.fontFamily = 'monospace';
    fpsEl.style.fontSize = '14px';
    fpsEl.style.zIndex = '99999';
    fpsEl.style.pointerEvents = 'none';
    fpsEl.style.display = 'none';
    document.body.appendChild(fpsEl);
    let fpsFrames = 0, fpsLast = performance.now();
    engine.addUpdatable({
        update: () => {
            fpsFrames++;
            const now = performance.now();
            if (now - fpsLast >= 500) {
                fpsEl.innerText = `${Math.round(fpsFrames / ((now - fpsLast) / 1000))} FPS`;
                fpsFrames = 0;
                fpsLast = now;
            }
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.code === 'F3') {
            e.preventDefault();
            fpsEl.style.display = fpsEl.style.display === 'none' ? 'block' : 'none';
        }
    });
    window.addEventListener('showFpsChanged', (e) => {
        fpsEl.style.display = e.detail ? 'block' : 'none';
    });
    
    // Remote tracers
    window.addEventListener('remoteShoot', (e) => {
        const data = e.detail;
        const origin = new THREE.Vector3(data.x, data.y, data.z);
        const direction = new THREE.Vector3(data.dx, data.dy, data.dz);
        
        // Raycast from remote origin to find end point
        const hitResult = collision.castRay(origin, direction, 1000);
        const endPoint = hitResult ? hitResult.point : origin.clone().add(direction.multiplyScalar(100));
        
        BulletTracer.create(origin, endPoint);
    });
    
    if (!isTestRoom) {
        if (!localStorage.getItem('vshift_callsign')) {
            gameState.transition(STATES.NAME_SELECT);
        } else {
            gameState.transition(STATES.MAIN_MENU);
        }
    }
};

init();
