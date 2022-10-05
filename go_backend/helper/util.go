package helper

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
)

func SHA256(s string) string {
	r := sha256.Sum256([]byte(s))
	return hex.EncodeToString(r[:])
}

func FileExists(file string) bool {
	_, err := os.Stat(file)
	return err == nil
}
