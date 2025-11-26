// کلاس ستاره
class Star {
    constructor(game) {
        this.game = game;
        this.size = 20;
        this.x = game.canvas.width;
        this.y = Math.random() * (game.canvas.height - 200) + 100;
        this.speed = 2.5;
        this.collected = false;
        this.rotation = 0;
        this.sparkle = 0;
    }

    update() {
        this.x -= this.speed;
        this.rotation += 0.1;
        this.sparkle += 0.2;
        return this.x < -this.size || this.collected;
    }

    draw(ctx) {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        
        // افکت درخشش
        const scale = 1 + Math.sin(this.sparkle) * 0.1;
        ctx.scale(scale, scale);
        
        // رسم ستاره
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / 5;
            
            const outerX = Math.cos(outerAngle) * this.size / 2;
            const outerY = Math.sin(outerAngle) * this.size / 2;
            const innerX = Math.cos(innerAngle) * this.size / 4;
            const innerY = Math.sin(innerAngle) * this.size / 4;
            
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        
        // هایلایت
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(0, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // افکت نور دور ستاره
        ctx.save();
        ctx.globalAlpha = 0.3;
        const gradient = ctx.createRadialGradient(
            this.x + this.size / 2, this.y + this.size / 2, 0,
            this.x + this.size / 2, this.y + this.size / 2, this.size
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size
        };
    }
}

// کلاس کپسول سوخت
class FuelCan {
    constructor(game) {
        this.game = game;
        this.width = 25;
        this.height = 35;
        this.x = game.canvas.width;
        this.y = Math.random() * (game.canvas.height - 200) + 100;
        this.speed = 2.5;
        this.collected = false;
        this.bob = 0;
    }

    update() {
        this.x -= this.speed;
        this.bob += 0.15;
        return this.x < -this.width || this.collected;
    }

    draw(ctx) {
        if (this.collected) return;
        
        const bobOffset = Math.sin(this.bob) * 3;
        
        ctx.save();
        ctx.translate(this.x, this.y + bobOffset);
        
        // بدنه کپسول
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width, this.height);
        
        // درپوش
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(-2, 0, this.width + 4, 8);
        
        // نشانگر سوخت (شعله)
        ctx.fillStyle = '#FFAA00';
        ctx.fillRect(5, 10, this.width - 10, 15);
        
        // شعله کوچک
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 3, 12);
        ctx.lineTo(this.width / 2 + 3, 12);
        ctx.lineTo(this.width / 2, 5);
        ctx.closePath();
        ctx.fill();
        
        // حلقه آویز
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(this.width / 2 - 2, this.height - 5, 4, 8);
        
        // افکت درخشش
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(2, 2, 6, 12);
        
        ctx.restore();
        
        // افکت نور قرمز دور کپسول
        ctx.save();
        ctx.globalAlpha = 0.2;
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2 + bobOffset, 0,
            this.x + this.width / 2, this.y + this.height / 2 + bobOffset, this.width
        );
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2,
            this.y + this.height / 2 + bobOffset,
            this.width * 1.5,
            0,
            Math.PI * 2
        );
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

// کلاس ذرات برای افکت جمع‌آوری
class CollectionParticle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        
        if (type === 'star') {
            this.color = '#FFD700';
        } else if (type === 'fuel') {
            this.color = '#FF4444';
        } else if (type === 'blood') {
            this.color = '#8B0000';
        }
        
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy += 0.1; // گرایش به پایین
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}
