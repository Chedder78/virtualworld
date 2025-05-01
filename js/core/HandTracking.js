// js/core/HandTracking.js
export class HandTracking {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.handMeshes = new Map();
    this.jointSpheres = [];
    this.handControllers = [];
    this.init();
  }

  async init() {
    // Check for hand tracking support
    if (!this.renderer.xr.isHandTrackingSupported) {
      console.warn('Hand tracking not supported');
      return;
    }

    // Create hand models
    this.createHandModels();
    
    // Set up hand controllers
    this.setupHandControllers();
  }

  createHandModels() {
    const handGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    const handMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });

    // Create spheres for each joint
    for (let i = 0; i < 25; i++) { // 25 joints per hand
      const sphere = new THREE.Mesh(handGeometry, handMaterial);
      sphere.visible = false;
      this.scene.add(sphere);
      this.jointSpheres.push(sphere);
    }

    // Create line segments for bones
    this.handLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
    );
    this.scene.add(this.handLines);
  }

  setupHandControllers() {
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.hand = this.renderer.xr.getHand(i);
      controller.addEventListener('connected', (event) => {
        if (event.data.targetRayMode === 'tracked-pointer') {
          if (event.data.hand) {
            this.setupHandTracking(event.data.hand);
          }
        }
      });
      this.scene.add(controller);
      this.scene.add(controller.hand);
      this.handControllers.push(controller);
    }
  }

  setupHandTracking(handInput) {
    const handMesh = new THREE.Group();
    this.scene.add(handMesh);
    this.handMeshes.set(handInput, handMesh);

    handInput.addEventListener('pinchstart', () => this.onPinchStart(handInput));
    handInput.addEventListener('pinchend', () => this.onPinchEnd(handInput));
  }

  updateHandModel(handInput) {
    if (!this.handMeshes.has(handInput)) return;

    const joints = handInput.joints;
    if (!joints) return;

    // Update joint positions
    joints.forEach((joint, index) => {
      if (joint.visible && this.jointSpheres[index]) {
        this.jointSpheres[index].position.copy(joint.position);
        this.jointSpheres[index].quaternion.copy(joint.quaternion);
        this.jointSpheres[index].visible = true;
      }
    });

    // Update bone connections
    const linePositions = [];
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
    ];

    connections.forEach(conn => {
      if (joints[conn[0]]?.visible && joints[conn[1]]?.visible) {
        linePositions.push(joints[conn[0]].position.x, joints[conn[0]].position.y, joints[conn[0]].position.z);
        linePositions.push(joints[conn[1]].position.x, joints[conn[1]].position.y, joints[conn[1]].position.z);
      }
    });

    this.handLines.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
  }

  onPinchStart(handInput) {
    // Handle pinch gesture
    console.log('Pinch started with hand:', handInput.handedness);
    this.triggerAction(handInput);
  }

  onPinchEnd(handInput) {
    console.log('Pinch ended with hand:', handInput.handedness);
  }

  triggerAction(handInput) {
    // Raycast from index finger to interact with objects
    const joints = handInput.joints;
    if (!joints || !joints['index-finger-tip']) return;

    const raycaster = new THREE.Raycaster();
    raycaster.set(joints['index-finger-tip'].position, 
                 joints['index-finger-tip'].direction);

    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (object.userData.interactive) {
        object.dispatchEvent({ type: 'hand-interact', hand: handInput });
      }
    }
  }

  update() {
    // Update hand models each frame
    this.handControllers.forEach(controller => {
      if (controller.hand?.joints) {
        this.updateHandModel(controller.hand);
      }
    });
  }
}
