package handlers

import (
	"fmt"
	"time"

	"example.com/backend/helper"
)

const CACHE_INTERVAL = 250 * time.Millisecond

func Detail(token string, timeout time.Duration) (Result, error) {
	tm := helper.TaskManagerInstance()
	cache := tm.CacheLoad(token)
	from := time.Now()
	for cache == nil {
		if time.Now().After(from.Add(timeout)) {
			return Result{}, fmt.Errorf("not found")
		}
		time.Sleep(CACHE_INTERVAL)
		cache = tm.CacheLoad(token)
	}
	return Result{
		FromURL:   cache.From,
		TermURL:   cache.Term,
		Chains:    cache.Chains,
		Thumbnail: token,
		Info: SiteInfo{
			Title:       cache.Info.Title,
			Description: cache.Info.Description,
		},
	}, nil
}
