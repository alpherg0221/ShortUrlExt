package browser

import (
	"bufio"
	"fmt"
	"io"
	"net/url"
	"os/exec"
	"regexp"
	"strings"
)

type Wget struct{}

func (wget Wget) Navigate(_url *url.URL, opt Options) (Result, error) {

	cmd := exec.Command("bash", "-c", fmt.Sprintf("wget -O - '%s' --server-response 2>&1", _url.String()))

	stdout, _ := cmd.StdoutPipe()
	r := bufio.NewReader(stdout)
	cmd.Start()

	// 出力結果を取得（C言語系だとdo~whileみたいなことをしている)
	line, err := r.ReadString('\n')

	// EOFの場合は err == io.EOF となる
	urls := []string{_url.String()}
	var title string
	var description string
	for err == nil {
		// データがGET出来た場合、文字列に変換して表示
		if len(line) > 0 {
			line = line[:len(line)-1]
			if strings.HasPrefix(line, "--") {
				arr := strings.Split(line, " ")
				if len(arr) == 4 {
					urls = append(urls, arr[3])
				}
			}
			if strings.Contains(line, "title") {
				re := regexp.MustCompile(`<title>([^<]+?)</title>`)
				matches := re.FindAllSubmatch([]byte(line), -1)
				if len(matches) > 0 {
					title = string(matches[0][1])
				}
			}
			if strings.Contains(line, "meta") {
				re := regexp.MustCompile(`<meta name="[Dd]escription" content="([^"]+?)"/?>`)
				matches := re.FindAllSubmatch([]byte(line), -1)
				if len(matches) > 0 {
					description = string(matches[0][1])
				}
			}
		}
		// 再び読み込む
		line, err = r.ReadString('\n')
	}
	if err != io.EOF {
		return Result{}, err
	}
	return Result{
		FromURL: _url.String(),
		TermURL: urls[len(urls)-1],
		Chains:  urls,
		Info: SiteInfo{
			Title:       title,
			Description: description,
		},
	}, nil
}
