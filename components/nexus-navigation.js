// components/nexus-navigation.js
const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
            position: fixed;
            bottom: var(--space-lg);
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
        }
        
        .experience-selector {
            display: flex;
            gap: var(--space-sm);
            background: var(--surface-2);
            padding: var(--space-sm);
            border-radius: var(--radius-full);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        }
        
        .experience-btn {
            all: unset;
            width: 44px;
            height: 44px;
            border-radius: var(--radius-full);
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: all var(--transition-medium) ease;
        }
        
        .experience-btn:hover {
            transform: translateY(-3px);
        }
        
        .experience-btn[active] {
            background: var(--accent-1);
            color: white;
        }
    </style>
    
    <div class="experience-selector">
        <button class="experience-btn" data-experience="cyberpunk">
            <sl-icon name="cpu"></sl-icon>
        </button>
        <button class="experience-btn" data-experience="nature">
            <sl-icon name="tree"></sl-icon>
        </button>
        <button class="experience-btn" data-experience="abstract">
            <sl-icon name="circle-half"></sl-icon>
        </button>
        <button class="experience-btn" data-experience="futurism">
            <sl-icon name="stars"></sl-icon>
        </button>
    </div>
`;

class NexusNavigation extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        
        this.buttons = this.shadowRoot.querySelectorAll('.experience-btn');
        this.activeExperience = 'cyberpunk';
    }
    
    connectedCallback() {
        this.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const experience = btn.dataset.experience;
                this.setExperience(experience);
                
                // Dispatch event to parent
                this.dispatchEvent(new CustomEvent('experience-change', {
                    detail: { experience }
                }));
            });
        });
    }
    
    setExperience(experience) {
        this.activeExperience = experience;
        this.buttons.forEach(btn => {
            const isActive = btn.dataset.experience === experience;
            btn.toggleAttribute('active', isActive);
        });
    }
}

customElements.define('nexus-navigation', NexusNavigation);
