class Balloon {
    constructor(game) {
        this.game = game;
        this.width = 60;
        this.height = 80;
        this.x = game.canvas.width / 2 - 30; // مرکز صفحه
        this.y = game.canvas.height / 2; // وسط صفحه برای شروع بهتر
        this.velocityY = 0;
        this.velocityX = 0;
        this.gravity = 0.15; // جاذبه کمتر
        this.lift = -0.6; // نیروی بالا کمتر برای کنترل بهتر
        this.isHeating = false;
        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelConsumption = 0.3; // مصرف سوخت کمتر
        
        // رنگ‌های مختلف برای بالن
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // انیمیشن
        this.flameAnimation = 0;

        // وضعیت دست‌های کامی
        this.armPose = 'neutral';
        this.armPoseTimer = 0;

        // انیمیشن اختصاصی مراحل
        this.whiskeyCooldown = 240 + Math.floor(Math.random() * 180);
        this.drinkTimer = 0;
        this.isDrinking = false;
    }

    update() {
        // اعمال جاذبه
        this.velocityY += this.gravity;
        
        // اعمال نیروی بالاروی در صورت گرم کردن
        if (this.isHeating && this.fuel > 0) {
            this.velocityY += this.lift;
            this.fuel -= this.fuelConsumption;
            if (this.fuel < 0) this.fuel = 0;
            
            // انیمیشن شعله
            this.flameAnimation += 0.2;
        }
        
        // محدود کردن سرعت
        this.velocityY = Math.max(Math.min(this.velocityY, 5), -5);
        this.velocityX = Math.max(Math.min(this.velocityX, 4), -4);
        
        // مقاومت هوا برای حرکت افقی
        this.velocityX *= 0.92;
        
        // اعمال حرکت
        this.y += this.velocityY;
        this.x += this.velocityX;
        
        // محدودیت‌های مرزی افقی
        if (this.x < 30) {
            this.x = 30;
            this.velocityX = 0;
        }
        if (this.x > this.game.canvas.width - 30) {
            this.x = this.game.canvas.width - 30;
            this.velocityX = 0;
        }
        
        // محدودیت بالا
        if (this.y < 50) {
            this.y = 50;
            this.velocityY = 0;
        }
        
        // Fall (game over) - only when it really goes down
        if (this.y > this.game.canvas.height - 30) {
            this.game.gameOver(false,'Your balloon has fallen!');
        }
        
        // Update altitude
        this.game.currentAltitude = Math.max(this.game.currentAltitude, 
            Math.floor((this.game.canvas.height - this.y) / 2));

        // مدیریت وضعیت دست‌ها (وقتی ورودی نداریم به حالت عادی برگردد)
        if (this.armPoseTimer > 0) {
            this.armPoseTimer--;
        } else if (!this.isHeating && !this.isDrinking) {
            this.armPose = 'neutral';
        }

        const stage = this.game.currentStage || 1;
        if (stage === 3) {
            if (this.drinkTimer > 0) {
                this.drinkTimer--;
                this.isDrinking = true;
            } else {
                if (this.isDrinking) {
                    this.armPoseTimer = 0;
                }
                this.isDrinking = false;
                if (this.whiskeyCooldown > 0) {
                    this.whiskeyCooldown--;
                } else {
                    this.drinkTimer = 90;
                    this.isDrinking = true;
                    this.whiskeyCooldown = 240 + Math.floor(Math.random() * 180);
                }
            }
        } else {
            this.isDrinking = false;
            this.drinkTimer = 0;
            this.whiskeyCooldown = 240;
        }
    }

    applyWindForce(force, direction) {
        // اعمال نیروی باد (برای مرحله 3)
        const windPush = force * (direction === 'right' ? 1 : -1);
        this.velocityX += windPush;
    }

    draw(ctx) {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 - 5;
        const basketTop = this.y + 58;
        const basketHeight = 20;

        // بدنه بالن با گرادیان و نوارهای رنگی
        const mainGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        mainGradient.addColorStop(0, this.color);
        mainGradient.addColorStop(0.5, '#ffffff33');
        mainGradient.addColorStop(1, this.color);
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // نوارهای افقی
        ctx.lineWidth = 6;
        const stripeColors = ['rgba(255,255,255,0.35)', 'rgba(0,0,0,0.1)'];
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = stripeColors[i % stripeColors.length];
            const offsetY = centerY - this.height / 2 + 15 + i * 18;
            ctx.beginPath();
            ctx.ellipse(centerX, offsetY, this.width / 2.3, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // هایلایت سمت چپ
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(centerX - this.width * 0.18, centerY - this.height * 0.25, this.width * 0.18, this.height * 0.32, -0.35, 0, Math.PI * 2);
        ctx.fill();

        // طناب‌ها
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 16, basketTop);
        ctx.lineTo(this.x + 10, this.y + 30);
        ctx.moveTo(this.x + this.width - 16, basketTop);
        ctx.lineTo(this.x + this.width - 10, this.y + 30);
        ctx.moveTo(this.x + 24, basketTop);
        ctx.lineTo(this.x + 20, this.y + 42);
        ctx.moveTo(this.x + this.width - 24, basketTop);
        ctx.lineTo(this.x + this.width - 20, this.y + 42);
        ctx.stroke();

        // شعله در صورت گرم کردن
        if (this.isHeating && this.fuel > 0) {
            const flameOffset = Math.sin(this.flameAnimation) * 3;
            ctx.beginPath();
            const flameX = centerX;
            const flameY = basketTop - 5;
            ctx.fillStyle = '#FF9F1C';
            ctx.moveTo(flameX - 6, flameY);
            ctx.lineTo(flameX + 6, flameY);
            ctx.lineTo(flameX, flameY + 18 + flameOffset);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FF4E00';
            ctx.beginPath();
            ctx.moveTo(flameX - 3, flameY + 3);
            ctx.lineTo(flameX + 3, flameY + 3);
            ctx.lineTo(flameX, flameY + 12 + flameOffset);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFE066';
            ctx.beginPath();
            ctx.moveTo(flameX - 2, flameY + 5);
            ctx.lineTo(flameX + 2, flameY + 5);
            ctx.lineTo(flameX, flameY + 9 + flameOffset);
            ctx.closePath();
            ctx.fill();
        }

        // سبد با جزئیات چوبی
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(this.x + 16, basketTop, this.width - 32, basketHeight);
        ctx.strokeStyle = '#5C3A1E';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 16, basketTop, this.width - 32, basketHeight);
        ctx.beginPath();
        ctx.moveTo(this.x + 16, basketTop + 7);
        ctx.lineTo(this.x + this.width - 16, basketTop + 7);
        ctx.moveTo(this.x + 16, basketTop + 14);
        ctx.lineTo(this.x + this.width - 16, basketTop + 14);
        ctx.stroke();

        // کامی داخل سبد
        const kamiiX = centerX;
        const kamiiY = basketTop - 10;

        // بدن
        ctx.fillStyle = '#2E86AB';
        ctx.fillRect(kamiiX - 12, kamiiY - 18, 24, 28);

        // کمربند ایمنی
        ctx.fillStyle = '#F5B041';
        ctx.fillRect(kamiiX - 12, kamiiY - 4, 24, 6);

        // سر
        ctx.fillStyle = '#F2C185';
        ctx.beginPath();
        ctx.arc(kamiiX, kamiiY - 26, 12, 0, Math.PI * 2);
        ctx.fill();

        // موها
        ctx.fillStyle = '#3C2F2F';
        ctx.beginPath();
        ctx.arc(kamiiX - 6, kamiiY - 30, 8, Math.PI * 0.2, Math.PI * 1.3);
        ctx.arc(kamiiX + 2, kamiiY - 32, 9, Math.PI * 1.2, Math.PI * 2.1);
        ctx.fill();

        const stage = this.game.currentStage || 1;
        let expression = 'smile';
        if (stage === 4) {
            expression = 'serious';
        }
        if (stage === 3 && this.isDrinking) {
            expression = 'drink';
        }

        const faceCenterY = kamiiY - 26;
        ctx.lineCap = 'round';
        if (expression === 'smile') {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(kamiiX - 4, faceCenterY - 1, 1.5, 0, Math.PI * 2);
            ctx.arc(kamiiX + 4, faceCenterY - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(kamiiX, faceCenterY + 5, 6, Math.PI * 0.15, Math.PI - Math.PI * 0.15);
            ctx.stroke();

            if (stage <= 2) {
                ctx.fillStyle = 'rgba(255, 105, 97, 0.35)';
                ctx.beginPath();
                ctx.arc(kamiiX - 7, faceCenterY + 6, 4, 0, Math.PI * 2);
                ctx.arc(kamiiX + 7, faceCenterY + 6, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (expression === 'serious') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(kamiiX - 6, faceCenterY - 3);
            ctx.lineTo(kamiiX - 1, faceCenterY - 3);
            ctx.moveTo(kamiiX + 1, faceCenterY - 3);
            ctx.lineTo(kamiiX + 6, faceCenterY - 3);
            ctx.stroke();

            // ابروهای اخمو
            ctx.beginPath();
            ctx.moveTo(kamiiX - 8, faceCenterY - 9);
            ctx.lineTo(kamiiX - 2, faceCenterY - 6);
            ctx.moveTo(kamiiX + 8, faceCenterY - 9);
            ctx.lineTo(kamiiX + 2, faceCenterY - 6);
            ctx.stroke();

            // دهان مستقیم
            ctx.beginPath();
            ctx.moveTo(kamiiX - 6, faceCenterY + 6);
            ctx.lineTo(kamiiX + 6, faceCenterY + 6);
            ctx.stroke();
        } else if (expression === 'drink') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(kamiiX - 5, faceCenterY - 2);
            ctx.quadraticCurveTo(kamiiX - 2, faceCenterY - 1, kamiiX, faceCenterY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(kamiiX + 5, faceCenterY - 2);
            ctx.quadraticCurveTo(kamiiX + 2, faceCenterY - 1, kamiiX, faceCenterY);
            ctx.stroke();

            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.arc(kamiiX + 3, faceCenterY + 6, 4, 0, Math.PI * 2);
            ctx.fill();

            // دهان باز برای نوشیدن
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(kamiiX + 3, faceCenterY + 6, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.lineWidth = 1;

        // دست‌ها بسته به ورودی
        const shoulderLeft = { x: kamiiX - 11, y: kamiiY - 10 };
        const shoulderRight = { x: kamiiX + 11, y: kamiiY - 10 };
        const poses = {
            neutral: {
                left: { x: shoulderLeft.x - 10, y: shoulderLeft.y + 12 },
                right: { x: shoulderRight.x + 10, y: shoulderRight.y + 12 }
            },
            left: {
                left: { x: shoulderLeft.x - 24, y: shoulderLeft.y + 2 },
                right: { x: shoulderRight.x + 6, y: shoulderRight.y + 16 }
            },
            right: {
                left: { x: shoulderLeft.x - 6, y: shoulderLeft.y + 16 },
                right: { x: shoulderRight.x + 24, y: shoulderRight.y + 2 }
            },
            heat: {
                left: { x: shoulderLeft.x - 6, y: shoulderLeft.y - 14 },
                right: { x: shoulderRight.x + 6, y: shoulderRight.y - 14 }
            },
            drink: {
                left: { x: shoulderLeft.x - 12, y: shoulderLeft.y + 16 },
                right: { x: shoulderRight.x + 10, y: shoulderRight.y - 18 }
            }
        };
        let poseKey = this.armPose;
        if (this.isHeating) {
            poseKey = 'heat';
        }
        if (this.isDrinking) {
            poseKey = 'drink';
        }
        if (!poses[poseKey]) {
            poseKey = 'neutral';
        }
        const currentPose = poses[poseKey];

        if (poseKey === 'drink') {
            ctx.save();
            ctx.translate(kamiiX + 12, faceCenterY + 4);
            ctx.rotate(-Math.PI / 10);
            ctx.fillStyle = '#8E5E3B';
            ctx.fillRect(-4, -6, 8, 26);
            ctx.fillStyle = '#F7DC6F';
            ctx.fillRect(-3.5, 3, 7, 7);
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(-2.5, -12, 5, 6);
            ctx.restore();
        }

        ctx.strokeStyle = '#F2C185';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        // دست چپ
        ctx.beginPath();
        ctx.moveTo(shoulderLeft.x, shoulderLeft.y);
        ctx.lineTo(currentPose.left.x, currentPose.left.y);
        ctx.stroke();
        // دست راست
        ctx.beginPath();
        ctx.moveTo(shoulderRight.x, shoulderRight.y);
        ctx.lineTo(currentPose.right.x, currentPose.right.y);
        ctx.stroke();

        // دستکش‌ها
        ctx.fillStyle = '#1F618D';
        ctx.beginPath();
        ctx.arc(currentPose.left.x, currentPose.left.y, 4, 0, Math.PI * 2);
        ctx.arc(currentPose.right.x, currentPose.right.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // جزئیات سبد (لبه جلویی برجسته)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(this.x + 16, basketTop, this.width - 32, 4);

        ctx.restore();
    }

    startHeating() {
        const wasHeating = this.isHeating;
        this.isHeating = true;
        if (!wasHeating && this.game && typeof this.game.playSound === 'function') {
            this.game.playSound('heat', { volume: 0.6 + Math.random() * 0.2, pitch: 0.95 + Math.random() * 0.1 });
        }
        if (!this.isDrinking) {
            this.armPose = 'heat';
        }
        this.armPoseTimer = 0;
    }

    stopHeating() {
        this.isHeating = false;
        if (!this.isDrinking) {
            this.armPose = 'neutral';
        }
        this.armPoseTimer = 0;
    }
    
    moveLeft() {
        this.velocityX -= 0.5;
        this.setArmPose('left');
    }
    
    moveRight() {
        this.velocityX += 0.5;
        this.setArmPose('right');
    }

    setArmPose(pose) {
        if (this.isDrinking || this.isHeating) return;
        this.armPose = pose;
        this.armPoseTimer = 8; // چند فریم نگه دار تا انیمیشن روان شود
    }

    addFuel(amount) {
        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
