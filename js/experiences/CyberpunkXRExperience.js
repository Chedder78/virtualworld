// js/experiences/CyberpunkXRExperience.js
import { XRExperience } from './XRExperience.js';

export class CyberpunkXRExperience extends XRExperience {
  constructor(config) {
    super(config);
    this.neonLights = [];
    this.holograms = [];
  }

  async init() {
    await super.init();
    this.setupCyberpunkScene();
  }

  setupCyberpunkScene() {
    // Neon buildings
    for (let i = 0; i < 8; i++) {
      const building = this.createNeonBuilding(
        Math.sin(i * Math.PI / 4) * 5,
        0,
        Math.cos(i * Math.PI / 4) * 5,
        2 + Math.random() * 3
      );
      this.scene.add(building);
      this.xrObjects.push(building);
    }
    
    // Interactive holograms
    this.createInteractiveHolograms();
  }

  createNeonBuilding(x, y, z, height) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    // Building structure
    const geometry = new THREE.BoxGeometry(1, height, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x111122,
      emissive: 0x000044,
      metalness: 0.9,
      roughness: 0.1
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.y = height / 2;
    group.add(building);
    
    // Neon strips
    const neonGeometry = new THREE.BoxGeometry(1.05, 0.1, 0.1);
    const neonMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2
    });
    
    for (let i = 0; i < height; i++) {
      const neon = new THREE.Mesh(neonGeometry, neonMaterial);
      neon.position.set(0, i, 0.55);
      group.add(neon);
      this.neonLights.push(neon);
    }
    
    return group;
  }

  createInteractiveHolograms() {
    const hologramGeometry = new THREE.IcosahedronGeometry(0.5, 3);
    
    for (let i = 0; i < 3; i++) {
      const hologram = new THREE.Mesh(
        hologramGeometry,
        new THREE.MeshPhysicalMaterial({
          transmission: 0.95,
          thickness: 0.5,
          roughness: 0,
          clearcoat: 1,
          ior: 1.33,
          color: new THREE.Color().setHSL(i / 3, 1, 0.7)
        })
      );
      
      hologram.position.set(
        Math.sin(i * Math.PI * 2 / 3) * 2,
        1.5,
        Math.cos(i * Math.PI * 2 / 3) * 2
      );
      
      hologram.userData.interactive = true;
      hologram.userData.color = hologram.material.color.clone();
      
      this.scene.add(hologram);
      this.holograms.push(hologram);
      this.xrObjects.push(hologram);
    }
  }

  onSelectStart(controllerId) {
    const controller = this.renderer.xr.getController(controllerId);
    
    // Raycast to check for hologram interaction
    const raycaster = new THREE.Raycaster();
    raycaster.setFromXRController(controller);
    
    const intersects = raycaster.intersectObjects(this.holograms);
    if (intersects.length > 0) {
      const hologram = intersects[0].object;
      hologram.material.color.setHSL(Math.random(), 1, 0.7);
      hologram.scale.setScalar(1.2);
    }
  }

  onSelectEnd(controllerId) {
    // Reset hologram scale
    this.holograms.forEach(h => {
      h.scale.setScalar(1);
      h.material.color.copy(h.userData.color);
    });
  }

  update() {
    super.update();
    
    // Animate neon lights
    const time = performance.now() * 0.001;
    this.neonLights.forEach((light, i) => {
      light.material.emissiveIntensity = Math.sin(time * 2 + i) * 0.5 + 1.5;
    });
    
    // Rotate holograms
    this.holograms.forEach((hologram, i) => {
      hologram.rotation.y = time * 0.5 + i;
    });
  }
}
