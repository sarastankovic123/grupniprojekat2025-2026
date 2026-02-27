package sync

import (
	"sync"
)

var (
	refreshMu         sync.Mutex
	refreshInProgress bool
	refreshQueued     bool
)

// TriggerAsyncRefresh schedules graph refresh without blocking callers.
// If refresh is already running, it queues exactly one additional run.
func TriggerAsyncRefresh() {
	refreshMu.Lock()
	if refreshInProgress {
		refreshQueued = true
		refreshMu.Unlock()
		return
	}
	refreshInProgress = true
	refreshMu.Unlock()

	go func() {
		for {
			SyncAll()

			refreshMu.Lock()
			if refreshQueued {
				refreshQueued = false
				refreshMu.Unlock()
				continue
			}
			refreshInProgress = false
			refreshMu.Unlock()
			return
		}
	}()
}
