import type { WebSocketMessage } from "@/types/api";
import { WS_BASE_URL } from "./config";

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private batchId: string,
    private onMessage: (message: WebSocketMessage) => void,
    private onError: (error: Error) => void
  ) {}

  connect() {
    try {
      this.ws = new WebSocket(
        `${WS_BASE_URL}/scraper/ws/batch/${
          this.batchId
        }?token=${localStorage.getItem("accessToken")}`
      );

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.onMessage(message);
        } catch (error) {
          this.onError(new Error("Failed to parse WebSocket message"));
        }
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        this.onError(new Error("WebSocket error occurred"));
      };
    } catch (error) {
      this.onError(new Error("Failed to establish WebSocket connection"));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
