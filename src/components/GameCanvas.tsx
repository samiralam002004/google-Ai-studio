import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pause, Play, LogOut, Shield, Zap, Compass, Coins, Award, Trophy, Target, Sparkles } from 'lucide-react';
import { Snake, Food, PowerupItem, Particle, Position, WORLD_SIZE, ControlType, ActivePowerups } from '../types';
import { audioSynth } from '../audio';

interface GameCanvasProps {
  playerName: string;
  selectedSkinColor: string;
  selectedSkinId: string;
  isMultiplayer: boolean;
  onGameOver: (finalScore: number, kills: number, coinsEarned: number) => void;
  onQuit: () => void;
}

const AI_NAMES = [
  'SlitherX', 'ViperMaster', 'Python99', 'Anaconda', 'NeonCobra',
  'Speedy', 'ShieldViper', 'MagnetMamba', 'GoldGlider', 'NokiaLegacy',
  'Pulsar', 'CosmicTail', 'AlphaWorm', 'ShadowCrawl', 'ApexSlayer'
];

const BOT_COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1',
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e',
  '#84cc16', '#eab308', '#f97316', '#ef4444'
];

export default function GameCanvas({
  playerName,
  selectedSkinColor,
  selectedSkinId,
  isMultiplayer,
  onGameOver,
  onQuit
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Keyboard, Mouse, and Joystick Controls
  const [controlType, setControlType] = useState<ControlType>('mouse');
  const joystickRef = useRef<{ active: boolean; startX: number; startY: number; curX: number; curY: number }>({
    active: false, startX: 0, startY: 0, curX: 0, curY: 0
  });

  // Game settings
  const [isPaused, setIsPaused] = useState(false);
  const [playersCount, setPlayersCount] = useState(1);
  const [hudStats, setHudStats] = useState({ score: 10, kills: 0, coins: 0, rank: 1 });

  // Missions & Achievements System
  const [activeMissions, setActiveMissions] = useState([
    { id: 'm1', text: 'Reach 100 Score', target: 100, current: 10, completed: false, reward: 20 },
    { id: 'm2', text: 'Kill 2 AI Snakes', target: 2, current: 0, completed: false, reward: 50 },
    { id: 'm3', text: 'Collect 1 Magnet Powerup', target: 1, current: 0, completed: false, reward: 30 }
  ]);
  const [notification, setNotification] = useState<string | null>(null);

  // Game Engine State Refs (to avoid React trigger loops in high-frequency anim frames)
  const playerRef = useRef<Snake | null>(null);
  const otherSnakesRef = useRef<Map<string, Snake>>(new Map());
  const foodRef = useRef<Food[]>([]);
  const powerupsRef = useRef<PowerupItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Game session parameters
  const scoreRef = useRef(10);
  const killsRef = useRef(0);
  const coinsRef = useRef(0);
  const keyboardRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<Position>({ x: 0, y: 0 });

  // Web Sockets reference connection setup
  useEffect(() => {
    if (!isMultiplayer) {
      // Local setup: seed food & powerups
      const localFood: Food[] = [];
      const FOOD_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
      for (let i = 0; i < 200; i++) {
        const isSuper = Math.random() < 0.08;
        localFood.push({
          id: `food_${Math.random().toString(36).substr(2, 9)}`,
          x: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
          y: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
          value: isSuper ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 3) + 2,
          color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
          size: isSuper ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 2) + 4,
          isSuper,
        });
      }
      foodRef.current = localFood;

      const localPowerups: PowerupItem[] = [];
      const types: Array<'magnet' | 'shield' | 'speed'> = ['magnet', 'shield', 'speed'];
      for (let i = 0; i < 12; i++) {
        localPowerups.push({
          id: `pw_${Math.random().toString(36).substr(2, 9)}`,
          type: types[Math.floor(Math.random() * types.length)],
          x: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
          y: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
          size: 15,
        });
      }
      powerupsRef.current = localPowerups;

      // Seed 12 intelligent AI snakes
      for (let i = 0; i < 12; i++) {
        const aiId = `ai_${Math.random().toString(36).substr(2, 9)}`;
        const startX = Math.floor(Math.random() * (WORLD_SIZE - 400)) + 200;
        const startY = Math.floor(Math.random() * (WORLD_SIZE - 400)) + 200;
        const startAngle = Math.random() * Math.PI * 2;
        const aiColor = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
        
        const segments = [];
        for (let j = 0; j < 12; j++) {
          segments.push({
            x: startX - Math.cos(startAngle) * j * 15,
            y: startY - Math.sin(startAngle) * j * 15,
            angle: startAngle
          });
        }

        otherSnakesRef.current.set(aiId, {
          id: aiId,
          name: AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)],
          segments,
          color: aiColor,
          skinId: 'classic_green',
          score: 120,
          kills: 0,
          isDead: false,
          isAI: true,
          isBoosting: false,
          activePowerups: { magnet: 0, shield: 0, speed: 0 },
          width: 14,
          speed: 3,
          angle: startAngle,
          targetAngle: startAngle,
        });
      }
      setPlayersCount(13); // Bots + player
    } else {
      // Setup WebSockets multiplayer link
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'join',
          payload: {
            name: playerName || 'SnakePlayer',
            skinId: selectedSkinId
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case 'welcome': {
              const { playerId, food, powerups } = message.payload;
              
              // Spawn player snake
              const px = Math.floor(Math.random() * 2000) + 1000;
              const py = Math.floor(Math.random() * 2000) + 1000;
              const angle = Math.random() * Math.PI * 2;
              
              const segments = [];
              for (let i = 0; i < 10; i++) {
                segments.push({ x: px - Math.cos(angle) * i * 15, y: py - Math.sin(angle) * i * 15, angle });
              }

              playerRef.current = {
                id: playerId,
                name: playerName || 'You',
                segments,
                color: selectedSkinColor,
                skinId: selectedSkinId,
                score: 10,
                kills: 0,
                isDead: false,
                isAI: false,
                isBoosting: false,
                activePowerups: { magnet: 0, shield: 0, speed: 0 },
                width: 15,
                speed: 3.5,
                angle,
                targetAngle: angle,
                isInvulnerable: true,
                spawnInvulTimer: Date.now() + 3000
              };

              foodRef.current = food;
              powerupsRef.current = powerups;
              break;
            }

            case 'player_joined': {
              // Quick alert notification for joining
              break;
            }

            case 'sync': {
              const { snakes, playersCount: count } = message.payload;
              setPlayersCount(count);
              
              // Sync snakes from server
              const activeIds = new Set<string>();
              snakes.forEach((s: any) => {
                if (playerRef.current && s.id === playerRef.current.id) {
                  // Keep authoritative local player segments to prevent network rubber-banding,
                  // but we can update our scores/kills if calculated by server.
                  return;
                }
                
                activeIds.add(s.id);
                otherSnakesRef.current.set(s.id, {
                  id: s.id,
                  name: s.name,
                  segments: s.segments,
                  color: s.color,
                  skinId: s.skinId,
                  score: s.score,
                  kills: s.kills,
                  isDead: s.isDead,
                  isAI: false,
                  isBoosting: s.isBoosting,
                  activePowerups: s.activePowerups,
                  width: s.width || 14,
                  speed: s.speed || 3,
                  angle: s.angle || 0,
                  targetAngle: s.targetAngle || 0
                });
              });

              // Clean up left players
              otherSnakesRef.current.forEach((val, key) => {
                if (!activeIds.has(key)) {
                  otherSnakesRef.current.delete(key);
                }
              });
              break;
            }

            case 'food_eaten': {
              const { eatenId, addedFood } = message.payload;
              // Remove eaten food
              foodRef.current = foodRef.current.filter(f => f.id !== eatenId);
              // Add fresh food
              foodRef.current.push(addedFood);
              break;
            }

            case 'powerup_collected': {
              const { collectedId, type: pwType } = message.payload;
              powerupsRef.current = powerupsRef.current.filter(p => p.id !== collectedId);
              break;
            }

            case 'powerup_respawn': {
              powerupsRef.current.push(message.payload);
              break;
            }

            case 'snake_dead': {
              const { deadId, killerId, disperseFood } = message.payload;
              if (playerRef.current && deadId === playerRef.current.id) {
                // We died
                handlePlayerDeath();
              } else {
                // Trigger explosion animation at corpse location
                const deadSnake = otherSnakesRef.current.get(deadId);
                if (deadSnake && deadSnake.segments.length > 0) {
                  const head = deadSnake.segments[0];
                  triggerDeathExplosion(head.x, head.y, deadSnake.color);
                }
                otherSnakesRef.current.delete(deadId);
              }
              
              // Spawn dispersed food items
              if (disperseFood && Array.isArray(disperseFood)) {
                foodRef.current.push(...disperseFood);
              }
              break;
            }
          }
        } catch (e) {
          console.error('Error reading socket data', e);
        }
      };

      ws.onclose = () => {
        // Switch gracefully to offline if server connection breaks
        console.warn('Socket closed. Connection lost.');
      };

      return () => {
        if (wsRef.current) wsRef.current.close();
      };
    }
  }, [isMultiplayer]);

  // Handle local player setup for Offline Mode
  useEffect(() => {
    if (!isMultiplayer) {
      const px = Math.floor(Math.random() * (WORLD_SIZE - 400)) + 200;
      const py = Math.floor(Math.random() * (WORLD_SIZE - 400)) + 200;
      const angle = Math.random() * Math.PI * 2;
      
      const segments = [];
      for (let i = 0; i < 10; i++) {
        segments.push({ x: px - Math.cos(angle) * i * 15, y: py - Math.sin(angle) * i * 15, angle });
      }

      playerRef.current = {
        id: 'player_local',
        name: playerName || 'You',
        segments,
        color: selectedSkinColor,
        skinId: selectedSkinId,
        score: 10,
        kills: 0,
        isDead: false,
        isAI: false,
        isBoosting: false,
        activePowerups: { magnet: 0, shield: 0, speed: 0 },
        width: 15,
        speed: 3.5,
        angle,
        targetAngle: angle,
        isInvulnerable: true,
        spawnInvulTimer: Date.now() + 3000
      };
    }
  }, [isMultiplayer]);

  // Push achievement notifications
  const showNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Check and update in-game missions
  const updateMissionsProgress = useCallback((type: 'score' | 'kill' | 'magnet', value: number) => {
    setActiveMissions((prev) =>
      prev.map((m) => {
        if (m.completed) return m;

        let cur = m.current;
        if (type === 'score' && m.id === 'm1') {
          cur = Math.max(m.current, value);
        } else if (type === 'kill' && m.id === 'm2') {
          cur += value;
        } else if (type === 'magnet' && m.id === 'm3') {
          cur += value;
        }

        const completed = cur >= m.target;
        if (completed) {
          audioSynth.playPowerup();
          coinsRef.current += m.reward;
          showNotification(`Mission Completed! ${m.text} (+${m.reward} Coins!)`);
        }

        return { ...m, current: cur, completed };
      })
    );
  }, []);

  // Trigger burst graphics particles when eating or dying
  const spawnParticles = (x: number, y: number, color: string, count: number, type: 'eat' | 'dust' | 'explode' | 'powerup') => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'explode' ? Math.random() * 4 + 2 : Math.random() * 2 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        maxLife: type === 'explode' ? 45 : type === 'eat' ? 15 : 25,
        size: type === 'explode' ? Math.random() * 4 + 2 : Math.random() * 2.5 + 1.5,
        type
      });
    }
  };

  const triggerDeathExplosion = (x: number, y: number, color: string) => {
    audioSynth.playDie();
    spawnParticles(x, y, color, 30, 'explode');
    spawnParticles(x, y, '#eab308', 10, 'explode'); // golden coin sparkles
  };

  const handlePlayerDeath = () => {
    if (!playerRef.current || playerRef.current.isDead) return;
    playerRef.current.isDead = true;

    triggerDeathExplosion(playerRef.current.segments[0].x, playerRef.current.segments[0].y, playerRef.current.color);

    // Calculate coin multiplier based on kills & scores
    const earnedCoins = Math.floor(scoreRef.current / 15) + (killsRef.current * 10) + coinsRef.current;
    
    // Trigger callback
    setTimeout(() => {
      onGameOver(scoreRef.current, killsRef.current, earnedCoins);
    }, 1500);
  };

  // Keyboard, Mouse, and Window handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (playerRef.current) playerRef.current.isBoosting = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardRef.current[e.key.toLowerCase()] = false;
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (playerRef.current) playerRef.current.isBoosting = false;
      }
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mouse Pointer following
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlType !== 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + canvas.width / 2;
    const cy = rect.top + canvas.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    mousePosRef.current = { x: dx, y: dy };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (playerRef.current) {
      playerRef.current.isBoosting = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (playerRef.current) {
      playerRef.current.isBoosting = false;
    }
  };

  // Mobile virtual analog joystick controller
  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setControlType('joystick');
    const touch = e.touches[0];
    joystickRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY
    };
  };

  const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickRef.current.active) return;
    const touch = e.touches[0];
    joystickRef.current.curX = touch.clientX;
    joystickRef.current.curY = touch.clientY;

    const dx = joystickRef.current.curX - joystickRef.current.startX;
    const dy = joystickRef.current.curY - joystickRef.current.startY;

    mousePosRef.current = { x: dx, y: dy };
  };

  const handleJoystickEnd = () => {
    joystickRef.current.active = false;
  };

  // Main Game Update and Rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateFrame = () => {
      if (isPaused) {
        animId = requestAnimationFrame(updateFrame);
        return;
      }

      const player = playerRef.current;
      if (!player) {
        animId = requestAnimationFrame(updateFrame);
        return;
      }

      const now = Date.now();

      // 1. UPDATE PLAYER DIRECTION
      if (controlType === 'keyboard') {
        let dx = 0;
        let dy = 0;
        if (keyboardRef.current['w'] || keyboardRef.current['arrowup']) dy = -1;
        if (keyboardRef.current['s'] || keyboardRef.current['arrowdown']) dy = 1;
        if (keyboardRef.current['a'] || keyboardRef.current['arrowleft']) dx = -1;
        if (keyboardRef.current['d'] || keyboardRef.current['arrowright']) dx = 1;

        if (dx !== 0 || dy !== 0) {
          player.targetAngle = Math.atan2(dy, dx);
        }
      } else {
        // Mouse & Joystick follow
        const dx = mousePosRef.current.x;
        const dy = mousePosRef.current.y;
        if (dx * dx + dy * dy > 100) {
          player.targetAngle = Math.atan2(dy, dx);
        }
      }

      // Smooth angle transition (interpolation)
      let diff = player.targetAngle - player.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      player.angle += diff * 0.15;

      // 2. SPEED BOOST CONTROL
      let currentSpeed = player.speed;
      if (player.isBoosting && player.score > 12) {
        currentSpeed *= 1.8;
        if (now % 6 === 0) {
          // Drain score to speed boost, drop behind food trail
          player.score -= 0.15;
          scoreRef.current = Math.floor(player.score);
          const tail = player.segments[player.segments.length - 1];
          
          if (!isMultiplayer) {
            // Drop physical food behind snake
            foodRef.current.push({
              id: `food_${Math.random().toString(36).substr(2, 9)}`,
              x: tail.x + (Math.random() - 0.5) * 15,
              y: tail.y + (Math.random() - 0.5) * 15,
              value: 1,
              color: player.color,
              size: 4,
              isSuper: false
            });
          }
          audioSynth.playBoost();
          spawnParticles(tail.x, tail.y, player.color, 2, 'dust');
        }
      }

      // Check speed active powerup
      if (player.activePowerups.speed > now) {
        currentSpeed *= 1.6;
        if (now % 8 === 0) {
          const head = player.segments[0];
          spawnParticles(head.x, head.y, '#a855f7', 1, 'powerup');
        }
      }

      // 3. MOVE PLAYER SEGMENTS
      const head = player.segments[0];
      const nextX = head.x + Math.cos(player.angle) * currentSpeed;
      const nextY = head.y + Math.sin(player.angle) * currentSpeed;

      // Map boundary constraint checks
      const clampX = Math.max(10, Math.min(WORLD_SIZE - 10, nextX));
      const clampY = Math.max(10, Math.min(WORLD_SIZE - 10, nextY));

      // Trigger self death if crashing headfirst into border
      if (clampX <= 10 || clampX >= WORLD_SIZE - 10 || clampY <= 10 || clampY >= WORLD_SIZE - 10) {
        handlePlayerDeath();
      }

      // Move body segments following the head
      const newSegments = [{ x: clampX, y: clampY, angle: player.angle }];
      const stepDist = 12; // distance between segments
      let prevX = clampX;
      let prevY = clampY;

      for (let i = 1; i < player.segments.length; i++) {
        const seg = player.segments[i];
        const dx = seg.x - prevX;
        const dy = seg.y - prevY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > stepDist) {
          const ratio = stepDist / dist;
          seg.x = prevX + dx * ratio;
          seg.y = prevY + dy * ratio;
          seg.angle = Math.atan2(dy, dx);
        }
        newSegments.push({ ...seg });
        prevX = seg.x;
        prevY = seg.y;
      }

      // Grow body tail if score expands
      const targetSegmentsCount = Math.floor(player.score) + 8;
      while (newSegments.length < targetSegmentsCount) {
        const tail = newSegments[newSegments.length - 1];
        newSegments.push({
          x: tail.x - Math.cos(tail.angle) * stepDist,
          y: tail.y - Math.sin(tail.angle) * stepDist,
          angle: tail.angle
        });
      }
      // Shrink if score drains
      if (newSegments.length > targetSegmentsCount) {
        newSegments.length = targetSegmentsCount;
      }

      player.segments = newSegments;
      scoreRef.current = Math.floor(player.score);

      // Sync player data to Web Socket server
      if (isMultiplayer && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'tick',
          payload: {
            segments: player.segments,
            angle: player.angle,
            score: player.score,
            kills: player.kills,
            isBoosting: player.isBoosting,
            color: player.color,
            skinId: player.skinId,
            activePowerups: player.activePowerups,
            name: player.name
          }
        }));
      }

      // 4. OFFLINE AI BOTS INTEGRATION LOOP
      if (!isMultiplayer) {
        otherSnakesRef.current.forEach((bot) => {
          if (bot.isDead) return;

          const botHead = bot.segments[0];
          let steerAngle = bot.angle;

          // A. Find nearest food pellet
          let nearestFood: Food | null = null;
          let minDist = 300; // scan radius
          foodRef.current.forEach((f) => {
            const dx = f.x - botHead.x;
            const dy = f.y - botHead.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
              minDist = dist;
              nearestFood = f;
            }
          });

          if (nearestFood) {
            const targetFood: Food = nearestFood;
            steerAngle = Math.atan2(targetFood.y - botHead.y, targetFood.x - botHead.x);
          }

          // B. Collision Avoidance against human player & other bots
          const avoidSensors = [
            { x: botHead.x + Math.cos(bot.angle) * 80, y: botHead.y + Math.sin(bot.angle) * 80 },
            { x: botHead.x + Math.cos(bot.angle - 0.5) * 60, y: botHead.y + Math.sin(bot.angle - 0.5) * 60 },
            { x: botHead.x + Math.cos(bot.angle + 0.5) * 60, y: botHead.y + Math.sin(bot.angle + 0.5) * 60 },
          ];

          let dangerAhead = false;
          const checkCrash = (obstacleSeg: Position, radius: number) => {
            for (const sensor of avoidSensors) {
              const dx = sensor.x - obstacleSeg.x;
              const dy = sensor.y - obstacleSeg.y;
              if (dx * dx + dy * dy < radius * radius) {
                dangerAhead = true;
                return true;
              }
            }
            return false;
          };

          // Check against Player body
          if (player && !player.isDead) {
            player.segments.forEach((seg) => {
              checkCrash(seg, 18);
            });
          }

          // Check against Other Bots body
          otherSnakesRef.current.forEach((oBot) => {
            if (oBot.id === bot.id || oBot.isDead) return;
            oBot.segments.forEach((seg) => {
              checkCrash(seg, 16);
            });
          });

          // Check border danger
          if (botHead.x < 150 || botHead.x > WORLD_SIZE - 150 || botHead.y < 150 || botHead.y > WORLD_SIZE - 150) {
            dangerAhead = true;
          }

          // If danger detected, steer away sharply
          if (dangerAhead) {
            steerAngle = bot.angle + Math.PI / 2 + (Math.random() - 0.5) * 0.8;
            bot.isBoosting = true;
          } else {
            bot.isBoosting = Math.random() < 0.05; // random sprint
          }

          // Interpolate angle
          let bDiff = steerAngle - bot.angle;
          while (bDiff < -Math.PI) bDiff += Math.PI * 2;
          while (bDiff > Math.PI) bDiff -= Math.PI * 2;
          bot.angle += bDiff * 0.12;

          // Move bot
          const botSpeed = bot.isBoosting ? bot.speed * 1.6 : bot.speed;
          const nextBX = Math.max(10, Math.min(WORLD_SIZE - 10, botHead.x + Math.cos(bot.angle) * botSpeed));
          const nextBY = Math.max(10, Math.min(WORLD_SIZE - 10, botHead.y + Math.sin(bot.angle) * botSpeed));

          const bSegments = [{ x: nextBX, y: nextBY, angle: bot.angle }];
          let bPrevX = nextBX;
          let bPrevY = nextBY;

          for (let k = 1; k < bot.segments.length; k++) {
            const bSeg = bot.segments[k];
            const dx = bSeg.x - bPrevX;
            const dy = bSeg.y - bPrevY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > stepDist) {
              const ratio = stepDist / dist;
              bSeg.x = bPrevX + dx * ratio;
              bSeg.y = bPrevY + dy * ratio;
              bSeg.angle = Math.atan2(dy, dx);
            }
            bSegments.push({ ...bSeg });
            bPrevX = bSeg.x;
            bPrevY = bSeg.y;
          }

          // Grow bot if score warrants
          const bTargetCount = Math.floor(bot.score / 10) + 8;
          while (bSegments.length < bTargetCount) {
            const tail = bSegments[bSegments.length - 1];
            bSegments.push({
              x: tail.x - Math.cos(tail.angle) * stepDist,
              y: tail.y - Math.sin(tail.angle) * stepDist,
              angle: tail.angle
            });
          }
          if (bSegments.length > bTargetCount) {
            bSegments.length = bTargetCount;
          }

          bot.segments = bSegments;
        });
      }

      // 5. FOOD CONSUMPTION LOGIC (MAGNET, BOOST, COLLISION)
      const pHead = player.segments[0];
      foodRef.current.forEach((f) => {
        // Magnet pulls food in if player has magnet powerup
        const hasMagnet = player.activePowerups.magnet > now;
        const dx = f.x - pHead.x;
        const dy = f.y - pHead.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (hasMagnet && dist < 180) {
          // Magnetized pulling effect
          f.x -= (dx / dist) * 6;
          f.y -= (dy / dist) * 6;
        }

        // Eat collision threshold
        if (dist < player.width + f.size) {
          // Consume pellet
          player.score += f.value * 0.45;
          audioSynth.playEat();
          spawnParticles(f.x, f.y, f.color, 6, 'eat');

          if (!isMultiplayer) {
            // Respawn locally
            f.x = Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50;
            f.y = Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50;
            f.id = `food_${Math.random().toString(36).substr(2, 9)}`;
            const isSuper = Math.random() < 0.08;
            f.isSuper = isSuper;
            f.size = isSuper ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 2) + 4;
            f.value = isSuper ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 3) + 2;
          } else if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Signal server of consumption
            wsRef.current.send(JSON.stringify({
              type: 'eat_food',
              payload: { foodId: f.id, points: f.value }
            }));
          }

          updateMissionsProgress('score', Math.floor(player.score));
        }
      });

      // AI Bots eating food offline
      if (!isMultiplayer) {
        otherSnakesRef.current.forEach((bot) => {
          const botHead = bot.segments[0];
          foodRef.current.forEach((f) => {
            const dx = f.x - botHead.x;
            const dy = f.y - botHead.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bot.width + f.size) {
              bot.score += f.value * 0.45;
              f.x = Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50;
              f.y = Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50;
              f.id = `food_${Math.random().toString(36).substr(2, 9)}`;
            }
          });
        });
      }

      // 6. COLLECT POWERUPS
      powerupsRef.current.forEach((pw) => {
        const dx = pw.x - pHead.x;
        const dy = pw.y - pHead.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.width + pw.size) {
          audioSynth.playPowerup();
          spawnParticles(pw.x, pw.y, '#eab308', 12, 'powerup');

          // Apply powerup durations
          const duration = 15000; // 15 seconds
          if (pw.type === 'magnet') {
            player.activePowerups.magnet = now + duration;
            updateMissionsProgress('magnet', 1);
            showNotification('MAGNET ACTIVE! Food drawn from far distances.');
          } else if (pw.type === 'shield') {
            player.activePowerups.shield = now + duration;
            showNotification('SHIELD ACTIVE! Invulnerable to front body crashes.');
          } else if (pw.type === 'speed') {
            player.activePowerups.speed = now + duration;
            showNotification('SPEED RUSH! Sprints without losing body score.');
          }

          if (!isMultiplayer) {
            // Respawn powerup locally in 10s
            pw.x = Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50;
            pw.y = Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50;
            pw.id = `pw_${Math.random().toString(36).substr(2, 9)}`;
          } else if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'eat_powerup',
              payload: { powerupId: pw.id, powerupType: pw.type }
            }));
          }
        }
      });

      // 7. BODYCOLLISION CHECKS (CRASH DAMAGE / KILLS)
      if (!isMultiplayer && !player.isDead) {
        const shieldActive = player.activePowerups.shield > now;

        otherSnakesRef.current.forEach((bot, bId) => {
          if (bot.isDead) return;

          // A. Player crashes headfirst into Bot body
          if (!shieldActive) {
            // Skip checking player head against first segment of bot to allow side-brushing
            for (let i = 2; i < bot.segments.length; i++) {
              const seg = bot.segments[i];
              const dx = pHead.x - seg.x;
              const dy = pHead.y - seg.y;
              if (dx * dx + dy * dy < 200) {
                handlePlayerDeath();
                return;
              }
            }
          }

          // B. Bot crashes headfirst into Player body
          const botHead = bot.segments[0];
          for (let i = 2; i < player.segments.length; i++) {
            const seg = player.segments[i];
            const dx = botHead.x - seg.x;
            const dy = botHead.y - seg.y;
            if (dx * dx + dy * dy < 180) {
              // Bot dies! Melt bot into huge food pellets
              triggerDeathExplosion(botHead.x, botHead.y, bot.color);
              
              // Disperse food locally
              bot.segments.forEach((bSeg, idx) => {
                if (idx % 2 === 0) {
                  foodRef.current.push({
                    id: `f_disp_${Math.random().toString(36).substr(2, 9)}`,
                    x: bSeg.x + (Math.random() - 0.5) * 20,
                    y: bSeg.y + (Math.random() - 0.5) * 20,
                    value: 4,
                    color: bot.color,
                    size: 7,
                    isSuper: true
                  });
                }
              });

              otherSnakesRef.current.delete(bId);
              player.kills += 1;
              coinsRef.current += 15; // earn coins per kill
              updateMissionsProgress('kill', 1);
              showNotification(`Killed ${bot.name}! (+15 Coins)`);
              break;
            }
          }

          // C. Bot head crashing into other Bot bodies
          otherSnakesRef.current.forEach((oBot) => {
            if (bot.id === oBot.id || oBot.isDead) return;
            const oHead = oBot.segments[0];

            for (let i = 2; i < bot.segments.length; i++) {
              const seg = bot.segments[i];
              const dx = oHead.x - seg.x;
              const dy = oHead.y - seg.y;
              if (dx * dx + dy * dy < 150) {
                triggerDeathExplosion(oHead.x, oHead.y, oBot.color);
                
                oBot.segments.forEach((bSeg) => {
                  foodRef.current.push({
                    id: `f_disp_${Math.random().toString(36).substr(2, 9)}`,
                    x: bSeg.x + (Math.random() - 0.5) * 15,
                    y: bSeg.y + (Math.random() - 0.5) * 15,
                    value: 3,
                    color: oBot.color,
                    size: 6,
                    isSuper: false
                  });
                });

                otherSnakesRef.current.delete(oBot.id);
                bot.score += 30; // bot absorbs part of dead bot
              }
            }
          });
        });
      } else if (isMultiplayer && !player.isDead) {
        // Multiplayer collision checks against synced other player segments
        const shieldActive = player.activePowerups.shield > now;
        if (!shieldActive) {
          otherSnakesRef.current.forEach((oSnake, oId) => {
            for (let i = 1; i < oSnake.segments.length; i++) {
              const seg = oSnake.segments[i];
              const dx = pHead.x - seg.x;
              const dy = pHead.y - seg.y;
              if (dx * dx + dy * dy < 180) {
                // We hit them! Send death signal to server
                const disperseFood = player.segments.map((s, idx) => ({
                  id: `f_disp_${Math.random().toString(36).substr(2, 9)}`,
                  x: s.x + (Math.random() - 0.5) * 15,
                  y: s.y + (Math.random() - 0.5) * 15,
                  value: 3,
                  color: player.color,
                  size: 6,
                }));

                wsRef.current?.send(JSON.stringify({
                  type: 'snake_die',
                  payload: { killedId: player.id, score: player.score, disperseFood }
                }));

                handlePlayerDeath();
                break;
              }
            }
          });
        }
      }

      // Respawn offline bots if they drop below 10
      if (!isMultiplayer && otherSnakesRef.current.size < 10) {
        const aiId = `ai_${Math.random().toString(36).substr(2, 9)}`;
        const startX = Math.floor(Math.random() * (WORLD_SIZE - 400)) + 200;
        const startY = Math.floor(Math.random() * (WORLD_SIZE - 400)) + 200;
        const startAngle = Math.random() * Math.PI * 2;
        const aiColor = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
        
        const bSegs = [];
        for (let j = 0; j < 10; j++) {
          bSegs.push({
            x: startX - Math.cos(startAngle) * j * 15,
            y: startY - Math.sin(startAngle) * j * 15,
            angle: startAngle
          });
        }

        otherSnakesRef.current.set(aiId, {
          id: aiId,
          name: AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)],
          segments: bSegs,
          color: aiColor,
          skinId: 'classic_green',
          score: 110,
          kills: 0,
          isDead: false,
          isAI: true,
          isBoosting: false,
          activePowerups: { magnet: 0, shield: 0, speed: 0 },
          width: 14,
          speed: 3,
          angle: startAngle,
          targetAngle: startAngle,
        });
      }

      // Update particle lives
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      // 8. GRAPHICS RENDERING SYSTEM
      ctx.fillStyle = '#0f172a'; // Deep space blue arena background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate camera coordinates (target is player head)
      const camX = pHead.x - canvas.width / 2;
      const camY = pHead.y - canvas.height / 2;

      ctx.save();
      ctx.translate(-camX, -camY);

      // Draw Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = 0; x <= WORLD_SIZE; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= WORLD_SIZE; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_SIZE, y);
        ctx.stroke();
      }

      // Draw Arena outer boundary wall
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      // Draw Food Pellets
      foodRef.current.forEach((f) => {
        // glowing base
        if (f.isSuper) {
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0; // reset shadow

      // Draw Powerups
      powerupsRef.current.forEach((pw) => {
        ctx.save();
        ctx.shadowColor = pw.type === 'magnet' ? '#3b82f6' : pw.type === 'shield' ? '#10b981' : '#a855f7';
        ctx.shadowBlur = 12;

        ctx.strokeStyle = ctx.shadowColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pw.x, pw.y, pw.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(23, 23, 23, 0.7)';
        ctx.beginPath();
        ctx.arc(pw.x, pw.y, pw.size - 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw dynamic inner symbol
        ctx.fillStyle = ctx.shadowColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 10px Inter, sans-serif';
        const symbol = pw.type === 'magnet' ? '🧲' : pw.type === 'shield' ? '🛡️' : '⚡';
        ctx.fillText(symbol, pw.x, pw.y);
        ctx.restore();
      });

      // Draw Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Helper to draw a snake (bot or player)
      const drawSnakeEntity = (sn: Snake) => {
        if (sn.isDead || sn.segments.length === 0) return;

        const isShieldActive = sn.activePowerups.shield > now;
        const isMagnetActive = sn.activePowerups.magnet > now;
        const isSpeedActive = sn.activePowerups.speed > now;

        // Draw Shield visual aura glow
        if (isShieldActive) {
          ctx.save();
          ctx.strokeStyle = 'rgba(16,185,129,0.35)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(sn.segments[0].x, sn.segments[0].y, sn.width + 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Draw Magnet field rings
        if (isMagnetActive) {
          ctx.save();
          ctx.strokeStyle = 'rgba(59,130,246,0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sn.segments[0].x, sn.segments[0].y, 180, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Render overlapping body segments backwards
        for (let i = sn.segments.length - 1; i >= 1; i--) {
          const seg = sn.segments[i];
          ctx.fillStyle = sn.color;

          // Striped pattern logic
          if (sn.skinId === 'royal_purple' && i % 3 === 0) {
            ctx.fillStyle = '#f43f5e';
          } else if (sn.skinId === 'classic_green' && i % 2 === 0) {
            ctx.fillStyle = '#047857';
          } else if (sn.skinId === 'gold_rush') {
            ctx.fillStyle = i % 3 === 0 ? '#ca8a04' : '#eab308';
          } else if (sn.skinId === 'rainbow') {
            const hShift = (i * 12) % 360;
            ctx.fillStyle = `hsl(${hShift}, 85%, 60%)`;
          }

          ctx.beginPath();
          // Segments shrink gradually towards the tail
          const segmentRadius = Math.max(6, sn.width - (i / sn.segments.length) * 4);
          ctx.arc(seg.x, seg.y, segmentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Border outlines
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Render Head Segment
        const sHead = sn.segments[0];
        ctx.fillStyle = sn.color;

        // Shiny gold/cyber shifts
        if (sn.skinId === 'cyber_pink') {
          ctx.save();
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 15;
        }

        ctx.beginPath();
        ctx.arc(sHead.x, sHead.y, sn.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Snake Eyes rotating towards target direction
        ctx.save();
        ctx.translate(sHead.x, sHead.y);
        ctx.rotate(sn.angle);

        // Eyeballs
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(6, -6, 4.5, 0, Math.PI * 2);
        ctx.arc(6, 6, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(8, -6, 2, 0, Math.PI * 2);
        ctx.arc(8, 6, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw Player Name Tag floating overhead
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sn.name, sHead.x, sHead.y - sn.width - 6);
      };

      // Draw AI/Other snakes
      otherSnakesRef.current.forEach((sn) => drawSnakeEntity(sn));

      // Draw Local Player
      if (player && !player.isDead) {
        drawSnakeEntity(player);
      }

      ctx.restore(); // reset translations

      // Calculate leaderboards on the client
      const allSnakes = Array.from(otherSnakesRef.current.values()) as Snake[];
      if (player && !player.isDead) allSnakes.push(player);
      
      allSnakes.sort((a, b) => b.score - a.score);
      
      const pRank = allSnakes.findIndex((s) => s.id === player?.id) + 1;

      setHudStats({
        score: Math.floor(player?.score || 0),
        kills: player?.kills || 0,
        coins: coinsRef.current,
        rank: pRank > 0 ? pRank : 1
      });

      animId = requestAnimationFrame(updateFrame);
    };

    animId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, controlType]);

  // Pause toggle
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      audioSynth.stopMusic();
    } else {
      audioSynth.startMusic();
    }
  };

  const quitGame = () => {
    audioSynth.stopMusic();
    onQuit();
  };

  // Get active leaderboard positions
  const getLeaderboardList = () => {
    const list = Array.from(otherSnakesRef.current.values()) as Snake[];
    if (playerRef.current && !playerRef.current.isDead) {
      list.push(playerRef.current);
    }
    return list.sort((a, b) => b.score - a.score).slice(0, 10);
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      
      {/* Dynamic 60fps Game Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="w-full h-full block cursor-crosshair"
      />

      {/* GAME HUD OVERLAYS */}
      
      {/* Top Left Indicators (Score, Coins, Kills) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2.5 max-w-[200px]">
        {/* Stats Card */}
        <div className="p-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl flex flex-col gap-2 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-semibold">HUD stats</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">Offline Arena</span>
          </div>
          
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-yellow-500" />
              <span className="text-xs text-slate-400 font-medium">Score</span>
            </div>
            <span className="text-sm font-bold font-mono text-yellow-400">{hudStats.score}</span>
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <Coins size={14} className="text-amber-500" />
              <span className="text-xs text-slate-400 font-medium">Coins</span>
            </div>
            <span className="text-sm font-bold font-mono text-amber-400">+{hudStats.coins}</span>
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-rose-500" />
              <span className="text-xs text-slate-400 font-medium">Kills</span>
            </div>
            <span className="text-sm font-bold font-mono text-rose-400">{hudStats.kills}</span>
          </div>
        </div>

        {/* Active Powerup Timers Overlay */}
        {playerRef.current && (
          <div className="space-y-1.5">
            {playerRef.current.activePowerups.magnet > Date.now() && (
              <div className="px-3 py-1 bg-blue-950/80 backdrop-blur border border-blue-800 rounded-lg flex items-center gap-2 text-blue-400 text-[10px] font-bold animate-pulse">
                <Compass size={11} /> MAGNET PULSE ACTIVE
              </div>
            )}
            {playerRef.current.activePowerups.shield > Date.now() && (
              <div className="px-3 py-1 bg-emerald-950/80 backdrop-blur border border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-400 text-[10px] font-bold animate-pulse">
                <Shield size={11} /> CRASH SHIELD ACTIVE
              </div>
            )}
            {playerRef.current.activePowerups.speed > Date.now() && (
              <div className="px-3 py-1 bg-purple-950/80 backdrop-blur border border-purple-800 rounded-lg flex items-center gap-2 text-purple-400 text-[10px] font-bold animate-pulse">
                <Zap size={11} /> SPEED RUSH ACTIVE
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Right Live Leaderboard */}
      <div className="absolute top-4 right-4 z-10 w-52 md:w-60 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-2xl text-left">
        <h3 className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
          <Award size={12} className="text-yellow-500" /> LEADERBOARD ({playersCount})
        </h3>
        
        <div className="space-y-1 font-mono text-xs max-h-[170px] overflow-y-auto">
          {getLeaderboardList().map((sn, idx) => {
            const isMe = sn.id === playerRef.current?.id;
            return (
              <div
                key={sn.id}
                className={`flex justify-between items-center py-0.5 px-1.5 rounded ${
                  isMe ? 'bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/15' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                  <span className="truncate">{sn.name}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{Math.floor(sn.score)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission System UI Card */}
      <div className="absolute bottom-4 left-4 z-10 w-56 md:w-64 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-2xl text-left hidden sm:block">
        <h4 className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
          <Target size={12} className="text-cyan-400" /> Active Missions
        </h4>
        <div className="space-y-2">
          {activeMissions.map((m) => (
            <div key={m.id} className="space-y-1 text-slate-300">
              <div className="flex justify-between text-[10px]">
                <span className={m.completed ? 'line-through text-slate-500 font-semibold' : ''}>{m.text}</span>
                <span className="font-bold text-yellow-500">+{m.reward}c</span>
              </div>
              <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${m.completed ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Toast Banner */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={14} /> {notification}
        </div>
      )}

      {/* Bottom Right Minimap Radar */}
      <div className="absolute bottom-4 right-4 z-10 p-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-full shadow-2xl flex items-center justify-center">
        <div className="relative w-24 h-24 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
          {/* Static center crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[1px] bg-slate-900/50" />
            <div className="h-full w-[1px] bg-slate-900/50" />
          </div>

          {/* Draw dots inside radar relative to map coordinates */}
          {playerRef.current && (
            <div
              className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-ping border border-black z-10"
              style={{
                left: `${(playerRef.current.segments[0].x / WORLD_SIZE) * 100}%`,
                top: `${(playerRef.current.segments[0].y / WORLD_SIZE) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}

          {/* Sync bot/other players dots */}
          {(Array.from(otherSnakesRef.current.values()) as Snake[]).map((bot) => (
            <div
              key={bot.id}
              className="absolute w-1 h-1 rounded-full bg-rose-500"
              style={{
                left: `${(bot.segments[0].x / WORLD_SIZE) * 100}%`,
                top: `${(bot.segments[0].y / WORLD_SIZE) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Control Buttons (Pause / Resume / Quit) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <button
          onClick={togglePause}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg shadow-xl transition-all"
          title={isPaused ? 'Resume Game' : 'Pause Game'}
        >
          {isPaused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <button
          onClick={quitGame}
          className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-rose-950 border border-slate-800 hover:border-rose-900 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-lg shadow-xl flex items-center gap-1.5 transition-all"
        >
          <LogOut size={13} /> Exit
        </button>
      </div>

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center animate-fade-in">
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center max-w-sm space-y-5">
            <h2 className="text-xl font-black text-white tracking-wide">GAME PAUSED</h2>
            <p className="text-xs text-slate-400">Your slither score and coin gains are paused. Resume playing whenever you are ready.</p>
            
            <div className="space-y-2.5">
              <button
                onClick={togglePause}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-all"
              >
                RESUME PLAYING
              </button>
              <button
                onClick={quitGame}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all"
              >
                EXIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Virtual Analog Joystick (Mobile touch only, showing if active) */}
      <div
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        className="absolute bottom-6 left-6 w-32 h-32 bg-slate-900/30 border-2 border-slate-800/40 rounded-full flex items-center justify-center z-10 pointer-events-auto sm:hidden"
      >
        <div className="w-12 h-12 bg-slate-800/80 rounded-full shadow-lg border border-slate-600 pointer-events-none" />
      </div>

    </div>
  );
}
