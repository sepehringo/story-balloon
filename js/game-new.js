class BalloonGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = window.soundManager || null;
        
        // Setup responsive Canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.gameWidth = this.canvas.width;
        this.gameHeight = this.canvas.height;
        
        // To prevent multiple simultaneous gameLoops
        this.animationFrameId = null;

    // Touch inputs
    this.touchRegions = new Map();
    this.touchState = { left: false, right: false, up: false };
    this.touchHeatingActive = false;
        
        this.init();
        this.setupEventListeners();

        this.updateAudioButton(this.sound ? this.sound.isMuted : false);
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const header = document.getElementById('gameHeader');
        const controls = document.getElementById('gameControls');
        const mobileControls = document.getElementById('mobileControls');

        const headerHeight = header ? header.offsetHeight : 0;
        const controlsHeight = controls ? controls.offsetHeight : 0;
        const mobileControlsHeight = mobileControls && !mobileControls.classList.contains('hidden')
            ? mobileControls.offsetHeight + 24
            : 0;

        const availableWidth = Math.min(container.clientWidth, window.innerWidth, 640);
        const availableHeight = Math.max(
            Math.min(window.innerHeight - headerHeight - controlsHeight - mobileControlsHeight - 32, 640),
            360
        );

        const size = Math.min(availableWidth, availableHeight);

        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        this.canvas.width = size;
        this.canvas.height = size;

        if (this.gameState === 'playing') {
            this.gameWidth = this.canvas.width;
            this.gameHeight = this.canvas.height;

            if (this.balloon) {
                this.balloon.x = Math.min(
                    Math.max(this.balloon.x, 30),
                    this.canvas.width - 30
                );
                this.balloon.y = Math.min(
                    Math.max(this.balloon.y, 50),
                    this.canvas.height - 120
                );
            }
        }
    }

    init() {
        this.currentStage = 1;
        this.gameState = 'menu';
        this.balloon = new Balloon(this);
        this.obstacles = [];
        this.items = [];
        this.birds = [];
        this.reverseBirds = []; // Reverse-flying birds
        this.thunderClouds = []; // Thunder clouds
        this.groundEnemies = []; // Stage 4 ground enemies
        this.buildings = [];
        this.shooters = [];
        this.girlfriendBalloon = null;
        this.particles = [];
        this.spawnTimer = 0;
        this.nextStageNumber = null;
        this.epilogueState = null;
        this.inputLocked = false;
        
        // Game stats
        this.starsCollected = 0;
        this.fuelCollected = 0;
        this.currentAltitude = 0;
        this.horizontalDistance = 0;
        this.targetAltitude = 500;
        this.targetDistance = 0;
        this.score = 0;
        this.startTime = 0;
        
        // Stage 3 specific
        this.killedSpectators = 0;
        this.shooterSpawnChance = 0; // Start with 0 - no shooters until first kill
        this.shootersToSpawn = 0; // Number of shooters to spawn
        this.balloonBloodLevel = 0;
        this.girlfriendRescued = false;
        
        // Keyboard control
        this.keys = {};
        
        // Dev menu - D key counter
        this.dKeyCount = 0;
        this.dKeyTimer = null;
        
        // Unlocked levels
        const savedLevels = localStorage.getItem('unlockedLevels');
        this.unlockedLevels = savedLevels ? JSON.parse(savedLevels) : [1];
        
        // Tutorial pagination
        this.currentTutorialPage = 1;
        this.totalTutorialPages = 5;
        
        this.backgroundOffset = 0;
        
        this.setupCanvas();
        this.showMainMenu();
    }

    setupCanvas() {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.gameWidth = rect.width;
        this.gameHeight = rect.height;
    }

    setupEventListeners() {
        // Touch/mouse controls
        this.canvas.addEventListener('mousedown', () => {
            this.ensureSoundReady();
            if (this.gameState === 'playing' && !this.inputLocked) {
                this.balloon.startHeating();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (this.gameState === 'playing') {
                this.balloon.stopHeating();
            }
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            if (this.gameState === 'playing') {
                this.balloon.stopHeating();
            }
        });
        
        // Keyboard control (left and right)
        window.addEventListener('keydown', (e) => {
            // Prevent Space from activating buttons
            if (e.key === ' ' && this.gameState === 'playing') {
                e.preventDefault();
            }
            
            // Dev menu - activate with 3 quick D presses (only when not playing)
            if ((e.key === 'd' || e.key === 'D') && this.gameState !== 'playing') {
                e.preventDefault(); // Prevent interference
                this.dKeyCount++;
                clearTimeout(this.dKeyTimer);
                
                if (this.dKeyCount === 3) {
                    const devMenu = document.getElementById('devMenu');
                    devMenu.style.display = devMenu.style.display === 'none' ? 'block' : 'none';
                    this.dKeyCount = 0;
                }
                
                this.dKeyTimer = setTimeout(() => {
                    this.dKeyCount = 0;
                }, 800);
                
                // Exit function - shouldn't reach game controls
                return;
            }
            
            this.keys[e.key] = true;
            
            if (this.gameState === 'playing' && !this.inputLocked) {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.balloon.moveLeft();
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.balloon.moveRight();
                }
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
                    this.balloon.startHeating();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
                this.balloon.stopHeating();
            }
        });
        
        // UI buttons
        document.getElementById('startStoryBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('startBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('startAdventureBtn').addEventListener('click', () => this.startAdventureFromMenu());
        document.getElementById('mainMenuLevelSelectBtn').addEventListener('click', () => {
            this.hideModal('mainMenuModal');
            this.showLevelSelect();
        });
        document.getElementById('mainMenuHowToPlayBtn').addEventListener('click', () => {
            this.hideModal('mainMenuModal');
            this.showModal('howToPlayModal');
        });
        document.getElementById('mainMenuCreditsBtn').addEventListener('click', () => {
            this.hideModal('mainMenuModal');
            this.showModal('creditsModal');
        });
        document.getElementById('startStage2Btn').addEventListener('click', () => this.startStage(2));
        document.getElementById('startStage3Btn').addEventListener('click', () => this.startStage(3));
        document.getElementById('startStage4Btn').addEventListener('click', () => this.startStage(4));
        document.getElementById('startStage5Btn').addEventListener('click', () => this.startStage(5));
        document.getElementById('nextStageBtn').addEventListener('click', () => this.nextStage());

        const audioToggle = document.getElementById('audioToggleBtn');
        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                this.ensureSoundReady();
                if (this.sound) {
                    const muted = this.sound.toggleMute();
                    this.playSound('ui', { volume: 0.7 });
                    this.updateAudioButton(muted);
                }
            });
        }
        
        // دکمه‌های منوی جدید
        const howToPlayBtn = document.getElementById('howToPlayBtn');
        if (howToPlayBtn) {
            howToPlayBtn.addEventListener('click', () => {
                this.showModal('howToPlayModal');
            });
        }
        
        const creditsBtn = document.getElementById('creditsBtn');
        if (creditsBtn) {
            creditsBtn.addEventListener('click', () => {
                this.showModal('creditsModal');
            });
        }
        
        const levelSelectBtn = document.getElementById('levelSelectBtn');
        if (levelSelectBtn) {
            levelSelectBtn.addEventListener('click', () => {
                this.showLevelSelect();
            });
        }
        
        // دکمه‌های بستن مودال‌ها
        const closeCreditsBtn = document.getElementById('closeCreditsBtn');
        if (closeCreditsBtn) {
            closeCreditsBtn.addEventListener('click', () => {
                this.hideModal('creditsModal');
            });
        }
        
        // Tutorial navigation buttons
        const tutorialPrevBtn = document.getElementById('tutorialPrevBtn');
        const tutorialNextBtn = document.getElementById('tutorialNextBtn');
        const tutorialBackBtn = document.getElementById('tutorialBackBtn');
        
        if (tutorialPrevBtn) {
            tutorialPrevBtn.addEventListener('click', () => this.navigateTutorial(-1));
        }
        if (tutorialNextBtn) {
            tutorialNextBtn.addEventListener('click', () => this.navigateTutorial(1));
        }
        if (tutorialBackBtn) {
            tutorialBackBtn.addEventListener('click', () => {
                this.hideModal('howToPlayModal');
                this.currentTutorialPage = 1;
                this.updateTutorialPage();
            });
        }

        
        const closeLevelSelectBtn = document.getElementById('closeLevelSelectBtn');
        if (closeLevelSelectBtn) {
            closeLevelSelectBtn.addEventListener('click', () => {
                this.hideModal('levelSelectModal');
            });
        }
        
        // کنترل‌های موبایل
        this.setupMobileControls();
        
        // کنترل لمسی برای گرم کردن (نگه داشتن روی صفحه)
        this.setupTouchControls();
    }
    
    setupMobileControls() {
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const setKeyState = (key, value) => {
            this.keys[key] = value;
        };

        const handlePress = (direction) => {
            if (this.gameState === 'playing' && !this.inputLocked) {
                setKeyState(direction, true);
                if (direction === 'ArrowLeft') {
                    this.balloon.moveLeft();
                } else if (direction === 'ArrowRight') {
                    this.balloon.moveRight();
                }
            }
        };

        const handleRelease = (direction) => {
            setKeyState(direction, false);
        };
        
        if (leftBtn) {
            // برای موبایل از touchstart/touchend استفاده می‌کنیم
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handlePress('ArrowLeft');
            }, { passive: false });
            
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleRelease('ArrowLeft');
            });

            leftBtn.addEventListener('touchcancel', () => handleRelease('ArrowLeft'));
            
            // برای دسکتاپ هم کار کند
            leftBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                handlePress('ArrowLeft');
            });

            leftBtn.addEventListener('mouseup', () => handleRelease('ArrowLeft'));
            leftBtn.addEventListener('mouseleave', () => handleRelease('ArrowLeft'));
        }
        
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handlePress('ArrowRight');
            }, { passive: false });
            
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleRelease('ArrowRight');
            });

            rightBtn.addEventListener('touchcancel', () => handleRelease('ArrowRight'));
            
            rightBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                handlePress('ArrowRight');
            });

            rightBtn.addEventListener('mouseup', () => handleRelease('ArrowRight'));
            rightBtn.addEventListener('mouseleave', () => handleRelease('ArrowRight'));
        }

        const releaseAll = () => {
            handleRelease('ArrowLeft');
            handleRelease('ArrowRight');
        };

        window.addEventListener('touchend', releaseAll);
        window.addEventListener('touchcancel', releaseAll);
        window.addEventListener('mouseup', releaseAll);
    }
    
    setupTouchControls() {
        const handleTouchUpdate = (touchList) => {
            for (const touch of Array.from(touchList)) {
                this.updateTouchRegion(touch);
            }
            this.refreshTouchState();
        };

        const handleTouchEnd = (touchList) => {
            for (const touch of Array.from(touchList)) {
                this.touchRegions.delete(touch.identifier);
            }
            this.refreshTouchState();
        };

        this.canvas.addEventListener('touchstart', (e) => {
            this.ensureSoundReady();
            if (!this.inputLocked) {
                handleTouchUpdate(e.changedTouches);
            }
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            handleTouchUpdate(e.changedTouches);
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            handleTouchEnd(e.changedTouches);
            e.preventDefault();
        });

        this.canvas.addEventListener('touchcancel', (e) => {
            handleTouchEnd(e.changedTouches);
            e.preventDefault();
        });
    }

    updateTouchRegion(touch) {
        if (this.gameState !== 'playing' || this.inputLocked) {
            this.touchRegions.delete(touch.identifier);
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            this.touchRegions.delete(touch.identifier);
            return;
        }

        const thirdWidth = rect.width / 3;
        const isUpperHalf = y < rect.height / 2;
        const region = { left: false, right: false, up: false };

        if (x < thirdWidth) {
            region.left = true;
            if (isUpperHalf) region.up = true;
        } else if (x > 2 * thirdWidth) {
            region.right = true;
            if (isUpperHalf) region.up = true;
        } else {
            region.up = true;
        }

        this.touchRegions.set(touch.identifier, region);
    }

    refreshTouchState() {
        let left = false;
        let right = false;
        let up = false;

        for (const region of this.touchRegions.values()) {
            left = left || region.left;
            right = right || region.right;
            up = up || region.up;
        }

        this.touchState = { left, right, up };
        this.applyTouchState();
    }

    applyTouchState() {
        const shouldHeat = this.touchState.up && this.gameState === 'playing' && !this.inputLocked;

        if (shouldHeat && !this.touchHeatingActive) {
            if (this.balloon) {
                this.balloon.startHeating();
            }
            this.touchHeatingActive = true;
        } else if (!shouldHeat && this.touchHeatingActive) {
            if (this.balloon) {
                this.balloon.stopHeating();
            }
            this.touchHeatingActive = false;
        }
    }

    resetTouchState() {
        if (this.touchRegions) {
            this.touchRegions.clear();
        }
        this.touchState = { left: false, right: false, up: false };
        this.applyTouchState();
        if (this.keys) {
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        }
    }

    ensureSoundReady() {
        if (this.sound) {
            this.sound.initialize();
        }
    }

    playSound(effect, options = {}) {
        if (this.sound) {
            this.sound.play(effect, options);
        }
    }

    updateAudioButton(isMuted) {
        const btn = document.getElementById('audioToggleBtn');
        if (!btn) return;
        if (isMuted) {
            btn.classList.add('muted');
            btn.textContent = '🔇';
        } else {
            btn.classList.remove('muted');
            btn.textContent = '🔊';
        }
    }

    showStory() {
        document.getElementById('storyModal').classList.remove('hidden');
    }
    
    showMainMenu() {
        document.getElementById('mainMenuModal').classList.remove('hidden');
        document.getElementById('storyModal').classList.add('hidden');
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('howToPlayModal')?.classList.add('hidden');
        document.getElementById('creditsModal')?.classList.add('hidden');
        document.getElementById('levelSelectModal')?.classList.add('hidden');
    }
    
    startAdventureFromMenu() {
        this.ensureSoundReady();
        document.getElementById('mainMenuModal').classList.add('hidden');
        this.showStory();
    }

    startGame() {
        this.ensureSoundReady();
        document.getElementById('storyModal').classList.add('hidden');
        document.getElementById('gameOverModal').classList.add('hidden');
        this.startStage(1);
    }

    startStage(stageNumber) {
        this.ensureSoundReady();
        // مخفی کردن همه مودال‌ها
        document.getElementById('stage2Modal').classList.add('hidden');
        document.getElementById('stage3Modal').classList.add('hidden');
    const stage4Modal = document.getElementById('stage4Modal');
    if (stage4Modal) stage4Modal.classList.add('hidden');
    const stage5Modal = document.getElementById('stage5Modal');
    if (stage5Modal) stage5Modal.classList.add('hidden');
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('storyModal').classList.add('hidden');
        
        // بستن Dev Menu
        const devMenu = document.getElementById('devMenu');
        if (devMenu) {
            devMenu.style.display = 'none';
        }
        
        // برداشتن focus از همه دکمه‌ها
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
        }
        
        // focus دادن به canvas
        this.canvas.focus();
        
        this.currentStage = stageNumber;
        this.gameState = 'playing';
        this.startTime = Date.now();
        
        // شروع موسیقی پس‌زمینه
        if (this.sound) {
            if (stageNumber >= 1 && stageNumber <= 4) {
                // مراحل عادی: پخش موسیقی مخصوص همان مرحله
                this.sound.playBackgroundMusic(stageNumber);
            } else if (stageNumber === 5) {
                // تیتراژ پایانی: پخش موسیقی مرحله 1 (آرام و خاطره‌انگیز)
                this.sound.playBackgroundMusic(1);
            }
        }
        
        // ریست کامل کلیدها و Dev Menu
        this.keys = {};
        this.dKeyCount = 0;
        if (this.dKeyTimer) {
            clearTimeout(this.dKeyTimer);
            this.dKeyTimer = null;
        }
        
        // ریست آمار
        this.starsCollected = 0;
        this.fuelCollected = 0;
        this.currentAltitude = 0;
        this.horizontalDistance = 0;
        this.killedSpectators = 0;
        this.shooterSpawnChance = 0; // شروع با 0
        this.shootersToSpawn = 0; // ریست تیراندازها
        this.balloonBloodLevel = 0;
        this.spawnTimer = 0;
    this.nextStageNumber = null;
    this.epilogueState = null;
    this.inputLocked = false;
    this.girlfriendRescued = false;
        
        // ریست کامل بالن با تنظیمات اولیه
    this.balloon = new Balloon(this);
    this.balloon.x = this.canvas.width / 2 - 30;
    // Give the player a longer grace period at level start: start balloon a bit higher
    this.balloon.y = this.canvas.height - 100;
        this.balloon.fuel = 100;
        this.balloon.maxFuel = 100;
        this.balloon.velocityY = 0;
        this.balloon.velocityX = 0;
        this.balloon.isHeating = false;
        
        // پاک کردن آرایه‌ها
        this.obstacles = [];
        this.items = [];
        this.birds = [];
        this.reverseBirds = [];
        this.thunderClouds = [];
        this.groundEnemies = [];
        this.buildings = [];
        this.shooters = [];
        this.particles = [];
        this.girlfriendBalloon = null;
        
        // تنظیمات مخصوص هر مرحله
        switch(stageNumber) {
            case 1:
                this.targetAltitude = 500;
                this.targetDistance = 0;
                document.getElementById('targetAltitude').textContent = 500;
                this.inputLocked = false;
                break;
            case 2:
                this.targetAltitude = 1500;
                this.targetDistance = 0;
                document.getElementById('targetAltitude').textContent = 1500;
                this.inputLocked = false;
                break;
            case 3:
                this.targetAltitude = 0;
                this.targetDistance = 3000; // کاهش از 10000 به 5000 متر
                document.getElementById('targetAltitude').textContent = 5000;
                this.inputLocked = false;
                break;
            case 4:
                this.targetAltitude = 0;
                this.targetDistance = 5000;
                document.getElementById('targetAltitude').textContent = 5000;
                this.girlfriendBalloon = new GirlfriendBalloon(this);
                this.inputLocked = false;
                break;
            case 5:
                this.targetAltitude = 0;
                this.targetDistance = 0;
                document.getElementById('targetAltitude').textContent = '∞';
                this.girlfriendBalloon = null;
                this.inputLocked = true;
                this.epilogueState = this.createInitialEpilogueState();
                this.balloon.x = this.canvas.width / 2 - this.balloon.width / 2;
                this.balloon.y = this.canvas.height / 2;
                this.balloon.velocityX = 0;
                this.balloon.velocityY = 0;
                this.balloon.isHeating = false;
                this.balloon.fuel = this.balloon.maxFuel;
                this.balloon.armPose = 'neutral';
                break;
        }
        
        // شروع game loop (فقط اگر قبلاً در حال اجرا نبوده)
        // کنسل کردن انیمیشن قبلی برای جلوگیری از تداخل
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // نمایش دکمه‌های موبایل در حالت بازی
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.add('hidden');
        }

        this.resetTouchState();
        this.resizeCanvas();
        
        // شروع game loop جدید
        this.gameLoop();
    }

    createInitialEpilogueState() {
        return {
            timer: 0,
            phase: 'glide',
            phaseTimer: 0,
            hearts: [],
            jumpers: [],
            currentCreditIndex: 0,
            creditTimer: 0,
            creditsShown: false,
            endingTriggered: false,
            credits: [
                { title: 'Kami and His Love', subtitle: 'Together Again', duration: 240 },
                { title: 'Free Flight', subtitle: 'The Sky Belongs to Both', duration: 240 },
                { title: 'Game Designers', subtitle: 'Sepehr Kheiri', duration: 200 },
                { title: 'Group Leader', subtitle: 'Mohammad Mehdi Shirmohammadi', duration: 200 },
                { title: 'Executive Director', subtitle: 'Ali Hamzehi', duration: 200 },
                { title: 'Computer Games Research Group', subtitle: 'Islamic Azad University, Hamedan Branch', duration: 220 },
                { title: 'Thank You', subtitle: 'For Following This Dream', duration: 260 }
            ],
            skyDots: this.createEpilogueSkyDots()
        };
    }

    createEpilogueSkyDots() {
        const dots = [];
        const count = 32;
        for (let i = 0; i < count; i++) {
            dots.push({
                x: Math.random() * this.gameWidth,
                y: Math.random() * (this.gameHeight * 0.65),
                size: Math.random() * 1.8 + 0.6,
                color: Math.random() > 0.5 ? '#FFE066' : '#FF9FF3'
            });
        }
        return dots;
    }

    gameLoop() {
        if (this.gameState !== 'playing') {
            // اگر بازی متوقف شد، انیمیشن رو کنسل کن
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            return;
        }
        
        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.currentStage === 5) {
            this.updateStage5();
            return;
        }
        this.balloon.update();
        
        // اعمال کنترل‌های مداوم
        const leftActive = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchState.left;
        const rightActive = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchState.right;

        if (!this.inputLocked && leftActive) {
            this.balloon.moveLeft();
        }
        if (!this.inputLocked && rightActive) {
            this.balloon.moveRight();
        }
        
        // تولید موانع و آیتم‌ها
        this.spawnTimer++;
        if (this.spawnTimer > this.getSpawnInterval()) {
            this.spawnObjects();
            this.spawnTimer = 0;
        }
        
        // بروزرسانی بر اساس مرحله
        if (this.currentStage === 1) {
            this.updateStage1();
        } else if (this.currentStage === 2) {
            this.updateStage2();
        } else if (this.currentStage === 3) {
            this.updateStage3();
        } else if (this.currentStage === 4) {
            this.updateStage4();
        }
        
        // بروزرسانی ذرات
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });
        
        // بررسی سوخت
        if (this.balloon.fuel <= 0 && this.currentStage === 1) {
            const now = Date.now();
            const inGrace = this.levelGraceUntil && now < this.levelGraceUntil;
            if (this.balloon.y > this.canvas.height - 50 && !inGrace) {
                this.playSound('fail', { volume: 0.9 });
                this.gameOver(false, 'Out of fuel — you crashed! 💥');
            }
        }
        
        // بروزرسانی رابط کاربری
        this.updateUI();
        
        // بروزرسانی پس‌زمینه
        if (this.currentStage >= 3) {
            this.backgroundOffset += 2;
        } else {
            this.backgroundOffset += 0.5;
        }
    }

    updateStage1() {
        // مرحله 1: حرکت عمودی و جمع‌آوری سوخت
        
        // بروزرسانی ابرها
        this.obstacles = this.obstacles.filter(obstacle => {
            const shouldRemove = obstacle.update();
            return !shouldRemove;
        });
        
        // بروزرسانی پرنده‌های معکوس (کشنده!)
        this.reverseBirds = this.reverseBirds.filter(bird => {
            const shouldRemove = bird.update();
            if (!shouldRemove && this.checkCollision(this.balloon, bird)) {
                this.playSound('crash', { volume: 0.8 });
                this.gameOver(false, 'Hit by a dangerous bird! 🦅💥');
                return true;
            }
            return !shouldRemove;
        });
        
        // بروزرسانی آیتم‌ها
        this.items = this.items.filter(item => {
            const shouldRemove = item.update();
            
            if (!shouldRemove && this.checkCollision(this.balloon, item)) {
                if (item instanceof FuelCan) {
                    this.collectFuel(item);
                }
                return true;
            }
            
            return !shouldRemove;
        });
        
        // بروزرسانی ارتفاع (خیلی کندتر برای 2+ دقیقه)
        this.currentAltitude += (this.canvas.height - this.balloon.y) / 3000;
        
        // بررسی پیروزی
        if (this.currentAltitude >= this.targetAltitude) {
            this.stageComplete();
        }
    }

    updateStage2() {
        // مرحله 2: اجتناب از موانع
        
        // بروزرسانی موانع
        this.obstacles = this.obstacles.filter(obstacle => {
            const shouldRemove = obstacle.update();
            
            if (!shouldRemove && this.checkCollision(this.balloon, obstacle)) {
                if (obstacle instanceof Cloud || obstacle instanceof ThickCloud) {
                    this.balloon.velocityY *= 0.9;
                } else if (obstacle instanceof Mountain || obstacle instanceof TallMountain) {
                    this.playSound('crash', { volume: 0.9 });
                    this.gameOver(false, 'Crashed into a mountain! ⛰️');
                    return true;
                }
            }
            
            return !shouldRemove;
        });
        
        // بروزرسانی ابرهای رعد و برق (کشنده!)
        this.thunderClouds = this.thunderClouds.filter(cloud => {
            const shouldRemove = cloud.update();
            
            if (!shouldRemove && cloud.isLightning) {
                // بررسی برخورد با رعد و برق
                const lightningBounds = cloud.getLightningBounds();
                for (const bounds of lightningBounds) {
                    if (this.checkCollisionWithBounds(this.balloon.getBounds(), bounds)) {
                        this.playSound('thunder', { volume: 1 });
                        this.gameOver(false, 'Struck by lightning! ⚡💥');
                        return true;
                    }
                }
            }
            
            return !shouldRemove;
        });
        
        // بروزرسانی پرندگان عادی
        this.birds = this.birds.filter(bird => {
            const shouldRemove = bird.update();
            if (!shouldRemove && this.checkCollision(this.balloon, bird)) {
                this.playSound('crow', { volume: 0.85 + Math.random() * 0.1 });
                this.gameOver(false, 'Hit by a bird! 🐦💥');
                return true;
            }
            return !shouldRemove;
        });
        
        // بروزرسانی پرنده‌های معکوس (کشنده!)
        this.reverseBirds = this.reverseBirds.filter(bird => {
            const shouldRemove = bird.update();
                if (!shouldRemove && this.checkCollision(this.balloon, bird)) {
                    this.playSound('crash', { volume: 0.8 });
                    this.gameOver(false, 'Hit by a dangerous bird! 🦅💥');
                    return true;
                }
            return !shouldRemove;
        });
        
        // بروزرسانی آیتم‌ها
        this.items = this.items.filter(item => {
            const shouldRemove = item.update();
            
            if (!shouldRemove && this.checkCollision(this.balloon, item)) {
                if (item instanceof Star) {
                    this.collectStar(item);
                } else if (item instanceof FuelCan) {
                    this.collectFuel(item);
                }
                return true;
            }
            
            return !shouldRemove;
        });
        
        this.currentAltitude += (this.canvas.height - this.balloon.y) / 1000;
        
        if (this.currentAltitude >= this.targetAltitude) {
            this.stageComplete();
        }
    }

    updateStage3() {
        // مرحله 3: محیط شهری
        
        // بروزرسانی ساختمان‌ها
        this.buildings = this.buildings.filter(building => {
            const shouldRemove = building.update();
            
            if (!shouldRemove) {
                // بررسی برخورد با تماشاچی‌ها (اول)
                const spectatorResult = building.checkSpectatorCollision(this.balloon);
                if (spectatorResult.killed) {
                    this.killedSpectators++;
                    this.balloonBloodLevel = Math.min(100, this.balloonBloodLevel + 10);
                    
                    // به ازای هر کشتن، 5 تیرانداز اضافه می‌شه
                    this.shootersToSpawn += 5;
                    
                    this.createBloodEffect(this.balloon.x + 30, this.balloon.y + 30);
                }
                
                if (spectatorResult.blownAway) {
                    // افکت باد - آدم پرت شد
                    this.createWindEffect(this.balloon.x + 30, this.balloon.y + 30);
                }
                
                // بررسی برخورد با ساختمان (بعد)
                if (this.checkCollision(this.balloon, building)) {
                    this.playSound('crash', { volume: 0.9 });
                    this.gameOver(false, 'Hit a building! 🏢');
                    return true;
                }
            }
            
            return !shouldRemove;
        });
        
        // بروزرسانی تیراندازها
        this.shooters = this.shooters.filter(shooter => {
            const shouldRemove = shooter.update();
            
            if (!shouldRemove) {
                const hitCount = shooter.checkBulletCollision(this.balloon);
                if (hitCount > 0) {
                    // هر گلوله 15% سوخت کم می‌کنه
                    this.balloon.fuel = Math.max(0, this.balloon.fuel - (15 * hitCount));
                    
                    // افکت برخورد گلوله
                    for (let i = 0; i < hitCount; i++) {
                        this.createBulletHitEffect(this.balloon.x + 30, this.balloon.y + 30);
                    }

                    this.playSound('fail', { volume: 0.6 + Math.min(hitCount, 3) * 0.1 });
                    
                    if (this.balloon.fuel <= 0) {
                        this.playSound('fail', { volume: 0.9 });
                        this.gameOver(false, 'Shot down! 🔫');
                    }
                }
            }
            
            return !shouldRemove;
        });
        
        // بروزرسانی پرنده‌های معکوس (مرحله 3)
        this.reverseBirds = this.reverseBirds.filter(bird => {
            const shouldRemove = bird.update();
            if (!shouldRemove && this.checkCollision(this.balloon, bird)) {
                this.playSound('crash', { volume: 0.85 });
                this.gameOver(false, 'You hit the bird!🦅💥');
                return true;
            }
            return !shouldRemove;
        });
        
        // بروزرسانی آیتم‌ها
        this.items = this.items.filter(item => {
            const shouldRemove = item.update();
            
            if (!shouldRemove && this.checkCollision(this.balloon, item)) {
                if (item instanceof FuelCan) {
                    this.collectFuel(item);
                }
                return true;
            }
            
            return !shouldRemove;
        });
        
        // افزایش مسافت افقی - تنظیم شده برای 2:56 (176 ثانیه)
        // 176 ثانیه × 60 FPS = 10,560 فریم
        // 10,000 متر ÷ 10,560 فریم ≈ 0.95 متر در هر فریم
        this.horizontalDistance += 0.95;
        
        if (this.horizontalDistance >= this.targetDistance) {
            this.stageComplete();
        }
    }

    updateStage4() {
        // مرحله 4: دنبال کردن دوست دختر
        const distanceRemaining = Math.max(0, this.targetDistance - this.horizontalDistance);
        const finalStretch = distanceRemaining <= 20;

        if (this.girlfriendBalloon) {
            const leadMeters = finalStretch ? distanceRemaining : 20;
            const leadPixels = Math.max(0, Math.min(180, leadMeters * 6));
            const maxX = this.canvas.width - this.girlfriendBalloon.width - 40;
            const targetX = Math.min(maxX, this.balloon.x + leadPixels);
            this.girlfriendBalloon.setTargetPosition(targetX, finalStretch);
            this.girlfriendBalloon.update();

            if (finalStretch && !this.girlfriendRescued && this.checkCollision(this.balloon, this.girlfriendBalloon)) {
                this.girlfriendRescued = true;
                this.horizontalDistance = this.targetDistance;
                this.stageComplete();
                return;
            }
        }
        
        // بروزرسانی موانع
        this.obstacles = this.obstacles.filter(obstacle => {
            const shouldRemove = obstacle.update();
            
            if (!shouldRemove && this.checkCollision(this.balloon, obstacle)) {
                if (obstacle instanceof Cloud || obstacle instanceof ThickCloud) {
                    this.balloon.velocityY *= 0.9;
                } else if (obstacle instanceof TallMountain) {
                    this.playSound('crash', { volume: 0.9 });
                    this.gameOver(false, 'Crashed into a mountain! ⛰️');
                    return true;
                }
            }
            
            return !shouldRemove;
        });
        
        // بروزرسانی ابرهای رعد و برق (کشنده!)
        this.thunderClouds = this.thunderClouds.filter(cloud => {
            const shouldRemove = cloud.update();
            
            if (!shouldRemove && cloud.isLightning) {
                // بررسی برخورد با رعد و برق
                const lightningBounds = cloud.getLightningBounds();
                for (const bounds of lightningBounds) {
                    if (this.checkCollisionWithBounds(this.balloon.getBounds(), bounds)) {
                        this.playSound('thunder', { volume: 1 });
                        this.gameOver(false, 'Struck by lightning! ⚡💥');
                        return true;
                    }
                }
            }
            
            return !shouldRemove;
        });
        
        // بروزرسانی پرندگان عادی
        this.birds = this.birds.filter(bird => {
            const shouldRemove = bird.update();
            if (!shouldRemove && this.checkCollision(this.balloon, bird)) {
                this.playSound('crow', { volume: 0.85 + Math.random() * 0.1 });
                this.gameOver(false, 'Hit by a bird! 🐦💥');
                return true;
            }
            return !shouldRemove;
        });

        // بروزرسانی پرنده‌های معکوس (کشنده!)
        this.reverseBirds = this.reverseBirds.filter(bird => {
            const shouldRemove = bird.update();
            if (!shouldRemove && this.checkCollision(this.balloon, bird)) {
                this.playSound('crash', { volume: 0.85 });
                this.gameOver(false, 'You Hit the bird!🦅💥');
                return true;
            }
            return !shouldRemove;
        });
        
        // بروزرسانی دشمنان زمینی
        this.groundEnemies = this.groundEnemies.filter(enemy => {
            const shouldRemove = enemy.update();
            if (!shouldRemove && this.checkCollision(this.balloon, enemy)) {
                this.playSound('fail', { volume: 0.9 });
                this.gameOver(false, 'Caught by ground enemy! 🦹‍♂️');
                return true;
            }
            return !shouldRemove;
        });
        
        // بروزرسانی آیتم‌ها
        this.items = this.items.filter(item => {
            const shouldRemove = item.update();
            if (!shouldRemove && this.checkCollision(this.balloon, item)) {
                if (item instanceof Star) {
                    this.collectStar(item);
                } else if (item instanceof FuelCan) {
                    this.collectFuel(item);
                }
                return true;
            }
            return !shouldRemove;
        });

        if (!this.girlfriendRescued) {
            this.horizontalDistance = Math.min(this.horizontalDistance + 2, this.targetDistance);
        }
    }

    updateStage5() {
        if (!this.epilogueState) {
            this.epilogueState = this.createInitialEpilogueState();
        }

        const state = this.epilogueState;
        state.timer++;
        state.phaseTimer++;

        this.backgroundOffset += 0.22;

        const swingX = Math.sin(state.timer / 210) * 40;
        const swingY = Math.sin(state.timer / 140) * 18;
        const targetX = this.canvas.width / 2 - this.balloon.width / 2 + swingX;
        const targetY = this.canvas.height * 0.4 + swingY;

        this.balloon.x += (targetX - this.balloon.x) * 0.035;
        this.balloon.y += (targetY - this.balloon.y) * 0.035;
        this.balloon.velocityX *= 0.85;
        this.balloon.velocityY *= 0.85;
        this.balloon.isHeating = false;
        this.balloon.fuel = this.balloon.maxFuel;
        this.balloon.armPose = 'neutral';

        this.horizontalDistance += 0.35;
        this.currentAltitude = Math.max(this.currentAltitude, Math.floor((this.canvas.height - this.balloon.y)));

        // تولید قلب‌های شناور
        if (!state.hearts) {
            state.hearts = [];
        }
        if (state.timer % 25 === 0) {
            const heartX = this.balloon.x + this.balloon.width / 2 + Math.sin(state.timer / 45) * 12;
            const heartY = this.balloon.y + this.balloon.height / 2;
            state.hearts.push(this.createEpilogueHeart(heartX, heartY));
        }
        state.hearts = state.hearts.filter(heart => {
            heart.x += heart.vx;
            heart.y += heart.vy;
            heart.vy += heart.gravity;
            heart.alpha -= 0.0055;
            heart.scale += 0.0025;
            return heart.alpha > 0 && heart.y > -40;
        });

        if (state.phase === 'glide') {
            if (state.phaseTimer > 360) {
                state.phase = 'jump';
                state.phaseTimer = 0;
                state.jumpers = this.createEpilogueJumpers();
                this.playSound('collectStar', { volume: 0.55 });
            }
        } else if (state.phase === 'jump') {
            state.jumpers.forEach(jumper => {
                jumper.x += jumper.vx;
                jumper.y += jumper.vy;
                jumper.vy += jumper.gravity;
                jumper.rotation += jumper.spin;
                jumper.t += 1;

                if (jumper.t % 18 === 0) {
                    state.hearts.push(this.createEpilogueHeart(jumper.x, jumper.y - 12, true));
                }
            });
            state.jumpers = state.jumpers.filter(jumper => jumper.y < this.canvas.height + 60);

            if (state.phaseTimer > 280) {
                state.phase = 'credits';
                state.phaseTimer = 0;
                state.currentCreditIndex = 0;
                state.creditTimer = 0;
            }
        } else if (state.phase === 'credits') {
            const current = state.credits[state.currentCreditIndex];
            if (current) {
                state.creditTimer++;
                if (state.creditTimer >= current.duration) {
                    state.currentCreditIndex++;
                    state.creditTimer = 0;
                }
            } else if (!state.creditsShown) {
                state.creditsShown = true;
                state.phase = 'finale';
                state.phaseTimer = 0;
            }
        } else if (state.phase === 'finale') {
            if (state.phaseTimer > 180 && !state.endingTriggered) {
                state.endingTriggered = true;
                this.playSound('victory', { volume: 0.7 });
                this.gameOver(true, '💞 Kami\'s Happy Ending\n\nKami and his love jumped from the balloon hand in hand and were freed in the open sky.', false);
            }
        }

        // در این مرحله دشمنی وجود ندارد، اما برای انسجام رابط کاربری بروزرسانی می‌شود
        this.updateUI();
    }

    createEpilogueHeart(x, y, fromJumpers = false) {
        const horizontalDrift = (Math.random() - 0.5) * (fromJumpers ? 1.2 : 0.6);
        return {
            x,
            y,
            vx: horizontalDrift,
            vy: -0.8 - Math.random() * 0.3,
            gravity: 0.004,
            alpha: 0.95,
            scale: fromJumpers ? 0.28 : 0.34,
            color: fromJumpers ? '#FF6AD5' : '#FFE066'
        };
    }

    createEpilogueJumpers() {
        const baseX = this.balloon.x + this.balloon.width / 2;
        const baseY = this.balloon.y + this.balloon.height - 6;
        return [
            {
                x: baseX - 16,
                y: baseY,
                vx: -0.9,
                vy: -2.4,
                gravity: 0.018,
                rotation: -0.25,
                spin: -0.0035,
                color: '#2E86AB',
                accent: '#FFE066',
                mirror: -1,
                t: 0
            },
            {
                x: baseX + 16,
                y: baseY,
                vx: 0.9,
                vy: -2.4,
                gravity: 0.018,
                rotation: 0.25,
                spin: 0.0035,
                color: '#FF6AD5',
                accent: '#FFE066',
                mirror: 1,
                t: 0
            }
        ];
    }

    drawStage5Overlay() {
        if (!this.epilogueState) return;
        const state = this.epilogueState;

        // هاله نور دور بالن
        this.ctx.save();
        this.ctx.globalAlpha = 0.18 + Math.sin(state.timer / 80) * 0.04;
        this.ctx.fillStyle = '#FF9FF3';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.balloon.x + this.balloon.width / 2,
            this.balloon.y + this.balloon.height / 2 - 10,
            this.balloon.width * 0.95,
            this.balloon.height * 0.9,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.restore();

        // قلب‌های شناور
        if (state.hearts) {
            state.hearts.forEach(heart => this.drawFloatingHeart(heart));
        }

        // پرش عاشقانه
        if (state.jumpers && state.jumpers.length) {
            this.drawEpilogueJumpers(state.jumpers);
        }

        // نمایش زیرنویس‌ها و تیتراژ
        if (state.phase === 'credits') {
            const index = Math.min(state.currentCreditIndex, state.credits.length - 1);
            if (index >= 0 && state.credits[index]) {
                const credit = state.credits[index];
                const fadeIn = Math.min(1, state.creditTimer / 40);
                const fadeOut = Math.min(1, (credit.duration - state.creditTimer) / 40);
                const alpha = Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
                this.drawEpilogueCredits(credit, alpha);
            }
        } else if (state.phase === 'finale' && !state.endingTriggered) {
            const alpha = Math.min(1, state.phaseTimer / 45);
            this.drawEpilogueCredits({
                title: 'The Sky Belongs to Love',
                subtitle: 'Kami and His Love, Free from All Enemies'
            }, alpha);
        }

        if (state.phase === 'finale' && state.endingTriggered) {
            this.drawEpilogueCredits({
                title: 'Happy Ending',
                subtitle: 'Click "Retry" to start again'
            }, 1);
        }
    }

    drawFloatingHeart(heart) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, heart.alpha));
        this.ctx.translate(heart.x, heart.y);
        this.ctx.scale(heart.scale, heart.scale);
        this.ctx.fillStyle = heart.color;

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.bezierCurveTo(12, -12, 22, 8, 0, 24);
        this.ctx.bezierCurveTo(-22, 8, -12, -12, 0, 0);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawEpilogueJumpers(jumpers) {
        jumpers.forEach(jumper => {
            this.ctx.save();
            this.ctx.translate(jumper.x, jumper.y);
            this.ctx.rotate(jumper.rotation);
            this.ctx.scale(1, 1);
            this.ctx.globalAlpha = 0.95;

            // بدن
            this.ctx.fillStyle = jumper.color;
            this.ctx.fillRect(-7, -26, 14, 26);

            // کمربند مشترک
            this.ctx.fillStyle = jumper.accent;
            this.ctx.fillRect(-7, -8, 14, 4);

            // سر
            this.ctx.fillStyle = '#FAD7A0';
            this.ctx.beginPath();
            this.ctx.arc(0, -32, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // بازوها - دست در دست
            this.ctx.strokeStyle = '#FAD7A0';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(-6 * jumper.mirror, -14);
            this.ctx.quadraticCurveTo(0, -4, 6 * jumper.mirror, -14);
            this.ctx.stroke();

            // پاها
            this.ctx.strokeStyle = jumper.color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(-4, 0);
            this.ctx.lineTo(-8 * jumper.mirror, 14);
            this.ctx.moveTo(4, 0);
            this.ctx.lineTo(10 * jumper.mirror, 18);
            this.ctx.stroke();

            // مو یا شال
            this.ctx.strokeStyle = jumper.accent;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-3 * jumper.mirror, -30);
            this.ctx.quadraticCurveTo(-12 * jumper.mirror, -38, -6 * jumper.mirror, -20);
            this.ctx.stroke();

            this.ctx.restore();
        });

        if (jumpers.length >= 2) {
            const midX = (jumpers[0].x + jumpers[1].x) / 2;
            const midY = (jumpers[0].y + jumpers[1].y) / 2 - 6;
            this.ctx.save();
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillStyle = '#FFE066';
            this.ctx.beginPath();
            this.ctx.ellipse(midX, midY, 22, 12, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawEpilogueCredits(credit, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';

        this.ctx.font = '28px "Vazirmatn", Arial, sans-serif';
        this.ctx.fillText(credit.title, this.gameWidth / 2, this.gameHeight * 0.22);

        if (credit.subtitle) {
            this.ctx.globalAlpha = alpha * 0.85;
            this.ctx.font = '20px "Vazirmatn", Arial, sans-serif';
            this.ctx.fillText(credit.subtitle, this.gameWidth / 2, this.gameHeight * 0.22 + 32);
        }

        this.ctx.restore();
    }

    getSpawnInterval() {
        const intervals = {
            1: 50,  // مرحله 1: spawn کندتر
            2: 45,
            3: 35,  // مرحله 3: ساختمان‌های زیاد
            4: 50
        };
        return intervals[this.currentStage] || 50;
    }

    spawnObjects() {
        const stage = this.currentStage;
        
        if (stage === 1) {
            // ابرهای بیشتر و سوخت کمتر
            if (Math.random() < 0.5) { // 50% ابر
                this.obstacles.push(new Cloud(this));
            }
            if (Math.random() < 0.35) { // 35% احتمال سوخت (کاهش از 80%)
                this.items.push(new FuelCan(this));
                this.fuelCollected++;
            }
            // پرنده‌های معکوس (خطرناک!)
            if (Math.random() < 0.08) { // 8% احتمال
                this.reverseBirds.push(new ReverseBird(this));
            }
        } else if (stage === 2) {
            // موانع و آیتم‌ها
            if (Math.random() < 0.3) {
                this.obstacles.push(new ThickCloud(this));
            }
            if (Math.random() < 0.25) {
                this.obstacles.push(new TallMountain(this));
            }
            if (Math.random() < 0.15) {
                this.birds.push(new Bird(this));
            }
            // ابرهای رعد و برق (خطرناک!)
            if (Math.random() < 0.12) { // 12% احتمال
                this.thunderClouds.push(new ThunderCloud(this));
            }
            // پرنده‌های معکوس (خطرناک!)
            if (Math.random() < 0.1) { // 10% احتمال
                this.reverseBirds.push(new ReverseBird(this));
            }
            if (Math.random() < 0.2) {
                this.items.push(new Star(this));
            }
            if (Math.random() < 0.2) {
                this.items.push(new FuelCan(this));
            }
        } else if (stage === 3) {
            // ساختمان‌ها
            if (Math.random() < 0.6) {
                this.buildings.push(new Building(this, Math.random() > 0.5));
            }
            
            // تیراندازها - فقط اگر آدم کشته شده باشه
            if (this.shootersToSpawn > 0) {
                this.shooters.push(new Shooter(this));
                this.shootersToSpawn--;
            }
            
            // پرنده‌های معکوس (خطرناک!)
            if (Math.random() < 0.1) { // 10% احتمال
                this.reverseBirds.push(new ReverseBird(this));
            }
            
            // سوخت
            if (Math.random() < 0.15) {
                this.items.push(new FuelCan(this));
            }
        } else if (stage === 4) {
            // ابرها
            if (Math.random() < 0.3) {
                this.obstacles.push(new Cloud(this));
            }
            if (Math.random() < 0.15) {
                this.obstacles.push(new ThickCloud(this));
            }
            if (Math.random() < 0.12) {
                this.obstacles.push(new TallMountain(this));
            }
            // ابرهای رعد و برق (خطرناک!)
            if (Math.random() < 0.12) { // 12% احتمال
                this.thunderClouds.push(new ThunderCloud(this));
            }
            // پرنده‌های معکوس (خطرناک!)
            if (Math.random() < 0.08) { // 8% احتمال
                this.reverseBirds.push(new ReverseBird(this));
            }
            // پرنده‌های مهاجم معمولی
            if (Math.random() < 0.1) {
                this.birds.push(new Bird(this));
            }
            // دشمن زمینی
            if (Math.random() < 0.08) {
                this.groundEnemies.push(new GroundEnemy(this));
            }
            // آیتم‌ها
            if (Math.random() < 0.18) {
                this.items.push(new Star(this));
            }
            if (Math.random() < 0.36) {
                this.items.push(new FuelCan(this));
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        this.drawBackground();
        
        // رسم اشیاء بر اساس مرحله
        if (this.currentStage === 3) {
            this.buildings.forEach(building => building.draw(this.ctx));
            this.shooters.forEach(shooter => shooter.draw(this.ctx));
        } else if (this.currentStage === 4 && this.girlfriendBalloon) {
            this.girlfriendBalloon.draw(this.ctx);
        }
        
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.birds.forEach(bird => bird.draw(this.ctx));
        this.reverseBirds.forEach(bird => bird.draw(this.ctx));
        this.thunderClouds.forEach(cloud => cloud.draw(this.ctx));
        this.groundEnemies.forEach(enemy => enemy.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));
        this.particles.forEach(particle => particle.draw(this.ctx));
        
        // رسم بالن با خون (مرحله 3)
        if (this.currentStage === 3 && this.balloonBloodLevel > 0) {
            this.drawBalloonBlood();
        }
        
        this.balloon.draw(this.ctx);
        
        if (this.currentStage === 5) {
            this.drawStage5Overlay();
        } else if (!this.inputLocked) {
            this.drawControls();
        }
    }

    drawBackground() {
        const stage = this.currentStage;
        let gradient;
        
        if (stage === 1 || stage === 2) {
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.5, '#E0F7FA');
            gradient.addColorStop(1, '#B2EBF2');
        } else if (stage === 3) {
            // پس‌زمینه شهری
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#16213e');
            gradient.addColorStop(1, '#0f3460');
        } else if (stage === 4) {
            // پس‌زمینه غروب
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
            gradient.addColorStop(0, '#FF6B6B');
            gradient.addColorStop(0.5, '#FFA500');
            gradient.addColorStop(1, '#FFD93D');
        } else if (stage === 5) {
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
            gradient.addColorStop(0, '#1B1B3A');
            gradient.addColorStop(0.4, '#3A1C71');
            gradient.addColorStop(0.75, '#D76D77');
            gradient.addColorStop(1, '#FFEAC9');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        if (stage === 5) {
            this.drawEpilogueSky();
        } else if (stage !== 3) {
            this.drawBackgroundClouds();
        }
    }

    drawBackgroundClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 3; i++) {
            const x = ((this.backgroundOffset * 0.3) + i * 150) % (this.gameWidth + 200) - 100;
            const y = 50 + i * 100;
            this.drawCloud(x, y, 0.5);
        }
    }

    drawCloud(x, y, scale) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 25 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 50 * scale, y, 20 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawEpilogueSky() {
        if (!this.epilogueState || !this.epilogueState.skyDots) {
            return;
        }

        const dots = this.epilogueState.skyDots;
        this.ctx.save();
        dots.forEach((dot, index) => {
            const twinkle = 0.45 + Math.sin((this.epilogueState.timer + index * 18) / 40) * 0.25;
            this.ctx.globalAlpha = Math.max(0.15, Math.min(0.9, twinkle));
            this.ctx.fillStyle = dot.color;
            this.ctx.beginPath();
            this.ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    drawBalloonBlood() {
        this.ctx.save();
        this.ctx.globalAlpha = this.balloonBloodLevel / 200;
        this.ctx.fillStyle = '#8B0000';
        
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const x = this.balloon.x + 30 + Math.cos(angle) * 25;
            const y = this.balloon.y + 30 + Math.sin(angle) * 30;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, Math.random() * 3 + 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    drawControls() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, this.gameHeight - 80, 200, 70);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Controls:', 200, this.gameHeight - 60);
        this.ctx.fillText('↑/Space/Click = Up', 200, this.gameHeight - 45);
        this.ctx.fillText('← = Left', 200, this.gameHeight - 30);
        this.ctx.fillText('→ = Right', 200, this.gameHeight - 15);
    }

    checkCollision(obj1, obj2) {
        const rect1 = obj1.getBounds();
        const rect2 = obj2.getBounds();
        
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    checkCollisionWithBounds(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    collectStar(star) {
        star.collected = true;
        this.starsCollected++;
        this.score += 100;
        this.playSound('collectStar', { volume: 0.8 });
        this.createCollectionEffect(star.x, star.y, 'star');
    }

    collectFuel(fuelCan) {
        fuelCan.collected = true;
        this.balloon.addFuel(30);
        this.playSound('collectFuel', { volume: 0.75 });
        this.createCollectionEffect(fuelCan.x, fuelCan.y, 'fuel');
    }

    createCollectionEffect(x, y, type) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new CollectionParticle(x, y, type));
        }
    }

    createBloodEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new CollectionParticle(x, y, 'blood'));
        }
    }

    createWindEffect(x, y) {
        // افکت باد - ذرات سفید
        for (let i = 0; i < 10; i++) {
            const particle = new CollectionParticle(x, y, 'star');
            particle.color = 'rgba(255, 255, 255, 0.8)';
            particle.velocityX *= 2; // سریع‌تر
            this.particles.push(particle);
        }
    }

    createBulletHitEffect(x, y) {
        // افکت برخورد گلوله - ذرات قرمز
        for (let i = 0; i < 8; i++) {
            const particle = new CollectionParticle(x, y, 'fuel');
            particle.velocityX *= 1.5;
            this.particles.push(particle);
        }
    }

    updateUI() {
        const fuelPercent = (this.balloon.fuel / this.balloon.maxFuel) * 100;
        document.getElementById('fuelFill').style.width = fuelPercent + '%';
        document.getElementById('fuelText').textContent = `Fuel: ${Math.round(fuelPercent)}%`;
        
        const fuelFill = document.getElementById('fuelFill');
        if (fuelPercent < 20) {
            fuelFill.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #ff4444 100%)';
        } else if (fuelPercent < 50) {
            fuelFill.style.background = 'linear-gradient(90deg, #feca57 0%, #ff9f43 100%)';
        } else {
            fuelFill.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #feca57 50%, #4ecdc4 100%)';
        }
        
        if (this.currentStage <= 2) {
            document.getElementById('altitude').textContent = Math.floor(this.currentAltitude);
        } else {
            document.getElementById('altitude').textContent = Math.floor(this.horizontalDistance);
            document.getElementById('targetAltitude').textContent = this.targetDistance;
        }
        
        document.getElementById('starsCount').textContent = this.currentStage === 3 ? 
            this.killedSpectators : this.starsCollected;
    }

    stageComplete() {
        this.gameState = 'gameOver';
        this.playSound('victory', { volume: 0.85 });
        this.nextStageNumber = this.currentStage < 5 ? this.currentStage + 1 : null;
        
        // آزادسازی مرحله بعدی
        if (this.nextStageNumber && !this.unlockedLevels.includes(this.nextStageNumber)) {
            this.unlockedLevels.push(this.nextStageNumber);
            localStorage.setItem('unlockedLevels', JSON.stringify(this.unlockedLevels));
        }
        
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        
        let message;
        if (this.currentStage === 4 && this.girlfriendRescued) {
            message = `💖 Kami rescued his love!\n\n`;
            message += `⏱️ Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}\n`;
            message += `🪄 Distance traveled: ${Math.floor(this.horizontalDistance)} meters\n`;
            message += `⭐ Total score: ${this.score}\n`;
        } else {
            message = `🎉 Congratulations! You completed Stage ${this.currentStage}!\n\n`;
            message += `⏱️ Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}\n`;
            
            if (this.currentStage === 3) {
                message += `💀 Spectators killed: ${this.killedSpectators}\n`;
                message += `🎯 Shooter spawn rate: ${Math.floor(this.shooterSpawnChance * 100)}%\n`;
            }
        }
        
        this.gameOver(true, message, true);
    }

    gameOver(isVictory, message, isCompletion = false) {
        this.gameState = 'gameOver';
        
        // مخفی کردن دکمه‌های موبایل
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.add('hidden');
        }
        
        this.resetTouchState();
        this.resizeCanvas();

        // موسیقی فقط در صورت تکمیل مرحله (رفتن به مرحله بعد) متوقف می‌شود
        // اگر بازنده شد، موسیقی ادامه می‌یابد
        if (this.sound && isVictory && isCompletion) {
            // فقط در صورت پیروزی و رفتن به مرحله بعد، موسیقی متوقف می‌شود
            // چون مرحله جدید موسیقی جدید دارد
        }
        // در غیر این صورت موسیقی همچنان پخش می‌شود
        
        const title = isVictory ? '🎉 You Won!' : '💥Game Over!';
        document.getElementById('gameResultTitle').textContent = title;
        document.getElementById('gameResultText').textContent = message;
        
        const stats = `
            <p>📊 Game Stats:</p>
            <p>🎈 Altitude/Distance: ${this.currentStage <= 2 ? Math.floor(this.currentAltitude) : Math.floor(this.horizontalDistance)} meters</p>
            <p>⭐ Score: ${this.score}</p>
            <p>⛽ Fuel Remaining: ${Math.round(this.balloon.fuel)}%</p>
        `;
        document.getElementById('gameStats').innerHTML = stats;
        
        if (isVictory && isCompletion && this.nextStageNumber) {
            document.getElementById('nextStageBtn').classList.remove('hidden');
        } else {
            document.getElementById('nextStageBtn').classList.add('hidden');
        }
        
        document.getElementById('gameOverModal').classList.remove('hidden');
    }

    nextStage() {
        this.ensureSoundReady();
        document.getElementById('gameOverModal').classList.add('hidden');
        
        const targetStage = this.nextStageNumber || (this.currentStage + 1);
        this.nextStageNumber = null;

        if (targetStage === 2) {
            document.getElementById('stage2Modal').classList.remove('hidden');
        } else if (targetStage === 3) {
            document.getElementById('stage3Modal').classList.remove('hidden');
        } else if (targetStage === 4) {
            const stage4Modal = document.getElementById('stage4Modal');
            if (stage4Modal) stage4Modal.classList.remove('hidden');
        } else if (targetStage === 5) {
            const stage5Modal = document.getElementById('stage5Modal');
            if (stage5Modal) stage5Modal.classList.remove('hidden');
        }
    }

    restartGame() {
        this.ensureSoundReady();
        // ذخیره مرحله فعلی
        const savedStage = this.currentStage;
        
        // بازنشانی بازی
        this.gameState = 'playing';
        this.balloon = new Balloon(this);
        this.obstacles = [];
        this.items = [];
        this.birds = [];
        this.reverseBirds = [];
        this.thunderClouds = [];
        this.groundEnemies = [];
        this.buildings = [];
        this.shooters = [];
        this.girlfriendBalloon = null;
        this.particles = [];
        this.spawnTimer = 0;
        
        // بازنشانی آمار
        this.starsCollected = 0;
        this.fuelCollected = 0;
        this.currentAltitude = 0;
        this.horizontalDistance = 0;
        this.score = 0;
        this.girlfriendRescued = false;
    this.inputLocked = false;
    // Start-of-level grace period (2.5 seconds) where falling won't immediately cause game over
    this.levelGraceUntil = Date.now() + 2500;
        this.epilogueState = null;
        this.nextStageNumber = null;
        
        // مخصوص مرحله 3
        this.killedSpectators = 0;
        this.shooterSpawnChance = 0; // ریست به 0
        this.shootersToSpawn = 0; // ریست تیراندازها
        this.balloonBloodLevel = 0;
        
        this.backgroundOffset = 0;
        
        // بستن modal و شروع از همان مرحله
        document.getElementById('gameOverModal').classList.add('hidden');
        this.startStage(savedStage);
    }
    
    // متدهای مدیریت مودال‌های جدید
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            
            // Initialize tutorial if opening How to Play
            if (modalId === 'howToPlayModal') {
                this.currentTutorialPage = 1;
                this.updateTutorialPage();
            }
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    showLevelSelect() {
        // بارگذاری مراحل آزاد شده از localStorage
        const savedLevels = localStorage.getItem('unlockedLevels');
        this.unlockedLevels = savedLevels ? JSON.parse(savedLevels) : [1];
        
        // ایجاد لیست مراحل
        const levelList = document.getElementById('levelList');
        if (!levelList) return;
        
        levelList.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const levelBtn = document.createElement('button');
            levelBtn.className = 'level-btn';
            levelBtn.textContent = `Stage ${i}`;
            
            const isUnlocked = this.unlockedLevels.includes(i);
            
            if (!isUnlocked) {
                levelBtn.classList.add('locked');
                levelBtn.textContent += ' 🔒';
                levelBtn.disabled = true;
            } else {
                levelBtn.addEventListener('click', () => {
                    this.hideModal('levelSelectModal');
                    this.startStage(i);
                });
            }
            
            levelList.appendChild(levelBtn);
        }
        
        this.showModal('levelSelectModal');
    }
    
    // Tutorial navigation methods
    navigateTutorial(direction) {
        const newPage = this.currentTutorialPage + direction;
        
        if (newPage >= 1 && newPage <= this.totalTutorialPages) {
            this.currentTutorialPage = newPage;
            this.updateTutorialPage();
        }
    }
    
    updateTutorialPage() {
        // Hide all pages
        const pages = document.querySelectorAll('.tutorial-page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show current page
        const currentPageElement = document.querySelector(`.tutorial-page[data-page="${this.currentTutorialPage}"]`);
        if (currentPageElement) {
            currentPageElement.classList.add('active');
        }
        
        // Update page indicator
        const currentPageSpan = document.getElementById('currentPage');
        if (currentPageSpan) {
            currentPageSpan.textContent = this.currentTutorialPage;
        }
        
        // Update button states
        const prevBtn = document.getElementById('tutorialPrevBtn');
        const nextBtn = document.getElementById('tutorialNextBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentTutorialPage === 1;
        }
        
        if (nextBtn) {
            if (this.currentTutorialPage === this.totalTutorialPages) {
                nextBtn.textContent = 'Done ✓';
                nextBtn.onclick = () => {
                    this.hideModal('howToPlayModal');
                    this.currentTutorialPage = 1;
                    this.updateTutorialPage();
                    nextBtn.textContent = 'Next →';
                    nextBtn.onclick = null;
                };
            } else {
                nextBtn.textContent = 'Next →';
                nextBtn.onclick = null;
                nextBtn.disabled = false;
            }
        }
    }
}

// متغیر global برای دسترسی به بازی از console
let game;

// تابع برای شروع بازی بعد از لود شدن کامل
window.initGame = function() {
    game = new BalloonGame();
};

// اگر پریلودر وجود نداشت، مستقیماً شروع کن
window.addEventListener('load', () => {
    if (!window.preloader) {
        game = new BalloonGame();
    }
});
