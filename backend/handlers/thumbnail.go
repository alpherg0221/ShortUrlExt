package handlers

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"math"
	"os"
	"time"

	"example.com/backend/helper"
	"golang.org/x/image/draw"
)

func Thumbnail(token string, size int64, timeout time.Duration) (string, error) {
	filename := token
	exists := helper.FileExists(filename)
	from := time.Now()
	for !exists {
		if time.Now().After(from.Add(timeout)) {
			return "", fmt.Errorf("not found")
		}
		time.Sleep(CACHE_INTERVAL)
		exists = helper.FileExists(filename)
	}

	size = int64(math.Max(float64(size), 100))
	size = int64(math.Min(float64(size), 800))

	cache := fmt.Sprintf("%s_%d", token, size)

	if helper.FileExists(cache) {
		return cache, nil
	}

	p, err := os.Open(filename)
	if err != nil {
		return "", err
	}

	imgSrc, err := png.Decode(p)
	if err != nil {
		return "", err
	}

	//rectange of image
	rctSrc := imgSrc.Bounds()
	factor := 1.0
	if rctSrc.Dx() < rctSrc.Dy() {
		factor = float64(size) / float64(rctSrc.Dx())
	} else {
		factor = float64(size) / float64(rctSrc.Dy())
	}

	imgDst := image.NewRGBA(image.Rect(0, 0, int(float64(rctSrc.Dx())*factor), int(float64(rctSrc.Dy())*(factor))))
	draw.CatmullRom.Scale(imgDst, imgDst.Bounds(), imgSrc, rctSrc, draw.Over, nil)

	//create resized image file
	dst, err := os.Create(cache) //maybe dst file path
	if err != nil {
		return "", err
	}
	defer dst.Close()
	err = jpeg.Encode(dst, imgDst, &jpeg.Options{Quality: 75})
	if err != nil {
		return "", err
	}
	return cache, nil
}
