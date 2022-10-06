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
	DumpRequest(req)
	tm := helper.TaskManagerInstance()
	cache := tm.CacheLoad(req.Thumbnail)
	if cache != nil {
		println("<<CACHE HIT>>\n")
		DumpResult(Result{
			FromURL:   cache.From,
			TermURL:   cache.Term,
			Chains:    cache.Chains,
			Thumbnail: req.Thumbnail,
			Info: SiteInfo{
				Title:       cache.Info.Title,
				Description: cache.Info.Description,
			},
		})
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

	if trace.Info == nil {
		DumpResult(Result{
			FromURL:   trace.From,
			TermURL:   trace.Term,
			Chains:    trace.Chains,
			Thumbnail: req.Thumbnail,
		})
		return Result{
			FromURL:   trace.From,
			TermURL:   trace.Term,
			Chains:    trace.Chains,
			Thumbnail: req.Thumbnail,
			Info:      SiteInfo{},
		}, nil
	}
	DumpResult(Result{
		FromURL:   trace.From,
		TermURL:   trace.Term,
		Chains:    trace.Chains,
		Thumbnail: req.Thumbnail,
		Info: SiteInfo{
			Title:       trace.Info.Title,
			Description: trace.Info.Description,
		},
	})
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

func DumpRequest(r *protobuf.Request) {
	helper.DebugLog("Task: %s\n", r.Url)
	helper.DebugLog("\tThumbnail: %s\n", r.Thumbnail)
	if helper.SHA256(r.Url) != r.Thumbnail {
		helper.DebugLog("\tSHA256 token not match\n")
	}
}

func DumpResult(r Result) {
	helper.DebugLog("From: %s\n", r.FromURL)
	helper.DebugLog("\tTo: %s\n", r.TermURL)
	helper.DebugLog("\tInfo: %+v\n", r.Info)
	if helper.SHA256(r.FromURL) != r.Thumbnail {
		helper.DebugLog("\tSHA256 token not match\n")
	}
}
