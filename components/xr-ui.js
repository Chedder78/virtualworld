// components/xr-ui.js
const template = document.createElement('template');
template.innerHTML = `
  <style>
    .xr-ui {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      padding: 10px 20px;
      border-radius: 20px;
      color: white;
      font-family: sans-serif;
      display: flex;
      gap: 15px;
      align-items: center;
      z-index: 1000;
    }
    
    .xr-ui.hidden {
      display: none;
    }
    
    .xr-tip {
      font-size: 14px;
    }
  </style>
  
  <div class="xr-ui hidden">
    <div class="xr-tip">Use controllers to interact with holograms</div>
  </div>
`;

class XRUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.uiElement = this.shadowRoot.querySelector('.xr-ui');
  }

  connectedCallback() {
    // Listen for XR session changes
    document.addEventListener('xr-session-start', () => this.showUI());
    document.addEventListener('xr-session-end', () => this.hideUI());
  }

  showUI() {
    this.uiElement.classList.remove('hidden');
  }

  hideUI() {
    this.uiElement.classList.add('hidden');
  }
}

customElements.define('xr-ui', XRUI);
