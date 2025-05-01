// js/core/TeleportControls.js
export class TeleportControls {
  constructor(renderer, camera, scene) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.teleportTarget = null;
    this.teleportCurve = null;
    this.teleportEnabled = false;
    this.floorObjects = [];
    this.init();
  }

  init() {
    // Create teleport target indicator
    this.teleportTarget = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.25, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      })
    );
    this.teleportTarget.rotateX(-Math.PI / 2);
    this.teleportTarget.visible = false;
    this.scene.add(this.teleportTarget);

    // Create teleport curve
    this.teleportCurve = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 })
    );
    this.teleportCurve.visible = false;
    this.scene.add(this.teleportCurve);

    // Find floor objects for teleportation
    this.findFloorObjects();

    // Set up controller events
    this.setupControllerEvents();
  }

  findFloorObjects() {
    this.scene.traverse(obj => {
      if (obj.userData.isFloor) {
        this.floorObjects.push(obj);
      }
    });

    // Default floor if none specified
    if (this.floorObjects.length === 0) {
      this.floorObjects.push(this.scene.getObjectByName('ground') || 
                           this.scene.getObjectByName('floor'));
    }
  }

  setupControllerEvents() {
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      
      controller.addEventListener('squeezestart', () => {
        this.teleportEnabled = true;
        this.teleportTarget.visible = true;
        this.teleportCurve.visible = true;
      });
      
      controller.addEventListener('squeezeend', () => {
        if (this.teleportEnabled && this.teleportTarget.visible) {
          this.executeTeleport();
        }
        this.teleportEnabled = false;
        this.teleportTarget.visible = false;
        this.teleportCurve.visible = false;
      });
      
      controller.addEventListener('select', () => {
        if (this.teleportEnabled) {
          this.executeTeleport();
          this.teleportEnabled = false;
          this.teleportTarget.visible = false;
          this.teleportCurve.visible = false;
        }
      });
    }
  }

  updateTeleportArc(controller) {
    if (!this.teleportEnabled) return;

    const direction = new THREE.Vector3();
    controller.getWorldDirection(direction);
    const origin = controller.position.clone();
    
    // Create parabolic arc
    const points = [];
    const velocity = 5;
    const gravity = -9.8;
    const segments = 20;
    const timeStep = 0.1;

    for (let i = 0; i <= segments; i++) {
      const t = i * timeStep;
      const x = origin.x + direction.x * velocity * t;
      const y = origin.y + direction.y * velocity * t + 0.5 * gravity * t * t;
      const z = origin.z + direction.z * velocity * t;
      points.push(new THREE.Vector3(x, y, z));

      // Check for floor collision
      if (i > 0) {
        const prevPoint = points[i-1];
        const raycaster = new THREE.Raycaster(
          prevPoint,
          new THREE.Vector3().subVectors(points[i], prevPoint).normalize(),
          0,
          prevPoint.distanceTo(points[i])
        );

        const intersects = raycaster.intersectObjects(this.floorObjects);
        if (intersects.length > 0) {
          // Update teleport target position
          this.teleportTarget.position.copy(intersects[0].point);
          this.teleportTarget.position.y += 0.01; // Slightly above floor
          
          // Shorten the arc to intersection point
          points.length = i + 1;
          points[i].copy(intersects[0].point);
          break;
        }
      }
    }

    // Update curve visualization
    const positions = [];
    points.forEach(point => {
      positions.push(point.x, point.y, point.z);
    });
    
    this.teleportCurve.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
  }

  executeTeleport() {
    if (!this.teleportTarget.visible) return;

    // Calculate new camera position
    const offset = new THREE.Vector3();
    offset.subVectors(this.camera.position, this.renderer.xr.getCamera().position);
    offset.y = 0; // Keep vertical position
    
    this.camera.position.copy(this.teleportTarget.position).add(offset);
    
    // Dispatch teleport event
    this.dispatchEvent({ 
      type: 'teleport', 
      position: this.teleportTarget.position.clone() 
    });
  }

  update() {
    if (!this.teleportEnabled) return;

    // Update teleport arc for both controllers
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      this.updateTeleportArc(controller);
    }
  }
}
