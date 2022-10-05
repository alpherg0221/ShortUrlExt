package browser

import (
	"net/url"
	"strconv"
)

type Browser interface {
	Navigate(*url.URL, Options) (Result, error)
}

type Options []Option

type Option struct {
	Key   string
	Value string
}

func (opt Options) Find(key string) (string, bool) {
	for _, e := range opt {
		if e.Key == key {
			return e.Value, true
		}
	}
	return "", false
}

func (opt Options) Bool(key string, defaultValue bool) bool {
	v, ok := opt.Find(key)
	if !ok {
		return defaultValue
	}
	parsed, err := strconv.ParseBool(v)
	if err != nil {
		return defaultValue
	}
	return parsed
}

func (opt Options) Int(key string, defaultValue int64) int64 {
	v, ok := opt.Find(key)
	if !ok {
		return defaultValue
	}
	parsed, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return defaultValue
	}
	return parsed
}

func (opt Options) String(key string, defaultValue string) string {
	v, ok := opt.Find(key)
	if !ok {
		return defaultValue
	}
	return v
}

func NewOption(options map[string]string) Options {
	var ret Options
	for k, v := range options {
		ret = append(ret, Option{Key: k, Value: v})
	}
	return ret
}

type Result struct {
	FromURL       string   `json:"from_url"`
	TermURL       string   `json:"term_url"`
	Chains        []string `json:"chains"`
	Thumbnail     string   `json:"thumbnail"`
	Info          SiteInfo `json:"info"`
	ThumbnailData string   `json:"thumbnail_data"`
	Error         string   `json:"err"`
}

type SiteInfo struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}
