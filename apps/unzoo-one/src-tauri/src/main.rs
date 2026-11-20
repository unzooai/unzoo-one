//! Unzoo One, the desktop client.
//!
//! Unzoo One is a client of its own background service, the Core: tasks,
//! schedules, agent sessions and the inbox live there and keep going with no
//! window open. This window carries the interface; on start it makes sure the
//! Core is running and tells the page where it is and which token to use.
//! The terminal is another client of the same Core, opened from here.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Read, Write};
use std::net::TcpStream;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
struct CoreConnection {
    base: String,
    token: String,
}

/// What the Core wrote about itself.
struct Discovery {
    token: String,
    pid: u32,
    http_port: Option<u16>,
}

fn read_discovery() -> Option<Discovery> {
    let path = unterm_protocol::core_discovery_path()?;
    let value: serde_json::Value = serde_json::from_slice(&std::fs::read(path).ok()?).ok()?;
    Some(Discovery {
        token: value.get("token")?.as_str()?.to_string(),
        pid: value.get("pid").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        http_port: value.get("http_port").and_then(|v| v.as_u64()).and_then(|p| u16::try_from(p).ok()),
    })
}

/// Whether a Core answers at this port with this token: one authenticated
/// request to the console's API, so a stale record or another program on a
/// recycled port is not mistaken for it.
fn answers(port: u16, token: &str) -> bool {
    let Ok(mut stream) = TcpStream::connect_timeout(&([127, 0, 0, 1], port).into(), Duration::from_millis(800))
    else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_secs(3)));
    let request = format!(
        "GET /api/console/run-settings HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nAuthorization: Bearer {token}\r\nConnection: close\r\n\r\n"
    );
    if stream.write_all(request.as_bytes()).is_err() {
        return false;
    }
    let mut head = [0u8; 16];
    let read = stream.read(&mut head).unwrap_or(0);
    head[..read].starts_with(b"HTTP/1.1 200")
}

fn live(discovery: &Discovery) -> Option<CoreConnection> {
    let port = discovery.http_port?;
    answers(port, &discovery.token).then(|| CoreConnection {
        base: format!("http://127.0.0.1:{port}"),
        token: discovery.token.clone(),
    })
}

/// The Core's program: named explicitly, next to this one (an install), or
/// the runtime's own build (developing).
fn core_program() -> Option<PathBuf> {
    sibling_program("unterm-core", "UNZOO_CORE_EXE")
}

fn start_core(program: &PathBuf) -> std::io::Result<()> {
    let mut command = Command::new(program);
    command.arg("--headless");
    // Its folders and messages are Unzoo One's: tasks work in
    // Documents\Unzoo One\<task>, not in a folder named after the runtime.
    command.env("UNTERM_PRODUCT_NAME", "Unzoo One");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // A console of its own that is never shown -- not DETACHED_PROCESS,
        // which leaves it none: then every console program it starts (the
        // agent CLIs, their MCP servers, git, powershell) opened a window of
        // its own on the person's desktop. With a hidden one they share it.
        // The window is a GUI program with no console, so the Core is not
        // tied to this window's life either way.
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command.spawn().map(|_| ())
}

fn ensure_core() -> Result<CoreConnection, String> {
    // One at a time: the window's start-up and the page's first request both
    // get here, and two would each start a Core (the second then exits on
    // the single-instance lock, but only after a confusing log line).
    static STARTING: Mutex<()> = Mutex::new(());
    let _one = STARTING.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    if let Some(found) = read_discovery() {
        if let Some(connection) = live(&found) {
            return Ok(connection);
        }
        if found.http_port.is_none() && found.pid != 0 && pid_alive(found.pid) {
            return Err(
                "An older background service is running that does not offer what Unzoo One needs. Quit it (or restart your computer), then open Unzoo One again."
                    .into(),
            );
        }
    }
    let program = core_program().ok_or("The Unzoo One background service is missing. Please reinstall Unzoo One.")?;
    adopt_shared_state();
    start_core(&program).map_err(|e| format!("The background service could not start: {e}"))?;
    let deadline = Instant::now() + Duration::from_secs(20);
    while Instant::now() < deadline {
        if let Some(connection) = read_discovery().as_ref().and_then(live) {
            return Ok(connection);
        }
        std::thread::sleep(Duration::from_millis(250));
    }
    Err("The background service did not become ready within 20 seconds.".into())
}

/// Unzoo One keeps its own state (`~/.unzoo-one`, its Core's record under
/// `%LOCALAPPDATA%\Unzoo One`) so a standalone Unterm can run beside it.
/// Earlier versions shared Unterm's `~/.unterm`; the first time there is no
/// state of its own, it starts from a copy of that one -- conversations,
/// settings, skills, trust -- and the original stays Unterm's.
///
/// Not copied: what belongs to the running processes there (window
/// registrations, server records, grants of live sessions) and remote
/// access, which listens on its own port here.
fn adopt_shared_state() {
    let (Some(own), Some(home)) = (unterm_protocol::state_dir(), dirs_home()) else { return };
    let shared = home.join(".unterm");
    if own.exists() || !shared.is_dir() || own == shared {
        return;
    }
    const LEFT_BEHIND: &[&str] = &["instances", "server.json", "auth_token", "hosted_grants", "remote", "stall.log", "core.json"];
    let staging = own.with_extension("adopting");
    let _ = std::fs::remove_dir_all(&staging);
    let copied = copy_tree(&shared, &staging, LEFT_BEHIND).and_then(|_| std::fs::rename(&staging, &own));
    if let Err(error) = copied {
        eprintln!("unzoo-one: starting with fresh state, the shared state could not be copied: {error}");
        let _ = std::fs::remove_dir_all(&staging);
    }
}

fn dirs_home() -> Option<PathBuf> {
    std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")).map(PathBuf::from)
}

fn copy_tree(from: &std::path::Path, to: &std::path::Path, skip: &[&str]) -> std::io::Result<()> {
    std::fs::create_dir_all(to)?;
    for entry in std::fs::read_dir(from)? {
        let entry = entry?;
        let name = entry.file_name();
        if skip.iter().any(|left| name == std::ffi::OsStr::new(left)) {
            continue;
        }
        let kind = entry.file_type()?;
        if kind.is_dir() {
            copy_tree(&entry.path(), &to.join(&name), &[])?;
        } else if kind.is_file() {
            std::fs::copy(entry.path(), to.join(&name))?;
        }
    }
    Ok(())
}

#[cfg(windows)]
fn pid_alive(pid: u32) -> bool {
    // tasklist is slow but this runs once, and only on the unusual path.
    Command::new("tasklist")
        .args(["/FI", &format!("PID eq {pid}"), "/NH"])
        .output()
        .map(|out| String::from_utf8_lossy(&out.stdout).contains(&pid.to_string()))
        .unwrap_or(false)
}

#[cfg(not(windows))]
fn pid_alive(pid: u32) -> bool {
    std::path::Path::new(&format!("/proc/{pid}")).exists()
        || Command::new("kill").args(["-0", &pid.to_string()]).status().map(|s| s.success()).unwrap_or(false)
}

/// A program that ships next to this one (an install), or the runtime's own
/// build (developing). `env` names an override.
fn sibling_program(stem: &str, env: &str) -> Option<PathBuf> {
    let name = if cfg!(windows) { format!("{stem}.exe") } else { stem.to_string() };
    if let Some(path) = std::env::var_os(env).map(PathBuf::from) {
        return path.is_file().then_some(path);
    }
    let beside = std::env::current_exe().ok()?.parent()?.join(&name);
    if beside.is_file() {
        return Some(beside);
    }
    let runtime = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../unterm/target");
    ["release", "debug"]
        .iter()
        .map(|profile| runtime.join(profile).join(&name))
        .find(|path| path.is_file())
}

/// Open the terminal: another client of the same Core, so its sessions and
/// the agent runs it shows are the ones Unzoo One knows about.
#[tauri::command]
fn open_terminal() -> Result<(), String> {
    let program = sibling_program("unterm", "UNZOO_TERMINAL_EXE")
        .ok_or("The terminal is missing. Please reinstall Unzoo One.")?;
    Command::new(&program)
        // Its windows are Unzoo One's: the terminal is a feature of this app.
        .env("UNTERM_PRODUCT_NAME", "Unzoo One")
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("The terminal could not start: {e}"))
}

/// Show a file a task made in the system's file manager, selected. Only an
/// existing file or folder; nothing is run but the file manager itself.
#[tauri::command]
fn reveal_path(path: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    if !target.exists() {
        return Err(format!("{path} is no longer there"));
    }
    #[cfg(windows)]
    let spawned = {
        use std::os::windows::process::CommandExt;
        // Explorer parses its own command line: `/select,"C:\a b\c.md"`.
        // Quoting the whole argument, as `arg` would for a path with a
        // space, makes it fall back to opening Documents.
        let quoted = format!("\"{}\"", target.display());
        if target.is_dir() {
            Command::new("explorer.exe").raw_arg(&quoted).spawn()
        } else {
            Command::new("explorer.exe").raw_arg(format!("/select,{quoted}")).spawn()
        }
    };
    #[cfg(target_os = "macos")]
    let spawned = Command::new("open").arg("-R").arg(&target).spawn();
    #[cfg(all(unix, not(target_os = "macos")))]
    let spawned = Command::new("xdg-open")
        .arg(if target.is_dir() { target.as_path() } else { target.parent().unwrap_or(&target) })
        .spawn();
    spawned.map(|_| ()).map_err(|e| format!("The folder could not be opened: {e}"))
}

// ---- start with the system -------------------------------------------------

/// Where Windows keeps what starts at sign-in, for this user only.
#[cfg(windows)]
const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
#[cfg(windows)]
const RUN_VALUE: &str = "Unzoo One";

/// The user's Run key, through the registry API. Not `reg.exe` in a hidden
/// console: a program that quietly runs `reg add ...\Run` is how malware
/// makes itself persistent, and antivirus engines score it that way.
#[cfg(windows)]
fn run_key(write: bool) -> std::io::Result<winreg::RegKey> {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};
    let user = winreg::RegKey::predef(HKEY_CURRENT_USER);
    if write {
        user.create_subkey_with_flags(RUN_KEY, KEY_READ | KEY_WRITE).map(|(key, _)| key)
    } else {
        user.open_subkey_with_flags(RUN_KEY, KEY_READ)
    }
}

/// Whether Unzoo One starts its background service when the user signs in.
#[tauri::command]
fn autostart_get() -> Result<bool, String> {
    #[cfg(windows)]
    {
        Ok(run_key(false).and_then(|key| key.get_value::<String, _>(RUN_VALUE)).is_ok())
    }
    #[cfg(not(windows))]
    {
        Ok(autostart_file()?.is_file())
    }
}

/// Start (or stop starting) the background service at sign-in: this program
/// with `--background`, which starts the service and opens no window. Scheduled
/// tasks need it after a restart, before anyone opens Unzoo One.
///
/// Windows: a value under the user's Run key. macOS: a LaunchAgent. Linux and
/// other desktops: an XDG autostart entry. All three are the user's own, need
/// no administrator, and are what each system's settings list as login items.
#[tauri::command]
fn autostart_set(enabled: bool) -> Result<bool, String> {
    #[cfg(windows)]
    {
        let key = run_key(true).map_err(|e| e.to_string())?;
        if enabled {
            let exe = std::env::current_exe().map_err(|e| e.to_string())?;
            let command = format!("\"{}\" --background", exe.display());
            key.set_value(RUN_VALUE, &command).map_err(|e| e.to_string())?;
        } else if let Err(error) = key.delete_value(RUN_VALUE) {
            // Deleting a value that is not there is already the wanted state.
            if error.kind() != std::io::ErrorKind::NotFound {
                return Err(error.to_string());
            }
        }
        autostart_get()
    }
    #[cfg(not(windows))]
    {
        let file = autostart_file()?;
        if enabled {
            let exe = std::env::current_exe().map_err(|e| e.to_string())?;
            #[cfg(target_os = "macos")]
            let contents = launch_agent_plist(&exe);
            #[cfg(not(target_os = "macos"))]
            let contents = desktop_entry(&exe);
            if let Some(dir) = file.parent() {
                std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
            }
            std::fs::write(&file, contents).map_err(|e| e.to_string())?;
        } else if let Err(error) = std::fs::remove_file(&file) {
            if error.kind() != std::io::ErrorKind::NotFound {
                return Err(error.to_string());
            }
        }
        autostart_get()
    }
}

/// The login item this user's system reads: a LaunchAgent on macOS, an XDG
/// autostart entry elsewhere.
#[cfg(not(windows))]
fn autostart_file() -> Result<PathBuf, String> {
    let home = std::env::var_os("HOME").map(PathBuf::from).ok_or("There is no home folder.")?;
    #[cfg(target_os = "macos")]
    {
        Ok(home.join("Library/LaunchAgents").join(format!("{LOGIN_ITEM_ID}.plist")))
    }
    #[cfg(not(target_os = "macos"))]
    {
        let config = std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .filter(|dir| dir.is_absolute())
            .unwrap_or_else(|| home.join(".config"));
        Ok(config.join("autostart").join("ai.unzoo.one.desktop"))
    }
}

#[cfg_attr(windows, allow(dead_code))]
const LOGIN_ITEM_ID: &str = "ai.unzoo.one.background";

/// A LaunchAgent that runs `<exe> --background` once at login. No KeepAlive:
/// `--background` starts the service and exits, and the service keeps itself.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
fn launch_agent_plist(exe: &std::path::Path) -> String {
    let xml = |text: &str| {
        text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;").replace('\'', "&apos;")
    };
    format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n\
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n\
<plist version=\"1.0\">\n\
<dict>\n\
\t<key>Label</key>\n\t<string>{LOGIN_ITEM_ID}</string>\n\
\t<key>ProgramArguments</key>\n\t<array>\n\t\t<string>{}</string>\n\t\t<string>--background</string>\n\t</array>\n\
\t<key>RunAtLoad</key>\n\t<true/>\n\
\t<key>ProcessType</key>\n\t<string>Background</string>\n\
</dict>\n\
</plist>\n",
        xml(&exe.display().to_string())
    )
}

/// An XDG autostart entry that runs `<exe> --background` at login.
#[cfg_attr(any(windows, target_os = "macos"), allow(dead_code))]
fn desktop_entry(exe: &std::path::Path) -> String {
    // Exec quoting (Desktop Entry spec): inside double quotes, `"`, `` ` ``,
    // `$` and `\` take a backslash -- and the file's own string escaping then
    // doubles every backslash, so a literal `\` is four. `%` is a field code
    // unless doubled.
    let mut quoted = String::new();
    for c in exe.display().to_string().chars() {
        match c {
            '"' | '`' | '$' => {
                quoted.push_str("\\\\");
                quoted.push(c);
            }
            '\\' => quoted.push_str("\\\\\\\\"),
            '%' => quoted.push_str("%%"),
            _ => quoted.push(c),
        }
    }
    format!(
        "[Desktop Entry]\n\
Type=Application\n\
Name=Unzoo One\n\
Comment=Starts the Unzoo One background service so scheduled tasks run\n\
Exec=\"{quoted}\" --background\n\
Terminal=false\n\
NoDisplay=true\n\
X-GNOME-Autostart-enabled=true\n"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn a_launch_agent_runs_the_client_in_the_background_once_at_login() {
        let plist = launch_agent_plist(Path::new("/Applications/Unzoo One.app/Contents/MacOS/unzoo-one"));
        assert!(plist.contains("<string>ai.unzoo.one.background</string>"));
        assert!(plist.contains("<string>/Applications/Unzoo One.app/Contents/MacOS/unzoo-one</string>"));
        assert!(plist.contains("<string>--background</string>"));
        assert!(plist.contains("<key>RunAtLoad</key>\n\t<true/>"));
        assert!(!plist.contains("KeepAlive"), "the service keeps itself; the launcher just exits");
        let odd = launch_agent_plist(Path::new("/Users/a&b/<x>/unzoo-one"));
        assert!(odd.contains("/Users/a&amp;b/&lt;x&gt;/unzoo-one"), "{odd}");
    }

    #[test]
    fn a_desktop_entry_quotes_the_path_the_way_the_spec_says() {
        let entry = desktop_entry(Path::new("/opt/Unzoo One/unzoo-one"));
        assert!(entry.starts_with("[Desktop Entry]\n"));
        assert!(entry.contains("Exec=\"/opt/Unzoo One/unzoo-one\" --background\n"));
        assert!(entry.contains("NoDisplay=true"));
        let odd = desktop_entry(Path::new("/home/me/100%/$HOME/a\"b/unzoo-one"));
        assert!(odd.contains(r#"Exec="/home/me/100%%/\\$HOME/a\\"b/unzoo-one" --background"#), "{odd}");
    }
}

/// The connection, found once and kept; asked again only after a failure,
/// so a Core that is still starting is waited for rather than given up on.
struct Connection(Mutex<Option<CoreConnection>>);

#[tauri::command]
async fn core_connection(state: tauri::State<'_, Connection>) -> Result<CoreConnection, String> {
    if let Some(known) = state.0.lock().unwrap().clone() {
        if answers(port_of(&known.base), &known.token) {
            return Ok(known);
        }
    }
    let found = tauri::async_runtime::spawn_blocking(ensure_core)
        .await
        .map_err(|e| e.to_string())??;
    *state.0.lock().unwrap() = Some(found.clone());
    Ok(found)
}

fn port_of(base: &str) -> u16 {
    base.rsplit(':').next().and_then(|p| p.parse().ok()).unwrap_or(0)
}

fn main() {
    // Everything this process resolves (its Core's record, its state) and
    // everything it starts (the Core, the terminal) is Unzoo One's, apart
    // from a standalone Unterm's -- in a development build too, which has
    // no product file beside it.
    std::env::set_var("UNTERM_PRODUCT_NAME", "Unzoo One");
    // Started at sign-in: bring the background service up and leave, no window.
    if std::env::args().any(|arg| arg == "--background") {
        if let Err(error) = ensure_core() {
            eprintln!("unzoo-one: {error}");
            std::process::exit(1);
        }
        return;
    }
    tauri::Builder::default()
        .manage(Connection(Mutex::new(None)))
        .setup(|_| {
            // Start the Core while the window is still painting.
            std::thread::spawn(|| {
                if let Err(error) = ensure_core() {
                    eprintln!("unzoo-one: {error}");
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![core_connection, open_terminal, reveal_path, autostart_get, autostart_set])
        .run(tauri::generate_context!())
        .expect("Unzoo One could not start");
}
