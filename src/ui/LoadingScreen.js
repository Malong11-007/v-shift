class LoadingScreen {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#111';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = 'Inter, sans-serif';
        this.container.style.zIndex = '9999';
        this.container.style.pointerEvents = 'auto';

        this.title = document.createElement('div');
        this.title.innerText = 'V-SHIFT';
        this.title.style.fontSize = '80px';
        this.title.style.margin = '0 0 40px 0';
        this.title.style.letterSpacing = '10px';
        this.title.style.textShadow = '0 0 20px #00f0ff';
        this.title.style.fontWeight = '800';
        this.container.appendChild(this.title);

        this.statusText = document.createElement('p');
        this.statusText.innerText = 'INITIALIZING ENGINE...';
        this.statusText.style.fontSize = '20px';
        this.statusText.style.marginBottom = '20px';
        this.statusText.style.letterSpacing = '2px';
        this.container.appendChild(this.statusText);

        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.style.width = '400px';
        this.progressBarContainer.style.height = '6px';
        this.progressBarContainer.style.backgroundColor = '#333';
        this.progressBarContainer.style.borderRadius = '3px';
        this.progressBarContainer.style.overflow = 'hidden';

        this.progressBar = document.createElement('div');
        this.progressBar.style.width = '0%';
        this.progressBar.style.height = '100%';
        this.progressBar.style.backgroundColor = '#00f0ff';
        this.progressBar.style.transition = 'width 0.2s';
        this.progressBar.style.boxShadow = '0 0 10px #00f0ff';
        this.progressBarContainer.appendChild(this.progressBar);

        this.container.appendChild(this.progressBarContainer);
        
        // Listen for load progress
        window.addEventListener('assetProgress', (e) => {
            const pct = e.detail.progress;
            this.progressBar.style.width = `${pct * 100}%`;
            this.statusText.innerText = `LOADING ASSETS... ${Math.round(pct * 100)}%`;
        });
    }

    show(payload) {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
        // Reset for next time
        this.progressBar.style.width = '0%';
        this.statusText.innerText = 'INITIALIZING...';
    }
}

export default LoadingScreen;
