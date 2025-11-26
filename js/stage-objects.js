// Building class (Stage 3)
class Building {
    constructor(game, isShort = false) {
        this.game = game;
        this.width = Math.random() * 60 + 40;
        this.height = isShort ? Math.random() * 100 + 80 : Math.random() * 200 + 150;
        this.x = game.canvas.width + 100;
        this.y = game.canvas.height - this.height;
        this.speed = 2;
        this.color = '#' + Math.floor(Math.random()*16777215).toString(16);
        this.hasSpectators = Math.random() > 0.5;
        this.spectators = [];
        
        if (this.hasSpectators) {
            const spectatorCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < spectatorCount; i++) {
                this.spectators.push({
                    x: this.x + Math.random() * this.width,
                    y: this.y - 30, // Above the building
                    killed: false,
                    blownAway: false,
                    canBlowAway: Math.random() > 0.5, // Only 50% can be blown away
                    wavePhase: Math.random() * Math.PI * 2,
                    waveSpeed: 0.12 + Math.random() * 0.08
                });
            }
        }
    }

    update() {
        this.x -= this.speed;
        this.spectators.forEach(spec => {
            if (!spec.killed && !spec.blownAway) {
                spec.wavePhase += spec.waveSpeed;
            }
            if (!spec.blownAway) {
                spec.x -= this.speed;
            } else {
                // If blown away, falls downward
                spec.x -= this.speed * 0.5;
                spec.y += 3;
            }
        });
        return this.x < -this.width - 100;
    }

    draw(ctx) {
        // Draw building
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Windows
        ctx.fillStyle = 'rgba(255, 255, 200, 0.7)';
        for (let i = 0; i < this.height / 30; i++) {
            for (let j = 0; j < this.width / 25; j++) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(
                        this.x + 5 + j * 25,
                        this.y + 5 + i * 30,
                        15, 20
                    );
                }
            }
        }
        
        // Draw spectators
        this.spectators.forEach(spec => {
            if (!spec.killed) {
                this.drawSpectator(ctx, spec);
            } else {
                this.drawBlood(ctx, spec.x, spec.y);
            }
        });
    }

    drawSpectator(ctx, spec) {
        let { x, y } = spec;
        ctx.save();
        
        // If blown away, add rotation
        if (spec.blownAway) {
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI);
            x = 0;
            y = 0;
        } else {
            const bounce = Math.sin(spec.wavePhase * 0.5) * 3;
            y += bounce;
        }
        
        // Head (larger)
        ctx.fillStyle = '#FDB777';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2); // From 8 to 12
        ctx.fill();
        
        // Body (larger)
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x - 9, y + 12, 18, 22); // From 12x15 to 18x22
        
        // Arms (waving or being blown away)
        ctx.strokeStyle = '#FDB777';
        ctx.lineWidth = 4; // From 3 to 4
        ctx.beginPath();
        if (!spec.blownAway) {
            const waveOffsetL = Math.sin(spec.wavePhase) * 6;
            const waveOffsetR = Math.sin(spec.wavePhase + Math.PI / 2) * 6;
            ctx.moveTo(x - 9, y + 15);
            ctx.lineTo(x - 22 - waveOffsetL, y + 5 - waveOffsetL * 0.4);
            ctx.moveTo(x + 9, y + 15);
            ctx.lineTo(x + 22 + waveOffsetR, y + 5 - waveOffsetR * 0.4);
        } else {
            ctx.moveTo(x - 9, y + 15);
            ctx.lineTo(x - 15, y + 25);
            ctx.moveTo(x + 9, y + 15);
            ctx.lineTo(x + 15, y + 25);
        }
        ctx.stroke();
        
        ctx.restore();
    }

    drawBlood(ctx, x, y) {
        // Larger and clearer blood splatter
        ctx.save();
        
        // Main blood
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Blood splatter
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = Math.random() * 20 + 10;
            const size = Math.random() * 5 + 2;
            
            ctx.fillStyle = i % 2 === 0 ? '#8B0000' : '#A00000';
            ctx.beginPath();
            ctx.arc(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                size,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Darker blood in center
        ctx.fillStyle = '#660000';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    getBounds() {
        // Smaller collision box for building (body only)
        return {
            x: this.x + 5,
            y: this.y + 20, // Slightly lower from top
            width: this.width - 10,
            height: this.height - 20
        };
    }

    checkSpectatorCollision(balloon) {
        let killed = false;
        let blownAway = false;
        
        this.spectators.forEach(spec => {
            if (!spec.killed && !spec.blownAway) {
                const dx = balloon.x + 30 - spec.x; // Balloon center
                const dy = balloon.y + 30 - spec.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Direct hit - kill
                if (distance < 45) { // Increased from 30 to 45
                    spec.killed = true;
                    killed = true;
                }
                // Close pass - blown away by wind (only if canBlowAway = true)
                else if (distance < 80 && spec.canBlowAway) {
                    spec.blownAway = true;
                    blownAway = true;
                }
            }
        });
        
        return { killed, blownAway };
    }
}

// Shooter class (Stage 3)
class Shooter {
    constructor(game) {
        this.game = game;
        this.width = 20;
        this.height = 30;
        this.x = game.canvas.width + 50;
        this.y = game.canvas.height - 100 - Math.random() * 200;
        this.speed = 2;
        this.shootTimer = 0;
        this.shootInterval = 120; // 2 seconds
        this.bullets = [];
    }

    update() {
        this.x -= this.speed;
        this.shootTimer++;
        
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x -= 5;
            bullet.y += bullet.vy;
            bullet.vy += 0.1; // Gravity
            return bullet.x > 0;
        });
        
        return this.x < -this.width;
    }

    shoot() {
        const balloon = this.game.balloon;
        const dx = balloon.x - this.x;
        const dy = balloon.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        this.bullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5
        });
    }

    draw(ctx) {
        // Shooter body
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Head
        ctx.fillStyle = '#FDB777';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Gun
        ctx.fillStyle = '#34495E';
        ctx.fillRect(this.x + 15, this.y + 10, 15, 5);
        
        // Bullets
        ctx.fillStyle = '#E74C3C';
        this.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    checkBulletCollision(balloon) {
        let hitCount = 0;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const dx = (balloon.x + 30) - bullet.x; // Balloon center
            const dy = (balloon.y + 30) - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 35) { // Larger for better detection
                this.bullets.splice(i, 1);
                hitCount++;
            }
        }
        return hitCount;
    }
}

// Girlfriend Balloon class (Stage 4)
class GirlfriendBalloon {
    constructor(game) {
        this.game = game;
        this.width = 70;
        this.height = 90;
        this.x = game.canvas.width + 200;
        this.y = game.canvas.height / 2;
        this.targetX = this.x;
        this.dialogues = [
            'Kamiiii !!',
            'Kami !',
            'Come for me !',
            'Kami! I am here!',
            'Sami is holding me!',
            'Hurry up, your fuel is running out!',
            'Together we will fly to the sky!'
        ];
        this.currentDialogue = '';
        this.dialogueTimer = 0;
        this.dialogueInterval = 150; // Approximately every 2.5 seconds
        this.dialogueDisplay = 0;
        this.captorWave = Math.random() * Math.PI * 2;
        this.allowRescue = false;
    }

    setTargetPosition(targetX, allowRescue = false) {
        this.targetX = targetX;
        this.allowRescue = allowRescue;
    }

    update() {
        // Vertical wave motion
        this.y += Math.sin(Date.now() * 0.0025) * 1.8;
        this.y = Math.max(60, Math.min(this.game.canvas.height - 120, this.y));

        // Approaching target position (to be 20 meters ahead)
        this.x += (this.targetX - this.x) * 0.08;

        // Villain animation
        this.captorWave += 0.12;

        // Help dialogues
        this.dialogueTimer++;
        if (this.dialogueTimer >= this.dialogueInterval) {
            this.dialogueTimer = 0;
            this.currentDialogue = this.dialogues[Math.floor(Math.random() * this.dialogues.length)];
            this.dialogueDisplay = 110; // Approximately 2 seconds
        }

        if (this.dialogueDisplay > 0) {
            this.dialogueDisplay--;
        } else {
            this.currentDialogue = '';
        }
    }

    draw(ctx) {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 - 15;
        const basketTop = this.y + this.height - 32;

        // Balloon body
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#FF9FF3');
        gradient.addColorStop(0.5, '#FF6AD5');
        gradient.addColorStop(1, '#FF9FF3');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Decorative stripes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 10, this.width / 2.4, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 10, this.width / 2.4, 12, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Heart in balloon center (glowing in Rescue mode)
        ctx.fillStyle = this.allowRescue ? '#FFE066' : '#FF2D95';
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 6, 9, 0, Math.PI * 2);
        ctx.arc(centerX + 8, centerY - 6, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX - 18, centerY - 2);
        ctx.lineTo(centerX, centerY + 18);
        ctx.lineTo(centerX + 18, centerY - 2);
        ctx.fill();

        if (this.allowRescue) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#FFE066';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, this.width / 2.1, this.height / 2.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Ropes
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 18, basketTop);
        ctx.lineTo(this.x + 10, this.y + 34);
        ctx.moveTo(this.x + this.width - 18, basketTop);
        ctx.lineTo(this.x + this.width - 10, this.y + 34);
        ctx.stroke();

        // Basket
        ctx.fillStyle = '#A57946';
        ctx.fillRect(this.x + 18, basketTop, this.width - 36, 24);
        ctx.strokeStyle = '#5C3A1E';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 18, basketTop, this.width - 36, 24);
        ctx.beginPath();
        ctx.moveTo(this.x + 18, basketTop + 8);
        ctx.lineTo(this.x + this.width - 18, basketTop + 8);
        ctx.moveTo(this.x + 18, basketTop + 16);
        ctx.lineTo(this.x + this.width - 18, basketTop + 16);
        ctx.stroke();

        // Villain character inside basket
        const villainX = centerX + 10;
        const villainY = basketTop - 6;
        const villainSwing = Math.sin(this.captorWave) * 4;
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(villainX - 10, villainY - 26, 20, 28);
        ctx.fillStyle = '#1B2631';
        ctx.fillRect(villainX - 12, villainY - 6, 24, 10);
        ctx.fillStyle = '#F2C185';
        ctx.beginPath();
        ctx.arc(villainX, villainY - 32, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(villainX - 3, villainY - 35, 1.5, 0, Math.PI * 2); 
        ctx.arc(villainX + 3, villainY - 35, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#922B21';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(villainX - 5, villainY - 29);
        ctx.lineTo(villainX + 5, villainY - 29);
        ctx.stroke();

        // Villain's hand holding rope
        ctx.strokeStyle = '#F2C185';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(villainX + 10, villainY - 16);
        ctx.lineTo(villainX + 20, villainY - 18 + villainSwing);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(villainX - 10, villainY - 16);
        ctx.lineTo(villainX - 18, villainY - 18 - villainSwing);
        ctx.stroke();

        // Rope towards Kami (showing hostage situation)
        ctx.strokeStyle = '#B03A2E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(villainX + 20, villainY - 18 + villainSwing);
        ctx.lineTo(centerX, villainY + 4);
        ctx.stroke();

        // Hostage girl
        const girlX = centerX - 10;
        const girlY = basketTop - 4;
        ctx.fillStyle = '#FFCDD2';
        ctx.fillRect(girlX - 10, girlY - 26, 20, 26);
        ctx.fillStyle = '#F2C185';
        ctx.beginPath();
        ctx.arc(girlX, girlY - 34, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(girlX - 3, girlY - 36, 1.2, 0, Math.PI * 2);
        ctx.arc(girlX + 3, girlY - 36, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(girlX - 4, girlY - 31);
        ctx.lineTo(girlX + 4, girlY - 31);
        ctx.stroke();

        // Long hair
        ctx.strokeStyle = '#6D4C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(girlX - 6, girlY - 30);
        ctx.lineTo(girlX - 12, girlY - 18);
        ctx.moveTo(girlX + 6, girlY - 30);
        ctx.lineTo(girlX + 12, girlY - 18);
        ctx.stroke();

        // Tied hands
        ctx.strokeStyle = '#F2C185';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(girlX - 10, girlY - 16);
        ctx.lineTo(girlX - 2, girlY - 10);
        ctx.moveTo(girlX + 10, girlY - 16);
        ctx.lineTo(girlX + 2, girlY - 10);
        ctx.stroke();
        ctx.strokeStyle = '#B03A2E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(girlX - 2, girlY - 10);
        ctx.lineTo(girlX + 2, girlY - 10);
        ctx.stroke();

        // Help speech bubble
        if (this.currentDialogue) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = '#1F1F1F';
            ctx.lineWidth = 2;
            const padding = 12;
            ctx.font = 'bold 14px "Vazirmatn", Arial, sans-serif';
            const textWidth = ctx.measureText(this.currentDialogue).width;
            const bubbleWidth = textWidth + padding * 2;
            const bubbleHeight = 34;
            const bubbleX = this.x - bubbleWidth / 4;
            const bubbleY = this.y - 45;

            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 10);
            ctx.fill();
            ctx.stroke();

            // Bubble tail
            ctx.beginPath();
            ctx.moveTo(bubbleX + bubbleWidth * 0.2, bubbleY + bubbleHeight);
            ctx.lineTo(bubbleX + bubbleWidth * 0.2 + 10, bubbleY + bubbleHeight + 12);
            ctx.lineTo(bubbleX + bubbleWidth * 0.2 + 20, bubbleY + bubbleHeight);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1F1F1F';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentDialogue, bubbleX + bubbleWidth / 2, bubbleY + 22);
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
}
