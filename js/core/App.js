// js/core/App.js
import { EnhancedXRManager } from './EnhancedXRManager.js';
import { CyberpunkXRExperience } from '../experiences/CyberpunkXRExperience.js';
import { MapSystem } from './systems/MapSystem.js';  // Add MapSystem import

export class App {
  constructor() {
    // Initialize Three.js core components
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.camera = new THREE.PerspectiveCamera();
    this.scene = new THREE.Scene();
    
    // Set initial camera position
    this.camera.position.set(0, 1.6, 5);
    
    // Add VR button to DOM
    document.body.appendChild(this.renderer.domElement);
    
    // Initialize enhanced XR manager
    this.xrManager = new EnhancedXRManager(this.renderer, this.camera, this.scene);
    
    // Initialize MapSystem (will be activated on demand)
    this.mapSystem = null;
    this.isMapActive = false;
    
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
    
    // Add grid helper for visual reference
    const gridHelper = new THREE.GridHelper(50, 20, 0xffde37, 0x444444);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const dirLight = new THREE.DirectionalLight(0xffde37, 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);
  }

  async init() {
    try {
      // Initialize experience
      await this.experience.init();
      
      // Setup MapSystem after experience is ready
      this.setupMapSystem();
      
      // Setup UI controls
      this.setupMapControls();
      
      // Handle window resize
      window.addEventListener('resize', this.onWindowResize.bind(this));
      this.onWindowResize();
      
      // Start animation loop
      this.renderer.setAnimationLoop(this.update.bind(this));
      
      console.log('App initialized with MapSystem');
    } catch (error) {
      console.error('App initialization failed:', error);
      this.showError('Failed to initialize gallery');
    }
  }

  setupMapSystem() {
    try {
      this.mapSystem = new MapSystem({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer
      });
      
      // Load POIs from your gallery
      this.loadMapPOIs();
      
      console.log('MapSystem initialized');
    } catch (error) {
      console.warn('MapSystem initialization failed:', error);
      this.mapSystem = null;
    }
  }

  loadMapPOIs() {
    // Define POIs based on your gallery layout
    const pois = [
      { 
        name: 'North Gallery', 
        position: [0, 1.5, -4], 
        description: 'GPK Cards 1-3' 
      },
      { 
        name: 'East Gallery', 
        position: [4, 1.5, 0], 
        description: 'GPK Cards 4-6' 
      },
      { 
        name: 'South Gallery', 
        position: [0, 1.5, 4], 
        description: 'GPK Cards 7-9' 
      },
      { 
        name: 'West Gallery', 
        position: [-4, 1.5, 0], 
        description: 'GPK Cards 10-12' 
      },
      { 
        name: 'Featured Display', 
        position: [0, 1.5, 0], 
        description: 'Rotating featured card' 
      }
    ];
    
    if (this.mapSystem && this.mapSystem.setPOIs) {
      this.mapSystem.setPOIs(pois);
    }
  }

  setupMapControls() {
    // Create map toggle button
    const mapButton = document.createElement('button');
    mapButton.id = 'map-toggle-btn';
    mapButton.innerHTML = '🗺️ Map';
    mapButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 12px 20px;
      background: rgba(26, 26, 26, 0.9);
      color: #ffde37;
      border: 2px solid #ffde37;
      border-radius: 10px;
      cursor: pointer;
      z-index: 10000;
      font-family: 'Bangers', cursive;
      font-size: 1.2rem;
      backdrop-filter: blur(5px);
      transition: all 0.2s;
    `;
    
    mapButton.addEventListener('mouseenter', () => {
      mapButton.style.background = '#ff3e41';
      mapButton.style.transform = 'scale(1.05)';
    });
    
    mapButton.addEventListener('mouseleave', () => {
      mapButton.style.background = 'rgba(26, 26, 26, 0.9)';
      mapButton.style.transform = 'scale(1)';
    });
    
    mapButton.addEventListener('click', () => this.toggleMap());
    
    document.body.appendChild(mapButton);
    
    // Create map control panel
    this.createMapControlPanel();
  }

  createMapControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'map-control-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      background: rgba(26, 26, 26, 0.95);
      border: 2px solid #ffde37;
      border-radius: 10px;
      padding: 15px;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 9999;
      display: none;
      max-width: 250px;
      backdrop-filter: blur(5px);
    `;
    
    panel.innerHTML = `
      <h3 style="color: #ffde37; margin: 0 0 10px 0;">Map Controls</h3>
      <button id="center-map" style="
        width: 100%;
        padding: 8px;
        margin: 5px 0;
        background: #ff3e41;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Center Map</button>
      <button id="reset-view" style="
        width: 100%;
        padding: 8px;
        margin: 5px 0;
        background: #444;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Reset View</button>
      <div id="poi-list" style="
        margin-top: 10px;
        max-height: 200px;
        overflow-y: auto;
      "></div>
    `;
    
    document.body.appendChild(panel);
    
    // Add event listeners
    panel.querySelector('#center-map').addEventListener('click', () => {
      if (this.mapSystem && this.mapSystem.centerMap) {
        this.mapSystem.centerMap();
      }
    });
    
    panel.querySelector('#reset-view').addEventListener('click', () => {
      if (this.mapSystem && this.mapSystem.resetView) {
        this.mapSystem.resetView();
      }
    });
    
    this.mapControlPanel = panel;
  }

  toggleMap() {
    if (!this.mapSystem) {
      this.showError('Map system not available');
      return;
    }
    
    this.isMapActive = !this.isMapActive;
    
    if (this.mapSystem.toggleMapVisibility) {
      this.mapSystem.toggleMapVisibility();
    }
    
    // Show/hide control panel
    this.mapControlPanel.style.display = this.isMapActive ? 'block' : 'none';
    
    // Update POI list when map is activated
    if (this.isMapActive) {
      this.updatePOIList();
    }
    
    // Visual feedback
    const button = document.getElementById('map-toggle-btn');
    button.style.background = this.isMapActive ? '#ff3e41' : 'rgba(26, 26, 26, 0.9)';
  }

  updatePOIList() {
    const poiList = this.mapControlPanel.querySelector('#poi-list');
    if (!poiList) return;
    
    poiList.innerHTML = '<div style="color: #ffde37; margin-bottom: 5px;">📍 Points of Interest</div>';
    
    const pois = [
      { name: 'North Gallery', pos: [0, 1.5, -4] },
      { name: 'East Gallery', pos: [4, 1.5, 0] },
      { name: 'South Gallery', pos: [0, 1.5, 4] },
      { name: 'West Gallery', pos: [-4, 1.5, 0] },
      { name: 'Featured Card', pos: [0, 1.5, 0] }
    ];
    
    pois.forEach(poi => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px;
        margin: 3px 0;
        background: rgba(255,255,255,0.1);
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.2s;
      `;
      item.textContent = poi.name;
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,222,55,0.3)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(255,255,255,0.1)';
      });
      
      item.addEventListener('click', () => {
        if (this.mapSystem && this.mapSystem.focusOnPOI) {
          this.mapSystem.focusOnPOI({ position: poi.pos });
        }
      });
      
      poiList.appendChild(item);
    });
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 62, 65, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      z-index: 10001;
      font-family: Arial, sans-serif;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(time) {
    // Update experience logic
    if (this.experience && this.experience.update) {
      this.experience.update(time);
    }
    
    // Update MapSystem
    if (this.mapSystem && this.mapSystem.update) {
      this.mapSystem.update(time);
    }
    
    // Update XR systems
    if (this.xrManager) {
      this.xrManager.update(time);
    }
    
    // Only render if not in XR session
    if (!this.renderer.xr.isPresenting) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.setAnimationLoop(null);
    
    // Clean up MapSystem
    if (this.mapSystem && this.mapSystem.destroy) {
      this.mapSystem.destroy();
    }
    
    // Remove UI elements
    const mapButton = document.getElementById('map-toggle-btn');
    if (mapButton) mapButton.remove();
    
    if (this.mapControlPanel) {
      this.mapControlPanel.remove();
    }
  }
}