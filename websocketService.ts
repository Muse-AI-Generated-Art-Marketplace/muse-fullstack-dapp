import { io, Socket } from 'socket.io-client';

interface TransactionStatusUpdate {
  hash: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
}

class WebSocketService {
  private socket: Socket | null = null;
  private readonly backendUrl: string;

  constructor() {
    this.backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  }

  public connect(): void {
    if (!this.socket || !this.socket.connected) {
      this.socket = io(this.backendUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public onTransactionStatusUpdate(callback: (update: TransactionStatusUpdate) => void): void {
    this.socket?.on('transactionStatusUpdate', callback);
  }

  public offTransactionStatusUpdate(callback: (update: TransactionStatusUpdate) => void): void {
    this.socket?.off('transactionStatusUpdate', callback);
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();