"""The plugin's tools for agents: a minimal MCP server over stdio (one JSON-RPC
message per line). Standard library only."""
import json, sys
import notes

TOOLS = [
    {"name": "list_notes", "description": "The notes, newest last.",
     "inputSchema": {"type": "object", "properties": {}}},
    {"name": "add_note", "description": "Add a note.",
     "inputSchema": {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]}},
]


def call(name, args):
    if name == "list_notes":
        return json.dumps(notes.load(), ensure_ascii=False)
    if name == "add_note":
        return json.dumps(notes.add(args.get("text")), ensure_ascii=False)
    raise ValueError(f"unknown tool {name}")


def main():
    out = sys.stdout
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        msg = json.loads(line)
        if "id" not in msg:
            continue  # notifications
        method, mid = msg.get("method"), msg["id"]
        try:
            if method == "initialize":
                result = {"protocolVersion": msg.get("params", {}).get("protocolVersion", "2025-06-18"),
                          "capabilities": {"tools": {}}, "serverInfo": {"name": "notes", "version": "0.1.0"}}
            elif method == "tools/list":
                result = {"tools": TOOLS}
            elif method == "tools/call":
                p = msg.get("params", {})
                result = {"content": [{"type": "text", "text": call(p.get("name"), p.get("arguments") or {})}]}
            else:
                raise ValueError(f"unsupported method {method}")
            reply = {"jsonrpc": "2.0", "id": mid, "result": result}
        except Exception as e:  # the agent sees the reason
            reply = {"jsonrpc": "2.0", "id": mid, "error": {"code": -32000, "message": str(e)}}
        out.write(json.dumps(reply, ensure_ascii=False) + "\n")
        out.flush()


if __name__ == "__main__":
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    main()
