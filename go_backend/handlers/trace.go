package handlers

import (
	"net/url"

	"example.com/backend/helper"
	"example.com/backend/protobuf"
)

func Trace(_url *url.URL) (Result, error) {
	token := helper.SHA256(_url.String())
	req := &protobuf.Request{
		Url:       _url.String(),
		Thumbnail: token,
	}
	tm := helper.TaskManagerInstance()
	cache := tm.CacheLoad(req.Thumbnail)
	if cache != nil {
		return Result{
			FromURL:   cache.From,
			TermURL:   cache.Term,
			Chains:    cache.Chains,
			Thumbnail: req.Thumbnail,
			Info: SiteInfo{
				Title:       cache.Info.Title,
				Description: cache.Info.Description,
			},
		}, nil
	}
	trace, err := tm.Handle(req)
	if err != nil {
		return Result{}, err
	}
	return Result{
		FromURL:   trace.From,
		TermURL:   trace.Term,
		Chains:    trace.Chains,
		Thumbnail: req.Thumbnail,
		Info: SiteInfo{
			Title:       trace.Info.Title,
			Description: trace.Info.Description,
		},
	}, nil
}

type Result struct {
	FromURL   string   `json:"from_url"`
	TermURL   string   `json:"term_url"`
	Chains    []string `json:"chains"`
	Thumbnail string   `json:"thumbnail"`
	Info      SiteInfo `json:"info"`
}

type SiteInfo struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}
