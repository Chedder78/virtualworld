// js/core/ExperienceManager.js
export class ExperienceManager {
    constructor({ renderer, textures, models }) {
        this.availableExperiences = new Map([
            ['cyberpunk', CyberpunkExperience],
            ['nature', NatureExperience],
            ['abstract', AbstractExperience],
            ['futurism', FuturismExperience]
        ]);
        
        this.currentExperience = null;
        this.init();
    }
    
    async init() {
        // Load default experience
        await this.switchExperience('cyberpunk');
    }
    
    async switchExperience(name) {
        // Clean up current experience
        if (this.currentExperience) {
            await this.currentExperience.destroy();
        }
        
        // Initialize new experience
        const ExperienceClass = this.availableExperiences.get(name);
        this.currentExperience = new ExperienceClass(this.config);
        await this.currentExperience.init();
    }
    
    update(time) {
        if (this.currentExperience?.update) {
            this.currentExperience.update(time);
        }
    }
}
