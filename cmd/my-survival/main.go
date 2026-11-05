package main

import (
	"github.com/oneworkspacestudio/my-survival/internal/app"
	"github.com/oneworkspacestudio/my-survival/internal/webui"
	"github.com/oneworkspacestudio/one-workspace/pkg/apphost"
	"os"
	"path/filepath"
	"strings"
)

var version = "0.1.0-preview.1"

func main() {
	hasData := false
	for _, arg := range os.Args[1:] {
		if arg == "--data" || strings.HasPrefix(arg, "--data=") {
			hasData = true
		}
	}
	if !hasData {
		root, e := os.UserConfigDir()
		if e != nil {
			apphost.Report(e)
			os.Exit(1)
		}
		os.Args = append(os.Args, "--data", filepath.Join(root, "OneWorkspace", "MySurvival"))
	}
	if e := apphost.Main(apphost.Config{ID: "survival", Name: "My Survival", Version: version, Listen: "127.0.0.1:9041", Geolocation: true}, webui.Files(), func(h *apphost.Host) (apphost.Application, error) { return app.New(h) }); e != nil {
		apphost.Report(e)
		os.Exit(1)
	}
}
