// components/vr-movement-ui.js
const template = document.createElement('template');
template.innerHTML = `
  <style>
    .vr-movement-ui {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      padding: 15px 25px;
      border-radius: 30px;
      color: white;
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }
    
    .vr-movement-ui.hidden {
      display: none;
    }
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .instructions {
      font-size: 14px;
      text-align: center;
      max-width: 300px;
    }
    
    .controller-hint {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-top: 10px;
    }
    
    .controller-icon {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
  
  <div class="vr-movement-ui hidden">
    <div class="title">MOVEMENT CONTROLS</div>
    <div class="instructions">
      Squeeze the controller grip button to activate teleportation arc.
      Release to teleport to the highlighted location.
    </div>
    <div class="controller-hint">
      <div class="controller-icon">✋</div>
      <div>Grip + Trigger to Teleport</div>
    </div>
  </div>
`;

class VRMovementUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.uiElement = this.shadowRoot.querySelector('.vr-movement-ui');
  }

  connectedCallback() {
    // Listen for XR events
    document.addEventListener('xr-session-start', () => this.showUI());
    document.addEventListener('xr-session-end', () => this.hideUI());
  }

  showUI() {
    // Only show if VR (not AR)
    if (this.renderer.xr.environmentBlendMode === 'opaque') {
      this.uiElement.classList.remove('hidden');
      // Hide after 10 seconds
      setTimeout(() => this.hideUI(), 10000);
    }
  }

  hideUI() {
    this.uiElement.classList.add('hidden');
  }
}

customElements.define('vr-movement-ui', VRMovementUI);
