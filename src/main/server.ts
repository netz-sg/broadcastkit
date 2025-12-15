import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { app } from 'electron';
import { configStore } from './store';

export class ExpressServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private port: number = 3000;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private getOverlaysPath(): string {
    // In production, overlays are in extraResources
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'overlays');
    }
    // In development
    return path.join(__dirname, '../../src/renderer/overlays');
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../renderer')));
    // Serve overlays from correct path
    this.app.use('/overlays-static', express.static(this.getOverlaysPath()));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Get current config
    this.app.get('/api/config', (req, res) => {
      const config = configStore.getAll();
      res.json(config);
    });

    // Overlay routes - serve HTML pages
    this.app.get('/overlay/lower-third', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'lower-third.html');
      console.log('[Server] Serving overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    // Now Playing overlay route
    this.app.get('/overlay/now-playing', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'now-playing.html');
      console.log('[Server] Serving Now Playing overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    // Social Widget overlay route
    this.app.get('/overlay/social-widget', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'social-widget.html');
      console.log('[Server] Serving Social Widget overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    // Stream Scenes overlay routes (each scene is a separate browser source)
    this.app.get('/overlay/scene-starting', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'scene-starting.html');
      console.log('[Server] Serving Starting Scene overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    this.app.get('/overlay/scene-brb', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'scene-brb.html');
      console.log('[Server] Serving BRB Scene overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    this.app.get('/overlay/scene-ending', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'scene-ending.html');
      console.log('[Server] Serving Ending Scene overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    this.app.get('/overlay/scene-technical', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'scene-technical.html');
      console.log('[Server] Serving Technical Scene overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    // Reaction Overlay route (all layouts in one overlay)
    this.app.get('/overlay/reaction', (req, res) => {
      const overlayPath = path.join(this.getOverlaysPath(), 'reaction.html');
      console.log('[Server] Serving Reaction overlay from:', overlayPath);
      res.sendFile(overlayPath);
    });

    // Socket.io client for overlays
    this.app.get('/socket.io/socket.io.js', (req, res) => {
      res.sendFile(path.join(__dirname, '../../node_modules/socket.io/client-dist/socket.io.js'));
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('[Server] Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('[Server] Client disconnected:', socket.id);
      });

      // Handle overlay events
      socket.on('trigger-overlay', (data) => {
        console.log('[Server] Triggering overlay:', data);
        this.io.emit('overlay-event', data);
      });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`[Server] Express server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }

  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Get number of connected clients
  getConnectedClients(): number {
    return this.io.engine.clientsCount;
  }

  // Force all browser sources to refresh
  refreshAllOverlays(): void {
    console.log('[Server] Refreshing all connected overlays...');
    this.io.emit('refresh-overlay');
  }
}

export const expressServer = new ExpressServer();
