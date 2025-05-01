// js/systems/MapSystem.js
export class MapSystem {
  constructor(scene, camera, renderer) {
    this.setupMapControls()
    setupMapControls() {
    // Mouse wheel zoom
    document.addEventListener('wheel', (e) => {
      if (this.mapPlane?.visible) {
        e.preventDefault();
        const zoomFactor = 1 + e.deltaY * -0.001;
        this.mapPlane.scale.multiplyScalar(zoomFactor);
  export class MapSystem {
  constructor(scene, camera, renderer) {
    // ... existing constructor code ...
    this.setupMapControls(); // Add this line
  }

  // ADD THIS NEW METHOD:
  setupMapControls() {
    // Mouse wheel zoom
    document.addEventListener('wheel', (e) => {
      if (this.mapPlane?.visible) {
        e.preventDefault();
        const zoomFactor = 1 + e.deltaY * -0.001;
        this.mapPlane.scale.multiplyScalar(zoomFactor);
        
        // Constrain zoom levels
        this.mapPlane.scale.clampScalar(0.5, 3);
      }
    }, { passive: false });

    // Touch pinch zoom (for mobile/VR controllers)
    this.pinchStartDistance = 0;
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && this.mapPlane?.visible) {
        this.pinchStartDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.mapTexture = null;
    this.mapPlane = null;
    this.poiLocations = [];
    this.mapScale = 100; // Scale between map pixels and 3D space
    this.init();
  }

  async init() {
    // Load map texture
    const textureLoader = new THREE.TextureLoader();
    this.mapTexture = await new Promise(resolve => {
      textureLoader.load('assets/map-texture.jpg', resolve);
    });

    // Create 3D map (initially hidden)
    this.mapPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      new THREE.MeshBasicMaterial({
        map: this.mapTexture,
        transparent: true,
        opacity: 0.9
      })
    );
    this.mapPlane.visible = false;
    this.mapPlane.position.set(0, 3, -5);
    this.mapPlane.rotation.x = -Math.PI / 4;
    this.scene.add(this.mapPlane);

    // Set up POIs (Points of Interest)
    this.setupPOIs();
  }

  setupPOIs() {
    this.poiLocations = [
      { x: 30, z: 45, name: "Main Plaza", color: 0xff00ff },
      { x: 70, z: 20, name: "Gallery", color: 0x00ff00 },
      { x: 15, z: 80, name: "Observation Deck", color: 0xffff00 }
    ];

    // Create 3D markers
    this.poiLocations.forEach(poi => {
      const marker = this.createPOIMarker(poi);
      this.scene.add(marker);
    });

    // Update UI map markers
    this.updateUIMap();
  }

  createPOIMarker(poi) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: poi.color });
    const marker = new THREE.Mesh(geometry, material);
    
    // Convert map coordinates to 3D space
    marker.position.set(
      (poi.x / this.mapScale) - 5,  // Center the map
      0.5,
      (poi.z / this.mapScale) - 3    // Center the map
    );
    
    marker.userData = {
      isPOI: true,
      poiData: poi
    };
    
    return marker;
  }

  updateUIMap() {
    const mapUI = document.querySelector('xr-map-ui');
    if (!mapUI) return;

    // Clear existing POI markers
    const container = mapUI.shadowRoot.querySelector('.map-container');
    const existingMarkers = container.querySelectorAll('.poi-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new POI markers
    this.poiLocations.forEach(poi => {
      const marker = document.createElement('div');
      marker.className = 'poi-marker';
      marker.style.left = `${poi.x / 100 * 300}px`;
      marker.style.top = `${poi.z / 100 * 200}px`;
      marker.style.backgroundColor = `#${poi.color.toString(16).padStart(6, '0')}`;
      marker.title = poi.name;
      
      marker.addEventListener('click', () => {
        this.teleportToPOI(poi);
      });
      
      container.appendChild(marker);
    });
  }

  teleportToPOI(poi) {
    // Convert map coordinates to 3D space
    const targetX = (poi.x / this.mapScale) - 5;
    const targetZ = (poi.z / this.mapScale) - 3;
    
    // Move camera (or player object)
    gsap.to(this.camera.position, {
      x: targetX,
      z: targetZ,
      duration: 1,
      ease: "power2.inOut"
    });
  }

  toggleMap() {
    this.mapPlane.visible = !this.mapPlane.visible;
    
    // In VR, position map in front of user
    if (this.renderer.xr.isPresenting && this.mapPlane.visible) {
      this.camera.getWorldDirection(this.mapPlane.position);
      this.mapPlane.position.multiplyScalar(3).add(this.camera.position);
      this.mapPlane.position.y = 1.5;
      this.mapPlane.lookAt(this.camera.position);
    }
  }

  update() {
    // Update player position on mini-map
    this.updatePlayerMarker();
  }

  updatePlayerMarker() {
    const marker = document.querySelector('xr-map-ui')?.shadowRoot?.getElementById('player-marker');
    if (!marker) return;
    
    // Convert 3D position to map coordinates
    const mapX = (this.camera.position.x + 5) * this.mapScale;
    const mapZ = (this.camera.position.z + 3) * this.mapScale;
    
    marker.style.left = `${Math.min(300, Math.max(0, mapX / 100 * 300))}px`;
    marker.style.top = `${Math.min(200, Math.max(0, mapZ / 100 * 200))}px`;
    
    // Rotate marker to match camera direction
    const angle = Math.atan2(
      this.camera.getWorldDirection(new THREE.Vector3()).x,
      this.camera.getWorldDirection(new THREE.Vector3()).z
    );
    marker.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }
}
