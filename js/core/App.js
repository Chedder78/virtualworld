// js/core/App.js
import { WebXRManager } from './WebXRManager.js';
import { CyberpunkXRExperience } from '../experiences/CyberpunkXRExperience.js';

export class App {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.camera = new THREE.PerspectiveCamera();
    this.scene = new THREE.Scene();
    
    // Initialize managers
    this.xrManager = new WebXRManager(this.renderer, this.camera, this.scene);
    this.experience = new CyberpunkXRExperience({
      renderer: this.renderer,
      camera: this.camera,
      scene: this.scene
    });
    
    this.init();
  }

  async init() {
    // Initialize experience
    await this.experience.init();
    
    // Start animation loop
    this.renderer.setAnimationLoop(this.update.bind(this));
  }

  update(time) {
    // Update experience
    this.experience.update(time);
    
    // Render scene
    if (!this.xrManager.xrSession) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
