// js/core/EnhancedXRManager.js
import { HandTracking } from './HandTracking.js';
import { TeleportControls } from './TeleportControls.js';

export class EnhancedXRManager {
  constructor(renderer, camera, scene) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    
    // Initialize subsystems
    this.handTracking = new HandTracking(renderer, scene);
    this.teleportControls = new TeleportControls(renderer, camera, scene);
    
    // UI elements
    this.xrUI = document.createElement('xr-ui');
    document.body.appendChild(this.xrUI);
    
    this.init();
  }

  async init() {
    // Set up XR session
    this.renderer.xr.enabled = true;
    
    // Add session start/end listeners
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.onSessionStart();
    });
    
    this.renderer.xr.addEventListener('sessionend', () => {
      this.onSessionEnd();
    });
  }

  onSessionStart() {
    // Show XR UI
    this.xrUI.showUI();
    
    // Enable hand tracking if available
    if (this.renderer.xr.isHandTrackingSupported) {
      this.handTracking.init();
    }
    
    // Always enable teleport controls
    this.teleportControls.init();
  }

  onSessionEnd() {
    // Hide XR UI
    this.xrUI.hideUI();
  }

  update() {
    // Update subsystems
    this.handTracking.update();
    this.teleportControls.update();
  }
}
