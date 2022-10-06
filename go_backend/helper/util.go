package helper

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
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

func DebugLog(format string, v ...interface{}) {
	fmt.Fprintf(os.Stdout, format, v...)
}
