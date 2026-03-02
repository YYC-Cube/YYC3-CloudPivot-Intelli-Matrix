import { createContext } from "react";
import type { ViewState, WebSocketDataState } from "@/app/types";

// WebSocket context uses WebSocketDataState from useWebSocketData hook
export const WebSocketContext = createContext<WebSocketDataState | null>(null);

// View context for responsive layout
export const ViewContext = createContext<ViewState | null>(null);

// Re-export for convenience (optional)
export { WebSocketContext as WebSocketContextType, ViewContext as ViewContextType };
