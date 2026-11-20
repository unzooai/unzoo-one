"""The notes both the page and the tools work on: one JSON file in the
folder Unzoo One gives the plugin (UNZOO_PLUGIN_DATA)."""
import json, os, time

DATA = os.environ.get("UNZOO_PLUGIN_DATA") or os.path.join(os.path.dirname(__file__), "_data")
FILE = os.path.join(DATA, "notes.json")


def load():
    try:
        with open(FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return []


def add(text):
    text = (text or "").strip()
    if not text:
        raise ValueError("a note needs text")
    notes = load()
    notes.append({"text": text[:2000], "at": time.strftime("%Y-%m-%d %H:%M")})
    os.makedirs(DATA, exist_ok=True)
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(notes, f, ensure_ascii=False, indent=1)
    return notes[-1]


def roles():
    try:
        return json.loads(os.environ.get("UNZOO_PLUGIN_ROLES") or "{}")
    except ValueError:
        return {}
