package app

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"github.com/oneworkspacestudio/one-workspace/pkg/apphost"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

func TestEncryptedEnvelopeBoundary(t *testing.T) {
	valid := Envelope{"my-survival-v1", 310000, base64.StdEncoding.EncodeToString(make([]byte, 16)), base64.StdEncoding.EncodeToString(make([]byte, 12)), base64.StdEncoding.EncodeToString(make([]byte, 40))}
	if e := valid.Validate(); e != nil {
		t.Fatal(e)
	}
	for _, change := range []func(*Envelope){func(e *Envelope) { e.Format = "plaintext" }, func(e *Envelope) { e.Iterations = 1 }, func(e *Envelope) { e.IV = "x" }, func(e *Envelope) { e.Salt = "" }, func(e *Envelope) { e.Ciphertext = "private personal details" }, func(e *Envelope) { e.Ciphertext = strings.Repeat("A", 900004) }} {
		v := valid
		change(&v)
		if v.Validate() == nil {
			t.Fatal("accepted malformed backup")
		}
	}
}

func TestPublicOfflineAssetsAndPrivateAccountBackup(t *testing.T) {
	h, err := apphost.New(apphost.Config{ID: "survival", Name: "My Survival", Version: "test", Data: filepath.Join(t.TempDir(), "private"), Listen: "127.0.0.1:25441", Origin: "http://localhost:25441/survival"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()
	if _, err = New(h); err != nil {
		t.Fatal(err)
	}
	call := func(method, path string, body any, cookie *http.Cookie, csrf string) *httptest.ResponseRecorder {
		var b []byte
		if body != nil {
			b, _ = json.Marshal(body)
		}
		r := httptest.NewRequest(method, h.Config.Origin+path, bytes.NewReader(b))
		r.RemoteAddr = "127.0.0.1:12345"
		r.Header.Set("Origin", "http://localhost:25441")
		r.Header.Set("X-CSRF-Token", csrf)
		if cookie != nil {
			r.AddCookie(cookie)
		}
		w := httptest.NewRecorder()
		h.Handler().ServeHTTP(w, r)
		return w
	}
	for _, p := range []string{"/", "/index.html", "/sw.js", "/portable.html"} {
		w := call("GET", p, nil, nil, "")
		if w.Code != 200 || w.Header().Get("Location") != "" {
			t.Fatalf("offline asset %s: %d", p, w.Code)
		}
	}
	if w := call("GET", "/api/vault", nil, nil, ""); w.Code != 401 {
		t.Fatal("anonymous private access", w.Code)
	}
	if err = h.Bootstrap("owner@example.test", "synthetic-only-password"); err != nil {
		t.Fatal(err)
	}
	login := func(email string) (*http.Cookie, string) {
		w := call("POST", "/api/login", map[string]string{"email": email, "password": "synthetic-only-password"}, nil, "")
		if w.Code != 200 {
			t.Fatal("login", w.Code, w.Body.String())
		}
		cookie := w.Result().Cookies()[0]
		var session apphost.Session
		json.Unmarshal(call("GET", "/api/me", nil, cookie, "").Body.Bytes(), &session)
		return cookie, session.CSRF
	}
	owner, csrf := login("owner@example.test")
	data := Envelope{"my-survival-v1", 310000, base64.StdEncoding.EncodeToString(make([]byte, 16)), base64.StdEncoding.EncodeToString(make([]byte, 12)), base64.StdEncoding.EncodeToString(make([]byte, 40))}
	if w := call("PUT", "/api/vault", data, owner, ""); w.Code != 403 {
		t.Fatal("CSRF not enforced", w.Code)
	}
	if w := call("PUT", "/api/vault", data, owner, csrf); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w := call("GET", "/api/vault", nil, owner, csrf); w.Code != 200 || !strings.Contains(w.Body.String(), data.Ciphertext) {
		t.Fatal("backup lost", w.Code)
	}
	if w := call("POST", "/api/local-users", map[string]string{"email": "member@example.test", "password": "synthetic-only-password"}, owner, csrf); w.Code != 201 && w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	member, memberCSRF := login("member@example.test")
	if w := call("GET", "/api/vault", nil, member, memberCSRF); w.Code != 404 {
		t.Fatal("cross-user access", w.Code)
	}
	call("POST", "/auth/logout", nil, owner, csrf)
	if w := call("GET", "/api/vault", nil, owner, csrf); w.Code != 401 {
		t.Fatal("logout did not revoke backup access", w.Code)
	}
	if w := call("GET", "/index.html", nil, owner, csrf); w.Code != 200 {
		t.Fatal("logout blocked emergency handbook")
	}
}
