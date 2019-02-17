export default class AutoReload {
    
    constructor() {
        this.enabled = true;
        this.hasChanges = false;
    }
    
    enable() {
        this.enabled = true;
    }
    
    disable() {
        this.enabled = false;
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
    
    setChanges(status) {
        this.hasChanges = !! status;
    }
    
    saveState() {
        this.state = {
            enabled: this.enabled,
        };
    }
    
    rollback() {
        if(!this.state) return;
        
        this.enabled = this.state.enabled;
        
        delete this.state;
    }
    
    saveAndEnable() {
        this.saveState();
        this.enable();
    }
}
