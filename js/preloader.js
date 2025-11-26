// Preloader - Loading Screen Manager
class Preloader {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.assets = {
            images: [
                'assets/balloon.png',
                'assets/fuel.png',
                'assets/star.png',
                'assets/background.jpg'
            ],
            audio: [
                'music/lvl1.mp3',
                'music/lvl2.mp3',
                'music/lvl3.mp3',
                'music/lvl4.mp3'
            ],
            scripts: [
                'js/sound-manager.js',
                'js/balloon.js',
                'js/obstacles.js',
                'js/items.js',
                'js/stage-objects.js',
                'js/game-new.js'
            ]
        };
        
        this.loadingScreen = null;
        this.progressBar = null;
        this.percentageText = null;
        this.fileNameText = null;
        this.statusText = null;
    }
    
    init() {
        this.createLoadingScreen();
        this.calculateTotalAssets();
    }
    
    createLoadingScreen() {
        // Create loading screen
        const loadingHTML = `
            <div id="preloader">
                <div class="preloader-container">
                    <div class="balloon-animation">
                        <div class="balloon-icon">🎈</div>
                    </div>
                    <h1 class="game-title">Balloon Journey</h1>
                    <h2 class="game-subtitle">Story Balloon</h2>
                    
                    <div class="loading-info">
                        <div class="loading-text">Loading...</div>
                        <div class="file-name" id="currentFile">Preparing...</div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="percentage" id="percentage">0%</div>
                    </div>
                    
                    <div class="loading-details">
                        <span id="loadedCount">0</span> of <span id="totalCount">0</span> files
                    </div>
                    
                    <div class="status-message" id="statusMessage">
                        Loading game resources...
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', loadingHTML);
        
        this.loadingScreen = document.getElementById('preloader');
        this.progressBar = document.getElementById('progressFill');
        this.percentageText = document.getElementById('percentage');
        this.fileNameText = document.getElementById('currentFile');
        this.statusText = document.getElementById('statusMessage');
        this.loadedCountText = document.getElementById('loadedCount');
        this.totalCountText = document.getElementById('totalCount');
    }
    
    calculateTotalAssets() {
        // Calculate total number of files
        this.totalAssets = 
            this.assets.images.length + 
            this.assets.audio.length + 
            this.assets.scripts.length;
        
        if (this.totalCountText) {
            this.totalCountText.textContent = this.totalAssets;
        }
    }
    
    updateProgress(fileName, type) {
        this.loadedAssets++;
        
        const percentage = Math.round((this.loadedAssets / this.totalAssets) * 100);
        
        // Update UI
        if (this.progressBar) {
            this.progressBar.style.width = percentage + '%';
        }
        
        if (this.percentageText) {
            this.percentageText.textContent = percentage + '%';
        }
        
        if (this.fileNameText) {
            const fileDisplayName = this.getFileDisplayName(fileName, type);
            this.fileNameText.textContent = fileDisplayName;
        }
        
        if (this.loadedCountText) {
            this.loadedCountText.textContent = this.loadedAssets;
        }
        
        if (this.statusText) {
            this.statusText.textContent = this.getStatusMessage(type, percentage);
        }
    }
    
    getFileDisplayName(fileName, type) {
        const fileMap = {
            'lvl1.mp3': '🎵 Stage 1 Music',
            'lvl2.mp3': '🎵 Stage 2 Music',
            'lvl3.mp3': '🎵 Stage 3 Music',
            'lvl4.mp3': '🎵 Stage 4 Music',
            'sound-manager.js': '🔊 Audio System',
            'balloon.js': '🎈 Balloon Management',
            'obstacles.js': '⚡ Obstacles & Enemies',
            'items.js': '⭐ Items',
            'stage-objects.js': '🏙️ Stage Objects',
            'game-new.js': '🎮 Game Engine'
        };
        
        const shortName = fileName.split('/').pop();
        return fileMap[shortName] || `📦 ${shortName}`;
    }
    
    getStatusMessage(type, percentage) {
        if (percentage < 30) {
            return 'Loading audio resources...';
        } else if (percentage < 70) {
            return 'Loading game engine...';
        } else if (percentage < 100) {
            return 'Final preparation...';
        } else {
            return 'Game ready! ✨';
        }
    }
    
    async loadAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', () => {
                this.updateProgress(url, 'audio');
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', () => {
                console.warn(`Could not load audio: ${url}`);
                this.updateProgress(url, 'audio');
                resolve(null); // حتی در صورت خطا، ادامه می‌دهیم
            });
            
            audio.src = url;
            audio.load();
        });
    }
    
    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.updateProgress(url, 'image');
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Could not load image: ${url}`);
                this.updateProgress(url, 'image');
                resolve(null);
            };
            img.src = url;
        });
    }
    
    async loadScript(url) {
        return new Promise((resolve, reject) => {
            // اسکریپت‌ها قبلاً لود شده‌اند، فقط شبیه‌سازی می‌کنیم
            setTimeout(() => {
                this.updateProgress(url, 'script');
                resolve(true);
            }, 100 + Math.random() * 200);
        });
    }
    
    async loadAllAssets() {
        try {
            // بارگذاری صداها
            for (const audioUrl of this.assets.audio) {
                await this.loadAudio(audioUrl);
            }
            
            // بارگذاری تصاویر (اگر وجود دارند)
            for (const imageUrl of this.assets.images) {
                await this.loadImage(imageUrl);
            }
            
            // شبیه‌سازی بارگذاری اسکریپت‌ها
            for (const scriptUrl of this.assets.scripts) {
                await this.loadScript(scriptUrl);
            }
            
            // تاخیر کوتاه برای نمایش 100%
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }
    
    async start() {
        this.init();
        await this.loadAllAssets();
        this.hide();
    }
    
    hide() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                // فعال کردن بازی
                if (typeof window.initGame === 'function') {
                    window.initGame();
                }
            }, 800);
        }
    }
}

// شروع خودکار پریلودر
let preloader = null;
window.addEventListener('DOMContentLoaded', () => {
    preloader = new Preloader();
    preloader.start();
});
