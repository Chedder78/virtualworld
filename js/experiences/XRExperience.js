// js/experiences/XRExperience.js
export class XRExperience {
  constructor(config) {
    this.config = config;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.xrObjects = [];
  }

  async init() {
    // Setup common XR elements
    this.setupXREnvironment();
    this.setupXRLighting();
    
    // Position camera for non-XR view
    this.camera.position.set(0, 1.6, 5);
  }

  setupXREnvironment() {
    // Floor grid for orientation
    const grid = new THREE.GridHelper(20, 20, 0x555555, 0x333333);
    grid.position.y = -0.01; // Slightly below floor to avoid z-fighting
    this.scene.add(grid);
    this.xrObjects.push(grid);
    
    // Add controller models when in VR
    if (this.renderer.xr.enabled) {
      this.setupXRControllers();
    }
  }

  setupXRLighting() {
    // XR-friendly lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);
    this.xrObjects.push(ambient);
    
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(1, 1, 1);
    this.scene.add(directional);
    this.xrObjects.push(directional);
  }

  setupXRControllers() {
    const controllerModelFactory = new XRControllerModelFactory();
    
    // Create controllers
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', () => this.onSelectStart(i));
      controller.addEventListener('selectend', () => this.onSelectEnd(i));
      this.scene.add(controller);
      this.xrObjects.push(controller);
      
      // Add controller model
      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));
      this.scene.add(grip);
      this.xrObjects.push(grip);
    }
  }

  onSelectStart(controllerId) {
    // Handle controller selection
    console.log(`Controller ${controllerId} selected`);
  }

  onSelectEnd(controllerId) {
    // Handle controller deselection
    console.log(`Controller ${controllerId} released`);
  }

  update() {
    // Update logic for both XR and non-XR
  }

  destroy() {
    // Clean up XR-specific objects
    this.xrObjects.forEach(obj => {
      if (obj.parent) obj.parent.remove(obj);
      if (obj.dispose) obj.dispose();
    });
  }
}
