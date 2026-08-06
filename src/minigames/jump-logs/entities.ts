import { JUMP_LOGS_CONFIG } from './config';
import { PLAYER_COLORS } from '@/core/constants';

export class GroundDetail {
    active: boolean = false;
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 3;

    spawn(startX: number) {
        this.x = startX;
        this.y = JUMP_LOGS_CONFIG.GROUND_Y + 6 + Math.random() * 45;
        this.width = Math.random() > 0.5 ? 4 : 8;
        this.active = true;
    }

    update(dt: number, speed: number) {
        if (!this.active) return;
        this.x -= speed * dt;
        if (this.x < -this.width) this.active = false;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.fillStyle = '#73c242';
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.width, this.height);
    }
}

export class Tronco {
    active: boolean = false;
    x: number = 0;
    y: number = 210;
    width: number = 44;
    height: number = 36;
    type: 'single' | 'double' | 'large' = 'single';

    spawn(startX: number, type: 'single' | 'double' | 'large' = 'single') {
        this.x = startX;
        this.type = type;

        if (type === 'large') {
            this.width = 56;
            this.height = 52;
            this.y = JUMP_LOGS_CONFIG.GROUND_Y - 52;
        } else if (type === 'double') {
            this.width = 86;
            this.height = 42;
            this.y = JUMP_LOGS_CONFIG.GROUND_Y - 42;
        } else {
            this.width = 48;
            this.height = 42;
            this.y = JUMP_LOGS_CONFIG.GROUND_Y - 42;
        }
        this.active = true;
    }

    update(dt: number, speed: number) {
        if (!this.active) return;
        this.x -= speed * dt;
        if (this.x < -this.width - 40) this.active = false;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        const ix = Math.floor(this.x);
        const iy = Math.floor(this.y);
        const w = Math.floor(this.width);
        const h = Math.floor(this.height);
        const px = 2;

        ctx.fillStyle = 'rgba(10, 20, 8, 0.5)';
        ctx.fillRect(ix + 4, JUMP_LOGS_CONFIG.GROUND_Y, w - 8, 6);
        ctx.fillRect(ix + 2, JUMP_LOGS_CONFIG.GROUND_Y + 2, w - 4, 4);

        ctx.fillStyle = '#1a0e05';
        ctx.fillRect(ix, iy, w, h);

        ctx.fillStyle = '#3a1c05';
        ctx.fillRect(ix + px, iy + px, w - px * 2, h - px * 2);

        ctx.fillStyle = '#5c3111';
        ctx.fillRect(ix + px * 2, iy + px * 2, w - px * 4, h - px * 4);

        ctx.fillStyle = '#4a2609';
        for (let row = 0; row < 3; row++) {
            const ly = iy + px * 3 + row * Math.floor((h - px * 6) / 3);
            ctx.fillRect(ix + px * 3, ly, w - px * 6, px);
        }

        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(ix + px * 3, iy + px * 2, w - px * 8, px);
        ctx.fillRect(ix + px * 3, iy + h - px * 3, w - px * 8, px);

        ctx.fillStyle = '#7c4a1e';
        ctx.fillRect(ix + px * 4, iy + px * 3, w - px * 10, px);
        ctx.fillRect(ix + px * 5, iy + h - px * 5, w - px * 12, px);

        ctx.fillStyle = '#3a1c05';
        ctx.fillRect(ix + Math.floor(w * 0.3), iy + Math.floor(h * 0.4), px * 2, px * 2);
        ctx.fillStyle = '#4a2609';
        ctx.fillRect(ix + Math.floor(w * 0.3) + 1, iy + Math.floor(h * 0.4) + 1, px, px);

        const endW = Math.min(12, Math.floor(w * 0.22));
        const endX = ix + w - endW - px;
        ctx.fillStyle = '#d4a373';
        ctx.fillRect(endX, iy + px * 2, endW, h - px * 4);
        ctx.fillStyle = '#c49360';
        ctx.fillRect(endX + px, iy + px * 3, endW - px * 2, h - px * 6);
        ctx.fillStyle = '#b07d4a';
        ctx.fillRect(endX + px * 2, iy + px * 4, endW - px * 4, h - px * 8);
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(endX + px * 3, iy + Math.floor(h / 2) - px, Math.max(px, endW - px * 6), px * 2);

        ctx.fillStyle = '#438a22';
        ctx.fillRect(ix + px * 2, iy - px * 2, px * 4, px * 2);
        ctx.fillRect(ix + px * 5, iy - px * 3, px * 6, px * 3);
        ctx.fillRect(ix + px * 9, iy - px * 2, px * 3, px * 2);
        ctx.fillStyle = '#73c242';
        ctx.fillRect(ix + px * 6, iy - px * 4, px * 4, px * 2);
        ctx.fillRect(ix + px * 3, iy - px * 2, px * 2, px);

        ctx.fillStyle = '#e04040';
        ctx.fillRect(ix + px, iy - px * 4, px * 3, px * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + px + 1, iy - px * 4, px, px);
        ctx.fillStyle = '#d4a373';
        ctx.fillRect(ix + px + px, iy - px * 2, px, px * 2);
    }
}

export interface RunnerEntity {
    slot: number;
    name: string;
    color: string;
    secondaryColor: string;
    shirtColor: string;
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
    grounded: boolean;
    jumpTimer: number;
    legState: boolean;
    animTimer: number;
    lives: number;
    invulnerableTimer: number;
    isBot: boolean;
    jump: () => boolean;
    update: (dt: number, onStep?: () => void) => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    reset: (startX: number) => void;
}

export const createRunner = (slot: number, name: string): RunnerEntity => {
    const colorInfo = PLAYER_COLORS[slot] || PLAYER_COLORS[0];
    const startX = JUMP_LOGS_CONFIG.PLAYER_SPACING_X[slot] || 70;

    return {
        slot,
        name,
        color: colorInfo.primary,
        secondaryColor: colorInfo.secondary,
        shirtColor: colorInfo.shirt,
        x: startX,
        y: JUMP_LOGS_CONFIG.PLAYER_GROUND_Y,
        width: 38,
        height: 48,
        dy: 0,
        grounded: false,
        jumpTimer: 0,
        legState: false,
        animTimer: 0,
        lives: 3,
        invulnerableTimer: 0,
        isBot: false,

        reset(newStartX: number) {
            this.x = newStartX;
            this.y = JUMP_LOGS_CONFIG.PLAYER_GROUND_Y;
            this.dy = 0;
            this.grounded = true;
            this.jumpTimer = 0;
            this.legState = false;
            this.animTimer = 0;
            this.lives = 3;
            this.invulnerableTimer = 0;
        },

        jump() {
            if (this.lives > 0 && this.grounded && this.jumpTimer <= 0) {
                this.dy = -JUMP_LOGS_CONFIG.JUMP_FORCE;
                this.grounded = false;
                this.jumpTimer = 0.12;
                return true;
            }
            return false;
        },

        update(dt: number, onStep?: () => void) {
            if (this.lives <= 0) return;

            if (this.jumpTimer > 0) this.jumpTimer -= dt;
            if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

            this.animTimer += dt;
            if (this.animTimer > 0.09) {
                this.legState = !this.legState;
                this.animTimer = 0;
                if (this.grounded && onStep) onStep();
            }

            this.dy += JUMP_LOGS_CONFIG.GRAVITY * dt;
            this.y += this.dy * dt;

            if (this.y > JUMP_LOGS_CONFIG.PLAYER_GROUND_Y) {
                this.y = JUMP_LOGS_CONFIG.PLAYER_GROUND_Y;
                this.dy = 0;
                this.grounded = true;
            } else {
                this.grounded = false;
            }
        },

        draw(ctx: CanvasRenderingContext2D) {
            if (this.lives <= 0) return;

            const ix = Math.floor(this.x);
            const iy = Math.floor(this.y);

            ctx.save();

            ctx.fillStyle = 'rgba(10, 20, 8, 0.35)';
            ctx.beginPath();
            ctx.ellipse(ix + 18, JUMP_LOGS_CONFIG.GROUND_Y + 4, 18, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            const isHit = this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0;
            const mainColor = isHit ? '#ff3333' : this.shirtColor;
            const accentColor = isHit ? '#ffffff' : this.color;
            const secondaryColor = isHit ? '#aa0000' : this.secondaryColor;

            ctx.fillStyle = secondaryColor;
            if (this.legState) {
                ctx.fillRect(ix + 2, iy + 14, 6, 12);
            } else {
                ctx.fillRect(ix + 28, iy + 14, 6, 12);
            }

            ctx.fillStyle = secondaryColor;
            if (!this.grounded) {
                ctx.fillRect(ix + 8, iy + 34, 8, 10);
                ctx.fillRect(ix + 20, iy + 32, 8, 8);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ix + 6, iy + 42, 10, 3);
                ctx.fillRect(ix + 20, iy + 38, 10, 3);
            } else if (this.legState) {
                ctx.fillRect(ix + 6, iy + 34, 8, 14);
                ctx.fillRect(ix + 22, iy + 34, 8, 10);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ix + 4, iy + 46, 10, 3);
                ctx.fillRect(ix + 22, iy + 42, 10, 3);
            } else {
                ctx.fillRect(ix + 6, iy + 34, 8, 10);
                ctx.fillRect(ix + 22, iy + 34, 8, 14);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(ix + 6, iy + 42, 10, 3);
                ctx.fillRect(ix + 20, iy + 46, 10, 3);
            }

            ctx.fillStyle = mainColor;
            ctx.fillRect(ix + 8, iy + 12, 20, 20);
            ctx.fillStyle = accentColor;
            ctx.fillRect(ix + 12, iy + 12, 4, 20);

            ctx.fillStyle = '#ffdbac';
            ctx.fillRect(ix + 10, iy + 2, 16, 12);

            ctx.fillStyle = accentColor;
            ctx.fillRect(ix + 8, iy - 2, 20, 6);

            ctx.fillStyle = secondaryColor;
            ctx.fillRect(ix + 4, iy, 5, 8);

            ctx.fillStyle = '#142416';
            ctx.fillRect(ix + 20, iy + 5, 4, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ix + 22, iy + 5, 2, 2);
            ctx.fillStyle = '#e87b7b';
            ctx.fillRect(ix + 22, iy + 9, 3, 2);

            ctx.fillStyle = mainColor;
            if (this.legState) {
                ctx.fillRect(ix + 24, iy + 14, 6, 12);
            } else {
                ctx.fillRect(ix + 6, iy + 14, 6, 12);
            }

            ctx.font = "10px 'Press Start 2P', monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = '#0a140b';
            ctx.fillText(this.name, ix + 19, iy - 13);
            ctx.fillStyle = accentColor;
            ctx.fillText(this.name, ix + 18, iy - 14);

            ctx.restore();
        }
    };
};

export const getFromPool = <T extends { active: boolean }>(pool: T[], factory: () => T): T => {
    const item = pool.find(p => !p.active);
    if (item) return item;
    const newItem = factory();
    pool.push(newItem);
    return newItem;
};

export function mulberry32(a: number) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function lerpColor(c1: string, c2: string, factor: number): string {
    const f = Math.max(0, Math.min(1, factor));
    const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(r1 + f * (r2 - r1));
    const g = Math.round(g1 + f * (g2 - g1));
    const b = Math.round(b1 + f * (b2 - b1));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
}

export const STARS = Array.from({ length: 50 }, () => ({
    x: Math.random() * 800,
    y: Math.random() * 320,
    size: Math.random() > 0.7 ? 3 : 2,
    phase: Math.random() * Math.PI * 2
}));

export const FIREFLIES = Array.from({ length: 14 }, () => ({
    x: Math.random() * 800,
    y: 180 + Math.random() * 280,
    speedX: (Math.random() - 0.5) * 22,
    speedY: (Math.random() - 0.5) * 16,
    phase: Math.random() * Math.PI * 2
}));
