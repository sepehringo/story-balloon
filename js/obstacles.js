// Simple cloud class (Stage 1)
class Cloud {
    constructor(game) {
        this.game = game;
        this.width = 80;
        this.height = 40;
        this.x = game.canvas.width;
        this.y = Math.random() * (game.canvas.height - 200) + 100;
        this.speed = 2;
        this.passed = false;
    }

    update() {
        this.x -= this.speed;
        return this.x < -this.width;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 10, 15, 0, Math.PI * 2);
        ctx.arc(this.x + 40, this.y + 5, 20, 0, Math.PI * 2);
        ctx.arc(this.x + 60, this.y + 10, 15, 0, Math.PI * 2);
        ctx.fill();
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

// Thick cloud class (Stage 2)
class ThickCloud {
    constructor(game) {
        this.game = game;
        this.width = 120;
        this.height = 60;
        this.x = game.canvas.width;
        this.y = Math.random() * (game.canvas.height - 300) + 150;
        this.speed = 2;
        this.alpha = 0.8;
    }

    update() {
        this.x -= this.speed;
        return this.x < -this.width;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(200, 200, 200, ${this.alpha})`;
        
        // Draw thick cloud with multiple layers
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 15, 20, 0, Math.PI * 2);
        ctx.arc(this.x + 60, this.y + 10, 25, 0, Math.PI * 2);
        ctx.arc(this.x + 90, this.y + 15, 20, 0, Math.PI * 2);
        ctx.arc(this.x + 50, this.y + 30, 22, 0, Math.PI * 2);
        ctx.arc(this.x + 75, this.y + 35, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Shadow
        ctx.fillStyle = `rgba(150, 150, 150, ${this.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x + 35, this.y + 20, 18, 0, Math.PI * 2);
        ctx.arc(this.x + 65, this.y + 15, 22, 0, Math.PI * 2);
        ctx.fill();
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

// Mountain class (Stage 1)
class Mountain {
    constructor(game) {
        this.game = game;
        this.width = 100;
        this.height = 150;
        this.x = game.canvas.width;
        this.y = game.canvas.height - this.height;
        this.speed = 3;
    }

    update() {
        this.x -= this.speed;
        return this.x < -this.width;
    }

    draw(ctx) {
        // Mountain body - simple fixed shape
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Snow on peak
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - 15, this.y + 15);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 2 + 15, this.y + 15);
        ctx.closePath();
        ctx.fill();
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

// Tall mountain class (Stage 2)
class TallMountain {
    constructor(game) {
        this.game = game;
        this.width = 120;
        this.height = 200;
        this.x = game.canvas.width;
        this.y = game.canvas.height - this.height;
        this.speed = 3.2;
    }

    update() {
        this.x -= this.speed;
        return this.x < -this.width;
    }

    draw(ctx) {
        // شکل ثابت - کوهستان بلند با دو قله
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.3, this.y + 40);
        ctx.lineTo(this.x + this.width * 0.5, this.y + 60);
        ctx.lineTo(this.x + this.width * 0.7, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // برف روی قله‌ها
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.25, this.y + 50);
        ctx.lineTo(this.x + this.width * 0.3, this.y + 40);
        ctx.lineTo(this.x + this.width * 0.35, this.y + 50);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.65, this.y + 15);
        ctx.lineTo(this.x + this.width * 0.7, this.y);
        ctx.lineTo(this.x + this.width * 0.75, this.y + 15);
        ctx.closePath();
        ctx.fill();
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

// کلاس پرنده مهاجم (مرحله 2)
class Bird {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 30;

        const minY = 100;
        const maxY = game.canvas.height - 220;
        this.anchorY = Math.random() * (maxY - minY) + minY;

        this.x = game.canvas.width + 80 + Math.random() * 220;
        const stage = game.currentStage || 1;
        if (stage >= 4) {
            this.scrollSpeed = 2.8 + Math.random() * 0.6;
        } else {
            this.scrollSpeed = 2.2 + Math.random() * 0.7;
        }

        this.hoverAmplitude = 10 + Math.random() * 10;
        this.hoverSpeed = 0.02 + Math.random() * 0.02;
        this.hoverAngle = Math.random() * Math.PI * 2;
        this.wingFlap = Math.random() * Math.PI * 2;
        this.flapSpeed = 0.2 + Math.random() * 0.15;

        this.age = 0;
        this.lifetime = 900 + Math.random() * 600; // طول عمر زیاد تا زمانی که از کادر خارج شود
    }

    update() {
        this.age++;
    this.hoverAngle += this.hoverSpeed;
    this.wingFlap += this.flapSpeed;
        this.y = this.anchorY + Math.sin(this.hoverAngle) * this.hoverAmplitude;
        this.x -= this.scrollSpeed;

        const offScreen = this.x < -this.width - 80;
        return offScreen || this.age > this.lifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // بدن پرنده
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.ellipse(20, 15, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // سر
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.arc(35, 15, 8, 0, Math.PI * 2);
        ctx.fill();

        // منقار
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(43, 15);
        ctx.lineTo(50, 12);
        ctx.lineTo(50, 18);
        ctx.closePath();
        ctx.fill();

        // بال‌ها (انیمیشن)
        const wingY = Math.sin(this.wingFlap) * 5;
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.ellipse(15, 15 + wingY, 8, 12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // چشم
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(37, 13, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(37, 13, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
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

// کلاس تندباد (مرحله 3)
class WindStorm {
    constructor(game) {
        this.game = game;
        this.width = 150;
        this.height = 80;
        this.x = Math.random() * game.canvas.width;
        this.y = Math.random() * (game.canvas.height - 300) + 100;
        this.direction = Math.random() > 0.5 ? 'right' : 'left';
        this.strength = 0.3;
        this.opacity = 0.6;
        this.particles = [];
        
        // ایجاد ذرات باد
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: Math.random() * 2 + 1,
                size: Math.random() * 3 + 1
            });
        }
    }

    update() {
        // بروزرسانی ذرات
        this.particles.forEach(particle => {
            particle.x += particle.speed * (this.direction === 'right' ? 1 : -1);
            
            if (this.direction === 'right' && particle.x > this.width) {
                particle.x = 0;
            } else if (this.direction === 'left' && particle.x < 0) {
                particle.x = this.width;
            }
        });
        
        return false; // تندبادها ثابت هستند
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // گرادیان برای تندباد
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.direction === 'right' ? this.x + this.width : this.x - this.width,
            this.y
        );
        
        gradient.addColorStop(0, 'rgba(135, 206, 250, 0.3)');
        gradient.addColorStop(0.5, 'rgba(135, 206, 250, 0.6)');
        gradient.addColorStop(1, 'rgba(135, 206, 250, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
        
        // رسم ذرات باد
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(this.x + particle.x, this.y + particle.y - this.height / 2, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // پیکان جهت باد
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        if (this.direction === 'right') {
            ctx.moveTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width - 15, this.y - 10);
            ctx.lineTo(this.x + this.width - 15, this.y + 10);
        } else {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + 15, this.y - 10);
            ctx.lineTo(this.x + 15, this.y + 10);
        }
        ctx.fill();
        
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    applyForce(balloon) {
        const bounds = this.getBounds();
        const balloonBounds = balloon.getBounds();
        
        // بررسی برخورد
        if (balloonBounds.x < bounds.x + bounds.width &&
            balloonBounds.x + balloonBounds.width > bounds.x &&
            balloonBounds.y < bounds.y + bounds.height &&
            balloonBounds.y + balloonBounds.height > bounds.y) {
            
            balloon.applyWindForce(this.strength, this.direction);
        }
    }
}

// کلاس پرنده معکوس (حرکت از چپ به راست - کشنده!)
class ReverseBird {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 30;
        this.x = -this.width; // شروع کمی بیرون از سمت چپ
        this.y = Math.random() * (game.canvas.height - 220) + 80;
        this.speed = 3 + Math.random() * 2; // سرعت ثابت بین 3 تا 5
        this.wingFlap = 0;
        this.color = '#e74c3c'; // قرمز برای خطرناک بودن
    }

    update() {
        this.wingFlap += 0.3;
        this.x += this.speed; // حرکت مستقیم به سمت راست
        
        return this.x > this.game.canvas.width + this.width;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // بدن پرنده (قرمز)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(20, 15, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // سر
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(35, 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // منقار (به سمت راست چون به راست میره)
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(43, 15);
        ctx.lineTo(52, 12);
        ctx.lineTo(52, 18);
        ctx.closePath();
        ctx.fill();
        
        // بال‌ها (انیمیشن)
        const wingY = Math.sin(this.wingFlap) * 5;
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.ellipse(15, 15 + wingY, 8, 12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // چشم
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(33, 13, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(33, 13, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // علامت خطر (!)
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('!', 10, -5);
        
        ctx.restore();
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

// کلاس ابر رعد و برق (مراحل 2 و 4 - کشنده!)
class ThunderCloud {
    constructor(game) {
        this.game = game;
        this.width = 150;
        this.height = 80;
        this.x = game.canvas.width;
        this.y = Math.random() * (game.canvas.height - 300) + 100;
        this.speed = 1.5;
        this.alpha = 0.9;
        
        // رعد و برق
        this.lightningTimer = 0;
        this.lightningInterval = 120 + Math.random() * 120; // 2-4 ثانیه
        this.isLightning = false;
        this.lightningDuration = 10; // 0.16 ثانیه
        this.lightningCounter = 0;
        this.lightningPoints = [];
    }

    update() {
        this.x -= this.speed;
        
        // مدیریت رعد و برق
        this.lightningTimer++;
        if (this.lightningTimer >= this.lightningInterval) {
            this.isLightning = true;
            this.lightningTimer = 0;
            this.lightningCounter = 0;
            this.generateLightning();
        }
        
        if (this.isLightning) {
            this.lightningCounter++;
            if (this.lightningCounter >= this.lightningDuration) {
                this.isLightning = false;
            }
        }
        
        return this.x < -this.width;
    }

    generateLightning() {
        this.lightningPoints = [];
        const startX = this.x + this.width / 2;
        const startY = this.y + this.height;
        let currentX = startX;
        let currentY = startY;
        
        // ساخت مسیر زیگزاگی رعد
        for (let i = 0; i < 5; i++) {
            currentX += (Math.random() - 0.5) * 30;
            currentY += 30 + Math.random() * 20;
            this.lightningPoints.push({ x: currentX, y: currentY });
        }
    }

    draw(ctx) {
        ctx.save();
        
        // ابر سیاه
        ctx.fillStyle = `rgba(50, 50, 60, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x + 40, this.y + 20, 25, 0, Math.PI * 2);
        ctx.arc(this.x + 75, this.y + 15, 30, 0, Math.PI * 2);
        ctx.arc(this.x + 110, this.y + 20, 25, 0, Math.PI * 2);
        ctx.arc(this.x + 60, this.y + 35, 28, 0, Math.PI * 2);
        ctx.arc(this.x + 90, this.y + 40, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // لبه‌های تیره‌تر
        ctx.fillStyle = `rgba(30, 30, 40, ${this.alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x + 45, this.y + 25, 22, 0, Math.PI * 2);
        ctx.arc(this.x + 80, this.y + 20, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // رعد و برق
        if (this.isLightning) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            
            this.lightningPoints.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            
            ctx.stroke();
            
            // برق اضافی (شاخه‌های کناری)
            ctx.lineWidth = 1.5;
            for (let i = 0; i < this.lightningPoints.length - 1; i++) {
                if (Math.random() > 0.5) {
                    const point = this.lightningPoints[i];
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(point.x + (Math.random() - 0.5) * 40, point.y + 20);
                    ctx.stroke();
                }
            }
            
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getLightningBounds() {
        if (!this.isLightning) return [];
        
        // برگرداندن bounds برای هر قسمت رعد
        const bounds = [];
        const centerX = this.x + this.width / 2;
        const startY = this.y + this.height;
        
        bounds.push({
            x: centerX - 10,
            y: startY,
            width: 20,
            height: 30
        });
        
        this.lightningPoints.forEach((point, i) => {
            if (i > 0) {
                const prevPoint = this.lightningPoints[i - 1];
                bounds.push({
                    x: Math.min(prevPoint.x, point.x) - 10,
                    y: prevPoint.y,
                    width: Math.abs(point.x - prevPoint.x) + 20,
                    height: point.y - prevPoint.y
                });
            }
        });
        
        return bounds;
    }
}

// دشمن زمینی (مرحله 4)
class GroundEnemy {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 60;
        this.x = game.canvas.width + 100;
        this.y = game.canvas.height - this.height - 10; // نزدیک زمین
        this.speed = 2.4;
        this.stepPhase = Math.random() * Math.PI * 2;
        this.capeWave = Math.random() * Math.PI * 2;
    }

    update() {
        this.x -= this.speed;
        this.stepPhase += 0.25;
        this.capeWave += 0.18;
        return this.x < -this.width;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // سایه روی زمین
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.width / 2, this.height + 8, this.width / 2.4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // شنل شرور
        ctx.fillStyle = '#5D6D7E';
        const capeSwing = Math.sin(this.capeWave) * 6;
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 15);
        ctx.quadraticCurveTo(this.width + 20 + capeSwing, this.height / 2, this.width / 2, this.height - 5);
        ctx.lineTo(this.width / 2 - 8, this.height - 10);
        ctx.closePath();
        ctx.fill();

        // بدن
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(this.width / 2 - 12, 12, 24, 32);

        // کمربند
        ctx.fillStyle = '#F4D03F';
        ctx.fillRect(this.width / 2 - 12, 28, 24, 6);

        // پاها با حرکت دویدن
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 4;
        const legOffset = Math.sin(this.stepPhase) * 8;
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 6, 44);
        ctx.lineTo(this.width / 2 - 10 + legOffset, this.height);
        ctx.moveTo(this.width / 2 + 6, 44);
        ctx.lineTo(this.width / 2 + 10 - legOffset, this.height);
        ctx.stroke();

        // سر
        ctx.fillStyle = '#F2C185';
        ctx.beginPath();
        ctx.arc(this.width / 2, 8, 12, 0, Math.PI * 2);
        ctx.fill();

        // صورت شرور
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 4, 6, 1.5, 0, Math.PI * 2);
        ctx.arc(this.width / 2 + 4, 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 6, 11);
        ctx.lineTo(this.width / 2 + 6, 11);
        ctx.strokeStyle = '#922B21';
        ctx.lineWidth = 2;
        ctx.stroke();

        // بازوها
        ctx.strokeStyle = '#F2C185';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 12, 20);
        ctx.lineTo(this.width / 2 - 24, 28 + legOffset * 0.3);
        ctx.moveTo(this.width / 2 + 12, 20);
        ctx.lineTo(this.width / 2 + 24, 28 - legOffset * 0.3);
        ctx.stroke();

        // سلاح ساده (قلاب)
        ctx.strokeStyle = '#B03A2E';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.width / 2 + 24, 28 - legOffset * 0.3);
        ctx.lineTo(this.width / 2 + 34, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.width / 2 + 38, 18, 4, Math.PI / 2, Math.PI * 1.6);
        ctx.stroke();

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x + 8,
            y: this.y + 14,
            width: this.width - 16,
            height: this.height - 18
        };
    }
}
