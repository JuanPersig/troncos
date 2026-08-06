import { JUMP_LOGS_CONFIG } from './config';
import { lerpColor, STARS, FIREFLIES, GroundDetail } from './entities';

interface RenderEngineState {
    dayNightTimer?: number;
    gameRunning: boolean;
    groundPool: GroundDetail[];
    gameSpeed: number;
}

export const drawBackground = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    timestamp: number,
    dt: number,
    engine: RenderEngineState
) => {
    if (engine.gameRunning) {
        engine.dayNightTimer = (engine.dayNightTimer || 0) + dt;
    }
    const cycleProgress = ((engine.dayNightTimer || 0) % 60) / 60; // 0.0 -> 1.0

    let topSky: string, midSky: string, botSky: string;
    let nightAlpha = 0;

    if (cycleProgress < 0.35) {
        topSky = '#0f2214'; midSky = '#1a3b2b'; botSky = '#2d5a3e';
        nightAlpha = 0;
    } else if (cycleProgress < 0.45) {
        const f = (cycleProgress - 0.35) / 0.10;
        topSky = lerpColor('#0f2214', '#261233', f);
        midSky = lerpColor('#1a3b2b', '#5c2242', f);
        botSky = lerpColor('#2d5a3e', '#b84e36', f);
        nightAlpha = f * 0.8;
    } else if (cycleProgress < 0.80) {
        topSky = '#050a14'; midSky = '#0c1626'; botSky = '#152438';
        nightAlpha = 0.8;
    } else {
        const f = (cycleProgress - 0.80) / 0.20;
        topSky = lerpColor('#050a14', '#0f2214', f);
        midSky = lerpColor('#0c1626', '#1a3b2b', f);
        botSky = lerpColor('#152438', '#2d5a3e', f);
        nightAlpha = (1 - f) * 0.8;
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, JUMP_LOGS_CONFIG.GROUND_Y);
    skyGrad.addColorStop(0, topSky);
    skyGrad.addColorStop(0.5, midSky);
    skyGrad.addColorStop(1, botSky);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const celestialAngle = (cycleProgress * Math.PI * 2) - Math.PI / 2;
    const sunX = canvas.width / 2 + Math.cos(celestialAngle) * 360;
    const sunY = JUMP_LOGS_CONFIG.GROUND_Y + Math.sin(celestialAngle) * 260;

    const moonAngle = celestialAngle + Math.PI;
    const moonX = canvas.width / 2 + Math.cos(moonAngle) * 360;
    const moonY = JUMP_LOGS_CONFIG.GROUND_Y + Math.sin(moonAngle) * 260;

    if (sunY < JUMP_LOGS_CONFIG.GROUND_Y + 40) {
        ctx.fillStyle = '#f4d160';
        ctx.fillRect(Math.floor(sunX - 18), Math.floor(sunY - 18), 36, 36);
        ctx.fillStyle = 'rgba(255, 230, 100, 0.25)';
        ctx.fillRect(Math.floor(sunX - 26), Math.floor(sunY - 26), 52, 52);
    }

    if (moonY < JUMP_LOGS_CONFIG.GROUND_Y + 40) {
        ctx.fillStyle = '#d6e8ff';
        ctx.fillRect(Math.floor(moonX - 16), Math.floor(moonY - 16), 32, 32);
        ctx.fillStyle = '#9cb8d9';
        ctx.fillRect(Math.floor(moonX - 8), Math.floor(moonY - 8), 10, 10);
        ctx.fillRect(Math.floor(moonX + 2), Math.floor(moonY + 4), 6, 6);
        ctx.fillStyle = 'rgba(214, 232, 255, 0.2)';
        ctx.fillRect(Math.floor(moonX - 22), Math.floor(moonY - 22), 44, 44);
    }

    if (nightAlpha > 0.1) {
        ctx.save();
        for (let i = 0; i < STARS.length; i++) {
            const star = STARS[i];
            const twinkle = (Math.sin(timestamp * 0.004 + star.phase) + 1) * 0.5;
            ctx.fillStyle = `rgba(224, 240, 255, ${twinkle * nightAlpha})`;
            ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
        }
        ctx.restore();
    }

    ctx.fillStyle = lerpColor('#0d1a0e', '#060d17', nightAlpha);
    for (let x = 0; x <= canvas.width; x += 40) {
        const h = 80 + Math.sin(x * 0.02) * 35;
        ctx.fillRect(x, JUMP_LOGS_CONFIG.GROUND_Y - h, 42, h);
    }

    ctx.fillStyle = lerpColor('#142a17', '#08121f', nightAlpha);
    for (let x = 0; x <= canvas.width; x += 30) {
        const h = 55 + (x % 35);
        ctx.fillRect(x, JUMP_LOGS_CONFIG.GROUND_Y - h, 18, h);
        ctx.fillRect(x - 6, JUMP_LOGS_CONFIG.GROUND_Y - h + 10, 30, 14);
        ctx.fillRect(x - 10, JUMP_LOGS_CONFIG.GROUND_Y - h + 24, 38, 16);
    }

    if (nightAlpha > 0.2) {
        ctx.save();
        for (let i = 0; i < FIREFLIES.length; i++) {
            const ff = FIREFLIES[i];
            if (engine.gameRunning) {
                ff.x += ff.speedX * dt;
                ff.y += ff.speedY * dt;
                if (ff.x < 0) ff.x = canvas.width;
                if (ff.x > canvas.width) ff.x = 0;
                if (ff.y < 180) ff.y = 180;
                if (ff.y > JUMP_LOGS_CONFIG.GROUND_Y) ff.y = JUMP_LOGS_CONFIG.GROUND_Y;
            }
            const glow = (Math.sin(timestamp * 0.005 + ff.phase) + 1) * 0.5;
            ctx.fillStyle = `rgba(168, 255, 62, ${glow * 0.9})`;
            ctx.fillRect(Math.floor(ff.x), Math.floor(ff.y), 3, 3);
        }
        ctx.restore();
    }

    ctx.fillStyle = lerpColor('#4a2e18', '#1c120a', nightAlpha);
    ctx.fillRect(0, JUMP_LOGS_CONFIG.GROUND_Y, canvas.width, canvas.height - JUMP_LOGS_CONFIG.GROUND_Y);

    ctx.fillStyle = lerpColor('#438a22', '#1b3b0e', nightAlpha);
    ctx.fillRect(0, JUMP_LOGS_CONFIG.GROUND_Y, canvas.width, 8);

    ctx.fillStyle = lerpColor('#73c242', '#2f5b1a', nightAlpha);
    for (let x = 0; x <= canvas.width; x += 14) {
        ctx.fillRect(x, JUMP_LOGS_CONFIG.GROUND_Y - 4, 5, 4);
    }
};

export const drawHUD = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, score: number) => {
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = '#f4d160';
    ctx.fillText(`PUNTAJE: ${score}`, canvas.width - 20, 35);
};
