import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const WORLD_SIZE = 4000;
const MAX_FOOD = 250;
const MAX_POWERUPS = 15;

interface Food {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  size: number;
  isSuper: boolean;
}

interface PowerupItem {
  id: string;
  type: 'magnet' | 'shield' | 'speed';
  x: number;
  y: number;
  size: number;
}

// Server game state
let serverFood: Food[] = [];
let serverPowerups: PowerupItem[] = [];
const clients = new Map<string, { ws: WebSocket; name: string; skinId: string; score: number; kills: number }>();
const snakesState = new Map<string, any>(); // tracks snake data of players

const FOOD_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];

// Seed food & powerups initially
function seedFood(count: number = MAX_FOOD) {
  for (let i = 0; i < count; i++) {
    const isSuper = Math.random() < 0.08;
    serverFood.push({
      id: `food_${Math.random().toString(36).substr(2, 9)}`,
      x: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
      y: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
      value: isSuper ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 3) + 2,
      color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
      size: isSuper ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 2) + 4,
      isSuper,
    });
  }
}

function seedPowerups() {
  const types: Array<'magnet' | 'shield' | 'speed'> = ['magnet', 'shield', 'speed'];
  for (let i = 0; i < MAX_POWERUPS; i++) {
    serverPowerups.push({
      id: `pw_${Math.random().toString(36).substr(2, 9)}`,
      type: types[Math.floor(Math.random() * types.length)],
      x: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
      y: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
      size: 15,
    });
  }
}

seedFood();
seedPowerups();

// Helper to broadcast JSON messages to all clients
function broadcast(data: any, skipClientId?: string) {
  const messageStr = JSON.stringify(data);
  clients.forEach((client, id) => {
    if (id !== skipClientId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr);
      } catch (err) {
        console.error(`Broadcast fail to client ${id}:`, err);
      }
    }
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Health API check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', playersOnline: clients.size });
  });

  // Attach WebSocket server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    const playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
    
    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        
        switch (parsed.type) {
          case 'join': {
            const { name, skinId } = parsed.payload;
            clients.set(playerId, { ws, name, skinId, score: 10, kills: 0 });
            
            // Send welcome pack
            ws.send(JSON.stringify({
              type: 'welcome',
              payload: {
                playerId,
                food: serverFood,
                powerups: serverPowerups,
                worldSize: WORLD_SIZE,
              }
            }));

            // Notify other players
            broadcast({
              type: 'player_joined',
              payload: { playerId, name, skinId }
            }, playerId);
            break;
          }

          case 'tick': {
            // Update snake state on the server
            const snakeData = parsed.payload;
            snakesState.set(playerId, snakeData);
            
            const clientInfo = clients.get(playerId);
            if (clientInfo) {
              clientInfo.score = snakeData.score || 10;
              clientInfo.kills = snakeData.kills || 0;
            }
            break;
          }

          case 'eat_food': {
            const { foodId, points } = parsed.payload;
            const foodIdx = serverFood.findIndex(f => f.id === foodId);
            
            if (foodIdx !== -1) {
              // Remove and replace food pellet
              serverFood.splice(foodIdx, 1);
              
              // Seed 1 new replacement food
              const isSuper = Math.random() < 0.08;
              const newFood: Food = {
                id: `food_${Math.random().toString(36).substr(2, 9)}`,
                x: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
                y: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
                value: isSuper ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 3) + 2,
                color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
                size: isSuper ? Math.floor(Math.random() * 4) + 8 : Math.floor(Math.random() * 2) + 4,
                isSuper,
              };
              serverFood.push(newFood);

              // Broadcast food update
              broadcast({
                type: 'food_eaten',
                payload: {
                  eatenId: foodId,
                  addedFood: newFood,
                  eaterId: playerId,
                }
              });
            }
            break;
          }

          case 'eat_powerup': {
            const { powerupId, powerupType } = parsed.payload;
            const idx = serverPowerups.findIndex(p => p.id === powerupId);
            if (idx !== -1) {
              serverPowerups.splice(idx, 1);
              
              // Create a replacement powerup in 10 seconds
              setTimeout(() => {
                const types: Array<'magnet' | 'shield' | 'speed'> = ['magnet', 'shield', 'speed'];
                const fresh: PowerupItem = {
                  id: `pw_${Math.random().toString(36).substr(2, 9)}`,
                  type: types[Math.floor(Math.random() * types.length)],
                  x: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
                  y: Math.floor(Math.random() * (WORLD_SIZE - 100)) + 50,
                  size: 15,
                };
                serverPowerups.push(fresh);
                
                broadcast({
                  type: 'powerup_respawn',
                  payload: fresh
                });
              }, 12000);

              // Broadcast current consumption
              broadcast({
                type: 'powerup_collected',
                payload: {
                  collectedId: powerupId,
                  type: powerupType,
                  eaterId: playerId
                }
              });
            }
            break;
          }

          case 'snake_die': {
            const { killedId, score, disperseFood } = parsed.payload;
            
            // If dead snake is a player, remove it from server list
            if (snakesState.has(killedId)) {
              snakesState.delete(killedId);
            }
            
            // Add dispersed food pieces to server food pool
            if (disperseFood && Array.isArray(disperseFood)) {
              // Add a sub-selection of segment food pieces to serverFood to keep pool performance optimal
              disperseFood.forEach((f: any) => {
                if (serverFood.length < MAX_FOOD + 100) {
                  serverFood.push({
                    id: f.id,
                    x: f.x,
                    y: f.y,
                    value: f.value,
                    color: f.color,
                    size: f.size,
                    isSuper: f.isSuper || false
                  });
                }
              });
            }

            // Broadcast death event
            broadcast({
              type: 'snake_dead',
              payload: {
                deadId: killedId,
                killerId: playerId, // current player registers the kill
                disperseFood
              }
            });
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(playerId);
      snakesState.delete(playerId);
      
      broadcast({
        type: 'player_left',
        payload: { playerId }
      });
    });
  });

  // Sync ticker: Send all snakes positions 30 times a second (33ms)
  setInterval(() => {
    if (clients.size === 0) return;

    const snakesList = Array.from(snakesState.entries()).map(([id, state]) => ({
      id,
      ...state
    }));

    broadcast({
      type: 'sync',
      payload: {
        snakes: snakesList,
        playersCount: clients.size
      }
    });
  }, 33);

  // Serve static UI / Dev Server integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Snake.io server boot. Running on port ${PORT}`);
  });
}

startServer();
