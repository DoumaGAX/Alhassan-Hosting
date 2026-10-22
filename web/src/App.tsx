import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Platform = "Java" | "Bedrock" | "Java + Bedrock";

type ServerInfo = {
  id: string;
  name: string;
  platform: Platform;
  software: string;
  version: string;
  ram: string;
  online: boolean;
  autoUpdateBedrock: boolean;
};

type Account = {
  id: string;
  username: string;
};

const css = `
*{box-sizing:border-box}
body{margin:0;background:#0b1020;color:#edf1ff;font-family:Inter,Arial,sans-serif}
button,input,select{font:inherit}button{cursor:pointer}
.app{min-height:100vh;display:flex;background:#0b1020}
.side{width:245px;flex-shrink:0;padding:24px 16px;background:#10172a;border-right:1px solid #25304a;display:flex;flex-direction:column;gap:10px}
.brand{font-size:23px;font-weight:800;color:#b6a0ff;padding:4px 10px 28px}
.brand small{display:block;font-size:10px;letter-spacing:5px;margin-top:5px}
.muted{color:#92a0bc}
.nav{width:100%;text-align:left;border:1px solid transparent;padding:12px;border-radius:10px;color:#aebbd4;background:transparent}
.nav:hover,.nav.selected{color:white;background:#30245e;border-color:#59459a}
.profile{margin-top:auto;border:1px solid #293653;background:#151f35;border-radius:12px;padding:15px;font-size:13px}
.main{flex:1;min-width:0;padding:30px}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:25px}
.title{font-size:32px;margin:8px 0}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 15px;border-radius:10px;border:1px solid #354362;background:#18223b;color:white}
.btn:disabled{opacity:.55;cursor:not-allowed}
.primary{background:#7958ed;border-color:#7958ed;font-weight:700}
.panel{border:1px solid #283653;background:#111a30;border-radius:15px;padding:20px;margin-bottom:20px}
.hero{padding:30px;background:linear-gradient(120deg,#241b50,#111a30 75%)}
.hero h2{font-size:clamp(27px,4vw,43px);margin:12px 0}
.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
.stat{padding:20px;border:1px solid #283653;border-radius:14px;background:#111a30}
.stat strong{display:block;font-size:27px;margin-top:12px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.server{border:1px solid #2b3855;background:#121c32;border-radius:14px;padding:18px;min-width:0}
.serverhead{display:flex;justify-content:space-between;gap:12px}
.tag{font-size:11px;border-radius:20px;padding:5px 9px;background:#273650;color:#d3dcf2;white-space:nowrap}
.online{background:#164936;color:#8bf0bd}.offline{background:#3d2b39;color:#ffb8c8}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.notice{border:1px solid #334163;border-radius:10px;padding:12px 14px;color:#bdc9e1;margin-bottom:20px;font-size:13px;overflow-wrap:anywhere}
.field{display:block;color:#bdc9e1;font-size:13px;margin:14px 0}
.field input,.field select{display:block;width:100%;margin-top:7px;padding:12px;border-radius:9px;border:1px solid #34415f;background:#0b1224;color:white;outline:none}
.check{display:flex;align-items:flex-start;gap:10px;color:#c3cde2;font-size:13px;margin:15px 0;line-height:1.5}
.check input{accent-color:#8868f0;margin-top:3px}
.modalbg{position:fixed;inset:0;background:#02040bd9;display:flex;align-items:center;justify-content:center;padding:18px;z-index:10}
.modal{width:100%;max-width:520px;max-height:92vh;overflow-y:auto;padding:24px;border-radius:16px;background:#111a30;border:1px solid #394665;box-shadow:0 20px 80px #0008}
.empty{padding:35px 15px;text-align:center;color:#9aa8c4}
.footer{color:#7f8da9;font-size:12px;margin-top:26px}
@media(max-width:850px){.side{width:190px;padding:18px 10px}.main{padding:20px}.stats{grid-template-columns:1fr}}
@media(max-width:600px){.app{display:block}.side{width:100%;border-right:0;border-bottom:1px solid #25304a}.brand{padding-bottom:10px}.profile{margin-top:10px}.main{padding:15px}.grid{grid-template-columns:1fr}.title{font-size:26px}.hero{padding:22px}}
`;

const javaFallback = ["1.21.11", "1.21.10", "1.21.8", "1.20.4", "1.19.4"];
const bedrockVersions = ["26.52", "26.51", "26.50", "26.49", "26.45"];

function mapServer(row: any): ServerInfo {
  return {
    id: String(row.id),
    name: row.name,
    platform: row.platform,
    software: row.software,
    version: row.version,
    ram: `${row.ram_gb} GB`,
    online: false,
    autoUpdateBedrock: Boolean(row.auto_update_bedrock),
  };
}

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loadedJavaVersions, setLoadedJavaVersions] = useState<string[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const javaVersions = loadedJavaVersions.length ? loadedJavaVersions : javaFallback;

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
  const [busyServerId, setBusyServerId] = useState<string | null>(null);

  const versions = platform === "Bedrock" ? bedrockVersions : javaVersions;

  const softwareOptions =
    platform === "Bedrock"
      ? ["Vanilla Bedrock"]
      : platform === "Java + Bedrock"
        ? ["Paper", "Purpur"]
        : ["Paper", "Purpur", "Fabric", "Vanilla"];

  async function loadServers() {
    const { data, error } = await supabase
      .from("minecraft_servers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setServers((data ?? []).map(mapServer));
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (cancelled) return;

        const user = data.session?.user;

        if (!user) {
          setAccount(null);
          setNotice("Please log in or create an account.");
          return;
        }

        setAccount({
          id: user.id,
          username: user.user_metadata?.username || user.email || "Player",
        });

        await loadServers();
        if (!cancelled) setNotice("Welcome back!");
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "Could not connect to Supabase.");
        }
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    }

    void restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      // Session is restored on initial load; login/register handle their own UI.
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchVersions() {
      try {
        const response = await fetch("/api/versions");
        if (!response.ok) throw new Error("Versions API unavailable");
        const data = await response.json();

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
    return () => { cancelled = true; };
  }, []);

  async function authenticate() {
    if (authLoading) return;

    if (!email.trim() || !password) {
      setNotice("Enter your email and password.");
      return;
    }

    if (authMode === "register" && !username.trim()) {
      setNotice("Enter a username.");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim() },
          },
        });

        if (error) throw error;

        if (!data.session) {
          setPassword("");
          setNotice("Account created! Check your email to confirm your account, then log in.");
          setAuthMode("login");
          return;
        }

        const user = data.user;
        if (!user) throw new Error("Account created, but user information was not returned.");

        setAccount({
          id: user.id,
          username: user.user_metadata?.username || username.trim(),
        });
        setNotice("Account created successfully!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Could not load your account.");

        setAccount({
          id: data.user.id,
          username: data.user.user_metadata?.username || data.user.email || "Player",
        });
        setNotice("Welcome back!");
      }

      setPassword("");
      await loadServers();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setNotice(error.message);
      return;
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
    setVersion(value === "Bedrock" ? bedrockVersions[0] : javaVersions[0]);
    setAutoUpdate(value !== "Java");
  }

  async function createServer() {
    if (!account) {
      setNotice("Log in before creating a server.");
      return;
    }

    if (!name.trim()) {
      setNotice("Please enter a server name first.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("minecraft_servers")
        .insert({
          user_id: account.id,
          name: name.trim(),
          platform,
          software,
          version,
          ram_gb: Number.parseInt(ram, 10),
          auto_update_bedrock: platform !== "Java" && autoUpdate,
        })
        .select("*")
        .single();

      if (error) throw error;

      setServers(previous => [...previous, mapServer(data)]);
      setName("");
      setShowCreate(false);
      setPage("Servers");
      setNotice("Server settings saved in Supabase. Minecraft has not been started.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create server.");
    } finally {
      setLoading(false);
    }
  }

  function toggleServer(id: string) {
    const server = servers.find(item => item.id === id);
    if (!server) return;

    setServers(previous =>
      previous.map(item => item.id === id ? { ...item, online: !item.online } : item)
    );

    setNotice("Preview only: this changes the displayed status, not a real Minecraft server.");
  }

  async function deleteServer(id: string) {
    if (busyServerId !== null) return;
    setBusyServerId(id);

    try {
      const { error } = await supabase
        .from("minecraft_servers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setServers(previous => previous.filter(item => item.id !== id));
      setNotice("Server record deleted from Supabase.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not delete server.");
    } finally {
      setBusyServerId(null);
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
    ["Settings", "⚙"],
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
            <p className="muted">{authMode === "register" ? "Create your account" : "Welcome back"}</p>

            <form onSubmit={event => { event.preventDefault(); void authenticate(); }}>
              {authMode === "register" && (
                <label className="field">
                  Username
                  <input
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>
              )}

              <label className="field">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
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
                  minLength={6}
                  required
                />
              </label>

              <div className="row">
                <button className="btn primary" type="submit" disabled={authLoading}>
                  {authLoading ? "Please wait..." : authMode === "register" ? "Create account" : "Log in"}
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
          <div className="brand">◈ Alhassan<small>HOSTING</small></div>
          <div className="muted" style={{ padding: "0 12px", fontSize: 11 }}>WORKSPACE</div>

          {navItems.map(([label, symbol]) => (
            <button key={label} className={`nav ${page === label ? "selected" : ""}`} onClick={() => setPage(label)}>
              <span style={{ display: "inline-block", width: 27 }}>{symbol}</span>
              {label}
              {label === "Servers" && <span style={{ float: "right" }}>{servers.length}</span>}
            </button>
          ))}

          <div className="profile">
            <b>{account?.username || "Alhassan Hosting"}</b>
            <p className="muted">Free plan · Dashboard</p>
            <span style={{ color: "#b6a0ff" }}>◆ Build your world</span>
            {account && <button className="btn" style={{ width: "100%", marginTop: 12 }} onClick={() => void logout()}>Log out</button>}
          </div>
        </aside>

        <main className="main">
          <header className="top">
            <div>
              <div className="muted" style={{ fontSize: 12 }}>WORKSPACE / {page.toUpperCase()}</div>
              <h1 className="title">{page === "Overview" ? "Your server universe." : page}</h1>
              <div className="muted">Build, manage, and explore your Minecraft servers.</div>
            </div>
            <button className="btn primary" disabled={!account} onClick={() => setShowCreate(true)}>＋ Create server</button>
          </header>

          <div className="notice">◆ &nbsp;{notice}</div>

          {page === "Overview" && (
            <>
              <section className="panel hero">
                <div style={{ color: "#b6a0ff", fontSize: 12, fontWeight: 700 }}>YOUR WORLD. YOUR RULES.</div>
                <h2>Create something<br /><span style={{ color: "#b6a0ff" }}>legendary.</span></h2>
                <p className="muted">Your Minecraft hosting dashboard starts here.</p>
                <button className="btn primary" disabled={!account} onClick={() => setShowCreate(true)}>＋ Create your first server</button>
              </section>

              <section className="stats" style={{ marginBottom: 22 }}>
                <div className="stat"><span className="muted">Total servers</span><strong>{servers.length}</strong><span className="muted" style={{ fontSize: 12 }}>Your servers</span></div>
                <div className="stat"><span className="muted">Online servers</span><strong>{servers.filter(server => server.online).length}</strong><span className="muted" style={{ fontSize: 12 }}>Preview status only</span></div>
                <div className="stat"><span className="muted">RAM allocated</span><strong>{totalRam} GB</strong><span className="muted" style={{ fontSize: 12 }}>Selected server RAM</span></div>
              </section>
            </>
          )}

          {(page === "Overview" || page === "Servers") && (
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <h2 style={{ fontSize: 20 }}>{page === "Overview" ? "Your servers" : "All servers"}</h2>
                <button className="btn primary" disabled={!account} onClick={() => setShowCreate(true)}>＋ Add server</button>
              </div>

              {servers.length === 0 ? (
                <div className="panel empty">
                  <div style={{ fontSize: 34 }}>▣</div>
                  <h3>No servers yet</h3>
                  <p>Create a server to see it here.</p>
                  <button className="btn primary" disabled={!account} onClick={() => setShowCreate(true)}>＋ Create server</button>
                </div>
              ) : (
                <div className="grid">
                  {servers.map(server => (
                    <article className="server" key={server.id}>
                      <div className="serverhead">
                        <div>
                          <div style={{ fontSize: 21, marginBottom: 8 }}>▣</div>
                          <h3 style={{ margin: "0 0 7px", overflowWrap: "anywhere" }}>{server.name}</h3>
                          <div className="muted" style={{ fontSize: 12 }}>{server.software} · {server.version}</div>
                        </div>
                        <span className={`tag ${server.online ? "online" : "offline"}`}>{server.online ? "Online (Preview)" : "Offline"}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20, fontSize: 13 }}>
                        <div><div className="muted">Platform</div><b>{server.platform}</b></div>
                        <div><div className="muted">Memory</div><b>{server.ram}</b></div>
                        <div><div className="muted">Address</div><b>Not allocated</b></div>
                        <div><div className="muted">Bedrock updates</div><b>{server.autoUpdateBedrock ? "Enabled" : "Disabled"}</b></div>
                      </div>

                      <div className="row">
                        <button className="btn" onClick={() => toggleServer(server.id)}>{server.online ? "■ Stop (Preview)" : "▶ Start (Preview)"}</button>
                        <button className="btn" onClick={() => setNotice(`${server.name}: ${server.platform}, ${server.version}, ${server.ram}`)}>⚙ Details</button>
                        <button className="btn" disabled={busyServerId !== null} onClick={() => void deleteServer(server.id)} style={{ color: "#ff9aa9" }}>{busyServerId === server.id ? "Deleting..." : "✕ Delete"}</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {page === "Backups" && <section className="panel"><h2>Backups</h2><p className="muted">Backup management is not implemented yet.</p></section>}
          {page === "Billing" && <section className="panel"><h2>Plans & billing</h2><p className="muted">Payments and subscriptions are not connected.</p></section>}
          {page === "Settings" && <section className="panel"><h2>Settings</h2><p className="muted">Account settings are not implemented yet.</p><button className="btn" onClick={() => setNotice("Settings saved for this preview.")}>Save settings</button></section>}

          <div className="footer">Alhassan Hosting · Supabase-connected prototype · Real Minecraft hosting requires a server runtime.</div>
        </main>
      </div>

      {showCreate && (
        <div className="modalbg" onMouseDown={event => { if (event.target === event.currentTarget) setShowCreate(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "#b6a0ff", fontSize: 11, fontWeight: 700 }}>NEW INSTANCE</div>
                <h2 id="create-title" style={{ margin: "7px 0" }}>Create a server</h2>
                <div className="muted" style={{ fontSize: 13 }}>Choose your game and server settings.</div>
              </div>
              <button className="btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <label className="field">Server name
              <input value={name} onChange={event => setName(event.target.value)} placeholder="My Survival Server" autoFocus />
            </label>

            <label className="field">Platform
              <select value={platform} onChange={event => changePlatform(event.target.value as Platform)}>
                <option>Java</option><option>Bedrock</option><option>Java + Bedrock</option>
              </select>
            </label>

            <label className="field">Server software
              <select value={software} onChange={event => setSoftware(event.target.value)}>
                {softwareOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>

            <label className="field">Minecraft version
              <select value={version} onChange={event => setVersion(event.target.value)}>
                {versions.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="field">RAM allocation
              <select value={ram} onChange={event => setRam(event.target.value)}>
                {["1 GB", "2 GB", "3 GB", "4 GB", "5 GB", "6 GB", "8 GB", "10 GB"].map(item => <option key={item}>{item}</option>)}
              </select>
            </label>

            {platform !== "Java" && (
              <label className="check">
                <input type="checkbox" checked={autoUpdate} onChange={event => setAutoUpdate(event.target.checked)} />
                <span><b>Automatic Bedrock updates</b><br />Saves your preference. Actual automatic updating is not implemented yet.</span>
              </label>
            )}

            {platform === "Java + Bedrock" && <div className="notice">Cross-play requires Geyser and often Floodgate on the actual server.</div>}
            {versionsLoading && <p className="muted" style={{ fontSize: 12 }}>Loading Minecraft versions...</p>}

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn primary" disabled={loading} onClick={() => void createServer()}>{loading ? "Creating..." : "Create server"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}