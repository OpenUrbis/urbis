import { SyncManager } from '@signaldb/sync';
import createIndexedDBAdapter from '@signaldb/indexeddb';
import { appState } from './signaldb';

// Create a SyncManager instance
export const syncManager = new SyncManager({
  // Pull changes from server
  async pull({ collection }) {
    try {
        const response = await fetch(`/api/sync/${collection.name}`);
        if (!response.ok) {
            // Treat 404 as empty or handle appropriately
            if (response.status === 404) return { items: [] };
            throw new Error(`Sync failed: ${response.statusText}`);
        }
        const items = await response.json();
        // Ensure items is an array
        return { items: Array.isArray(items) ? items : [] };
    } catch (error) {
        console.error(`[SyncManager] Pull failed for ${collection.name}:`, error);
        return { items: [] };
    }
  },

  // Push changes to server
  async push({ changes, collection }) {
    try {
        if (changes.length === 0) return;
        
        await fetch(`/api/sync/${collection.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes })
        });
    } catch (error) {
        console.error(`[SyncManager] Push failed for ${collection.name}:`, error);
    }
  },

  // Persistence adapter for sync metadata (snapshots)
  persistenceAdapter: (name) => createIndexedDBAdapter(`sync-${name}`, {
      prefix: 'urbis-sync-'
  })
});

// Register collections to be synced
syncManager.addCollection(appState, { name: 'appState' });