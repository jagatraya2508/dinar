"""Local server for the Dinar Seafood site and admin editor."""

import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import threading
import time
import webbrowser
from email import message_from_bytes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
CONTENT_PATH = DATA / "content.json"
ADMIN_PATH = DATA / "admin.json"
UPLOADS = ROOT / "assets" / "web" / "uploads"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 3002))
MAX_JSON = 1_000_000
MAX_UPLOAD = 8 * 1024 * 1024
SESSION_TTL = 60 * 60 * 12

SESSIONS = {}
LOGIN_FAILS = {}
IMAGE_KEYS = {"image", "logo", "logoWhite", "map", "src"}
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return salt.hex(), digest.hex()


def ensure_admin():
    DATA.mkdir(parents=True, exist_ok=True)
    UPLOADS.mkdir(parents=True, exist_ok=True)
    if ADMIN_PATH.exists():
        return
    salt, digest = hash_password("dinar2026")
    ADMIN_PATH.write_text(
        json.dumps({"username": "admin", "salt": salt, "hash": digest}, indent=2),
        encoding="utf-8",
    )
    print("Akun admin dibuat. Username: admin  |  Kata sandi: dinar2026")
    print("Ganti kata sandi lewat menu admin setelah masuk.")


def load_admin():
    return json.loads(ADMIN_PATH.read_text(encoding="utf-8"))


def check_password(password):
    admin = load_admin()
    salt = bytes.fromhex(admin["salt"])
    _, digest = hash_password(password, salt)
    return hmac.compare_digest(digest, admin["hash"])


def valid_image_ref(value):
    if not isinstance(value, str) or value == "":
        return True
    if ".." in value or value.startswith("//"):
        return False
    if value.startswith("assets/web/"):
        return True
    return value.startswith("https://") or value.startswith("http://")


def check_images(node):
    if isinstance(node, dict):
        for key, value in node.items():
            if key in IMAGE_KEYS:
                if not valid_image_ref(value):
                    raise ValueError("path foto tidak valid")
            else:
                check_images(value)
    elif isinstance(node, list):
        for item in node:
            check_images(item)


def clean_sessions():
    now = time.time()
    expired = [token for token, item in SESSIONS.items() if item["exp"] < now]
    for token in expired:
        SESSIONS.pop(token, None)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def send_json(self, code, payload, extra_headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if extra_headers:
            for key, value in extra_headers:
                self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_JSON:
            raise ValueError("data terlalu besar")
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def cookies(self):
        found = {}
        for bit in self.headers.get("Cookie", "").split(";"):
            if "=" in bit:
                key, value = bit.strip().split("=", 1)
                found[key] = value
        return found

    def current_session(self):
        clean_sessions()
        token = self.cookies().get("dinar_session")
        item = SESSIONS.get(token)
        if not item or item["exp"] < time.time():
            return None
        return item

    def require_admin(self):
        if self.current_session():
            return True
        self.send_json(401, {"error": "Silakan masuk dulu."})
        return False

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/content":
            self.send_json(200, json.loads(CONTENT_PATH.read_text(encoding="utf-8")))
            return
        if path == "/api/me":
            session = self.current_session()
            if not session:
                self.send_json(200, {"ok": False})
                return
            self.send_json(200, {"ok": True, "username": session["username"]})
            return
        if path.startswith("/data/"):
            self.send_error(404)
            return
        if path in ("/admin", "/admin/"):
            path = "/admin/index.html"
        if path == "/":
            path = "/index.html"
        self.serve_file(path)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            if path == "/api/login":
                self.handle_login()
            elif path == "/api/logout":
                token = self.cookies().get("dinar_session")
                SESSIONS.pop(token, None)
                self.send_json(200, {"ok": True}, [("Set-Cookie", cookie("", max_age=0))])
            elif path == "/api/upload":
                if self.require_admin():
                    self.handle_upload()
            elif path == "/api/password":
                if self.require_admin():
                    self.handle_password()
            else:
                self.send_json(404, {"error": "Tidak ditemukan."})
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json(400, {"error": str(exc)})

    def do_PUT(self):
        if urlparse(self.path).path != "/api/content":
            self.send_json(404, {"error": "Tidak ditemukan."})
            return
        if not self.require_admin():
            return
        try:
            payload = self.read_json()
            if not isinstance(payload, dict):
                raise ValueError("format konten tidak valid")
            check_images(payload)
            temp = CONTENT_PATH.with_suffix(".tmp")
            temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            os.replace(temp, CONTENT_PATH)
            self.send_json(200, {"ok": True})
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json(400, {"error": str(exc)})

    def handle_login(self):
        ip = self.client_address[0]
        fails = LOGIN_FAILS.get(ip, [])
        now = time.time()
        fails = [stamp for stamp in fails if now - stamp < 600]
        if len(fails) >= 8:
            raise ValueError("Terlalu banyak percobaan. Coba lagi beberapa menit.")
        body = self.read_json()
        username = str(body.get("username", "")).strip()
        password = str(body.get("password", ""))
        admin = load_admin()
        if username != admin["username"] or not check_password(password):
            fails.append(now)
            LOGIN_FAILS[ip] = fails
            raise ValueError("Username atau kata sandi salah.")
        LOGIN_FAILS.pop(ip, None)
        token = secrets.token_urlsafe(32)
        SESSIONS[token] = {"username": username, "exp": now + SESSION_TTL}
        self.send_json(200, {"ok": True, "username": username}, [("Set-Cookie", cookie(token))])

    def handle_password(self):
        body = self.read_json()
        current = str(body.get("current", ""))
        new_password = str(body.get("next", ""))
        if not check_password(current):
            raise ValueError("Kata sandi sekarang salah.")
        if len(new_password) < 6:
            raise ValueError("Kata sandi baru minimal 6 karakter.")
        admin = load_admin()
        salt, digest = hash_password(new_password)
        admin["salt"] = salt
        admin["hash"] = digest
        ADMIN_PATH.write_text(json.dumps(admin, indent=2), encoding="utf-8")
        self.send_json(200, {"ok": True})

    def handle_upload(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_UPLOAD:
            raise ValueError("Ukuran foto maksimal 8 MB.")
        raw_type = self.headers.get("Content-Type", "")
        message = message_from_bytes(
            ("Content-Type: %s\r\nMIME-Version: 1.0\r\n\r\n" % raw_type).encode("utf-8")
            + self.rfile.read(length)
        )
        saved = None
        for part in message.walk():
            filename = part.get_filename()
            if not filename:
                continue
            ext = Path(filename).suffix.lower()
            if ext not in ALLOWED_EXT:
                raise ValueError("Gunakan foto JPG, PNG, WEBP, atau GIF.")
            data = part.get_payload(decode=True) or b""
            if not data:
                raise ValueError("Foto kosong.")
            name = secrets.token_hex(8) + ext
            target = UPLOADS / name
            target.write_bytes(data)
            saved = "assets/web/uploads/" + name
            break
        if not saved:
            raise ValueError("Foto tidak ditemukan.")
        self.send_json(200, {"ok": True, "path": saved})

    def serve_file(self, url_path):
        relative = unquote(url_path).lstrip("/")
        target = (ROOT / relative).resolve()
        if not str(target).startswith(str(ROOT)) or not target.is_file():
            self.send_error(404)
            return
        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if target.suffix == ".js":
            mime = "text/javascript"
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        if target.suffix == ".html":
            self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def cookie(token, max_age=SESSION_TTL):
    return "dinar_session=%s; HttpOnly; SameSite=Lax; Path=/; Max-Age=%s" % (token, max_age)


def main():
    ensure_admin()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    url = "http://%s:%s/" % (HOST, PORT)
    print("Website: %s" % url)
    print("Admin:   %sadmin" % url)
    threading.Timer(0.8, lambda: webbrowser.open(url + "admin")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer berhenti.")


if __name__ == "__main__":
    main()
