package sync

import (
	"sync"
)

var (
	refreshMu         sync.Mutex
	refreshInProgress bool
	refreshQueued     bool
)

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
