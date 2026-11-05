package app

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/oneworkspacestudio/my-survival/internal/webui"
	"github.com/oneworkspacestudio/one-workspace/pkg/apphost"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strings"
	"time"
)

type Envelope struct {
	Format     string `json:"format"`
	Iterations int    `json:"iterations"`
	Salt       string `json:"salt"`
	IV         string `json:"iv"`
	Ciphertext string `json:"ciphertext"`
}

func (e Envelope) Validate() error {
	if e.Format != "my-survival-v1" || e.Iterations != 310000 || len(e.Ciphertext) > 900000 {
		return errors.New("unsupported encrypted backup")
	}
	for _, v := range []struct {
		s string
		n int
	}{{e.Salt, 16}, {e.IV, 12}, {e.Ciphertext, 0}} {
		b, err := base64.StdEncoding.DecodeString(v.s)
		if err != nil || (v.n > 0 && len(b) != v.n) || (v.n == 0 && len(b) < 16) {
			return errors.New("invalid encrypted backup")
		}
	}
	return nil
}

type App struct{ H *apphost.Host }

func New(h *apphost.Host) (*App, error) {
	a := &App{H: h}
	var v int
	if e := h.DB.QueryRow("SELECT coalesce(max(version),0) FROM host_migrations").Scan(&v); e != nil {
		return nil, e
	}
	if v > 1 {
		return nil, errors.New("this plan store requires a newer My Survival version")
	}
	if e := h.Migrate(1, `CREATE TABLE IF NOT EXISTS survival_vaults(user_id TEXT PRIMARY KEY,value TEXT NOT NULL,updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`); e != nil {
		return nil, e
	}
	h.Mux.HandleFunc("GET /api/vault", h.Require(a.get))
	h.Mux.HandleFunc("PUT /api/vault", h.Require(a.put))
	// Serve exact embedded bytes (FileServer redirects index.html). Offline install
	// verifies hashes and deliberately never caches account or API responses.
	h.UIHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, "/")
		if name == "" {
			name = "index.html"
		}
		if !fs.ValidPath(name) {
			http.NotFound(w, r)
			return
		}
		b, e := fs.ReadFile(webui.Files(), name)
		if e != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", mime.TypeByExtension(path.Ext(name)))
		if name == "portable.html" {
			w.Header().Set("Content-Disposition", `attachment; filename="My-Survival-offline.html"`)
		}
		http.ServeContent(w, r, name, time.Time{}, bytes.NewReader(b))
	})
	return a, nil
}
func (a *App) Run(ctx context.Context) error { <-ctx.Done(); return nil }
func (a *App) get(w http.ResponseWriter, r *http.Request) {
	var data string
	e := a.H.DB.QueryRowContext(r.Context(), "SELECT value FROM survival_vaults WHERE user_id=?", apphost.Current(r).User.ID).Scan(&data)
	if errors.Is(e, sql.ErrNoRows) {
		apphost.Problem(w, 404, "No encrypted backup stored")
		return
	}
	if e != nil {
		apphost.Problem(w, 500, "Backup unavailable")
		return
	}
	var envelope Envelope
	if json.Unmarshal([]byte(data), &envelope) != nil || envelope.Validate() != nil {
		apphost.Problem(w, 500, "Stored backup could not be read")
		return
	}
	apphost.JSON(w, 200, envelope)
}
func (a *App) put(w http.ResponseWriter, r *http.Request) {
	var envelope Envelope
	if !apphost.Decode(w, r, &envelope) {
		return
	}
	if envelope.Validate() != nil {
		apphost.Problem(w, 400, "Provide a supported encrypted My Survival backup")
		return
	}
	b, _ := json.Marshal(envelope)
	_, e := a.H.DB.ExecContext(r.Context(), "INSERT INTO survival_vaults(user_id,value) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET value=excluded.value,updated=CURRENT_TIMESTAMP", apphost.Current(r).User.ID, string(b))
	if e != nil {
		apphost.Problem(w, 500, "Backup could not be saved")
		return
	}
	apphost.JSON(w, 200, map[string]bool{"saved": true})
}
