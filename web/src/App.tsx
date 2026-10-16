import { useEffect, useState } from "react";

type Platform = "Java" | "Bedrock" | "Java + Bedrock";

type ServerInfo = {
  id: number;
  name: string;
  platform: Platform;
  software: string;
  version: string;
  ram: string;
  online: boolean;
  autoUpdateBedrock: boolean;
};

type Account = {
  id?: number;
  username: string;
};

const css = `
*{box-sizing:border-box}body{margin:0;background:#0b1020;color:#edf1ff;font-family:Inter,Arial,sans-serif}button,input,select{font:inherit}button{cursor:pointer}.app{min-height:100vh;display:flex;background:#0b1020}.side{width:245px;flex-shrink:0;padding:24px 16px;background:#10172a;border-right:1px solid #25304a;display:flex;flex-direction:column;gap:10px}.brand{font-size:23px;font-weight:800;color:#b6a0ff;padding:4px 10px 28px}.brand small{display:block;font-size:10px;letter-spacing:5px;margin-top:5px}.muted{color:#92a0bc}.nav{width:100%;text-align:left;border:1px solid transparent;padding:12px;border-radius:10px;color:#aebbd4;background:transparent}.nav:hover,.nav.selected{color:white;background:#30245e;border-color:#59459a}.profile{margin-top:auto;border:1px solid #293653;background:#151f35;border-radius:12px;padding:15px;font-size:13px}.main{flex:1;min-width:0;padding:30px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:25px}.title{font-size:32px;margin:8px 0}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 15px;border-radius:10px;border:1px solid #354362;background:#18223b;color:white}.btn:disabled{opacity:.55;cursor:not-allowed}.primary{background:#7958ed;border-color:#7958ed;font-weight:700}.panel{border:1px solid #283653;background:#111a30;border-radius:15px;padding:20px;margin-bottom:20px}.hero{padding:30px;background:linear-gradient(120deg,#241b50,#111a30 75%)}.hero h2{font-size:clamp(27px,4vw,43px);margin:12px 0}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.stat{padding:20px;border:1px solid #283653;border-radius:14px;background:#111a30}.stat strong{display:block;font-size:27px;margin-top:12px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.server{border:1px solid #2b3855;background:#121c32;border-radius:14px;padding:18px;min-width:0}.serverhead{display:flex;justify-content:space-between;gap:12px}.tag{font-size:11px;border-radius:20px;padding:5px 9px;background:#273650;color:#d3dcf2;white-space:nowrap}.online{background:#164936;color:#8bf0bd}.offline{background:#3d2b39;color:#ffb8c8}.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.notice{border:1px solid #334163;border-radius:10px;padding:12px 14px;color:#bdc9e1;margin-bottom:20px;font-size:13px}.field{display:block;color:#bdc9e1;font-size:13px;margin:14px 0}.field input,.field select{display:block;width:100%;margin-top:7px;padding:12px;border-radius:9px;border:1px solid #34415f;background:#0b1224;color:white;outline:none}.check{display:flex;align-items:flex-start;gap:10px;color:#c3cde2;font-size:13px;margin:15px 0;line-height:1.5}.check input{accent-color:#8868f0;margin-top:3px}.modalbg{position:fixed;inset:0;background:#02040bd9;display:flex;align-items:center;justify-content:center;padding:18px;z-index:10}.modal{width:100%;max-width:520px;max-height:92vh;overflow-y:auto;padding:24px;border-radius:16px;background:#111a30;border:1px solid #394665;box-shadow:0 20px 80px #0008}.empty{padding:35px 15px;text-align:center;color:#9aa8c4}.footer{color:#7f8da9;font-size:12px;margin-top:26px}@media(max-width:850px){.side{width:190px;padding:18px 10px}.main{padding:20px}.stats{grid-template-columns:1fr}}@media(max-width:600px){.app{display:block}.side{width:100%;border-right:0;border-bottom:1px solid #25304a}.brand{padding-bottom:10px}.profile{margin-top:10px}.main{padding:15px}.grid{grid-template-columns:1fr}.title{font-size:26px}.hero{padding:22px}}
`;

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loadedJavaVersions, setLoadedJavaVersions] = useState<string[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);

  const bedrockVersions = ["26.52", "26.51", "26.50", "26.49", "26.45"];
  const javaVersions = loadedJavaVersions.length
    ? loadedJavaVersions
    : ["1.21.11", "1.21.10", "1.21.8", "1.20.4", "1.19.4"];

  const [page, setPage] = useState("Overview");
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("Java + Bedrock");
  const [software, setSoftware] = useState("Paper");
  const [version, setVersion] = useState("1.21.11");
  const [ram, setRam] = useState("2 GB");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [notice, setNotice] = useState("Connecting to Alhassan Hosting...");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [busyServerId, setBusyServerId] = useState<number | null>(null);

  const versions = platform === "Bedrock" ? bedrockVersions : javaVersions;

  const softwareOptions =
    platform === "Bedrock"
      ? ["Vanilla Bedrock"]
      : platform === "Java + Bedrock"
        ? ["Paper", "Purpur"]
        : ["Paper", "Purpur", "Fabric", "Vanilla"];

  async function readResponse(response: Response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
  }

  async function loadServers() {
    const response = await fetch("/api/servers", {
      credentials: "include"
    });

    const data: ServerInfo[] = await readResponse(response);
    setServers(data);
    return data;
  }

  // Restore the logged-in account after refreshing the page.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        });

        if (response.status === 401) {
          if (!cancelled) {
            setAccount(null);
            setNotice("Please log in to continue.");
          }
          return;
        }

        const user: Account = await readResponse(response);
        if (cancelled) return;

        setAccount(user);

        const serverResponse = await fetch("/api/servers", {
          credentials: "include"
        });

        const data: ServerInfo[] = await readResponse(serverResponse);
        if (cancelled) return;

        setServers(data);
        setNotice(`Welcome back, ${user.username}!`);
      } catch {
        if (!cancelled) {
          setNotice("Cannot connect to backend. Check that the API is running.");
        }
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load the available Java releases.
  useEffect(() => {
    let cancelled = false;

    async function fetchVersions() {
      try {
        const response = await fetch("/api/versions");
        const data = await readResponse(response);

        if (!cancelled && Array.isArray(data.java)) {
          setLoadedJavaVersions(data.java);
        }
      } catch {
        if (!cancelled) setLoadedJavaVersions([]);
      } finally {
        if (!cancelled) setVersionsLoading(false);
      }
    }

    void fetchVersions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function authenticate() {
    if (authLoading) return;

    setAuthLoading(true);

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      const data: Account = await readResponse(response);

      setAccount(data);
      setPassword("");
      setNotice(`Welcome, ${data.username}!`);

      const serverResponse = await fetch("/api/servers", {
        credentials: "include"
      });

      const serverData: ServerInfo[] = await readResponse(serverResponse);
      setServers(serverData);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch {
      // Clear the local view even if the server is temporarily unavailable.
    }

    setAccount(null);
    setServers([]);
    setPassword("");
    setAuthMode("login");
    setNotice("You have logged out.");
  }

  function changePlatform(value: Platform) {
    setPlatform(value);
    setSoftware(value === "Bedrock" ? "Vanilla Bedrock" : "Paper");
    setVersion(
      value === "Bedrock" ? bedrockVersions[0] : javaVersions[0]
    );
    setAutoUpdate(value !== "Java");
  }

  async function createServer() {
    if (!name.trim()) {
      setNotice("Please enter a server name first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          platform,
          software,
          version,
          ram,
          autoUpdateBedrock: platform !== "Java" && autoUpdate
        })
      });

      const result: ServerInfo = await readResponse(response);

      setServers(previous => [...previous, result]);
      setName("");
      setShowCreate(false);
      setPage("Servers");
      setNotice("Server created successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create server.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleServer(id: number) {
    if (busyServerId !== null) return;

    const server = servers.find(item => item.id === id);
    if (!server) return;

    setBusyServerId(id);
    setNotice(server.online ? "Stopping Minecraft server..." : "Starting Minecraft server...");

    try {
      const response = await fetch(`/api/servers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ online: !server.online })
      });

      const result: ServerInfo = await readResponse(response);

      setServers(previous =>
        previous.map(item => item.id === id ? result : item)
      );

      setNotice(
        result.online
          ? "Start request sent to the Minecraft server."
          : "Stop request sent to the Minecraft server."
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not control the server.");
    } finally {
      setBusyServerId(null);
    }
  }

  async function deleteServer(id: number) {
    try {
      const response = await fetch(`/api/servers/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      await readResponse(response);

      setServers(previous => previous.filter(item => item.id !== id));
      setNotice("Server record deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not delete server.");
    }
  }

  const totalRam = servers.reduce(
    (total, server) => total + (Number.parseInt(server.ram, 10) || 0),
    0
  );

  const navItems = [
    ["Overview", "◫"],
    ["Servers", "▣"],
    ["Backups", "▤"],
    ["Billing", "◇"],
    ["Settings", "⚙"]
  ];

  if (!sessionChecked) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#edf1ff", background: "#0b1020" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#b6a0ff" }}>Alhassan Hosting</h2>
            <p>Checking your session...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      {!account && (
        <div className="modalbg">
          <div className="modal">
            <h2>Alhassan Hosting</h2>
            <p className="muted">
              {authMode === "register" ? "Create your account" : "Welcome back"}
            </p>

            <form onSubmit={event => { event.preventDefault(); void authenticate(); }}>
              <label className="field">
                Username
                <input
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label className="field">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  required
                />
              </label>

              <div className="row">
                <button className="btn primary" type="submit" disabled={authLoading}>
                  {authLoading
                    ? "Please wait..."
                    : authMode === "register"
                      ? "Create account"
                      : "Log in"}
                </button>

                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "register" ? "login" : "register");
                    setNotice("");
                  }}
                >
                  {authMode === "register" ? "I already have an account" : "Create a new account"}
                </button>
              </div>
            </form>

            <p className="muted" style={{ fontSize: 12 }}>{notice}</p>
          </div>
        </div>
      )}

      <div className="app">
        <aside className="side">
          <div className="brand">
            ◈ Alhassan
            <small>HOSTING</small>
          </div>

          <div className="muted" style={{ padding: "0 12px", fontSize: 11 }}>
            WORKSPACE
          </div>

          {navItems.map(([label, symbol]) => (
            <button
              key={label}
              className={`nav ${page === label ? "selected" : ""}`}
              onClick={() => setPage(label)}
            >
              <span style={{ display: "inline-block", width: 27 }}>{symbol}</span>
              {label}
              {label === "Servers" && (
                <span style={{ float: "right" }}>{servers.length}</span>
              )}
            </button>
          ))}

          <div className="profile">
            <b>{account?.username || "Alhassan Hosting"}</b>
            <p className="muted">Free plan · Dashboard</p>
            <span style={{ color: "#b6a0ff" }}>◆ Build your world</span>

            {account && (
              <button className="btn" style={{ width: "100%", marginTop: 12 }} onClick={() => void logout()}>
                Log out
              </button>
            )}
          </div>
        </aside>

        <main className="main">
          <header className="top">
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                WORKSPACE / {page.toUpperCase()}
              </div>
              <h1 className="title">
                {page === "Overview" ? "Your server universe." : page}
              </h1>
              <div className="muted">
                Build, manage, and explore your Minecraft servers.
              </div>
            </div>

            <button className="btn primary" onClick={() => setShowCreate(true)}>
              ＋ Create server
            </button>
          </header>

          <div className="notice">◆ &nbsp;{notice}</div>

          {page === "Overview" && (
            <>
              <section className="panel hero">
                <div style={{ color: "#b6a0ff", fontSize: 12, fontWeight: 700 }}>
                  YOUR WORLD. YOUR RULES.
                </div>
                <h2>
                  Create something
                  <br />
                  <span style={{ color: "#b6a0ff" }}>legendary.</span>
                </h2>
                <p className="muted">Your Minecraft hosting dashboard starts here.</p>
                <button className="btn primary" onClick={() => setShowCreate(true)}>
                  ＋ Create your first server
                </button>
              </section>

              <section className="stats" style={{ marginBottom: 22 }}>
                <div className="stat">
                  <span className="muted">Total servers</span>
                  <strong>{servers.length}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>Your servers</span>
                </div>

                <div className="stat">
                  <span className="muted">Online servers</span>
                  <strong>{servers.filter(server => server.online).length}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>Reported by backend</span>
                </div>

                <div className="stat">
                  <span className="muted">RAM allocated</span>
                  <strong>{totalRam} GB</strong>
                  <span className="muted" style={{ fontSize: 12 }}>Selected server RAM</span>
                </div>
              </section>
            </>
          )}

          {(page === "Overview" || page === "Servers") && (
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <h2 style={{ fontSize: 20 }}>
                  {page === "Overview" ? "Your servers" : "All servers"}
                </h2>
                <button className="btn" onClick={() => setShowCreate(true)}>
                  ＋ Add server
                </button>
              </div>

              {servers.length === 0 ? (
                <div className="panel empty">
                  <div style={{ fontSize: 34 }}>▣</div>
                  <h3>No servers yet</h3>
                  <p>Create a server to see it here.</p>
                  <button className="btn primary" onClick={() => setShowCreate(true)}>
                    ＋ Create server
                  </button>
                </div>
              ) : (
                <div className="grid">
                  {servers.map(server => (
                    <article className="server" key={server.id}>
                      <div className="serverhead">
                        <div>
                          <div style={{ fontSize: 21, marginBottom: 8 }}>▣</div>
                          <h3 style={{ margin: "0 0 7px", overflowWrap: "anywhere" }}>
                            {server.name}
                          </h3>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {server.software} · {server.version}
                          </div>
                        </div>

                        <span className={`tag ${server.online ? "online" : "offline"}`}>
                          {server.online ? "Online" : "Offline"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20, fontSize: 13 }}>
                        <div>
                          <div className="muted">Platform</div>
                          <b>{server.platform}</b>
                        </div>
                        <div>
                          <div className="muted">Memory</div>
                          <b>{server.ram}</b>
                        </div>
                        <div>
                          <div className="muted">Address</div>
                          <b>Not allocated</b>
                        </div>
                        <div>
                          <div className="muted">Bedrock updates</div>
                          <b>{server.autoUpdateBedrock ? "Enabled" : "Disabled"}</b>
                        </div>
                      </div>

                      <div className="row">
                        <button
                          className="btn"
                          disabled={busyServerId !== null}
                          onClick={() => void toggleServer(server.id)}
                        >
                          {busyServerId === server.id
                            ? "Please wait..."
                            : server.online
                              ? "■ Stop"
                              : "▶ Start"}
                        </button>

                        <button
                          className="btn"
                          onClick={() => setNotice(`${server.name}: ${server.platform}, ${server.version}, ${server.ram}`)}
                        >
                          ⚙ Details
                        </button>

                        <button
                          className="btn"
                          disabled={busyServerId !== null}
                          onClick={() => void deleteServer(server.id)}
                          style={{ color: "#ff9aa9" }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {page === "Backups" && (
            <section className="panel">
              <h2>Backups</h2>
              <p className="muted">Backup management is not implemented yet.</p>
            </section>
          )}

          {page === "Billing" && (
            <section className="panel">
              <h2>Plans & billing</h2>
              <p className="muted">Payments and subscriptions are not connected.</p>
            </section>
          )}

          {page === "Settings" && (
            <section className="panel">
              <h2>Settings</h2>
              <p className="muted">Account settings are not implemented yet.</p>
              <button className="btn" onClick={() => setNotice("Settings saved for this preview.")}>
                Save settings
              </button>
            </section>
          )}

          <div className="footer">
            Alhassan Hosting · Backend-connected prototype · Server availability depends on the backend.
          </div>
        </main>
      </div>

      {showCreate && (
        <div
          className="modalbg"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setShowCreate(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "#b6a0ff", fontSize: 11, fontWeight: 700 }}>NEW INSTANCE</div>
                <h2 id="create-title" style={{ margin: "7px 0" }}>Create a server</h2>
                <div className="muted" style={{ fontSize: 13 }}>
                  Choose your game and server settings.
                </div>
              </div>
              <button className="btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <label className="field">
              Server name
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="My Survival Server"
                autoFocus
              />
            </label>

            <label className="field">
              Platform
              <select value={platform} onChange={event => changePlatform(event.target.value as Platform)}>
                <option>Java</option>
                <option>Bedrock</option>
                <option>Java + Bedrock</option>
              </select>
            </label>

            <label className="field">
              Server software
              <select value={software} onChange={event => setSoftware(event.target.value)}>
                {softwareOptions.map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Minecraft version
              <select value={version} onChange={event => setVersion(event.target.value)}>
                {versions.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="field">
              RAM allocation
              <select value={ram} onChange={event => setRam(event.target.value)}>
                {["1 GB", "2 GB", "3 GB", "4 GB", "5 GB", "6 GB", "8 GB", "10 GB", "12 GB", "16 GB"].map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            {platform !== "Java" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={autoUpdate}
                  onChange={event => setAutoUpdate(event.target.checked)}
                />
                <span>
                  <b>Automatic Bedrock updates</b>
                  <br />
                  Saves your preference; automatic updating is not implemented yet.
                </span>
              </label>
            )}

            {platform === "Java + Bedrock" && (
              <div className="notice">
                Cross-play requires Geyser and often Floodgate on the actual server.
              </div>
            )}

            {versionsLoading && (
              <p className="muted" style={{ fontSize: 12 }}>Loading Minecraft versions...</p>
            )}

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn primary" disabled={loading} onClick={() => void createServer()}>
                {loading ? "Creating..." : "Create server"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}