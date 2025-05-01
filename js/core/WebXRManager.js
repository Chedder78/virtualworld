// js/core/WebXRManager.js
export class WebXRManager {
  constructor(renderer, camera, scene) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.xrSession = null;
    this.xrReferenceSpace = null;
    this.xrHitTestSource = null;
    this.xrButton = null;
    
    // Initialize WebXR
    this.init();
  }

  async init() {
    // Check for WebXR support
    if (!navigator.xr) {
      console.warn('WebXR not supported');
      return;
    }

    // Create XR button
    this.createXRButton();

    // Enable XR in renderer
    this.renderer.xr.enabled = true;
    this.renderer.xr.setReferenceSpaceType('local-floor');
  }

  createXRButton() {
    this.xrButton = document.createElement('button');
    this.xrButton.id = 'xr-button';
    this.xrButton.innerHTML = '<sl-icon name="vr-headset"></sl-icon> ENTER XR';
    this.xrButton.classList.add('xr-button');
    
    // Style the button
    const style = document.createElement('style');
    style.textContent = `
      .xr-button {
        position: fixed;
        bottom: var(--space-lg);
        right: var(--space-lg);
        z-index: 1000;
        background: var(--accent-1);
        color: white;
        border: none;
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-full);
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: all var(--transition-medium) ease;
      }
      
      .xr-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(0,0,0,0.4);
      }
      
      .xr-button sl-icon {
        font-size: 1.2em;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.xrButton);
    
    // Add click handler
    this.xrButton.addEventListener('click', () => this.toggleXR());
  }

  async toggleXR() {
    if (this.xrSession) {
      await this.endXR();
    } else {
      await this.startXR();
    }
  }

  async startXR() {
    try {
      // Request session
      const sessionInit = { 
        optionalFeatures: ['local-floor', 'hand-tracking', 'hit-test'] 
      };
      this.xrSession = await navigator.xr.requestSession('immersive-vr', sessionInit);
      
      // Update UI
      this.xrButton.innerHTML = '<sl-icon name="x-circle"></sl-icon> EXIT XR';
      
      // Set up session
      this.setupXRSession();
      
    } catch (error) {
      console.error('Failed to start XR session:', error);
    }
  }

  setupXRSession() {
    // Handle session end
    this.xrSession.addEventListener('end', () => this.endXR());
    
    // Set up render loop
    this.renderer.xr.setSession(this.xrSession);
    this.renderer.setAnimationLoop(this.onXRFrame.bind(this));
    
    // Request reference space
    this.xrSession.requestReferenceSpace('local-floor').then(refSpace => {
      this.xrReferenceSpace = refSpace;
    });
    
    // Set up hit test for AR
    if (this.xrSession.environmentBlendMode === 'opaque') {
      this.setupHitTest();
    }
  }

  async setupHitTest() {
    const session = this.xrSession;
    const viewerSpace = await session.requestReferenceSpace('viewer');
    this.xrHitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    
    // Add reticle for placement
    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.reticle.visible = false;
    this.scene.add(this.reticle);
  }

  onXRFrame(time, frame) {
    if (!this.xrSession) return;
    
    // Handle hit test in AR
    if (this.xrHitTestSource && frame) {
      const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(this.xrReferenceSpace);
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        this.reticle.visible = false;
      }
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  async endXR() {
    if (this.xrSession) {
      await this.xrSession.end();
    }
    
    // Clean up
    this.xrSession = null;
    this.xrButton.innerHTML = '<sl-icon name="vr-headset"></sl-icon> ENTER XR';
    this.renderer.setAnimationLoop(null);
    
    // Remove reticle if exists
    if (this.reticle) {
      this.scene.remove(this.reticle);
      this.reticle = null;
    }
  }
}
