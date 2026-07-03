/**
 * Session Manager - Improved Duplicate Tab Detection
 * 
 * Uses dual-layer approach:
 * 1. BroadcastChannel API: Fast same-origin tab detection (instant, no server)
 * 2. Server-side session tracking: Cross-device/tab detection via edge function
 */

import { getTelegramUserId, getRawInitData } from './telegram';

const BROADCAST_CHANNEL_NAME = 'jolt_time_session';
const SESSION_TIMEOUT_MS = 5000; // Consider session stale after 5 seconds of inactivity
const SERVER_CHECK_INTERVAL_MS = 10000; // Check server every 10 seconds

export interface SessionInfo {
  tabId: string;
  startedAt: number;
  lastPing: number;
}

export type DuplicateDetectionCallback = (isDuplicate: boolean, source: 'broadcast' | 'server' | null) => void;

// Generate unique tab ID
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Check if BroadcastChannel is supported
function isBroadcastChannelSupported(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

// Check if the tab is likely a duplicate (same origin) via BroadcastChannel
class LocalTabDetector {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private callbacks: Set<DuplicateDetectionCallback> = new Set();
  private pingInterval: number | null = null;
  private otherTabs: Map<string, number> = new Map(); // tabId -> last ping time
  private isActive = false;
  private checkInterval: number | null = null;
  private storageHandler: ((e: StorageEvent) => void) | null = null;

  constructor() {
    this.tabId = generateTabId();
  }

  start(onDuplicate: DuplicateDetectionCallback): void {
    if (this.isActive) return;
    this.isActive = true;

    this.callbacks.add(onDuplicate);

    if (isBroadcastChannelSupported()) {
      this.initBroadcastChannel();
    } else {
      // Fallback to localStorage-based detection
      this.initLocalStorageFallback();
    }

    // Start sending pings
    this.pingInterval = window.setInterval(() => this.sendPing(), 1000);
  }

  stop(onDuplicate?: DuplicateDetectionCallback): void {
    if (onDuplicate) {
      this.callbacks.delete(onDuplicate);
    }
    if (this.callbacks.size === 0 && this.isActive) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.isActive = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = null;
    }
    if (this.channel) {
      this.sendMessage({ type: 'leave', tabId: this.tabId });
      this.channel.close();
      this.channel = null;
    }
    // Release localStorage claim
    localStorage.removeItem('game_active_tab');
    this.callbacks.clear();
    this.otherTabs.clear();
  }

  private initBroadcastChannel(): void {
    this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    this.channel.onmessage = (event) => {
      const data = event.data;
      switch (data.type) {
        case 'ping':
          if (data.tabId !== this.tabId) {
            this.otherTabs.set(data.tabId, Date.now());
            // Respond with pong
            this.sendMessage({ type: 'pong', tabId: this.tabId });
          }
          break;
        case 'pong':
          if (data.tabId !== this.tabId) {
            this.otherTabs.set(data.tabId, Date.now());
          }
          break;
        case 'leave':
          this.otherTabs.delete(data.tabId);
          this.checkForDuplicates();
          break;
      }
    };

    // Initial broadcast - announce presence
    this.sendMessage({ type: 'ping', tabId: this.tabId });

    // Check for duplicates periodically
    this.checkInterval = window.setInterval(() => this.checkForDuplicates(), 1000);
  }

  private initLocalStorageFallback(): void {
    const STORAGE_KEY = 'game_active_tab';
    
    // Claim active tab
    localStorage.setItem(STORAGE_KEY, this.tabId);

    const checkTab = () => {
      const activeTab = localStorage.getItem(STORAGE_KEY);
      if (activeTab && activeTab !== this.tabId) {
        this.notifyCallbacks(true, 'broadcast');
      } else {
        // Reclaim
        localStorage.setItem(STORAGE_KEY, this.tabId);
        this.notifyCallbacks(false, null);
      }
    };

    this.storageHandler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue && e.newValue !== this.tabId) {
        this.notifyCallbacks(true, 'broadcast');
      } else {
        this.notifyCallbacks(false, null);
      }
    };

    this.checkInterval = window.setInterval(checkTab, 1000);
    window.addEventListener('storage', this.storageHandler);
  }

  private sendPing(): void {
    this.sendMessage({ type: 'ping', tabId: this.tabId });
  }

  private sendMessage(message: object): void {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {
        console.warn('BroadcastChannel send failed:', e);
      }
    }
  }

  private checkForDuplicates(): void {
    const now = Date.now();
    
    // Remove stale tabs (no ping in SESSION_TIMEOUT_MS)
    for (const [tabId, lastPing] of this.otherTabs) {
      if (now - lastPing > SESSION_TIMEOUT_MS) {
        this.otherTabs.delete(tabId);
      }
    }

    // If any other tabs remain, we're a duplicate
    if (this.otherTabs.size > 0) {
      this.notifyCallbacks(true, 'broadcast');
    } else {
      this.notifyCallbacks(false, null);
    }
  }

  private notifyCallbacks(isDuplicate: boolean, source: 'broadcast' | 'server' | null): void {
    for (const callback of this.callbacks) {
      callback(isDuplicate, source);
    }
  }

  getTabId(): string {
    return this.tabId;
  }
}

// Server-side session checker
class ServerSessionChecker {
  private callbacks: Set<DuplicateDetectionCallback> = new Set();
  private checkInterval: number | null = null;
  private telegramId: number | null = null;
  private lastServerCheck = 0;
  private serverSaysDuplicate = false;
  private isActive = false;

  async checkServerForDuplicate(): Promise<boolean> {
    try {
      const initData = getRawInitData();
      if (!initData) return false;

      const telegramId = getTelegramUserId();
      if (!telegramId) return false;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-duplicate-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegram_id: telegramId,
            init_data: initData,
          }),
        }
      );

      if (!response.ok) {
        console.warn('Server session check failed:', response.status);
        return false;
      }

      const data = await response.json();
      return data.is_duplicate === true;
    } catch (e) {
      console.warn('Server session check error:', e);
      return false;
    }
  }

  start(telegramId: number, onDuplicate: DuplicateDetectionCallback): void {
    if (this.isActive) return;
    this.isActive = true;
    this.telegramId = telegramId;
    this.callbacks.add(onDuplicate);

    // Initial check
    this.performServerCheck();

    // Periodic checks
    this.checkInterval = window.setInterval(() => {
      this.performServerCheck();
    }, SERVER_CHECK_INTERVAL_MS);
  }

  stop(onDuplicate?: DuplicateDetectionCallback): void {
    if (onDuplicate) {
      this.callbacks.delete(onDuplicate);
    }
    if (this.callbacks.size === 0 && this.isActive) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.isActive = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.callbacks.clear();
  }

  private async performServerCheck(): Promise<void> {
    if (!this.telegramId) return;

    const isDuplicate = await this.checkServerForDuplicate();
    this.serverSaysDuplicate = isDuplicate;

    if (isDuplicate) {
      this.notifyCallbacks(true, 'server');
    } else {
      // Only clear server flag if local check also shows no duplicate
      this.notifyCallbacks(false, null);
    }
  }

  getLastServerResult(): boolean {
    return this.serverSaysDuplicate;
  }

  private notifyCallbacks(isDuplicate: boolean, source: 'broadcast' | 'server' | null): void {
    for (const callback of this.callbacks) {
      callback(isDuplicate, source);
    }
  }
}

// Singleton instances
let localDetector: LocalTabDetector | null = null;
let serverChecker: ServerSessionChecker | null = null;
let currentCallback: DuplicateDetectionCallback | null = null;
let isRunning = false;

// Combined detection state
let localDuplicate = false;
let serverDuplicate = false;

/**
 * Initialize the session manager
 * Call this when the app starts
 */
export function initSessionManager(): void {
  if (isRunning) return;
  isRunning = true;

  const onDuplicate: DuplicateDetectionCallback = (isDuplicate, source) => {
    if (source === 'broadcast') {
      localDuplicate = isDuplicate;
    } else if (source === 'server') {
      serverDuplicate = isDuplicate;
    }

    // If either source says duplicate, show warning
    if (currentCallback) {
      currentCallback(localDuplicate || serverDuplicate, source);
    }
  };

  // Start local tab detection (BroadcastChannel or localStorage fallback)
  localDetector = new LocalTabDetector();
  localDetector.start(onDuplicate);

  // Get telegram ID for server checking
  const telegramId = getTelegramUserId();
  if (telegramId) {
    // Start server-side session checking
    serverChecker = new ServerSessionChecker();
    serverChecker.start(telegramId, onDuplicate);
  } else {
    console.warn('SessionManager: No Telegram ID available, skipping server checks');
  }
}

/**
 * Register callback for duplicate detection
 */
export function onDuplicateDetected(callback: DuplicateDetectionCallback): () => void {
  currentCallback = callback;
  // Trigger initial callback with current state
  callback(localDuplicate || serverDuplicate, null);
  return () => {
    currentCallback = null;
  };
}

/**
 * Stop the session manager
 * Call this when the app unmounts
 */
export function stopSessionManager(): void {
  if (!isRunning) return;
  isRunning = false;

  if (localDetector) {
    localDetector.stop();
    localDetector = null;
  }

  if (serverChecker) {
    serverChecker.stop();
    serverChecker = null;
  }

  localDuplicate = false;
  serverDuplicate = false;
}

/**
 * Check if duplicate is detected from either source
 */
export function isDuplicateSession(): boolean {
  return localDuplicate || serverDuplicate;
}

/**
 * Get detailed duplicate status
 */
export function getDuplicateStatus(): { local: boolean; server: boolean; any: boolean } {
  return {
    local: localDuplicate,
    server: serverDuplicate,
    any: localDuplicate || serverDuplicate,
  };
}