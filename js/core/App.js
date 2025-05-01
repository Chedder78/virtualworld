// In your App.js
import { MapSystem } from './systems/MapSystem.js';

export class App {
  constructor() {
    // ... existing code ...// js/core/App.js
import { EnhancedXRManager } from './EnhancedXRManager.js'; // Replace WebXRManager
import { CyberpunkXRExperience } from '../experiences/CyberpunkXRExperience.js';

export class App {
  constructor() {
    // Initialize Three.js core components
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.camera = new THREE.PerspectiveCamera();
    this.scene = new THREE.Scene();
    
    // Add VR button to DOM (if needed)
    document.body.appendChild(this.renderer.domElement);
    
    // Initialize enhanced XR manager (replaces WebXRManager)
    this.xrManager = new EnhancedXRManager(this.renderer, this.camera, this.scene);
    
    // Create essential environment elements
    this.createEnvironment();
    
    // Initialize experience
    this.experience = new CyberpunkXRExperience({
      renderer: this.renderer,
      camera: this.camera,
      scene: this.scene
    });
    
    this.init();
  }

  createEnvironment() {
    // Add floor for teleportation
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ 
        color: 0x222233,
        roughness: 0.8,
        metalness: 0.2
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    floor.userData.isFloor = true; // Mark as teleportable surface
    this.scene.add(floor);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
  }

  async init() {
    try {
      // Initialize experience
      await this.experience.init();
      
      // Handle window resize
      window.addEventListener('resize', this.onWindowResize.bind(this));
      this.onWindowResize();
      
      // Start animation loop
      this.renderer.setAnimationLoop(this.update.bind(this));
      
    } catch (error) {
      console.error('App initialization failed:', error);
      // Show error UI to user
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(time) {
    // Update experience logic
    this.experience.update(time);
    
    // Update XR systems (hand tracking, teleportation, etc.)
    if (this.xrManager) {
      this.xrManager.update(time);
    }
    
    // Only render if not in XR session (XR sessions handle their own rendering)
    if (!this.renderer.xr.isPresenting) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Clean up if needed
  destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.setAnimationLoop(null);
    // Additional cleanup as needed
  }
}
