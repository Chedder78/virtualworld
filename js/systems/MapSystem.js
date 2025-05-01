// js/systems/MapSystem.js
export class MapSystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.mapTexture = null;
    this.mapPlane = null;
    this.poiLocations = [];
    this.mapScale = 100;
    this.pinchStartDistance = 0;
    this.activeController = null;
    this.vrMarker = null;
    this.init();
  }

  async init() {
    // Load map texture
    const textureLoader = new THREE.TextureLoader();
    this.mapTexture = await new Promise(resolve => {
      textureLoader.load('assets/map-texture.jpg', resolve);
    });

    // Create 3D map
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

    // Set up controls and POIs
    this.setupMapControls();
    await this.loadPOIs();
  }

  async loadPOIs() {
    try {
      const response = await fetch('assets/data/pois.json');
      this.poiLocations = await response.json();
    } catch (error) {
      console.error('Using default POIs:', error);
      this.poiLocations = [
        { x: 30, z: 45, name: "Main Plaza", color: 0xff00ff },
        { x: 70, z: 20, name: "Gallery", color: 0x00ff00 },
        { x: 15, z: 80, name: "Observation Deck", color: 0xffff00 }
      ];
    }
    this.setupPOIs();
    this.createMapLabels();
  }

  setupMapControls() {
    // Mouse wheel zoom
    document.addEventListener('wheel', (e) => {
      if (this.mapPlane?.visible) {
        e.preventDefault();
        const zoomFactor = 1 + e.deltaY * -0.001;
        this.mapPlane.scale.multiplyScalar(zoomFactor);
        this.mapPlane.scale.clampScalar(0.5, 3);
      }
    }, { passive: false });

    // Touch pinch zoom
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && this.mapPlane?.visible) {
        this.pinchStartDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && this.pinchStartDistance > 0) {
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const zoomFactor = currentDistance / this.pinchStartDistance;
        this.mapPlane.scale.multiplyScalar(zoomFactor);
        this.pinchStartDistance = currentDistance;
      }
    });

    // VR controller interactions
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', () => {
        if (this.mapPlane.visible) this.activeController = controller;
      });
      controller.addEventListener('selectend', () => {
        this.activeController = null;
      });
      this.scene.add(controller);
    }
  }

  setupPOIs() {
    this.poiLocations.forEach(poi => {
      const marker = this.createPOIMarker(poi);
      this.scene.add(marker);
    });
    this.updateUIMap();
  }

  createPOIMarker(poi) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: poi.color });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(
      (poi.x / this.mapScale) - 5,
      0.5,
      (poi.z / this.mapScale) - 3
    );
    
    marker.userData = {
      isPOI: true,
      poiData: poi
    };
    
    return marker;
  }

  createMapLabels() {
    this.poiLocations.forEach(poi => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.roundRect(10, 10, ctx.measureText(poi.name).width + 20, 30, 8);
      ctx.fill();
      
      ctx.font = '16px "Bangers", sans-serif';
      ctx.fillStyle = `#${poi.color.toString(16).padStart(6, '0')}`;
      ctx.fillText(poi.name, 20, 30);
      
      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true })
      );
      sprite.scale.set(1, 0.5, 1);
      sprite.position.set(
        (poi.x / this.mapScale) - 5,
        1.5,
        (poi.z / this.mapScale) - 3
      );
      sprite.userData = { alwaysFaceCamera: true };
      this.scene.add(sprite);
    });
  }

  update() {
    this.updatePlayerMarker();
    this.handleVRMapInteraction();
    this.updateMapLabels();
  }

  handleVRMapInteraction() {
    if (!this.activeController || !this.mapPlane.visible) return;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromXRController(this.activeController);
    const intersects = raycaster.intersectObject(this.mapPlane);
    
    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const mapX = (hitPoint.x + 5) * this.mapScale;
      const mapZ = (hitPoint.z + 3) * this.mapScale;
      this.showVRTargetMarker(mapX, mapZ);
    }
  }

  showVRTargetMarker(x, z) {
    if (!this.vrMarker) {
      const geometry = new THREE.RingGeometry(0.2, 0.25, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        side: THREE.DoubleSide 
      });
      this.vrMarker = new THREE.Mesh(geometry, material);
      this.vrMarker.rotation.x = -Math.PI / 2;
      this.scene.add(this.vrMarker);
    }
    
    this.vrMarker.position.set(
      (x / this.mapScale) - 5,
      0.1,
      (z / this.mapScale) - 3
    );
  }

  updateUIMap() {
    const mapUI = document.querySelector('xr-map-ui');
    if (!mapUI) return;

    const container = mapUI.shadowRoot.querySelector('.map-container');
    container.querySelectorAll('.poi-marker').forEach(m => m.remove());

    this.poiLocations.forEach(poi => {
      const marker = document.createElement('div');
      marker.className = 'poi-marker';
      marker.style.left = `${poi.x / 100 * 300}px`;
      marker.style.top = `${poi.z / 100 * 200}px`;
      marker.style.backgroundColor = `#${poi.color.toString(16).padStart(6, '0')}`;
      marker.title = poi.name;
      marker.addEventListener('click', () => this.teleportToPOI(poi));
      container.appendChild(marker);
    });
  }

  updatePlayerMarker() {
    const marker = document.querySelector('xr-map-ui')?.shadowRoot?.getElementById('player-marker');
    if (!marker) return;
    
    const mapX = (this.camera.position.x + 5) * this.mapScale;
    const mapZ = (this.camera.position.z + 3) * this.mapScale;
    
    marker.style.left = `${Math.min(300, Math.max(0, mapX / 100 * 300))}px`;
    marker.style.top = `${Math.min(200, Math.max(0, mapZ / 100 * 200))}px`;
    
    const angle = Math.atan2(
      this.camera.getWorldDirection(new THREE.Vector3()).x,
      this.camera.getWorldDirection(new THREE.Vector3()).z
    );
    marker.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }

  updateMapLabels() {
    this.scene.children.forEach(child => {
      if (child.userData?.alwaysFaceCamera) {
        child.quaternion.copy(this.camera.quaternion);
      }
    });
  }

  teleportToPOI(poi) {
    const targetX = (poi.x / this.mapScale) - 5;
    const targetZ = (poi.z / this.mapScale) - 3;
    
    gsap.to(this.camera.position, {
      x: targetX,
      z: targetZ,
      duration: 1,
      ease: "power2.inOut"
    });
  }

  toggleMap() {
    this.mapPlane.visible = !this.mapPlane.visible;
    
    if (this.renderer.xr.isPresenting && this.mapPlane.visible) {
      this.camera.getWorldDirection(this.mapPlane.position);
      this.mapPlane.position.multiplyScalar(3).add(this.camera.position);
      this.mapPlane.position.y = 1.5;
      this.mapPlane.lookAt(this.camera.position);
    }
  }
}
