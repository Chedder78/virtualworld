// js/experiences/CyberpunkExperience.js
export class CyberpunkExperience {
    constructor(config) {
        this.config = config;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();
    }
    
    async init() {
        // Setup scene
        this.setupEnvironment();
        this.setupLighting();
        this.setupObjects();
        this.setupPostProcessing();
        
        // Position camera
        this.camera.position.set(0, 1.6, 5);
    }
    
    setupEnvironment() {
        // Neon grid floor
        const gridTexture = new THREE.TextureLoader().load('assets/textures/grid.png');
        gridTexture.wrapS = gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.repeat.set(20, 20);
        
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({
                map: gridTexture,
                emissive: 0x00ffff,
                emissiveIntensity: 0.1,
                roughness: 0.8,
                metalness: 0.2
            })
        );
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);
        
        // Fog
        this.scene.fog = new THREE.FogExp2(0x000022, 0.002);
    }
    
    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        // Neon signs
        const neonColors = [0xff00ff, 0x00ffff, 0xffff00];
        for (let i = 0; i < 12; i++) {
            const light = new THREE.PointLight(
                neonColors[i % 3],
                2,
                10,
                2
            );
            light.position.set(
                Math.sin(i * Math.PI / 6) * 8,
                2,
                Math.cos(i * Math.PI / 6) * 8
            );
            this.scene.add(light);
            
            // Light helper
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 16, 16),
                new THREE.MeshBasicMaterial({ color: neonColors[i % 3] })
            );
            sphere.position.copy(light.position);
            this.scene.add(sphere);
        }
    }
    
    setupObjects() {
        // Holographic display
        this.hologram = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 0.1, 32),
            new THREE.MeshPhysicalMaterial({
                transmission: 0.9,
                roughness: 0,
                thickness: 0.5,
                ior: 1.5,
                chromaticAberration: 0.5
            })
        );
        this.hologram.position.y = 1.5;
        this.scene.add(this.hologram);
        
        // Floating particles
        this.particles = new THREE.Group();
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        for (let i = 0; i < 100; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                Math.random() * 10 - 5,
                Math.random() * 5,
                Math.random() * 10 - 5
            );
            particle.userData.speed = Math.random() * 0.02 + 0.01;
            this.particles.add(particle);
        }
        this.scene.add(this.particles);
    }
    
    setupPostProcessing() {
        // Bloom effect
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,
            0.4,
            0.85
        );
        
        // Color grading
        this.colorCorrection = new LUTPass(new THREE.LUT3dlLoader().load('assets/lut/cyberpunk.3dl'));
        
        // Composer
        this.composer = new EffectComposer(this.config.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(this.colorCorrection);
    }
    
    update() {
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        // Rotate hologram
        this.hologram.rotation.y += delta * 0.5;
        
        // Animate particles
        this.particles.children.forEach(particle => {
            particle.position.y += particle.userData.speed;
            if (particle.position.y > 5) {
                particle.position.y = -2;
            }
            
            particle.scale.setScalar(Math.sin(time * 2 + particle.position.x) * 0.5 + 1);
        });
        
        // Render with post-processing
        this.composer.render();
    }
    
    async destroy() {
        // Clean up resources
        this.scene.traverse(obj => {
            if (obj.isMesh) {
                obj.geometry.dispose();
                if (obj.material) {
                    Object.values(obj.material).forEach(prop => {
                        if (prop && typeof prop.dispose === 'function') {
                            prop.dispose();
                        }
                    });
                }
            }
        });
        
        this.composer.passes.forEach(pass => pass.dispose());
    }
}
