// js/core/ResponsiveManager.js
export class ResponsiveManager {
    constructor(renderer, camera, scene) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;
        
        this.breakpoints = {
            mobile: 600,
            tablet: 900,
            desktop: 1200
        };
        
        this.currentBreakpoint = this.getBreakpoint();
        this.init();
    }
    
    init() {
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize(); // Initial setup
    }
    
    getBreakpoint() {
        const width = window.innerWidth;
        if (width < this.breakpoints.mobile) return 'mobile';
        if (width < this.breakpoints.tablet) return 'tablet';
        if (width < this.breakpoints.desktop) return 'desktop';
        return 'xl';
    }
    
    handleResize() {
        const newBreakpoint = this.getBreakpoint();
        
        // Only update if breakpoint changed
        if (newBreakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            this.onBreakpointChange(newBreakpoint);
        }
        
        // Always update renderer and camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onBreakpointChange(breakpoint) {
        // Adjust scene complexity based on device
        switch(breakpoint) {
            case 'mobile':
                this.setMobileSettings();
                break;
            case 'tablet':
                this.setTabletSettings();
                break;
            default:
                this.setDesktopSettings();
        }
    }
    
    setMobileSettings() {
        // Reduce quality for mobile
        this.renderer.physicallyCorrectLights = false;
        this.renderer.toneMapping = THREE.NoToneMapping;
        
        // Simplify scene
        this.scene.traverse(obj => {
            if (obj.isMesh) {
                if (obj.userData.lod) {
                    obj.geometry = obj.userData.lod.low;
                }
            }
        });
    }
    
    setDesktopSettings() {
        // High quality for desktop
        this.renderer.physicallyCorrectLights = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        
        // Use high quality assets
        this.scene.traverse(obj => {
            if (obj.isMesh) {
                if (obj.userData.lod) {
                    obj.geometry = obj.userData.lod.high;
                }
            }
        });
    }
}
