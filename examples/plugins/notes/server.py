"""The plugin's program: its page and a small JSON API, on the port Unzoo One
gives it (UNZOO_PLUGIN_PORT). Standard library only."""
import html, json, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import notes

PAGE = """<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notes</title><style>
body{{font-family:system-ui,sans-serif;margin:24px;color:#1b1f27;background:#fbfbfc}}
@media (prefers-color-scheme:dark){{body{{color:#e8eaee;background:#0d1017}}}}
li{{margin:6px 0}} small{{color:#888}} code{{font-size:12px}}
</style></head><body>
<h1>Notes</h1>
<form method="post" action="/add"><input name="text" placeholder="A note" style="width:60%"> <button>Add</button></form>
<ul>{items}</ul>
<h3>Roles Unzoo One gave this plugin</h3><pre><code>{roles}</code></pre>
</body></html>"""


class Handler(BaseHTTPRequestHandler):
    def send(self, code, body, kind="application/json; charset=utf-8"):
        data = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/ping":
            return self.send(200, json.dumps({"ok": True}))
        if self.path == "/api/notes":
            return self.send(200, json.dumps(notes.load(), ensure_ascii=False))
        if self.path == "/":
            items = "".join(f"<li>{html.escape(n['text'])} <small>{n['at']}</small></li>" for n in reversed(notes.load()))
            roles = html.escape(json.dumps(notes.roles(), ensure_ascii=False, indent=1))
            return self.send(200, PAGE.format(items=items or "<li><small>No notes yet</small></li>", roles=roles), "text/html; charset=utf-8")
        self.send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        if self.path == "/add":
            from urllib.parse import parse_qs
            length = int(self.headers.get("Content-Length") or 0)
            text = parse_qs(self.rfile.read(length).decode("utf-8")).get("text", [""])[0]
            try:
                notes.add(text)
            except ValueError:
                pass
            self.send_response(303)
            self.send_header("Location", "/")
            self.end_headers()
            return
        self.send(404, json.dumps({"error": "not found"}))

    def log_message(self, fmt, *args):
        print(fmt % args, flush=True)


if __name__ == "__main__":
    port = int(os.environ.get("UNZOO_PLUGIN_PORT") or 8790)
    print(f"notes plugin on http://127.0.0.1:{port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
