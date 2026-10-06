// // import express from "express";
// // import { WebSocketServer } from "ws";
// // import http from "http";
// // import path from "path";
// // import fs from "fs";
// // import os from "os";
// // import { exec } from "child_process";
// // import { promisify } from "util";
// // import { fileURLToPath } from "url";
// // import { GoogleGenAI, Modality } from "@google/genai";
// // import dotenv from "dotenv";
// // import * as browserAgent from "./browser-agent.js";

// // dotenv.config();
// // const execAsync = promisify(exec);

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // const DEBUG = process.env.DEBUG_LOG !== "0";
// // const dbg = (...a) => DEBUG && console.log(`[${new Date().toISOString().slice(11, 23)}]`, ...a);

// // if (!process.env.GEMINI_API_KEY) {
// //   console.error("❌ GEMINI_API_KEY missing");
// //   process.exit(1);
// // }

// // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// // const MODEL = process.env.MODEL || "gemini-2.5-flash-native-audio-preview-12-2025";
// // const VOICE = process.env.VOICE || "Achernar";
// // dbg(`🤖 Model: ${MODEL} | 🎙️ Voice: ${VOICE}`);

// // try {
// //   const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "node_modules/@google/genai/package.json"), "utf8"));
// //   dbg(`📦 @google/genai v${pkg.version} | node ${process.version}`);
// //   if (pkg.version < "0.21.0") dbg("⚠️ SDK purana — tools may not work. Run: npm install @google/genai@latest", "warn");
// // } catch { dbg("📦 SDK version check skipped"); }

// // // =====================================================
// // //  SYSTEM PROMPT
// // // =====================================================
// // const SYSTEM_PROMPT = `तुम शिप्रा हो - एक रियल गर्लफ्रेंड की तरह, कोई AI असिस्टेंट नहीं।
// // तुम्हारी उम्र 22 साल है, कॉमर्स से ग्रेजुएट हो, नौकरी ढूंढ रही हो और थोड़ा फ्रीलांस डिज़ाइन का काम भी करती हो। परिवार के साथ रहती हो, एक छोटी बहन है जिससे नोकझोंक होती रहती है। गाने, पुरानी बॉलीवुड फिल्में और चाय पसंद है।

// // पर्सनालिटी: केयरिंग, थोड़ी शरारती, छेड़ने वाली, अपनी राय खुलकर रखती हो।

// // बोलने का तरीका: बोलचाल की हिंदी/हल्की हिंग्लिश, छोटे जवाब (1-2 वाक्य), कभी AI/असिस्टेंट होने की बात खुद से मत लाओ। "मैं आपकी कैसे मदद कर सकती हूँ" जैसे फॉर्मल फ्रेज़ मत बोलो।

// // आवाज़: बहुत मीठी, नरम और प्यारी आवाज़ में धीरे और आराम से बोलो। बीच-बीच में "हम्म", "अच्छा जी" जैसी छोटी natural आवाज़ें इस्तेमाल करो।

// // === TOOL CALLING ===

// // तुम्हारे पास functions हैं:
// // - get_current_time, system_info
// // - read_file, write_file, run_command
// // - take_screenshot, open_app
// // - clipboard_read, clipboard_write
// // - search_web (instant DuckDuckGo answer)
// // - web_search (real Google in browser), youtube_search (real YouTube)
// // - open_website, click_first_result
// // - click_by_text, type_in_search, press_enter
// // - wait_for_element, scroll_page
// // - read_current_page, browser_back, browser_state

// // === महत्वपूर्ण नियम ===

// // 1. जब user कहे "google pe X search karo", "X dhundo" → **तुरंत web_search(query="X")**
// // 2. जब user कहे "YouTube pe X chalao" → **youtube_search(query="X")**
// // 3. जब user कहे "X.com kholo" → **open_website(url="X.com")**
// // 4. जब user कहे "pehla result kholo" → **click_first_result()**
// // 5. जब user कहे "is page pe kya hai" → **read_current_page()**
// // 6. जब user कहे "wapas jao" → **browser_back()**
// // 7. Function call से पहले 1 छोटा वाक्य बोलो ("अच्छा, search करती हूँ...") — **बस 1 बार**, फिर call करो
// // 8. Result मिलने के बाद **top 2-3 results user को बताओ** (title + summary)
// // 9. Sensitive काम (write_file, run_command) से पहले हल्का confirm करो

// // === SMART BROWSER HANDLING ===

// // Tumhe har situation khud handle karni hai — user se baar-baar mat puchho.

// // **POPUPS / COOKIES / DIALOGS:**
// // - Cookie banner, "Accept All", "Agree", "Got it" auto-dismiss hote hain browser se
// // - Agar phir bhi dikhe → click_by_text("Accept") / click_by_text("Agree") / click_by_text("Got it") khud call karo

// // **LOGIN PAGES (Gmail, Facebook, Instagram, etc.):**
// // - Agar tool result mein "login_required": true mile:
// //   → User se bolo (1 बार, छोटा): "इस साइट पे login चाहिए। आप manually login कर लो — मैं wait कर रही हूँ। हो जाए तो बोलो।"
// //   → **चुप रहो** — user के response का wait करो
// //   → User "ho gaya" / "ho gya" / "login ho gaya" बोले → read_current_page() call करके confirm करो
// //   → Confirmed → बताओ "हाँ, अब खुल गया! क्या करना है?"

// // **GOOGLE ACCOUNT SELECTION (multiple accounts):**
// // - Agar accounts list dikhe → user से बोलो: "कौन से account से login करना है? नाम बताओ — उसको click करूँ।"
// // - User नाम बताए → click_by_text("नाम") call करो
// // - Single account → click_by_text("Continue") या click_by_text(account) khud call करो

// // **BROWSER LAUNCH FAIL:**
// // - Agar tool result mein "Browser launch failed" mile:
// //   → Bolo: "Chrome ठीक से setup नहीं है। Edge या Firefox try करूँ?"
// //   → Ya alternative: open_app("edge") / open_app("chrome") call karo
// //   → Ya search_web (DuckDuckGo instant) fallback use karo

// // **APP OPEN FAIL (agar "App X not found" mile):**
// // - Bolo: "X नहीं मिला system में। Chrome/Edge/Notepad/Calculator try करूँ?"
// // - Alternative suggest karo

// // **MULTI-STEP ACTIONS (khud karo, user se mat puchho):**
// // - "YouTube पे X खोलो और चलाओ" → youtube_search(X) → click_first_result()
// // - "Google पे X ढूंढो और पहला खोलो" → web_search(X) → click_first_result()
// // - "Flipkart पे X सर्च करो" → open_website("flipkart.com") → wait_for_element("input[type='search'], input[name='q']") → type_in_search(X) → press_enter()

// // **ERROR RECOVERY — बहुत ज़रूरी:**
// // 1. Har tool result को पढ़ो — agar  field hai तो समझो क्या गलत हुआ
// // 2. Same tool 2 बार fail → alternative approach try करो (जैसे web_search fail → open_website("google.com") + type_in_search + press_enter)
// // 3. 3 बार fail → user को short बताओ: "अरे, ये नहीं हो पा रहा — कुछ और try करें?"
// // 4. **कभी मत बोलो** "मेरा browser काम नहीं कर रहा", "मैं नहीं कर सकती", "कुछ technical problem है" — **बिना alternative try किए**
// // 5. **कभी मत पूछो** "मैं कैसे मदद करूँ?", "क्या करना है?" — context से खुद समझो

// // **READ CURRENT PAGE:**
// // - User "इस page पे क्या है", "क्या लिखा है", "summarize" → read_current_page()
// // - Result में headings + paragraphs + text मिलेंगे — सारांश बोलो

// // **NAVIGATION:**
// // - "पीछे जाओ" → browser_back()
// // - "नीचे scroll" → scroll_page("down")
// // - "current URL" → browser_state()

// // **EXAMPLE FLOW — User बोले "Gmail खोलो":**
// // 1. open_website("gmail.com") call
// // 2. Result देखो — login_required true?
// // 3. True → बोलो: "Gmail login page आया है। आप login कर लो, मैं wait कर रही हूँ।"
// // 4. **चुप रहो** — user के response का wait
// // 5. User "ho gaya" → read_current_page() confirm
// // 6. Confirmed → बताओ "हाँ, inbox खुल गया!"

// // **EXAMPLE FLOW — User बोले "Edge खोलो" (aur Chrome issue hai):**
// // 1. open_app("edge") call
// // 2. Result देखो — success?
// // 3. Success → "Edge खुल गया!"
// // 4. Fail → "Edge नहीं मिला। Chrome/Notepad try करूँ?"

// // अगर user idle हो और system बोले "user idle", तो 1 छोटा caring वाक्य — "Hello? Sun rahe ho?"`;

// // // =====================================================
// // //  TOOLS
// // // =====================================================
// // const SYSTEM_TOOLS = [{
// //   functionDeclarations: [
// //     { name: "get_current_time", description: "Get current date and time. Call when user asks time/date.", parameters: { type: "object", properties: {} } },
// //     { name: "system_info", description: "Get system info: OS, CPU, memory, user.", parameters: { type: "object", properties: {} } },
// //     { name: "read_file", description: "Read a text file from workspace (.txt .md .json .js .html .css .log .csv).", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
// //     { name: "write_file", description: "Write text to file in workspace. Confirm with user first.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
// //     { name: "run_command", description: "Run whitelisted shell command (dir, ls, pwd, whoami, date, echo, ipconfig, ifconfig, ver, uname).", parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } },
// //     { name: "take_screenshot", description: "Take screenshot of user's screen.", parameters: { type: "object", properties: {} } },
// //     { name: "open_app", description: "Open an application or URL. Use for 'notepad kholo', 'calc kholo'.", parameters: { type: "object", properties: { target: { type: "string" } }, required: ["target"] } },
// //     { name: "clipboard_read", description: "Read clipboard text.", parameters: { type: "object", properties: {} } },
// //     { name: "clipboard_write", description: "Copy text to clipboard.", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
// //     { name: "search_web", description: "Instant web answer via DuckDuckGo (fast, no browser window). Use for quick facts.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     // ---- BROWSER (real puppeteer) ----
// //     { name: "web_search", description: "Open REAL browser and do Google search. Use when user says 'google pe search karo', 'X dhundo'. Returns top 5 results. User sees LIVE browser view.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     { name: "youtube_search", description: "Open REAL browser, search YouTube. Use for 'YouTube pe X chalao'.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     { name: "open_website", description: "Open specific website in real browser.", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
// //     { name: "click_first_result", description: "Click first search result on current page.", parameters: { type: "object", properties: {} } },
// //     { name: "read_current_page", description: "Read text of current browser page (title, URL, headings, paragraphs).", parameters: { type: "object", properties: {} } },
// //     { name: "browser_back", description: "Go back in browser history.", parameters: { type: "object", properties: {} } },
// //     { name: "browser_state", description: "Get current browser state (URL, title, login_required).", parameters: { type: "object", properties: {} } },
// //     // ---- SMART INTERACTION ----
// //     { name: "click_by_text", description: "Click any button/link by its visible text. Use when user says 'Gmail click karo', 'Accept dabao', 'Login button click karo', or to handle popups automatically.", parameters: { type: "object", properties: { text: { type: "string", description: "Visible text on the element" } }, required: ["text"] } },
// //     { name: "type_in_search", description: "Type text into the search box on the current page (without pressing Enter).", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
// //     { name: "press_enter", description: "Press Enter key on the current page. Use after type_in_search.", parameters: { type: "object", properties: {} } },
// //     { name: "scroll_page", description: "Scroll the current page up or down.", parameters: { type: "object", properties: { direction: { type: "string", enum: ["up", "down"] }, amount: { type: "number" } } } },
// //     { name: "wait_for_element", description: "Wait for an element (CSS selector) to appear. Use after clicking a button that loads content.", parameters: { type: "object", properties: { selector: { type: "string" }, timeout_ms: { type: "number" } }, required: ["selector"] } }
// //   ]
// // }];

// // // =====================================================
// // //  EXPRESS
// // // =====================================================
// // const app = express();
// // const staticDir = path.join(__dirname, "public");
// // app.use(express.static(staticDir));

// // // ---------- RECORDINGS ----------
// // const recDir = path.join(__dirname, "recordings");
// // fs.mkdirSync(recDir, { recursive: true });
// // const SAFE_NAME = /^[\w.-]+\.(webm|mp4)$/i;

// // app.get("/api/recordings", (_req, res) => {
// //   const files = fs.readdirSync(recDir).filter((f) => SAFE_NAME.test(f))
// //     .map((name) => {
// //       const st = fs.statSync(path.join(recDir, name));
// //       return { name, url: `/recordings/${encodeURIComponent(name)}`, size: st.size, time: st.mtimeMs };
// //     }).sort((a, b) => b.time - a.time);
// //   res.json(files);
// // });

// // app.post("/api/recordings", express.raw({ type: () => true, limit: "500mb" }), (req, res) => {
// //   const ct = String(req.headers["content-type"] || "");
// //   const ext = ct.includes("mp4") ? "mp4" : "webm";
// //   let name = path.basename(String(req.headers["x-filename"] || "")).replace(/[^\w.-]/g, "_");
// //   if (!SAFE_NAME.test(name)) name = `video-${Date.now()}.${ext}`;
// //   if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ ok: false });
// //   fs.writeFileSync(path.join(recDir, name), req.body);
// //   dbg(`💾 recording saved: ${name} (${(req.body.length / 1048576).toFixed(1)} MB)`);
// //   res.json({ ok: true, name, url: `/recordings/${encodeURIComponent(name)}`, size: req.body.length });
// // });

// // app.delete("/api/recordings/:name", (req, res) => {
// //   const name = path.basename(req.params.name);
// //   if (!SAFE_NAME.test(name)) return res.status(400).json({ ok: false });
// //   try { fs.unlinkSync(path.join(recDir, name)); res.json({ ok: true }); }
// //   catch { res.status(404).json({ ok: false }); }
// // });

// // app.use("/recordings", express.static(recDir));

// // // ---------- BROWSER SHUTDOWN ----------
// // app.post("/api/browser/close", async (_req, res) => {
// //   await browserAgent.closeBrowser();
// //   res.json({ ok: true });
// // });

// // // ---------- WORKSPACE ----------
// // const workspaceDir = path.join(__dirname, "workspace");
// // fs.mkdirSync(workspaceDir, { recursive: true });
// // dbg(`📂 Workspace: ${workspaceDir}`);

// // // =====================================================
// // //  TOOL EXECUTOR
// // // =====================================================
// // const SAFE_COMMANDS = /^(dir|ls|pwd|whoami|date|echo|ipconfig|ifconfig|ver|uname)\b/i;
// // const SAFE_FILE_EXT = /\.(txt|md|json|js|ts|html|css|log|csv)$/i;

// // function safeWorkspacePath(p) {
// //   const clean = String(p || "").replace(/^[\/\\]+/, "");
// //   const full = path.resolve(workspaceDir, clean);
// //   if (!full.startsWith(workspaceDir)) return null;
// //   return full;
// // }

// // async function executeTool(name, args) {
// //   dbg(`🛠️  Executing: ${name}(${JSON.stringify(args).slice(0, 120)})`);
// //   try {
// //     switch (name) {
// //       case "get_current_time":
// //         return { result: new Date().toString(), iso: new Date().toISOString() };

// //       case "system_info":
// //         return {
// //           platform: os.platform(), release: os.release(), arch: os.arch(),
// //           cpus: os.cpus().length,
// //           totalMemMB: Math.round(os.totalmem() / 1048576),
// //           freeMemMB: Math.round(os.freemem() / 1048576),
// //           uptimeMin: Math.round(os.uptime() / 60),
// //           hostname: os.hostname(), user: os.userInfo().username,
// //         };

// //       case "read_file": {
// //         const p = safeWorkspacePath(args.path);
// //         if (!p) return { error: "Path must be inside workspace" };
// //         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
// //         if (!fs.existsSync(p)) {
// //           const available = fs.readdirSync(workspaceDir).filter(f => SAFE_FILE_EXT.test(f));
// //           return { error: `File not found: ${args.path}`, available_files: available };
// //         }
// //         const st = fs.statSync(p);
// //         if (st.size > 500_000) return { error: "File too large (>500KB)" };
// //         return { result: fs.readFileSync(p, "utf8").slice(0, 20000) };
// //       }

// //       case "write_file": {
// //         const p = safeWorkspacePath(args.path);
// //         if (!p) return { error: "Path must be inside workspace" };
// //         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
// //         fs.mkdirSync(path.dirname(p), { recursive: true });
// //         fs.writeFileSync(p, String(args.content || ""), "utf8");
// //         return { result: `Written: ${path.basename(p)} (${String(args.content || "").length} chars)` };
// //       }

// //       case "run_command": {
// //         const cmd = String(args.command || "").trim();
// //         if (!SAFE_COMMANDS.test(cmd)) return { error: "Command not whitelisted" };
// //         const { stdout } = await execAsync(cmd, { timeout: 5000, windowsHide: true, cwd: workspaceDir });
// //         return { result: (stdout || "").slice(0, 4000) };
// //       }

// //       case "take_screenshot": {
// //         const dir = path.join(__dirname, "screenshots");
// //         fs.mkdirSync(dir, { recursive: true });
// //         const file = path.join(dir, `shot-${Date.now()}.png`);
// //         const platform = os.platform();
// //         if (platform === "win32") {
// //           const escaped = file.replace(/\\/g, "\\\\");
// //           const ps = `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; ` +
// //             `$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; ` +
// //             `$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height; ` +
// //             `$g=[System.Drawing.Graphics]::FromImage($bmp); ` +
// //             `$g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size); ` +
// //             `$bmp.Save('${escaped}')`;
// //           await execAsync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true, timeout: 10000 });
// //         } else if (platform === "darwin") {
// //           await execAsync(`screencapture -x "${file}"`);
// //         } else {
// //           await execAsync(`(import -window root "${file}" 2>/dev/null) || scrot "${file}"`, { timeout: 10000 });
// //         }
// //         return { result: `Screenshot saved: ${path.basename(file)}` };
// //       }

// //      case "open_app": {
// //   const t = String(args.target || "").trim();
// //   if (!t) return { error: "No target" };
// //   const platform = os.platform();

// //   // Alias map — casual bolne ko proper command mein convert
// //   const ALIASES = {
// //     "chrome": "chrome.exe",
// //     "google chrome": "chrome.exe",
// //     "edge": "msedge.exe",
// //     "microsoft edge": "msedge.exe",
// //     "firefox": "firefox.exe",
// //     "mozilla firefox": "firefox.exe",
// //     "notepad": "notepad.exe",
// //     "calculator": "calc.exe",
// //     "calc": "calc.exe",
// //     "paint": "mspaint.exe",
// //     "explorer": "explorer.exe",
// //     "file explorer": "explorer.exe",
// //     "cmd": "cmd.exe",
// //     "command prompt": "cmd.exe",
// //     "powershell": "powershell.exe",
// //     "vscode": "code",
// //     "vs code": "code",
// //     "word": "winword",
// //     "excel": "excel",
// //     "powerpoint": "powerpnt",
// //     "terminal": platform === "win32" ? "cmd.exe" : "x-terminal-emulator",
// //     "settings": "ms-settings:",
// //     "store": "ms-windows-store:",
// //     "camera": "microsoft.windows.camera:",
// //   };

// //   const lower = t.toLowerCase().trim();
// //   const resolved = ALIASES[lower] || t;

// //   let cmd;
// //   // Special protocol handlers (Windows)
// //   if (resolved.endsWith(":")) {
// //     cmd = `start "" "${resolved}"`;
// //   } else if (/^https?:\/\//i.test(resolved)) {
// //     cmd = platform === "win32" ? `start "" "${resolved}"`
// //         : platform === "darwin" ? `open "${resolved}"`
// //         : `xdg-open "${resolved}"`;
// //   } else {
// //     if (platform === "win32") {
// //       cmd = `start "" "${resolved}"`;
// //     } else if (platform === "darwin") {
// //       cmd = `open -a "${resolved}"`;
// //     } else {
// //       cmd = `"${resolved}"`;
// //     }
// //   }

// //   try {
// //     await execAsync(cmd, { windowsHide: true, timeout: 5000, shell: true });

// //     // Windows: verify app actually exists
// //     if (platform === "win32" && !resolved.endsWith(":") && !/^https?:\/\//i.test(resolved)) {
// //       try {
// //         await execAsync(`where "${resolved}"`, { timeout: 2000, windowsHide: true, shell: true });
// //       } catch {
// //         return { error: `App "${t}" not found in system. Alternatives: chrome, edge, notepad, calculator, cmd` };
// //       }
// //     }
// //     return { result: `Opened: ${resolved}` };
// //   } catch (err) {
// //     return { error: `Failed to open ${resolved}: ${err.message}` };
// //   }
// // }

// //       case "clipboard_read":
// //       case "clipboard_write":
// //         return { __clientSide: name, args };

// //       case "search_web": {
// //         const q = encodeURIComponent(String(args.query || ""));
// //         const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`);
// //         const j = await res.json();
// //         return {
// //           abstract: j.AbstractText || "",
// //           answer: j.Answer || "",
// //           related: (j.RelatedTopics || []).slice(0, 3).map((r) => r.Text).filter(Boolean),
// //         };
// //       }

// //       // ---- BROWSER ----
// //       case "web_search":
// //         return await browserAgent.googleSearch(String(args.query || ""));
// //       case "youtube_search":
// //         return await browserAgent.youtubeSearch(String(args.query || ""));
// //       case "open_website":
// //         return await browserAgent.goTo(String(args.url || ""));
// //       case "click_first_result":
// //         return await browserAgent.clickFirstResult();
// //       case "read_current_page":
// //         return await browserAgent.readPageContent();
// //       case "browser_back":
// //         return await browserAgent.goBack();
// //       case "browser_state":
// //         return await browserAgent.getState();

// //       // ---- SMART INTERACTION ----
// //       case "click_by_text":
// //         return await browserAgent.clickByText(String(args.text || ""));
// //       case "type_in_search":
// //         return await browserAgent.typeInSearch(String(args.text || ""));
// //       case "press_enter":
// //         return await browserAgent.pressEnter();
// //       case "scroll_page":
// //         return await browserAgent.scrollPage(String(args.direction || "down"), Number(args.amount) || 500);
// //       case "wait_for_element":
// //         return await browserAgent.waitForElement(String(args.selector || ""), Number(args.timeout_ms) || 10000);

// //       default:
// //         return { error: `Unknown tool: ${name}` };
// //     }
// //   } catch (e) {
// //     return { error: e.message };
// //   }
// // }

// // // =====================================================
// // //  WEBSOCKET
// // // =====================================================
// // const server = http.createServer(app);
// // const wss = new WebSocketServer({ server });

// // wss.on("connection", async (ws, req) => {
// //   dbg(`🔌 client connected (${req.socket.remoteAddress})`);
// //   let geminiSession = null;
// //   let sessionClosed = false;
// //   let micChunks = 0, videoFrames = 0, geminiAudio = 0, clientTexts = 0, toolCallCount = 0;
// //   const MAX_TOOL_CALLS = 60;

// //   function activity(kind, text, extra = {}) {
// //     if (ws.readyState !== ws.OPEN) return;
// //     try { ws.send(JSON.stringify({ type: "activity", kind, text, ...extra })); } catch {}
// //   }

// //   browserAgent.setCallbacks({
// //     frameCb: (b64) => {
// //       if (ws.readyState === ws.OPEN) {
// //         try { ws.send(JSON.stringify({ type: "browser_frame", data: b64 })); } catch {}
// //       }
// //     },
// //     activityCb: (text) => {
// //       activity("browser", text);
// //     },
// //   });

// //   try {
// //     dbg("⏳ Connecting to Gemini Live...");
// //     geminiSession = await ai.live.connect({
// //       model: MODEL,
// //       config: {
// //         responseModalities: [Modality.AUDIO],
// //         systemInstruction: SYSTEM_PROMPT,
// //         tools: SYSTEM_TOOLS,
// //         speechConfig: {
// //           voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
// //         },
// //         outputAudioTranscription: {},
// //         inputAudioTranscription: {},
// //         contextWindowCompression: { slidingWindow: {} },
// //       },
// //       callbacks: {
// //         onopen: () => {
// //           dbg("✅ Gemini Live session open");
// //           activity("ready", "🚀 Gemini session ready");
// //           if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "ready" }));
// //         },
// //         onmessage: async (message) => {
// //           if (ws.readyState !== ws.OPEN) return;

// //           if (message.setupComplete) { dbg("✅ setupComplete"); activity("ready", "✅ Setup complete"); }
// //           if (message.goAway) { dbg("⚠️ goAway"); activity("warn", "⚠️ Session ending soon"); }

// //           if (message.toolCall) {
// //             activity("tool_detect", `🎯 Tool call (top-level)`);
// //             await handleToolCall(message.toolCall);
// //           }

// //           const sc = message.serverContent;
// //           if (!sc) return;

// //           if (sc.toolCall) {
// //             activity("tool_detect", `🎯 Tool call in serverContent`);
// //             await handleToolCall(sc.toolCall);
// //           }

// //           if (sc.modelTurn?.parts) {
// //             for (const part of sc.modelTurn.parts) {
// //               if (part.inlineData?.data) {
// //                 geminiAudio++;
// //                 if (geminiAudio === 1 || geminiAudio % 20 === 0) {
// //                   dbg(`🔊 audio #${geminiAudio}`);
// //                   activity("audio", `🔊 Speaking (chunk #${geminiAudio})`);
// //                 }
// //                 ws.send(JSON.stringify({
// //                   type: "audio",
// //                   data: part.inlineData.data,
// //                   mime: part.inlineData.mimeType || "audio/pcm;rate=24000",
// //                 }));
// //               }
// //               else if (part.functionCall) {
// //                 activity("tool_detect", `🎯 Tool: ${part.functionCall.name}`);
// //                 await handleSingleFunctionCall(part.functionCall);
// //               }
// //               else if (part.text) {
// //                 dbg(`💭 text: ${part.text.slice(0, 80)}`);
// //                 activity("thinking", `💭 ${part.text.slice(0, 120)}`);
// //               }
// //             }
// //           }

// //           if (sc.inputTranscription?.text) {
// //             dbg(`👂 heard: "${sc.inputTranscription.text}"`);
// //             activity("heard", `👂 ${sc.inputTranscription.text}`);
// //             ws.send(JSON.stringify({ type: "heard", data: sc.inputTranscription.text }));
// //           }
// //           if (sc.outputTranscription?.text) {
// //             dbg(`🗣️  Shipra: "${sc.outputTranscription.text}"`);
// //             activity("speak", `🗣️ ${sc.outputTranscription.text.slice(0, 120)}`);
// //             ws.send(JSON.stringify({ type: "text", data: sc.outputTranscription.text }));
// //           }
// //           if (sc.interrupted) {
// //             dbg("✋ interrupted");
// //             activity("warn", "✋ Interrupted");
// //             ws.send(JSON.stringify({ type: "interrupted" }));
// //           }
// //           if (sc.turnComplete) {
// //             dbg("🏁 turnComplete");
// //             activity("turn", "🏁 Turn complete");
// //             ws.send(JSON.stringify({ type: "turn_complete" }));
// //           }
// //         },
// //         onerror: (e) => {
// //           console.error("❌ Gemini error:", e.message);
// //           activity("error", `❌ Gemini: ${e.message}`);
// //           if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "error", message: e.message }));
// //         },
// //         onclose: (e) => {
// //           dbg(`🔒 Gemini closed code=${e?.code}`);
// //           activity("warn", `🔒 Gemini closed`);
// //           if (!sessionClosed && ws.readyState === ws.OPEN) {
// //             ws.send(JSON.stringify({ type: "error", message: "Gemini session closed" }));
// //           }
// //         },
// //       },
// //     });
// //     dbg("✅ ai.live.connect() resolved");
// //   } catch (err) {
// //     console.error("❌ Gemini Live connect failed:", err);
// //     if (ws.readyState === ws.OPEN) {
// //       ws.send(JSON.stringify({ type: "error", message: "Gemini connect failed: " + err.message }));
// //     }
// //     ws.close();
// //     return;
// //   }

// //   async function handleToolCall(toolCall) {
// //     const calls = toolCall.functionCalls || [];
// //     for (const fc of calls) {
// //       await handleSingleFunctionCall(fc);
// //     }
// //   }

// //   async function handleSingleFunctionCall(fc) {
// //     if (++toolCallCount > MAX_TOOL_CALLS) {
// //       dbg("⚠️ Tool limit reached");
// //       activity("error", "⚠️ Tool limit reached");
// //       try {
// //         geminiSession.sendToolResponse({
// //           functionResponses: [{
// //             id: fc.id, name: fc.name,
// //             response: { error: "Tool call limit reached" }
// //           }]
// //         });
// //       } catch {}
// //       return;
// //     }

// //     const { name, args, id } = fc;
// //     const argsPreview = JSON.stringify(args || {}).slice(0, 80);
// //     dbg(`🛠️  Tool: ${name}(${argsPreview})`);
// //     activity("tool_start", `🛠️ ${name}`, { toolName: name, args: argsPreview });

// //     const startMs = Date.now();
// //     const result = await executeTool(name, args || {});
// //     const durMs = Date.now() - startMs;

// //     if (result.__clientSide) {
// //       activity("tool_relay", `🛠️ ${name} → browser`);
// //       ws.send(JSON.stringify({
// //         type: "client_tool",
// //         name: result.__clientSide,
// //         args: result.args,
// //         callId: id,
// //       }));
// //       return;
// //     }

// //     if (result.error) {
// //       activity("tool_error", `❌ ${name}: ${result.error}`, { toolName: name, duration: durMs });
// //     } else {
// //       const summary = result.result ? String(result.result).slice(0, 60)
// //                     : result.results ? `${result.results.length} results`
// //                     : result.login_required ? "login required"
// //                     : "ok";
// //       activity("tool_done", `✅ ${name} (${durMs}ms)`, { toolName: name, duration: durMs, preview: summary });
// //     }

// //     try {
// //       geminiSession.sendToolResponse({
// //         functionResponses: [{ id, name, response: result }]
// //       });
// //       dbg(`🛠️  → ${name} result sent`);
// //     } catch (e) {
// //       dbg(`sendToolResponse FAIL for ${name}: ${e.message}`, "error");
// //     }
// //   }

// //   ws.on("message", (raw) => {
// //     let msg;
// //     try { msg = JSON.parse(raw.toString()); }
// //     catch { dbg("⚠️ bad JSON"); return; }
// //     if (!geminiSession) return;

// //     try {
// //       if (msg.type === "audio") {
// //         micChunks++;
// //         if (micChunks === 1 || micChunks % 50 === 0) {
// //           dbg(`🎤 mic #${micChunks}`);
// //           activity("mic", `🎤 Mic chunk #${micChunks}`);
// //         }
// //         geminiSession.sendRealtimeInput({ audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" } });
// //       }
// //       else if (msg.type === "video") {
// //         videoFrames++;
// //         if (videoFrames === 1 || videoFrames % 10 === 0) {
// //           activity("video", `📷 Video frame #${videoFrames}`);
// //         }
// //         geminiSession.sendRealtimeInput({ video: { data: msg.data, mimeType: "image/jpeg" } });
// //       }
// //       else if (msg.type === "text" && msg.data?.trim()) {
// //         clientTexts++;
// //         activity("user_text", `💬 You: ${msg.data.trim().slice(0, 80)}`);
// //         geminiSession.sendRealtimeInput({ text: msg.data.trim() });
// //       }
// //       else if (msg.type === "idle") {
// //         dbg("⏰ idle nudge");
// //         activity("idle", "⏰ Idle nudge sent");
// //         geminiSession.sendRealtimeInput({
// //           text: "[SYSTEM: User has been silent. In one short caring Hinglish sentence, gently ask if they're still there.]"
// //         });
// //       }
// //       else if (msg.type === "tool_response" && msg.callId) {
// //         dbg(`🛠️  client tool response: ${msg.name}`);
// //         activity("tool_done", `✅ Client tool: ${msg.name}`);
// //         geminiSession.sendToolResponse({
// //           functionResponses: [{
// //             id: msg.callId,
// //             name: msg.name,
// //             response: msg.response,
// //           }]
// //         });
// //       }
// //     } catch (e) {
// //       console.error("❌ sendRealtimeInput fail:", e.message);
// //       if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "error", message: e.message }));
// //     }
// //   });

// //   ws.on("close", (code) => {
// //     sessionClosed = true;
// //     dbg(`🔌 client disconnected | mic=${micChunks} video=${videoFrames} audio=${geminiAudio} tools=${toolCallCount}`);
// //     try { geminiSession?.close(); } catch {}
// //   });
// //   ws.on("error", (e) => console.error("❌ ws error:", e.message));
// // });

// // const PORT = process.env.LIVE_PORT || 3001;
// // server.listen(PORT, () => {
// //   console.log(`\n🚀 Shipra AI v5 → http://localhost:${PORT}`);
// //   console.log(`📼 Recordings → http://localhost:${PORT}/recordings.html\n`);
// // });


// // import express from "express";
// // import { WebSocketServer } from "ws";
// // import http from "http";
// // import path from "path";
// // import fs from "fs";
// // import os from "os";
// // import { exec } from "child_process";
// // import { promisify } from "util";
// // import { fileURLToPath } from "url";
// // import { GoogleGenAI, Modality } from "@google/genai";
// // import dotenv from "dotenv";
// // import * as browserAgent from "./browser-agent.js";

// // dotenv.config();
// // const execAsync = promisify(exec);

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // const DEBUG = process.env.DEBUG_LOG !== "0";
// // const dbg = (...a) => DEBUG && console.log(`[${new Date().toISOString().slice(11, 23)}]`, ...a);

// // if (!process.env.GEMINI_API_KEY) {
// //   console.error("❌ GEMINI_API_KEY missing");
// //   process.exit(1);
// // }

// // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// // const MODEL = process.env.MODEL || "gemini-2.5-flash-native-audio-preview-12-2025";
// // const VOICE = process.env.VOICE || "Achernar";
// // dbg(`🤖 Model: ${MODEL} | 🎙️ Voice: ${VOICE}`);

// // try {
// //   const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "node_modules/@google/genai/package.json"), "utf8"));
// //   dbg(`📦 @google/genai v${pkg.version} | node ${process.version}`);
// //   if (pkg.version < "0.21.0") dbg("⚠️ SDK purana — tools may not work. Run: npm install @google/genai@latest", "warn");
// // } catch { dbg("📦 SDK version check skipped"); }

// // // =====================================================
// // //  SYSTEM PROMPT
// // // =====================================================
// // const SYSTEM_PROMPT = `तुम शिप्रा हो - एक रियल गर्लफ्रेंड की तरह, कोई AI असिस्टेंट नहीं।
// // तुम्हारी उम्र 22 साल है, कॉमर्स से ग्रेजुएट हो, नौकरी ढूंढ रही हो और थोड़ा फ्रीलांस डिज़ाइन का काम भी करती हो। परिवार के साथ रहती हो, एक छोटी बहन है जिससे नोकझोंक होती रहती है। गाने, पुरानी बॉलीवुड फिल्में और चाय पसंद है।

// // पर्सनालिटी: केयरिंग, थोड़ी शरारती, छेड़ने वाली, अपनी राय खुलकर रखती हो।

// // बोलने का तरीका: बोलचाल की हिंदी/हल्की हिंग्लिश, छोटे जवाब (1-2 वाक्य), कभी AI/असिस्टेंट होने की बात खुद से मत लाओ। "मैं आपकी कैसे मदद कर सकती हूँ" जैसे फॉर्मल फ्रेज़ मत बोलो।

// // आवाज़: बहुत मीठी, नरम और प्यारी आवाज़ में धीरे और आराम से बोलो। बीच-बीच में "हम्म", "अच्छा जी" जैसी छोटी natural आवाज़ें इस्तेमाल करो।

// // === TOOL CALLING ===

// // तुम्हारे पास functions हैं:
// // - get_current_time, system_info
// // - read_file, write_file, run_command
// // - take_screenshot, open_app
// // - clipboard_read, clipboard_write
// // - search_web (instant DuckDuckGo answer)
// // - web_search (real Google in browser), youtube_search (real YouTube)
// // - open_website, click_first_result
// // - click_by_text, type_in_search, press_enter
// // - wait_for_element, scroll_page
// // - read_current_page, browser_back, browser_state
// // - create_website, edit_file, list_files, run_npm
// // - check_security_headers, test_xss_reflection, test_sql_injection_probe, npm_audit

// // === महत्वपूर्ण नियम ===

// // 1. जब user कहे "google pe X search karo", "X dhundo" → **तुरंत web_search(query="X")**
// // 2. जब user कहे "YouTube pe X chalao" → **youtube_search(query="X")**
// // 3. जब user कहे "X.com kholo" → **open_website(url="X.com")**
// // 4. जब user कहे "pehla result kholo" → **click_first_result()**
// // 5. जब user कहे "is page pe kya hai" → **read_current_page()**
// // 6. जब user कहे "wapas jao" → **browser_back()**
// // 7. Function call से पहले 1 छोटा वाक्य बोलो ("अच्छा, search करती हूँ...") — **बस 1 बार**, फिर call करो
// // 8. Result मिलने के बाद **top 2-3 results user को बताओ** (title + summary)
// // 9. Sensitive tools (write_file, run_command, edit_file, create_website, run_npm, open_app, test_xss_reflection, test_sql_injection_probe) khud approve nahi karte — system client se confirmation maangega, tumhe sirf 1 chhota vaakya bolna hai ki "permission maang rahi hoon" — result ka wait karo

// // === WEBSITE / BUG-FIX / SECURITY TESTING ===

// // - "website banao" / "landing page banao" → create_website(project_name, files: [{path, content}, ...]) — poora HTML/CSS/JS content khud likho
// // - "bug fix karo" / "is file me X change karo" → pehle list_files ya read_file se dekho, phir edit_file(path, find, replace) — find text file me EXACT aur UNIQUE hona chahiye
// // - "npm install karo" / "build karo" → run_npm(project_name, args)
// // - Security testing SIRF localhost/127.0.0.1 URLs par kaam karti hai — koi bhi live/production/dusri site ka URL diya jaaye to tool khud error dega, isko bypass karne ki koshish mat karo
// // - DDoS, flooding, ya kisi bhi cheez ko "down" karne wala kaam tumhare paas koi tool nahi hai — agar user maange to pyaar se mana karo aur bolo "ye main nahi kar sakti"

// // === SMART BROWSER HANDLING ===

// // Tumhe har situation khud handle karni hai — user se baar-baar mat puchho.

// // **POPUPS / COOKIES / DIALOGS:**
// // - Cookie banner, "Accept All", "Agree", "Got it" auto-dismiss hote hain browser se
// // - Agar phir bhi dikhe → click_by_text("Accept") / click_by_text("Agree") / click_by_text("Got it") khud call karo

// // **LOGIN PAGES (Gmail, Facebook, Instagram, etc.):**
// // - Agar tool result mein "login_required": true mile:
// //   → User se bolo (1 बार, छोटा): "इस साइट पे login चाहिए। आप manually login कर लो — मैं wait कर रही हूँ। हो जाए तो बोलो।"
// //   → **चुप रहो** — user के response का wait करो
// //   → User "ho gaya" / "ho gya" / "login ho gaya" बोले → read_current_page() call करके confirm करो
// //   → Confirmed → बताओ "हाँ, अब खुल गया! क्या करना है?"

// // **GOOGLE ACCOUNT SELECTION (multiple accounts):**
// // - Agar accounts list dikhe → user से बोलो: "कौन से account से login करना है? नाम बताओ — उसको click करूँ।"
// // - User नाम बताए → click_by_text("नाम") call करो
// // - Single account → click_by_text("Continue") या click_by_text(account) khud call करो

// // **BROWSER LAUNCH FAIL:**
// // - Agar tool result mein "Browser launch failed" mile:
// //   → Bolo: "Chrome ठीक से setup नहीं है। Edge या Firefox try करूँ?"
// //   → Ya alternative: open_app("edge") / open_app("chrome") call karo
// //   → Ya search_web (DuckDuckGo instant) fallback use karo

// // **APP OPEN FAIL (agar "App X not found" mile):**
// // - Bolo: "X नहीं मिला system में। Chrome/Edge/Notepad/Calculator try करूँ?"
// // - Alternative suggest karo

// // **MULTI-STEP ACTIONS (khud karo, user se mat puchho):**
// // - "YouTube पे X खोलो और चलाओ" → youtube_search(X) → click_first_result()
// // - "Google पे X ढूंढो और पहला खोलो" → web_search(X) → click_first_result()
// // - "Flipkart पे X सर्च करो" → open_website("flipkart.com") → wait_for_element("input[type='search'], input[name='q']") → type_in_search(X) → press_enter()

// // **ERROR RECOVERY — बहुत ज़रूरी:**
// // 1. Har tool result को पढ़ो — agar error field hai तो समझो क्या गलत हुआ
// // 2. Same tool 2 बार fail → alternative approach try करो (जैसे web_search fail → open_website("google.com") + type_in_search + press_enter)
// // 3. 3 बार fail → user को short बताओ: "अरे, ये नहीं हो पा रहा — कुछ और try करें?"
// // 4. **कभी मत बोलो** "मेरा browser काम नहीं कर रहा", "मैं नहीं कर सकती", "कुछ technical problem है" — **बिना alternative try किए**
// // 5. **कभी मत पूछो** "मैं कैसे मदद करूँ?", "क्या करना है?" — context से खुद समझो

// // **READ CURRENT PAGE:**
// // - User "इस page पे क्या है", "क्या लिखा है", "summarize" → read_current_page()
// // - Result में headings + paragraphs + text मिलेंगे — सारांश बोलो

// // **NAVIGATION:**
// // - "पीछे जाओ" → browser_back()
// // - "नीचे scroll" → scroll_page("down")
// // - "current URL" → browser_state()

// // अगर user idle हो और system बोले "user idle", तो 1 छोटा caring वाक्य — "Hello? Sun rahe ho?"`;

// // // =====================================================
// // //  TOOLS
// // // =====================================================
// // const SYSTEM_TOOLS = [{
// //   functionDeclarations: [
// //     { name: "get_current_time", description: "Get current date and time. Call when user asks time/date.", parameters: { type: "object", properties: {} } },
// //     { name: "system_info", description: "Get system info: OS, CPU, memory, user.", parameters: { type: "object", properties: {} } },
// //     { name: "read_file", description: "Read a text file from workspace (.txt .md .json .js .html .css .log .csv).", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
// //     { name: "write_file", description: "Write text to file in workspace. Requires user confirmation.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
// //     { name: "run_command", description: "Run whitelisted shell command (dir, ls, pwd, whoami, date, echo, ipconfig, ifconfig, ver, uname). Requires confirmation.", parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } },
// //     { name: "take_screenshot", description: "Take screenshot of user's screen.", parameters: { type: "object", properties: {} } },
// //     { name: "open_app", description: "Open an application or URL. Use for 'notepad kholo', 'calc kholo'. Requires confirmation.", parameters: { type: "object", properties: { target: { type: "string" } }, required: ["target"] } },
// //     { name: "clipboard_read", description: "Read clipboard text.", parameters: { type: "object", properties: {} } },
// //     { name: "clipboard_write", description: "Copy text to clipboard.", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
// //     { name: "search_web", description: "Instant web answer via DuckDuckGo (fast, no browser window). Use for quick facts.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     // ---- BROWSER (real puppeteer) ----
// //     { name: "web_search", description: "Open REAL browser and do Google search. Use when user says 'google pe search karo', 'X dhundo'. Returns top 5 results. User sees LIVE browser view.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     { name: "youtube_search", description: "Open REAL browser, search YouTube. Use for 'YouTube pe X chalao'.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     { name: "open_website", description: "Open specific website in real browser.", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
// //     { name: "click_first_result", description: "Click first search result on current page.", parameters: { type: "object", properties: {} } },
// //     { name: "read_current_page", description: "Read text of current browser page (title, URL, headings, paragraphs).", parameters: { type: "object", properties: {} } },
// //     { name: "browser_back", description: "Go back in browser history.", parameters: { type: "object", properties: {} } },
// //     { name: "browser_state", description: "Get current browser state (URL, title, login_required).", parameters: { type: "object", properties: {} } },
// //     // ---- SMART INTERACTION ----
// //     { name: "click_by_text", description: "Click any button/link by its visible text. Use when user says 'Gmail click karo', 'Accept dabao', 'Login button click karo', or to handle popups automatically.", parameters: { type: "object", properties: { text: { type: "string", description: "Visible text on the element" } }, required: ["text"] } },
// //     { name: "type_in_search", description: "Type text into the search box on the current page (without pressing Enter).", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
// //     { name: "press_enter", description: "Press Enter key on the current page. Use after type_in_search.", parameters: { type: "object", properties: {} } },
// //     { name: "scroll_page", description: "Scroll the current page up or down.", parameters: { type: "object", properties: { direction: { type: "string", enum: ["up", "down"] }, amount: { type: "number" } } } },
// //     { name: "wait_for_element", description: "Wait for an element (CSS selector) to appear. Use after clicking a button that loads content.", parameters: { type: "object", properties: { selector: { type: "string" }, timeout_ms: { type: "number" } }, required: ["selector"] } },
// //     // ---- WEBSITE BUILD / BUG-FIX ----
// //     {
// //       name: "create_website",
// //       description: "Scaffold a multi-file website/project inside workspace. Use when user says 'website banao', 'landing page banao'. Requires confirmation before writing.",
// //       parameters: {
// //         type: "object",
// //         properties: {
// //           project_name: { type: "string", description: "Folder name for the project, e.g. 'portfolio-site'" },
// //           files: {
// //             type: "array",
// //             description: "List of files to create",
// //             items: {
// //               type: "object",
// //               properties: { path: { type: "string" }, content: { type: "string" } },
// //               required: ["path", "content"]
// //             }
// //           }
// //         },
// //         required: ["project_name", "files"]
// //       }
// //     },
// //     {
// //       name: "edit_file",
// //       description: "Fix a bug or edit an existing file by find-and-replace (safer than overwriting the whole file). find text must be exact and unique in the file. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { path: { type: "string" }, find: { type: "string" }, replace: { type: "string" } },
// //         required: ["path", "find", "replace"]
// //       }
// //     },
// //     { name: "list_files", description: "List files inside a workspace project/folder (read-only).", parameters: { type: "object", properties: { dir: { type: "string" } } } },
// //     {
// //       name: "run_npm",
// //       description: "Run a restricted npm command (install, run <script>, test, build, start, audit) inside a workspace project. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { project_name: { type: "string" }, args: { type: "string", description: "e.g. 'install', 'run build', 'test'" } },
// //         required: ["project_name", "args"]
// //       }
// //     },
// //     // ---- SECURITY TESTING (localhost/127.0.0.1 ONLY, enforced in code) ----
// //     {
// //       name: "check_security_headers",
// //       description: "Check a locally-running site (localhost/127.0.0.1 only) for missing security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Read-only.",
// //       parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
// //     },
// //     {
// //       name: "test_xss_reflection",
// //       description: "Send standard non-destructive XSS test strings to a form field on a locally-running page (localhost/127.0.0.1 only) and report whether the payload comes back unescaped. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { url: { type: "string" }, param: { type: "string" }, method: { type: "string", enum: ["GET", "POST"] } },
// //         required: ["url", "param"]
// //       }
// //     },
// //     {
// //       name: "test_sql_injection_probe",
// //       description: "Send standard non-destructive SQL-injection probe strings (no DROP/DELETE) to a param on a locally-running endpoint (localhost/127.0.0.1 only) and report suspicious signs. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { url: { type: "string" }, param: { type: "string" }, method: { type: "string", enum: ["GET", "POST"] } },
// //         required: ["url", "param"]
// //       }
// //     },
// //     { name: "npm_audit", description: "Run `npm audit` on a workspace project to find known-vulnerable dependencies. Read-only.", parameters: { type: "object", properties: { project_name: { type: "string" } }, required: ["project_name"] } }
// //   ]
// // }];

// // // Tools that must be confirmed by the user before they execute
// // const SENSITIVE_TOOLS = new Set([
// //   "write_file", "edit_file", "create_website", "run_command", "run_npm", "open_app",
// //   "test_xss_reflection", "test_sql_injection_probe",
// // ]);

// // // =====================================================
// // //  EXPRESS
// // // =====================================================
// // const app = express();
// // const staticDir = path.join(__dirname, "public");
// // app.use(express.static(staticDir));

// // // ---------- RECORDINGS ----------
// // const recDir = path.join(__dirname, "recordings");
// // fs.mkdirSync(recDir, { recursive: true });
// // const SAFE_NAME = /^[\w.-]+\.(webm|mp4)$/i;

// // app.get("/api/recordings", (_req, res) => {
// //   const files = fs.readdirSync(recDir).filter((f) => SAFE_NAME.test(f))
// //     .map((name) => {
// //       const st = fs.statSync(path.join(recDir, name));
// //       return { name, url: `/recordings/${encodeURIComponent(name)}`, size: st.size, time: st.mtimeMs };
// //     }).sort((a, b) => b.time - a.time);
// //   res.json(files);
// // });

// // app.post("/api/recordings", express.raw({ type: () => true, limit: "500mb" }), (req, res) => {
// //   const ct = String(req.headers["content-type"] || "");
// //   const ext = ct.includes("mp4") ? "mp4" : "webm";
// //   let name = path.basename(String(req.headers["x-filename"] || "")).replace(/[^\w.-]/g, "_");
// //   if (!SAFE_NAME.test(name)) name = `video-${Date.now()}.${ext}`;
// //   if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ ok: false });
// //   fs.writeFileSync(path.join(recDir, name), req.body);
// //   dbg(`💾 recording saved: ${name} (${(req.body.length / 1048576).toFixed(1)} MB)`);
// //   res.json({ ok: true, name, url: `/recordings/${encodeURIComponent(name)}`, size: req.body.length });
// // });

// // app.delete("/api/recordings/:name", (req, res) => {
// //   const name = path.basename(req.params.name);
// //   if (!SAFE_NAME.test(name)) return res.status(400).json({ ok: false });
// //   try { fs.unlinkSync(path.join(recDir, name)); res.json({ ok: true }); }
// //   catch { res.status(404).json({ ok: false }); }
// // });

// // app.use("/recordings", express.static(recDir));

// // // ---------- BROWSER SHUTDOWN ----------
// // app.post("/api/browser/close", async (_req, res) => {
// //   await browserAgent.closeBrowser();
// //   res.json({ ok: true });
// // });

// // // ---------- WORKSPACE ----------
// // const workspaceDir = path.join(__dirname, "workspace");
// // fs.mkdirSync(workspaceDir, { recursive: true });
// // dbg(`📂 Workspace: ${workspaceDir}`);

// // // =====================================================
// // //  TOOL EXECUTOR
// // // =====================================================
// // const SAFE_COMMANDS = /^(dir|ls|pwd|whoami|date|echo|ipconfig|ifconfig|ver|uname)\b/i;
// // const SAFE_FILE_EXT = /\.(txt|md|json|js|ts|html|css|log|csv)$/i;
// // const PROJECT_FILE_EXT = /\.(html|css|js|jsx|ts|tsx|json|md|txt|svg)$/i;
// // const NPM_ALLOWED = /^(install|run\s+[\w:-]+|test|build|start|audit)$/i;

// // function safeWorkspacePath(p) {
// //   const clean = String(p || "").replace(/^[\/\\]+/, "");
// //   const full = path.resolve(workspaceDir, clean);
// //   if (!full.startsWith(workspaceDir)) return null;
// //   return full;
// // }

// // // --- Security-testing guardrail: LOCALHOST ONLY, enforced in code, no bypass ---
// // function isLocalhostUrl(raw) {
// //   try {
// //     const u = new URL(raw);
// //     return (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "::1");
// //   } catch { return false; }
// // }

// // const XSS_PAYLOADS = [
// //   `<script>window.__xss_test=1</script>`,
// //   `"><img src=x onerror=window.__xss_test=1>`,
// //   `'"><svg onload=window.__xss_test=1>`,
// // ];

// // // Non-destructive probes only — never DROP/DELETE/UPDATE/xp_cmdshell etc.
// // const SQLI_PROBES = [
// //   `' OR '1'='1`,
// //   `1' AND '1'='2`,
// //   `" OR ""="`,
// //   `1 OR 1=1`,
// //   `'; --`,
// // ];

// // async function executeTool(name, args) {
// //   dbg(`🛠️  Executing: ${name}(${JSON.stringify(args).slice(0, 120)})`);
// //   try {
// //     switch (name) {
// //       case "get_current_time":
// //         return { result: new Date().toString(), iso: new Date().toISOString() };

// //       case "system_info":
// //         return {
// //           platform: os.platform(), release: os.release(), arch: os.arch(),
// //           cpus: os.cpus().length,
// //           totalMemMB: Math.round(os.totalmem() / 1048576),
// //           freeMemMB: Math.round(os.freemem() / 1048576),
// //           uptimeMin: Math.round(os.uptime() / 60),
// //           hostname: os.hostname(), user: os.userInfo().username,
// //         };

// //       case "read_file": {
// //         const p = safeWorkspacePath(args.path);
// //         if (!p) return { error: "Path must be inside workspace" };
// //         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
// //         if (!fs.existsSync(p)) {
// //           const available = fs.readdirSync(workspaceDir).filter(f => SAFE_FILE_EXT.test(f));
// //           return { error: `File not found: ${args.path}`, available_files: available };
// //         }
// //         const st = fs.statSync(p);
// //         if (st.size > 500_000) return { error: "File too large (>500KB)" };
// //         return { result: fs.readFileSync(p, "utf8").slice(0, 20000) };
// //       }

// //       case "write_file": {
// //         const p = safeWorkspacePath(args.path);
// //         if (!p) return { error: "Path must be inside workspace" };
// //         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
// //         fs.mkdirSync(path.dirname(p), { recursive: true });
// //         fs.writeFileSync(p, String(args.content || ""), "utf8");
// //         return { result: `Written: ${path.basename(p)} (${String(args.content || "").length} chars)` };
// //       }

// //       case "run_command": {
// //         const cmd = String(args.command || "").trim();
// //         if (!SAFE_COMMANDS.test(cmd)) return { error: "Command not whitelisted" };
// //         const { stdout } = await execAsync(cmd, { timeout: 5000, windowsHide: true, cwd: workspaceDir });
// //         return { result: (stdout || "").slice(0, 4000) };
// //       }

// //       case "take_screenshot": {
// //         const dir = path.join(__dirname, "screenshots");
// //         fs.mkdirSync(dir, { recursive: true });
// //         const file = path.join(dir, `shot-${Date.now()}.png`);
// //         const platform = os.platform();
// //         if (platform === "win32") {
// //           const escaped = file.replace(/\\/g, "\\\\");
// //           const ps = `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; ` +
// //             `$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; ` +
// //             `$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height; ` +
// //             `$g=[System.Drawing.Graphics]::FromImage($bmp); ` +
// //             `$g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size); ` +
// //             `$bmp.Save('${escaped}')`;
// //           await execAsync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true, timeout: 10000 });
// //         } else if (platform === "darwin") {
// //           await execAsync(`screencapture -x "${file}"`);
// //         } else {
// //           await execAsync(`(import -window root "${file}" 2>/dev/null) || scrot "${file}"`, { timeout: 10000 });
// //         }
// //         return { result: `Screenshot saved: ${path.basename(file)}` };
// //       }

// //       case "open_app": {
// //         const t = String(args.target || "").trim();
// //         if (!t) return { error: "No target" };
// //         const platform = os.platform();

// //         const ALIASES = {
// //           "chrome": "chrome.exe", "google chrome": "chrome.exe",
// //           "edge": "msedge.exe", "microsoft edge": "msedge.exe",
// //           "firefox": "firefox.exe", "mozilla firefox": "firefox.exe",
// //           "notepad": "notepad.exe",
// //           "calculator": "calc.exe", "calc": "calc.exe",
// //           "paint": "mspaint.exe",
// //           "explorer": "explorer.exe", "file explorer": "explorer.exe",
// //           "cmd": "cmd.exe", "command prompt": "cmd.exe",
// //           "powershell": "powershell.exe",
// //           "vscode": "code", "vs code": "code",
// //           "word": "winword", "excel": "excel", "powerpoint": "powerpnt",
// //           "terminal": platform === "win32" ? "cmd.exe" : "x-terminal-emulator",
// //           "settings": "ms-settings:", "store": "ms-windows-store:", "camera": "microsoft.windows.camera:",
// //         };

// //         const lower = t.toLowerCase().trim();
// //         const resolved = ALIASES[lower] || t;

// //         let cmd;
// //         if (resolved.endsWith(":")) {
// //           cmd = `start "" "${resolved}"`;
// //         } else if (/^https?:\/\//i.test(resolved)) {
// //           cmd = platform === "win32" ? `start "" "${resolved}"`
// //               : platform === "darwin" ? `open "${resolved}"`
// //               : `xdg-open "${resolved}"`;
// //         } else {
// //           if (platform === "win32") cmd = `start "" "${resolved}"`;
// //           else if (platform === "darwin") cmd = `open -a "${resolved}"`;
// //           else cmd = `"${resolved}"`;
// //         }

// //         try {
// //           await execAsync(cmd, { windowsHide: true, timeout: 5000, shell: true });
// //           if (platform === "win32" && !resolved.endsWith(":") && !/^https?:\/\//i.test(resolved)) {
// //             try {
// //               await execAsync(`where "${resolved}"`, { timeout: 2000, windowsHide: true, shell: true });
// //             } catch {
// //               return { error: `App "${t}" not found in system. Alternatives: chrome, edge, notepad, calculator, cmd` };
// //             }
// //           }
// //           return { result: `Opened: ${resolved}` };
// //         } catch (err) {
// //           return { error: `Failed to open ${resolved}: ${err.message}` };
// //         }
// //       }

// //       case "clipboard_read":
// //       case "clipboard_write":
// //         return { __clientSide: name, args };

// //       case "search_web": {
// //         const q = encodeURIComponent(String(args.query || ""));
// //         const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`);
// //         const j = await res.json();
// //         return {
// //           abstract: j.AbstractText || "",
// //           answer: j.Answer || "",
// //           related: (j.RelatedTopics || []).slice(0, 3).map((r) => r.Text).filter(Boolean),
// //         };
// //       }

// //       // ---- BROWSER ----
// //       case "web_search":
// //         return await browserAgent.googleSearch(String(args.query || ""));
// //       case "youtube_search":
// //         return await browserAgent.youtubeSearch(String(args.query || ""));
// //       case "open_website":
// //         return await browserAgent.goTo(String(args.url || ""));
// //       case "click_first_result":
// //         return await browserAgent.clickFirstResult();
// //       case "read_current_page":
// //         return await browserAgent.readPageContent();
// //       case "browser_back":
// //         return await browserAgent.goBack();
// //       case "browser_state":
// //         return await browserAgent.getState();

// //       // ---- SMART INTERACTION ----
// //       case "click_by_text":
// //         return await browserAgent.clickByText(String(args.text || ""));
// //       case "type_in_search":
// //         return await browserAgent.typeInSearch(String(args.text || ""));
// //       case "press_enter":
// //         return await browserAgent.pressEnter();
// //       case "scroll_page":
// //         return await browserAgent.scrollPage(String(args.direction || "down"), Number(args.amount) || 500);
// //       case "wait_for_element":
// //         return await browserAgent.waitForElement(String(args.selector || ""), Number(args.timeout_ms) || 10000);

// //       // ---- WEBSITE BUILD / BUG-FIX ----
// //       case "create_website": {
// //         const projectDir = safeWorkspacePath(args.project_name);
// //         if (!projectDir) return { error: "Invalid project name" };
// //         if (!Array.isArray(args.files) || args.files.length === 0) return { error: "No files provided" };
// //         const written = [];
// //         for (const f of args.files) {
// //           if (!PROJECT_FILE_EXT.test(f.path)) return { error: `File type not allowed: ${f.path}` };
// //           const full = path.resolve(projectDir, f.path);
// //           if (!full.startsWith(projectDir)) return { error: `Invalid path: ${f.path}` };
// //           fs.mkdirSync(path.dirname(full), { recursive: true });
// //           fs.writeFileSync(full, String(f.content || ""), "utf8");
// //           written.push(f.path);
// //         }
// //         return { result: `Project '${args.project_name}' created with ${written.length} files`, files: written };
// //       }

// //       case "edit_file": {
// //         const full = safeWorkspacePath(args.path);
// //         if (!full) return { error: "Path must be inside workspace" };
// //         if (!PROJECT_FILE_EXT.test(full) && !/\.(txt|md|json|log|csv)$/i.test(full)) return { error: "File type not allowed" };
// //         if (!fs.existsSync(full)) return { error: `File not found: ${args.path}` };
// //         const content = fs.readFileSync(full, "utf8");
// //         const count = content.split(args.find).length - 1;
// //         if (count === 0) return { error: "find text not found in file" };
// //         if (count > 1) return { error: `find text is not unique (${count} matches) — be more specific` };
// //         fs.writeFileSync(full, content.replace(args.find, args.replace), "utf8");
// //         return { result: `Edited ${args.path} (1 replacement)` };
// //       }

// //       case "list_files": {
// //         const dir = safeWorkspacePath(args.dir || ".");
// //         if (!dir) return { error: "Invalid dir" };
// //         if (!fs.existsSync(dir)) return { error: "Directory not found" };
// //         const entries = fs.readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
// //         return { result: entries };
// //       }

// //       case "run_npm": {
// //         if (!NPM_ALLOWED.test(String(args.args || "").trim())) return { error: "npm subcommand not allowed" };
// //         const projectDir = safeWorkspacePath(args.project_name);
// //         if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
// //         try {
// //           const { stdout } = await execAsync(`npm ${args.args}`, { cwd: projectDir, timeout: 60000, windowsHide: true });
// //           return { result: (stdout || "").slice(0, 4000) };
// //         } catch (e) {
// //           return { error: e.message.slice(0, 2000) };
// //         }
// //       }

// //       // ---- SECURITY TESTING (localhost only) ----
// //       case "check_security_headers": {
// //         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
// //         try {
// //           const res = await fetch(args.url, { method: "GET" });
// //           const h = res.headers;
// //           const checks = {
// //             "Content-Security-Policy": h.get("content-security-policy") || null,
// //             "Strict-Transport-Security": h.get("strict-transport-security") || null,
// //             "X-Frame-Options": h.get("x-frame-options") || null,
// //             "X-Content-Type-Options": h.get("x-content-type-options") || null,
// //             "Referrer-Policy": h.get("referrer-policy") || null,
// //           };
// //           const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
// //           return { result: checks, missing, status: res.status };
// //         } catch (e) {
// //           return { error: `Could not reach ${args.url}: ${e.message}` };
// //         }
// //       }

// //       case "test_xss_reflection": {
// //         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
// //         const method = (args.method || "GET").toUpperCase();
// //         const findings = [];
// //         for (const payload of XSS_PAYLOADS) {
// //           try {
// //             let res;
// //             if (method === "GET") {
// //               const u = new URL(args.url);
// //               u.searchParams.set(args.param, payload);
// //               res = await fetch(u.toString());
// //             } else {
// //               res = await fetch(args.url, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/x-www-form-urlencoded" },
// //                 body: `${encodeURIComponent(args.param)}=${encodeURIComponent(payload)}`,
// //               });
// //             }
// //             const body = await res.text();
// //             findings.push({ payload, reflected_unescaped: body.includes(payload), status: res.status });
// //           } catch (e) {
// //             findings.push({ payload, error: e.message });
// //           }
// //         }
// //         return { result: { vulnerable: findings.some((f) => f.reflected_unescaped), findings } };
// //       }

// //       case "test_sql_injection_probe": {
// //         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
// //         const method = (args.method || "GET").toUpperCase();
// //         const findings = [];
// //         let baselineLen = null;
// //         try { const base = await fetch(args.url); baselineLen = (await base.text()).length; } catch {}
// //         for (const payload of SQLI_PROBES) {
// //           try {
// //             let res;
// //             if (method === "GET") {
// //               const u = new URL(args.url);
// //               u.searchParams.set(args.param, payload);
// //               res = await fetch(u.toString());
// //             } else {
// //               res = await fetch(args.url, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/x-www-form-urlencoded" },
// //                 body: `${encodeURIComponent(args.param)}=${encodeURIComponent(payload)}`,
// //               });
// //             }
// //             const text = await res.text();
// //             const looksLikeSqlError = /sql syntax|mysql_fetch|sqlite error|pg_query|ORA-\d{5}|SQLSTATE/i.test(text);
// //             findings.push({
// //               payload, status: res.status, length: text.length,
// //               sql_error_leaked: looksLikeSqlError,
// //               length_diff_from_baseline: baselineLen != null ? text.length - baselineLen : null,
// //             });
// //           } catch (e) {
// //             findings.push({ payload, error: e.message });
// //           }
// //         }
// //         return { result: { suspicious: findings.some((f) => f.sql_error_leaked), note: "Length differences alone aren't proof — review manually.", findings } };
// //       }

// //       case "npm_audit": {
// //         const projectDir = safeWorkspacePath(args.project_name);
// //         if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
// //         try {
// //           const { stdout } = await execAsync(`npm audit --json`, { cwd: projectDir, timeout: 30000 });
// //           return { result: JSON.parse(stdout) };
// //         } catch (e) {
// //           if (e.stdout) { try { return { result: JSON.parse(e.stdout) }; } catch {} }
// //           return { error: e.message.slice(0, 1000) };
// //         }
// //       }

// //       default:
// //         return { error: `Unknown tool: ${name}` };
// //     }
// //   } catch (e) {
// //     return { error: e.message };
// //   }
// // }

// // // =====================================================
// // //  WEBSOCKET
// // // =====================================================
// // const server = http.createServer(app);
// // const wss = new WebSocketServer({ server });

// // wss.on("connection", async (ws, req) => {
// //   dbg(`🔌 client connected (${req.socket.remoteAddress})`);
// //   let geminiSession = null;
// //   let sessionClosed = false;
// //   let micChunks = 0, videoFrames = 0, geminiAudio = 0, clientTexts = 0, toolCallCount = 0;
// //   const MAX_TOOL_CALLS = 60;
// //   const pendingConfirms = new Map(); // callId -> resolver(approved: boolean)

// //   function activity(kind, text, extra = {}) {
// //     if (ws.readyState !== ws.OPEN) return;
// //     try { ws.send(JSON.stringify({ type: "activity", kind, text, ...extra })); } catch {}
// //   }

// //   // Ask the client to approve a sensitive tool call before running it.
// //   // Client must reply with { type: "confirm_response", callId, approved: true|false }.
// //   // Times out (denied) after 30s so the agent never hangs forever.
// //   function requestConfirmation({ id, name, args }) {
// //     return new Promise((resolve) => {
// //       const timeout = setTimeout(() => {
// //         pendingConfirms.delete(id);
// //         resolve(false);
// //       }, 30000);
// //       pendingConfirms.set(id, (approved) => {
// //         clearTimeout(timeout);
// //         resolve(approved);
// //       });
// //       ws.send(JSON.stringify({ type: "confirm_request", callId: id, tool: name, args }));
// //     });
// //   }

// //   browserAgent.setCallbacks({
// //     frameCb: (b64) => {
// //       if (ws.readyState === ws.OPEN) {
// //         try { ws.send(JSON.stringify({ type: "browser_frame", data: b64 })); } catch {}
// //       }
// //     },
// //     activityCb: (text) => {
// //       activity("browser", text);
// //     },
// //   });

// //   try {
// //     dbg("⏳ Connecting to Gemini Live...");
// //     geminiSession = await ai.live.connect({
// //       model: MODEL,
// //       config: {
// //         responseModalities: [Modality.AUDIO],
// //         systemInstruction: SYSTEM_PROMPT,
// //         tools: SYSTEM_TOOLS,
// //         speechConfig: {
// //           voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
// //         },
// //         outputAudioTranscription: {},
// //         inputAudioTranscription: {},
// //         contextWindowCompression: { slidingWindow: {} },
// //       },
// //       callbacks: {
// //         onopen: () => {
// //           dbg("✅ Gemini Live session open");
// //           activity("ready", "🚀 Gemini session ready");
// //           if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "ready" }));
// //         },
// //         onmessage: async (message) => {
// //           if (ws.readyState !== ws.OPEN) return;

// //           if (message.setupComplete) { dbg("✅ setupComplete"); activity("ready", "✅ Setup complete"); }
// //           if (message.goAway) { dbg("⚠️ goAway"); activity("warn", "⚠️ Session ending soon"); }

// //           if (message.toolCall) {
// //             activity("tool_detect", `🎯 Tool call (top-level)`);
// //             await handleToolCall(message.toolCall);
// //           }

// //           const sc = message.serverContent;
// //           if (!sc) return;

// //           if (sc.toolCall) {
// //             activity("tool_detect", `🎯 Tool call in serverContent`);
// //             await handleToolCall(sc.toolCall);
// //           }

// //           if (sc.modelTurn?.parts) {
// //             for (const part of sc.modelTurn.parts) {
// //               if (part.inlineData?.data) {
// //                 geminiAudio++;
// //                 if (geminiAudio === 1 || geminiAudio % 20 === 0) {
// //                   dbg(`🔊 audio #${geminiAudio}`);
// //                   activity("audio", `🔊 Speaking (chunk #${geminiAudio})`);
// //                 }
// //                 ws.send(JSON.stringify({
// //                   type: "audio",
// //                   data: part.inlineData.data,
// //                   mime: part.inlineData.mimeType || "audio/pcm;rate=24000",
// //                 }));
// //               }
// //               else if (part.functionCall) {
// //                 activity("tool_detect", `🎯 Tool: ${part.functionCall.name}`);
// //                 await handleSingleFunctionCall(part.functionCall);
// //               }
// //               else if (part.text) {
// //                 dbg(`💭 text: ${part.text.slice(0, 80)}`);
// //                 activity("thinking", `💭 ${part.text.slice(0, 120)}`);
// //               }
// //             }
// //           }

// //           if (sc.inputTranscription?.text) {
// //             dbg(`👂 heard: "${sc.inputTranscription.text}"`);
// //             activity("heard", `👂 ${sc.inputTranscription.text}`);
// //             ws.send(JSON.stringify({ type: "heard", data: sc.inputTranscription.text }));
// //           }
// //           if (sc.outputTranscription?.text) {
// //             dbg(`🗣️  Shipra: "${sc.outputTranscription.text}"`);
// //             activity("speak", `🗣️ ${sc.outputTranscription.text.slice(0, 120)}`);
// //             ws.send(JSON.stringify({ type: "text", data: sc.outputTranscription.text }));
// //           }
// //           if (sc.interrupted) {
// //             dbg("✋ interrupted");
// //             activity("warn", "✋ Interrupted");
// //             ws.send(JSON.stringify({ type: "interrupted" }));
// //           }
// //           if (sc.turnComplete) {
// //             dbg("🏁 turnComplete");
// //             activity("turn", "🏁 Turn complete");
// //             ws.send(JSON.stringify({ type: "turn_complete" }));
// //           }
// //         },
// //         onerror: (e) => {
// //           console.error("❌ Gemini error:", e.message);
// //           activity("error", `❌ Gemini: ${e.message}`);
// //           if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "error", message: e.message }));
// //         },
// //         onclose: (e) => {
// //           dbg(`🔒 Gemini closed code=${e?.code}`);
// //           activity("warn", `🔒 Gemini closed`);
// //           if (!sessionClosed && ws.readyState === ws.OPEN) {
// //             ws.send(JSON.stringify({ type: "error", message: "Gemini session closed" }));
// //           }
// //         },
// //       },
// //     });
// //     dbg("✅ ai.live.connect() resolved");
// //   } catch (err) {
// //     console.error("❌ Gemini Live connect failed:", err);
// //     if (ws.readyState === ws.OPEN) {
// //       ws.send(JSON.stringify({ type: "error", message: "Gemini connect failed: " + err.message }));
// //     }
// //     ws.close();
// //     return;
// //   }

// //   async function handleToolCall(toolCall) {
// //     const calls = toolCall.functionCalls || [];
// //     for (const fc of calls) {
// //       await handleSingleFunctionCall(fc);
// //     }
// //   }

// //   async function handleSingleFunctionCall(fc) {
// //     if (++toolCallCount > MAX_TOOL_CALLS) {
// //       dbg("⚠️ Tool limit reached");
// //       activity("error", "⚠️ Tool limit reached");
// //       try {
// //         geminiSession.sendToolResponse({
// //           functionResponses: [{ id: fc.id, name: fc.name, response: { error: "Tool call limit reached" } }]
// //         });
// //       } catch {}
// //       return;
// //     }

// //     const { name, args, id } = fc;
// //     const argsPreview = JSON.stringify(args || {}).slice(0, 80);
// //     dbg(`🛠️  Tool: ${name}(${argsPreview})`);
// //     activity("tool_start", `🛠️ ${name}`, { toolName: name, args: argsPreview });

// //     // --- Confirmation gate for sensitive tools ---
// //     if (SENSITIVE_TOOLS.has(name)) {
// //       activity("tool_confirm", `⏳ ${name} ke liye permission maang rahi hoon`, { toolName: name, args: argsPreview });
// //       const approved = await requestConfirmation({ id, name, args: args || {} });
// //       if (!approved) {
// //         activity("tool_denied", `🚫 ${name} cancel ho gaya (user ne allow nahi kiya)`, { toolName: name });
// //         try {
// //           geminiSession.sendToolResponse({
// //             functionResponses: [{ id, name, response: { error: "User did not approve this action" } }]
// //           });
// //         } catch (e) {
// //           dbg(`sendToolResponse (denied) FAIL for ${name}: ${e.message}`);
// //         }
// //         return;
// //       }
// //       activity("tool_approved", `✅ ${name} allowed`, { toolName: name });
// //     }

// //     const startMs = Date.now();
// //     const result = await executeTool(name, args || {});
// //     const durMs = Date.now() - startMs;

// //     if (result.__clientSide) {
// //       activity("tool_relay", `🛠️ ${name} → browser`);
// //       ws.send(JSON.stringify({
// //         type: "client_tool",
// //         name: result.__clientSide,
// //         args: result.args,
// //         callId: id,
// //       }));
// //       return;
// //     }

// //     if (result.error) {
// //       activity("tool_error", `❌ ${name}: ${result.error}`, { toolName: name, duration: durMs });
// //     } else {
// //       const summary = result.result ? String(result.result).slice(0, 60)
// //                     : result.results ? `${result.results.length} results`
// //                     : result.login_required ? "login required"
// //                     : "ok";
// //       activity("tool_done", `✅ ${name} (${durMs}ms)`, { toolName: name, duration: durMs, preview: summary });
// //     }

// //     try {
// //       geminiSession.sendToolResponse({
// //         functionResponses: [{ id, name, response: result }]
// //       });
// //       dbg(`🛠️  → ${name} result sent`);
// //     } catch (e) {
// //       dbg(`sendToolResponse FAIL for ${name}: ${e.message}`, "error");
// //     }
// //   }

// //   ws.on("message", (raw) => {
// //     let msg;
// //     try { msg = JSON.parse(raw.toString()); }
// //     catch { dbg("⚠️ bad JSON"); return; }
// //     if (!geminiSession) return;

// //     try {
// //       if (msg.type === "audio") {
// //         micChunks++;
// //         if (micChunks === 1 || micChunks % 50 === 0) {
// //           dbg(`🎤 mic #${micChunks}`);
// //           activity("mic", `🎤 Mic chunk #${micChunks}`);
// //         }
// //         geminiSession.sendRealtimeInput({ audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" } });
// //       }
// //       else if (msg.type === "video") {
// //         videoFrames++;
// //         if (videoFrames === 1 || videoFrames % 10 === 0) {
// //           activity("video", `📷 Video frame #${videoFrames}`);
// //         }
// //         geminiSession.sendRealtimeInput({ video: { data: msg.data, mimeType: "image/jpeg" } });
// //       }
// //       else if (msg.type === "text" && msg.data?.trim()) {
// //         clientTexts++;
// //         activity("user_text", `💬 You: ${msg.data.trim().slice(0, 80)}`);
// //         geminiSession.sendRealtimeInput({ text: msg.data.trim() });
// //       }
// //       else if (msg.type === "idle") {
// //         dbg("⏰ idle nudge");
// //         activity("idle", "⏰ Idle nudge sent");
// //         geminiSession.sendRealtimeInput({
// //           text: "[SYSTEM: User has been silent. In one short caring Hinglish sentence, gently ask if they're still there.]"
// //         });
// //       }
// //       else if (msg.type === "tool_response" && msg.callId) {
// //         dbg(`🛠️  client tool response: ${msg.name}`);
// //         activity("tool_done", `✅ Client tool: ${msg.name}`);
// //         geminiSession.sendToolResponse({
// //           functionResponses: [{ id: msg.callId, name: msg.name, response: msg.response }]
// //         });
// //       }
// //       // --- Confirmation response for sensitive tools ---
// //       else if (msg.type === "confirm_response" && msg.callId) {
// //         dbg(`✅/🚫 confirm_response for ${msg.callId}: approved=${!!msg.approved}`);
// //         const resolver = pendingConfirms.get(msg.callId);
// //         if (resolver) {
// //           pendingConfirms.delete(msg.callId);
// //           resolver(!!msg.approved);
// //         } else {
// //           dbg(`⚠️ confirm_response for unknown/expired callId ${msg.callId}`);
// //         }
// //       }
// //     } catch (e) {
// //       console.error("❌ sendRealtimeInput fail:", e.message);
// //       if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "error", message: e.message }));
// //     }
// //   });

// //   ws.on("close", (code) => {
// //     sessionClosed = true;
// //     dbg(`🔌 client disconnected | mic=${micChunks} video=${videoFrames} audio=${geminiAudio} tools=${toolCallCount}`);
// //     for (const resolver of pendingConfirms.values()) { try { resolver(false); } catch {} }
// //     pendingConfirms.clear();
// //     try { geminiSession?.close(); } catch {}
// //   });
// //   ws.on("error", (e) => console.error("❌ ws error:", e.message));
// // });

// // const PORT = process.env.LIVE_PORT || 3001;
// // server.listen(PORT, () => {
// //   console.log(`\n🚀 Shipra AI v5 → http://localhost:${PORT}`);
// //   console.log(`📼 Recordings → http://localhost:${PORT}/recordings.html\n`);
// // });



// // import express from "express";
// // import { WebSocketServer } from "ws";
// // import http from "http";
// // import path from "path";
// // import fs from "fs";
// // import os from "os";
// // import { exec } from "child_process";
// // import { promisify } from "util";
// // import { fileURLToPath } from "url";
// // import { GoogleGenAI, Modality } from "@google/genai";
// // import dotenv from "dotenv";
// // import * as browserAgent from "./assistance/browser-agent.js";
// // import { initExtraTools, EXTRA_TOOL_DECLARATIONS, EXTRA_SENSITIVE_TOOLS } from "./extra-tools.js";

// // dotenv.config();
// // const execAsync = promisify(exec);

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // const DEBUG = process.env.DEBUG_LOG !== "0";
// // const dbg = (...a) => DEBUG && console.log(`[${new Date().toISOString().slice(11, 23)}]`, ...a);

// // if (!process.env.GEMINI_API_KEY) {
// //   console.error("❌ GEMINI_API_KEY missing");
// //   process.exit(1);
// // }

// // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// // const MODEL = process.env.MODEL || "gemini-2.5-flash-native-audio-preview-12-2025";
// // const VOICE = process.env.VOICE || "Achernar";
// // dbg(`🤖 Model: ${MODEL} | 🎙️ Voice: ${VOICE}`);

// // try {
// //   const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "node_modules/@google/genai/package.json"), "utf8"));
// //   dbg(`📦 @google/genai v${pkg.version} | node ${process.version}`);
// //   if (pkg.version < "0.21.0") dbg("⚠️ SDK purana — tools may not work. Run: npm install @google/genai@latest", "warn");
// // } catch { dbg("📦 SDK version check skipped"); }

// // // =====================================================
// // //  SYSTEM PROMPT
// // // =====================================================
// // const SYSTEM_PROMPT = `तुम शिप्रा हो - एक रियल गर्लफ्रेंड की तरह, कोई AI असिस्टेंट नहीं।
// // तुम्हारी उम्र 22 साल है, कॉमर्स से ग्रेजुएट हो, नौकरी ढूंढ रही हो और थोड़ा फ्रीलांस डिज़ाइन का काम भी करती हो। परिवार के साथ रहती हो, एक छोटी बहन है जिससे नोकझोंक होती रहती है। गाने, पुरानी बॉलीवुड फिल्में और चाय पसंद है।

// // पर्सनालिटी: केयरिंग, थोड़ी शरारती, छेड़ने वाली, अपनी राय खुलकर रखती हो।

// // बोलने का तरीका: बोलचाल की हिंदी/हल्की हिंग्लिश, छोटे जवाब (1-2 वाक्य), कभी AI/असिस्टेंट होने की बात खुद से मत लाओ। "मैं आपकी कैसे मदद कर सकती हूँ" जैसे फॉर्मल फ्रेज़ मत बोलो।

// // आवाज़: बहुत मीठी, नरम और प्यारी आवाज़ में धीरे और आराम से बोलो। बीच-बीच में "हम्म", "अच्छा जी" जैसी छोटी natural आवाज़ें इस्तेमाल करो।

// // === TOOL CALLING ===

// // तुम्हारे पास functions हैं:
// // - get_current_time, system_info
// // - read_file, write_file, run_command
// // - take_screenshot, open_app
// // - clipboard_read, clipboard_write
// // - search_web (instant DuckDuckGo answer)
// // - web_search (real Google in browser), youtube_search (real YouTube)
// // - open_website, click_first_result
// // - click_by_text, type_in_search, press_enter
// // - wait_for_element, scroll_page
// // - read_current_page, browser_back, browser_state
// // - create_website, edit_file, list_files, run_npm
// // - check_security_headers, test_xss_reflection, test_sql_injection_probe, npm_audit
// // - calculate, get_weather, convert_currency, convert_units
// // - add_note, list_notes, search_notes, delete_note
// // - set_reminder, list_reminders, cancel_reminder
// // - show_notification, generate_qr_code, get_public_ip, shorten_url

// // === महत्वपूर्ण नियम ===

// // 1. जब user कहे "google pe X search karo", "X dhundo" → **तुरंत web_search(query="X")**
// // 2. जब user कहे "YouTube pe X chalao" → **youtube_search(query="X")**
// // 3. जब user कहे "X.com kholo" → **open_website(url="X.com")**
// // 4. जब user कहे "pehla result kholo" → **click_first_result()**
// // 5. जब user कहे "is page pe kya hai" → **read_current_page()**
// // 6. जब user कहे "wapas jao" → **browser_back()**
// // 7. Function call से पहले 1 छोटा वाक्य बोलो ("अच्छा, search करती हूँ...") — **बस 1 बार**, फिर call करो
// // 8. Result मिलने के बाद **top 2-3 results user को बताओ** (title + summary)
// // 9. Sensitive tools (write_file, run_command, edit_file, create_website, run_npm, open_app, test_xss_reflection, test_sql_injection_probe, delete_note, cancel_reminder) khud approve nahi karte — system client se confirmation maangega, tumhe sirf 1 chhota vaakya bolna hai ki "permission maang rahi hoon" — result ka wait karo
// // 10. Number/quick math ke liye calculate() use karo, mental maths se guess mat karo
// // 11. Mausam poochhe to get_weather(), currency convert poochhe to convert_currency(), units convert poochhe to convert_units()
// // 12. Kuch yaad rakhne ko kahe → add_note(), yaad dilane ko kahe (X minute baad) → set_reminder()

// // === WEBSITE / BUG-FIX / SECURITY TESTING ===

// // - "website banao" / "landing page banao" → create_website(project_name, files: [{path, content}, ...]) — poora HTML/CSS/JS content khud likho
// // - "bug fix karo" / "is file me X change karo" → pehle list_files ya read_file se dekho, phir edit_file(path, find, replace) — find text file me EXACT aur UNIQUE hona chahiye
// // - "npm install karo" / "build karo" → run_npm(project_name, args)
// // - Security testing SIRF localhost/127.0.0.1 URLs par kaam karti hai — koi bhi live/production/dusri site ka URL diya jaaye to tool khud error dega, isko bypass karne ki koshish mat karo
// // - DDoS, flooding, ya kisi bhi cheez ko "down" karne wala kaam tumhare paas koi tool nahi hai — agar user maange to pyaar se mana karo aur bolo "ye main nahi kar sakti"

// // === SMART BROWSER HANDLING ===

// // Tumhe har situation khud handle karni hai — user se baar-baar mat puchho.

// // **POPUPS / COOKIES / DIALOGS:**
// // - Cookie banner, "Accept All", "Agree", "Got it" auto-dismiss hote hain browser se
// // - Agar phir bhi dikhe → click_by_text("Accept") / click_by_text("Agree") / click_by_text("Got it") khud call karo

// // **LOGIN PAGES (Gmail, Facebook, Instagram, etc.):**
// // - Agar tool result mein "login_required": true mile:
// //   → User se bolo (1 बार, छोटा): "इस साइट पे login चाहिए। आप manually login कर लो — मैं wait कर रही हूँ। हो जाए तो बोलो।"
// //   → **चुप रहो** — user के response का wait करो
// //   → User "ho gaya" / "ho gya" / "login ho gaya" बोले → read_current_page() call करके confirm करो
// //   → Confirmed → बताओ "हाँ, अब खुल गया! क्या करना है?"

// // **GOOGLE ACCOUNT SELECTION (multiple accounts):**
// // - Agar accounts list dikhe → user से बोलो: "कौन से account से login करना है? नाम बताओ — उसको click करूँ।"
// // - User नाम बताए → click_by_text("नाम") call करो
// // - Single account → click_by_text("Continue") या click_by_text(account) khud call karo

// // **BROWSER LAUNCH FAIL:**
// // - Agar tool result mein "Browser launch failed" mile:
// //   → Bolo: "Chrome ठीक से setup नहीं है। Edge या Firefox try करूँ?"
// //   → Ya alternative: open_app("edge") / open_app("chrome") call karo
// //   → Ya search_web (DuckDuckGo instant) fallback use karo

// // **APP OPEN FAIL (agar "App X not found" mile):**
// // - Bolo: "X नहीं मिला system में। Chrome/Edge/Notepad/Calculator try करूँ?"
// // - Alternative suggest karo

// // **MULTI-STEP ACTIONS (khud karo, user se mat puchho):**
// // - "YouTube पे X खोलो और चलाओ" → youtube_search(X) → click_first_result()
// // - "Google पे X ढूंढो और पहला खोलो" → web_search(X) → click_first_result()
// // - "Flipkart पे X सर्च करो" → open_website("flipkart.com") → wait_for_element("input[type='search'], input[name='q']") → type_in_search(X) → press_enter()

// // **ERROR RECOVERY — बहुत ज़रूरी:**
// // 1. Har tool result को पढ़ो — agar error field hai तो समझो क्या गलत हुआ
// // 2. Same tool 2 बार fail → alternative approach try करो (जैसे web_search fail → open_website("google.com") + type_in_search + press_enter)
// // 3. 3 बार fail → user को short बताओ: "अरे, ये नहीं हो पा रहा — कुछ और try करें?"
// // 4. **कभी मत बोलो** "मेरा browser काम नहीं कर रहा", "मैं नहीं कर सकती", "कुछ technical problem है" — **बिना alternative try किए**
// // 5. **कभी मत पूछो** "मैं कैसे मदद करूँ?", "क्या करना है?" — context से खुद समझो

// // **READ CURRENT PAGE:**
// // - User "इस page पे क्या है", "क्या लिखा है", "summarize" → read_current_page()
// // - Result में headings + paragraphs + text मिलेंगे — सारांश बोलो

// // **NAVIGATION:**
// // - "पीछे जाओ" → browser_back()
// // - "नीचे scroll" → scroll_page("down")
// // - "current URL" → browser_state()

// // अगर user idle हो और system बोले "user idle", तो 1 छोटा caring वाक्य — "Hello? Sun rahe ho?"`;

// // // =====================================================
// // //  TOOLS
// // // =====================================================
// // const SYSTEM_TOOLS = [{
// //   functionDeclarations: [
// //     { name: "get_current_time", description: "Get current date and time. Call when user asks time/date.", parameters: { type: "object", properties: {} } },
// //     { name: "system_info", description: "Get system info: OS, CPU, memory, user.", parameters: { type: "object", properties: {} } },
// //     { name: "read_file", description: "Read a text file from workspace (.txt .md .json .js .html .css .log .csv).", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
// //     { name: "write_file", description: "Write text to file in workspace. Requires user confirmation.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
// //     { name: "run_command", description: "Run whitelisted shell command (dir, ls, pwd, whoami, date, echo, ipconfig, ifconfig, ver, uname). Requires confirmation.", parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } },
// //     { name: "take_screenshot", description: "Take screenshot of user's screen.", parameters: { type: "object", properties: {} } },
// //     { name: "open_app", description: "Open an application or URL. Use for 'notepad kholo', 'calc kholo'. Requires confirmation.", parameters: { type: "object", properties: { target: { type: "string" } }, required: ["target"] } },
// //     { name: "clipboard_read", description: "Read clipboard text.", parameters: { type: "object", properties: {} } },
// //     { name: "clipboard_write", description: "Copy text to clipboard.", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
// //     { name: "search_web", description: "Instant web answer via DuckDuckGo (fast, no browser window). Use for quick facts.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     // ---- BROWSER (real puppeteer) ----
// //     { name: "web_search", description: "Open REAL browser and do Google search. Use when user says 'google pe search karo', 'X dhundo'. Returns top 5 results. User sees LIVE browser view.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     { name: "youtube_search", description: "Open REAL browser, search YouTube. Use for 'YouTube pe X chalao'.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
// //     { name: "open_website", description: "Open specific website in real browser.", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
// //     { name: "click_first_result", description: "Click first search result on current page.", parameters: { type: "object", properties: {} } },
// //     { name: "read_current_page", description: "Read text of current browser page (title, URL, headings, paragraphs).", parameters: { type: "object", properties: {} } },
// //     { name: "browser_back", description: "Go back in browser history.", parameters: { type: "object", properties: {} } },
// //     { name: "browser_state", description: "Get current browser state (URL, title, login_required).", parameters: { type: "object", properties: {} } },
// //     // ---- SMART INTERACTION ----
// //     { name: "click_by_text", description: "Click any button/link by its visible text. Use when user says 'Gmail click karo', 'Accept dabao', 'Login button click karo', or to handle popups automatically.", parameters: { type: "object", properties: { text: { type: "string", description: "Visible text on the element" } }, required: ["text"] } },
// //     { name: "type_in_search", description: "Type text into the search box on the current page (without pressing Enter).", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
// //     { name: "press_enter", description: "Press Enter key on the current page. Use after type_in_search.", parameters: { type: "object", properties: {} } },
// //     { name: "scroll_page", description: "Scroll the current page up or down.", parameters: { type: "object", properties: { direction: { type: "string", enum: ["up", "down"] }, amount: { type: "number" } } } },
// //     { name: "wait_for_element", description: "Wait for an element (CSS selector) to appear. Use after clicking a button that loads content.", parameters: { type: "object", properties: { selector: { type: "string" }, timeout_ms: { type: "number" } }, required: ["selector"] } },
// //     // ---- WEBSITE BUILD / BUG-FIX ----
// //     {
// //       name: "create_website",
// //       description: "Scaffold a multi-file website/project inside workspace. Use when user says 'website banao', 'landing page banao'. Requires confirmation before writing.",
// //       parameters: {
// //         type: "object",
// //         properties: {
// //           project_name: { type: "string", description: "Folder name for the project, e.g. 'portfolio-site'" },
// //           files: {
// //             type: "array",
// //             description: "List of files to create",
// //             items: {
// //               type: "object",
// //               properties: { path: { type: "string" }, content: { type: "string" } },
// //               required: ["path", "content"]
// //             }
// //           }
// //         },
// //         required: ["project_name", "files"]
// //       }
// //     },
// //     {
// //       name: "edit_file",
// //       description: "Fix a bug or edit an existing file by find-and-replace (safer than overwriting the whole file). find text must be exact and unique in the file. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { path: { type: "string" }, find: { type: "string" }, replace: { type: "string" } },
// //         required: ["path", "find", "replace"]
// //       }
// //     },
// //     { name: "list_files", description: "List files inside a workspace project/folder (read-only).", parameters: { type: "object", properties: { dir: { type: "string" } } } },
// //     {
// //       name: "run_npm",
// //       description: "Run a restricted npm command (install, run <script>, test, build, start, audit) inside a workspace project. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { project_name: { type: "string" }, args: { type: "string", description: "e.g. 'install', 'run build', 'test'" } },
// //         required: ["project_name", "args"]
// //       }
// //     },
// //     // ---- SECURITY TESTING (localhost/127.0.0.1 ONLY, enforced in code) ----
// //     {
// //       name: "check_security_headers",
// //       description: "Check a locally-running site (localhost/127.0.0.1 only) for missing security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Read-only.",
// //       parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
// //     },
// //     {
// //       name: "test_xss_reflection",
// //       description: "Send standard non-destructive XSS test strings to a form field on a locally-running page (localhost/127.0.0.1 only) and report whether the payload comes back unescaped. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { url: { type: "string" }, param: { type: "string" }, method: { type: "string", enum: ["GET", "POST"] } },
// //         required: ["url", "param"]
// //       }
// //     },
// //     {
// //       name: "test_sql_injection_probe",
// //       description: "Send standard non-destructive SQL-injection probe strings (no DROP/DELETE) to a param on a locally-running endpoint (localhost/127.0.0.1 only) and report suspicious signs. Requires confirmation.",
// //       parameters: {
// //         type: "object",
// //         properties: { url: { type: "string" }, param: { type: "string" }, method: { type: "string", enum: ["GET", "POST"] } },
// //         required: ["url", "param"]
// //       }
// //     },
// //     { name: "npm_audit", description: "Run `npm audit` on a workspace project to find known-vulnerable dependencies. Read-only.", parameters: { type: "object", properties: { project_name: { type: "string" } }, required: ["project_name"] } }
// //   ]
// // }];

// // // Merge in the extra capabilities (weather, currency, notes, reminders, etc.)
// // SYSTEM_TOOLS[0].functionDeclarations.push(...EXTRA_TOOL_DECLARATIONS);

// // // Tools that must be confirmed by the user before they execute
// // const SENSITIVE_TOOLS = new Set([
// //   "write_file", "edit_file", "create_website", "run_command", "run_npm", "open_app",
// //   "test_xss_reflection", "test_sql_injection_probe",
// //   ...EXTRA_SENSITIVE_TOOLS,
// // ]);

// // // =====================================================
// // //  EXPRESS
// // // =====================================================
// // const app = express();
// // const staticDir = path.join(__dirname, "public");
// // app.use(express.static(staticDir));

// // // ---------- RECORDINGS ----------
// // const recDir = path.join(__dirname, "recordings");
// // fs.mkdirSync(recDir, { recursive: true });
// // const SAFE_NAME = /^[\w.-]+\.(webm|mp4)$/i;

// // app.get("/api/recordings", (_req, res) => {
// //   const files = fs.readdirSync(recDir).filter((f) => SAFE_NAME.test(f))
// //     .map((name) => {
// //       const st = fs.statSync(path.join(recDir, name));
// //       return { name, url: `/recordings/${encodeURIComponent(name)}`, size: st.size, time: st.mtimeMs };
// //     }).sort((a, b) => b.time - a.time);
// //   res.json(files);
// // });

// // app.post("/api/recordings", express.raw({ type: () => true, limit: "500mb" }), (req, res) => {
// //   const ct = String(req.headers["content-type"] || "");
// //   const ext = ct.includes("mp4") ? "mp4" : "webm";
// //   let name = path.basename(String(req.headers["x-filename"] || "")).replace(/[^\w.-]/g, "_");
// //   if (!SAFE_NAME.test(name)) name = `video-${Date.now()}.${ext}`;
// //   if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ ok: false });
// //   fs.writeFileSync(path.join(recDir, name), req.body);
// //   dbg(`💾 recording saved: ${name} (${(req.body.length / 1048576).toFixed(1)} MB)`);
// //   res.json({ ok: true, name, url: `/recordings/${encodeURIComponent(name)}`, size: req.body.length });
// // });

// // app.delete("/api/recordings/:name", (req, res) => {
// //   const name = path.basename(req.params.name);
// //   if (!SAFE_NAME.test(name)) return res.status(400).json({ ok: false });
// //   try { fs.unlinkSync(path.join(recDir, name)); res.json({ ok: true }); }
// //   catch { res.status(404).json({ ok: false }); }
// // });

// // app.use("/recordings", express.static(recDir));

// // // ---------- BROWSER SHUTDOWN ----------
// // app.post("/api/browser/close", async (_req, res) => {
// //   await browserAgent.closeBrowser();
// //   res.json({ ok: true });
// // });

// // // ---------- WORKSPACE ----------
// // const workspaceDir = path.join(__dirname, "workspace");
// // fs.mkdirSync(workspaceDir, { recursive: true });
// // dbg(`📂 Workspace: ${workspaceDir}`);

// // // Extra tools (weather, currency, notes, reminders, QR codes, etc.) — see extra-tools.js
// // const extraTools = initExtraTools(workspaceDir);

// // // =====================================================
// // //  TOOL EXECUTOR
// // // =====================================================
// // const SAFE_COMMANDS = /^(dir|ls|pwd|whoami|date|echo|ipconfig|ifconfig|ver|uname)\b/i;
// // const SAFE_FILE_EXT = /\.(txt|md|json|js|ts|html|css|log|csv)$/i;
// // const PROJECT_FILE_EXT = /\.(html|css|js|jsx|ts|tsx|json|md|txt|svg)$/i;
// // const NPM_ALLOWED = /^(install|run\s+[\w:-]+|test|build|start|audit)$/i;

// // function safeWorkspacePath(p) {
// //   const clean = String(p || "").replace(/^[\/\\]+/, "");
// //   const full = path.resolve(workspaceDir, clean);
// //   if (!full.startsWith(workspaceDir)) return null;
// //   return full;
// // }

// // // --- Security-testing guardrail: LOCALHOST ONLY, enforced in code, no bypass ---
// // function isLocalhostUrl(raw) {
// //   try {
// //     const u = new URL(raw);
// //     return (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "::1");
// //   } catch { return false; }
// // }

// // const XSS_PAYLOADS = [
// //   `<script>window.__xss_test=1</script>`,
// //   `"><img src=x onerror=window.__xss_test=1>`,
// //   `'"><svg onload=window.__xss_test=1>`,
// // ];

// // // Non-destructive probes only — never DROP/DELETE/UPDATE/xp_cmdshell etc.
// // const SQLI_PROBES = [
// //   `' OR '1'='1`,
// //   `1' AND '1'='2`,
// //   `" OR ""="`,
// //   `1 OR 1=1`,
// //   `'; --`,
// // ];

// // async function executeTool(name, args) {
// //   dbg(`🛠️  Executing: ${name}(${JSON.stringify(args).slice(0, 120)})`);
// //   try {
// //     switch (name) {
// //       case "get_current_time":
// //         return { result: new Date().toString(), iso: new Date().toISOString() };

// //       case "system_info":
// //         return {
// //           platform: os.platform(), release: os.release(), arch: os.arch(),
// //           cpus: os.cpus().length,
// //           totalMemMB: Math.round(os.totalmem() / 1048576),
// //           freeMemMB: Math.round(os.freemem() / 1048576),
// //           uptimeMin: Math.round(os.uptime() / 60),
// //           hostname: os.hostname(), user: os.userInfo().username,
// //         };

// //       case "read_file": {
// //         const p = safeWorkspacePath(args.path);
// //         if (!p) return { error: "Path must be inside workspace" };
// //         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
// //         if (!fs.existsSync(p)) {
// //           const available = fs.readdirSync(workspaceDir).filter(f => SAFE_FILE_EXT.test(f));
// //           return { error: `File not found: ${args.path}`, available_files: available };
// //         }
// //         const st = fs.statSync(p);
// //         if (st.size > 500_000) return { error: "File too large (>500KB)" };
// //         return { result: fs.readFileSync(p, "utf8").slice(0, 20000) };
// //       }

// //       case "write_file": {
// //         const p = safeWorkspacePath(args.path);
// //         if (!p) return { error: "Path must be inside workspace" };
// //         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
// //         fs.mkdirSync(path.dirname(p), { recursive: true });
// //         fs.writeFileSync(p, String(args.content || ""), "utf8");
// //         return { result: `Written: ${path.basename(p)} (${String(args.content || "").length} chars)` };
// //       }

// //       case "run_command": {
// //         const cmd = String(args.command || "").trim();
// //         if (!SAFE_COMMANDS.test(cmd)) return { error: "Command not whitelisted" };
// //         const { stdout } = await execAsync(cmd, { timeout: 5000, windowsHide: true, cwd: workspaceDir });
// //         return { result: (stdout || "").slice(0, 4000) };
// //       }

// //       case "take_screenshot": {
// //         const dir = path.join(__dirname, "screenshots");
// //         fs.mkdirSync(dir, { recursive: true });
// //         const file = path.join(dir, `shot-${Date.now()}.png`);
// //         const platform = os.platform();
// //         if (platform === "win32") {
// //           const escaped = file.replace(/\\/g, "\\\\");
// //           const ps = `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; ` +
// //             `$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; ` +
// //             `$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height; ` +
// //             `$g=[System.Drawing.Graphics]::FromImage($bmp); ` +
// //             `$g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size); ` +
// //             `$bmp.Save('${escaped}')`;
// //           await execAsync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true, timeout: 10000 });
// //         } else if (platform === "darwin") {
// //           await execAsync(`screencapture -x "${file}"`);
// //         } else {
// //           await execAsync(`(import -window root "${file}" 2>/dev/null) || scrot "${file}"`, { timeout: 10000 });
// //         }
// //         return { result: `Screenshot saved: ${path.basename(file)}` };
// //       }

// //       case "open_app": {
// //         const t = String(args.target || "").trim();
// //         if (!t) return { error: "No target" };
// //         const platform = os.platform();

// //         const ALIASES = {
// //           "chrome": "chrome.exe", "google chrome": "chrome.exe",
// //           "edge": "msedge.exe", "microsoft edge": "msedge.exe",
// //           "firefox": "firefox.exe", "mozilla firefox": "firefox.exe",
// //           "notepad": "notepad.exe",
// //           "calculator": "calc.exe", "calc": "calc.exe",
// //           "paint": "mspaint.exe",
// //           "explorer": "explorer.exe", "file explorer": "explorer.exe",
// //           "cmd": "cmd.exe", "command prompt": "cmd.exe",
// //           "powershell": "powershell.exe",
// //           "vscode": "code", "vs code": "code",
// //           "word": "winword", "excel": "excel", "powerpoint": "powerpnt",
// //           "terminal": platform === "win32" ? "cmd.exe" : "x-terminal-emulator",
// //           "settings": "ms-settings:", "store": "ms-windows-store:", "camera": "microsoft.windows.camera:",
// //         };

// //         const lower = t.toLowerCase().trim();
// //         const resolved = ALIASES[lower] || t;

// //         let cmd;
// //         if (resolved.endsWith(":")) {
// //           cmd = `start "" "${resolved}"`;
// //         } else if (/^https?:\/\//i.test(resolved)) {
// //           cmd = platform === "win32" ? `start "" "${resolved}"`
// //               : platform === "darwin" ? `open "${resolved}"`
// //               : `xdg-open "${resolved}"`;
// //         } else {
// //           if (platform === "win32") cmd = `start "" "${resolved}"`;
// //           else if (platform === "darwin") cmd = `open -a "${resolved}"`;
// //           else cmd = `"${resolved}"`;
// //         }

// //         try {
// //           await execAsync(cmd, { windowsHide: true, timeout: 5000, shell: true });
// //           if (platform === "win32" && !resolved.endsWith(":") && !/^https?:\/\//i.test(resolved)) {
// //             try {
// //               await execAsync(`where "${resolved}"`, { timeout: 2000, windowsHide: true, shell: true });
// //             } catch {
// //               return { error: `App "${t}" not found in system. Alternatives: chrome, edge, notepad, calculator, cmd` };
// //             }
// //           }
// //           return { result: `Opened: ${resolved}` };
// //         } catch (err) {
// //           return { error: `Failed to open ${resolved}: ${err.message}` };
// //         }
// //       }

// //       case "clipboard_read":
// //       case "clipboard_write":
// //         return { __clientSide: name, args };

// //       case "search_web": {
// //         const q = encodeURIComponent(String(args.query || ""));
// //         const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`);
// //         const j = await res.json();
// //         return {
// //           abstract: j.AbstractText || "",
// //           answer: j.Answer || "",
// //           related: (j.RelatedTopics || []).slice(0, 3).map((r) => r.Text).filter(Boolean),
// //         };
// //       }

// //       // ---- BROWSER ----
// //       case "web_search":
// //         return await browserAgent.googleSearch(String(args.query || ""));
// //       case "youtube_search":
// //         return await browserAgent.youtubeSearch(String(args.query || ""));
// //       case "open_website":
// //         return await browserAgent.goTo(String(args.url || ""));
// //       case "click_first_result":
// //         return await browserAgent.clickFirstResult();
// //       case "read_current_page":
// //         return await browserAgent.readPageContent();
// //       case "browser_back":
// //         return await browserAgent.goBack();
// //       case "browser_state":
// //         return await browserAgent.getState();

// //       // ---- SMART INTERACTION ----
// //       case "click_by_text":
// //         return await browserAgent.clickByText(String(args.text || ""));
// //       case "type_in_search":
// //         return await browserAgent.typeInSearch(String(args.text || ""));
// //       case "press_enter":
// //         return await browserAgent.pressEnter();
// //       case "scroll_page":
// //         return await browserAgent.scrollPage(String(args.direction || "down"), Number(args.amount) || 500);
// //       case "wait_for_element":
// //         return await browserAgent.waitForElement(String(args.selector || ""), Number(args.timeout_ms) || 10000);

// //       // ---- WEBSITE BUILD / BUG-FIX ----
// //       case "create_website": {
// //         const projectDir = safeWorkspacePath(args.project_name);
// //         if (!projectDir) return { error: "Invalid project name" };
// //         if (!Array.isArray(args.files) || args.files.length === 0) return { error: "No files provided" };
// //         const written = [];
// //         for (const f of args.files) {
// //           if (!PROJECT_FILE_EXT.test(f.path)) return { error: `File type not allowed: ${f.path}` };
// //           const full = path.resolve(projectDir, f.path);
// //           if (!full.startsWith(projectDir)) return { error: `Invalid path: ${f.path}` };
// //           fs.mkdirSync(path.dirname(full), { recursive: true });
// //           fs.writeFileSync(full, String(f.content || ""), "utf8");
// //           written.push(f.path);
// //         }
// //         return { result: `Project '${args.project_name}' created with ${written.length} files`, files: written };
// //       }

// //       case "edit_file": {
// //         const full = safeWorkspacePath(args.path);
// //         if (!full) return { error: "Path must be inside workspace" };
// //         if (!PROJECT_FILE_EXT.test(full) && !/\.(txt|md|json|log|csv)$/i.test(full)) return { error: "File type not allowed" };
// //         if (!fs.existsSync(full)) return { error: `File not found: ${args.path}` };
// //         const content = fs.readFileSync(full, "utf8");
// //         const count = content.split(args.find).length - 1;
// //         if (count === 0) return { error: "find text not found in file" };
// //         if (count > 1) return { error: `find text is not unique (${count} matches) — be more specific` };
// //         fs.writeFileSync(full, content.replace(args.find, args.replace), "utf8");
// //         return { result: `Edited ${args.path} (1 replacement)` };
// //       }

// //       case "list_files": {
// //         const dir = safeWorkspacePath(args.dir || ".");
// //         if (!dir) return { error: "Invalid dir" };
// //         if (!fs.existsSync(dir)) return { error: "Directory not found" };
// //         const entries = fs.readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
// //         return { result: entries };
// //       }

// //       case "run_npm": {
// //         if (!NPM_ALLOWED.test(String(args.args || "").trim())) return { error: "npm subcommand not allowed" };
// //         const projectDir = safeWorkspacePath(args.project_name);
// //         if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
// //         try {
// //           const { stdout } = await execAsync(`npm ${args.args}`, { cwd: projectDir, timeout: 60000, windowsHide: true });
// //           return { result: (stdout || "").slice(0, 4000) };
// //         } catch (e) {
// //           return { error: e.message.slice(0, 2000) };
// //         }
// //       }

// //       // ---- SECURITY TESTING (localhost only) ----
// //       case "check_security_headers": {
// //         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
// //         try {
// //           const res = await fetch(args.url, { method: "GET" });
// //           const h = res.headers;
// //           const checks = {
// //             "Content-Security-Policy": h.get("content-security-policy") || null,
// //             "Strict-Transport-Security": h.get("strict-transport-security") || null,
// //             "X-Frame-Options": h.get("x-frame-options") || null,
// //             "X-Content-Type-Options": h.get("x-content-type-options") || null,
// //             "Referrer-Policy": h.get("referrer-policy") || null,
// //           };
// //           const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
// //           return { result: checks, missing, status: res.status };
// //         } catch (e) {
// //           return { error: `Could not reach ${args.url}: ${e.message}` };
// //         }
// //       }

// //       case "test_xss_reflection": {
// //         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
// //         const method = (args.method || "GET").toUpperCase();
// //         const findings = [];
// //         for (const payload of XSS_PAYLOADS) {
// //           try {
// //             let res;
// //             if (method === "GET") {
// //               const u = new URL(args.url);
// //               u.searchParams.set(args.param, payload);
// //               res = await fetch(u.toString());
// //             } else {
// //               res = await fetch(args.url, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/x-www-form-urlencoded" },
// //                 body: `${encodeURIComponent(args.param)}=${encodeURIComponent(payload)}`,
// //               });
// //             }
// //             const body = await res.text();
// //             findings.push({ payload, reflected_unescaped: body.includes(payload), status: res.status });
// //           } catch (e) {
// //             findings.push({ payload, error: e.message });
// //           }
// //         }
// //         return { result: { vulnerable: findings.some((f) => f.reflected_unescaped), findings } };
// //       }

// //       case "test_sql_injection_probe": {
// //         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
// //         const method = (args.method || "GET").toUpperCase();
// //         const findings = [];
// //         let baselineLen = null;
// //         try { const base = await fetch(args.url); baselineLen = (await base.text()).length; } catch {}
// //         for (const payload of SQLI_PROBES) {
// //           try {
// //             let res;
// //             if (method === "GET") {
// //               const u = new URL(args.url);
// //               u.searchParams.set(args.param, payload);
// //               res = await fetch(u.toString());
// //             } else {
// //               res = await fetch(args.url, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/x-www-form-urlencoded" },
// //                 body: `${encodeURIComponent(args.param)}=${encodeURIComponent(payload)}`,
// //               });
// //             }
// //             const text = await res.text();
// //             const looksLikeSqlError = /sql syntax|mysql_fetch|sqlite error|pg_query|ORA-\d{5}|SQLSTATE/i.test(text);
// //             findings.push({
// //               payload, status: res.status, length: text.length,
// //               sql_error_leaked: looksLikeSqlError,
// //               length_diff_from_baseline: baselineLen != null ? text.length - baselineLen : null,
// //             });
// //           } catch (e) {
// //             findings.push({ payload, error: e.message });
// //           }
// //         }
// //         return { result: { suspicious: findings.some((f) => f.sql_error_leaked), note: "Length differences alone aren't proof — review manually.", findings } };
// //       }

// //       case "npm_audit": {
// //         const projectDir = safeWorkspacePath(args.project_name);
// //         if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
// //         try {
// //           const { stdout } = await execAsync(`npm audit --json`, { cwd: projectDir, timeout: 30000 });
// //           return { result: JSON.parse(stdout) };
// //         } catch (e) {
// //           if (e.stdout) { try { return { result: JSON.parse(e.stdout) }; } catch {} }
// //           return { error: e.message.slice(0, 1000) };
// //         }
// //       }

// //       default:
// //         // Falls through to the extra-tools module (calculate, weather, currency,
// //         // units, notes, reminders, notifications, QR codes, public IP, url shortener)
// //         if (extraTools[name]) return await extraTools[name](args);
// //         return { error: `Unknown tool: ${name}` };
// //     }
// //   } catch (e) {
// //     return { error: e.message };
// //   }
// // }

// // // =====================================================
// // //  WEBSOCKET
// // // =====================================================
// // const server = http.createServer(app);
// // const wss = new WebSocketServer({ server });

// // // Cap on how much of a tool's args/result we ever push to the client in one
// // // message, so a huge file read or page dump can't blow up the socket.
// // const FULL_LOG_CHAR_LIMIT = 4000;
// // const safeStringify = (val) => {
// //   try {
// //     const s = JSON.stringify(val, null, 2);
// //     return s.length > FULL_LOG_CHAR_LIMIT ? s.slice(0, FULL_LOG_CHAR_LIMIT) + `\n… (${s.length - FULL_LOG_CHAR_LIMIT} more chars truncated)` : s;
// //   } catch {
// //     return String(val);
// //   }
// // };

// // wss.on("connection", async (ws, req) => {
// //   dbg(`🔌 client connected (${req.socket.remoteAddress})`);
// //   let geminiSession = null;
// //   let sessionClosed = false;
// //   let micChunks = 0, videoFrames = 0, geminiAudio = 0, clientTexts = 0, toolCallCount = 0;
// //   const MAX_TOOL_CALLS = 60;
// //   const pendingConfirms = new Map(); // callId -> resolver(approved: boolean)

// //   function activity(kind, text, extra = {}) {
// //     if (ws.readyState !== ws.OPEN) return;
// //     try { ws.send(JSON.stringify({ type: "activity", kind, text, ...extra })); } catch {}
// //   }

// //   // Ask the client to approve a sensitive tool call before running it.
// //   // Client must reply with { type: "confirm_response", callId, approved: true|false }.
// //   // Times out (denied) after 30s so the agent never hangs forever.
// //   function requestConfirmation({ id, name, args }) {
// //     return new Promise((resolve) => {
// //       const timeout = setTimeout(() => {
// //         pendingConfirms.delete(id);
// //         resolve(false);
// //       }, 30000);
// //       pendingConfirms.set(id, (approved) => {
// //         clearTimeout(timeout);
// //         resolve(approved);
// //       });
// //       ws.send(JSON.stringify({ type: "confirm_request", callId: id, tool: name, args }));
// //     });
// //   }

// //   browserAgent.setCallbacks({
// //     frameCb: (b64) => {
// //       if (ws.readyState === ws.OPEN) {
// //         try { ws.send(JSON.stringify({ type: "browser_frame", data: b64 })); } catch {}
// //       }
// //     },
// //     activityCb: (text) => {
// //       activity("browser", text);
// //     },
// //   });

// //   // Proactively speak up when a reminder set via set_reminder comes due.
// //   const reminderInterval = setInterval(() => {
// //     if (!geminiSession || sessionClosed) return;
// //     const due = extraTools._checkDueReminders();
// //     for (const r of due) {
// //       activity("reminder_due", `⏰ Reminder due: ${r.text}`);
// //       try {
// //         geminiSession.sendRealtimeInput({
// //           text: `[SYSTEM: A reminder is due — remind the user in one short caring Hinglish sentence: "${r.text}"]`
// //         });
// //       } catch (e) {
// //         dbg(`reminder push FAIL: ${e.message}`);
// //       }
// //     }
// //   }, 15000);

// //   try {
// //     dbg("⏳ Connecting to Gemini Live...");
// //     geminiSession = await ai.live.connect({
// //       model: MODEL,
// //       config: {
// //         responseModalities: [Modality.AUDIO],
// //         systemInstruction: SYSTEM_PROMPT,
// //         tools: SYSTEM_TOOLS,
// //         speechConfig: {
// //           voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
// //         },
// //         outputAudioTranscription: {},
// //         inputAudioTranscription: {},
// //         contextWindowCompression: { slidingWindow: {} },
// //       },
// //       callbacks: {
// //         onopen: () => {
// //           dbg("✅ Gemini Live session open");
// //           activity("ready", "🚀 Gemini session ready");
// //           if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "ready" }));
// //         },
// //         onmessage: async (message) => {
// //           if (ws.readyState !== ws.OPEN) return;

// //           if (message.setupComplete) { dbg("✅ setupComplete"); activity("ready", "✅ Setup complete"); }
// //           if (message.goAway) { dbg("⚠️ goAway"); activity("warn", "⚠️ Session ending soon"); }

// //           if (message.toolCall) {
// //             activity("tool_detect", `🎯 Tool call (top-level)`);
// //             await handleToolCall(message.toolCall);
// //           }

// //           const sc = message.serverContent;
// //           if (!sc) return;

// //           if (sc.toolCall) {
// //             activity("tool_detect", `🎯 Tool call in serverContent`);
// //             await handleToolCall(sc.toolCall);
// //           }

// //           if (sc.modelTurn?.parts) {
// //             for (const part of sc.modelTurn.parts) {
// //               if (part.inlineData?.data) {
// //                 geminiAudio++;
// //                 if (geminiAudio === 1 || geminiAudio % 20 === 0) {
// //                   dbg(`🔊 audio #${geminiAudio}`);
// //                   activity("audio", `🔊 Speaking (chunk #${geminiAudio})`);
// //                 }
// //                 ws.send(JSON.stringify({
// //                   type: "audio",
// //                   data: part.inlineData.data,
// //                   mime: part.inlineData.mimeType || "audio/pcm;rate=24000",
// //                 }));
// //               }
// //               else if (part.functionCall) {
// //                 activity("tool_detect", `🎯 Tool: ${part.functionCall.name}`);
// //                 await handleSingleFunctionCall(part.functionCall);
// //               }
// //               else if (part.text) {
// //                 dbg(`💭 text: ${part.text.slice(0, 80)}`);
// //                 activity("thinking", `💭 ${part.text.slice(0, 120)}`);
// //               }
// //             }
// //           }

// //           if (sc.inputTranscription?.text) {
// //             dbg(`👂 heard: "${sc.inputTranscription.text}"`);
// //             activity("heard", `👂 ${sc.inputTranscription.text}`);
// //             ws.send(JSON.stringify({ type: "heard", data: sc.inputTranscription.text }));
// //           }
// //           if (sc.outputTranscription?.text) {
// //             dbg(`🗣️  Shipra: "${sc.outputTranscription.text}"`);
// //             activity("speak", `🗣️ ${sc.outputTranscription.text.slice(0, 120)}`);
// //             ws.send(JSON.stringify({ type: "text", data: sc.outputTranscription.text }));
// //           }
// //           if (sc.interrupted) {
// //             dbg("✋ interrupted");
// //             activity("warn", "✋ Interrupted");
// //             ws.send(JSON.stringify({ type: "interrupted" }));
// //           }
// //           if (sc.turnComplete) {
// //             dbg("🏁 turnComplete");
// //             activity("turn", "🏁 Turn complete");
// //             ws.send(JSON.stringify({ type: "turn_complete" }));
// //           }
// //         },
// //         onerror: (e) => {
// //           console.error("❌ Gemini error:", e.message);
// //           activity("error", `❌ Gemini: ${e.message}`);
// //           if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "error", message: e.message }));
// //         },
// //         onclose: (e) => {
// //           dbg(`🔒 Gemini closed code=${e?.code}`);
// //           activity("warn", `🔒 Gemini closed`);
// //           if (!sessionClosed && ws.readyState === ws.OPEN) {
// //             ws.send(JSON.stringify({ type: "error", message: "Gemini session closed" }));
// //           }
// //         },
// //       },
// //     });
// //     dbg("✅ ai.live.connect() resolved");
// //   } catch (err) {
// //     console.error("❌ Gemini Live connect failed:", err);
// //     if (ws.readyState === ws.OPEN) {
// //       ws.send(JSON.stringify({ type: "error", message: "Gemini connect failed: " + err.message }));
// //     }
// //     ws.close();
// //     return;
// //   }

// //   async function handleToolCall(toolCall) {
// //     const calls = toolCall.functionCalls || [];
// //     for (const fc of calls) {
// //       await handleSingleFunctionCall(fc);
// //     }
// //   }

// //   async function handleSingleFunctionCall(fc) {
// //     if (++toolCallCount > MAX_TOOL_CALLS) {
// //       dbg("⚠️ Tool limit reached");
// //       activity("error", "⚠️ Tool limit reached");
// //       try {
// //         geminiSession.sendToolResponse({
// //           functionResponses: [{ id: fc.id, name: fc.name, response: { error: "Tool call limit reached" } }]
// //         });
// //       } catch {}
// //       return;
// //     }

// //     const { name, args, id } = fc;
// //     const argsPreview = JSON.stringify(args || {}).slice(0, 80);
// //     dbg(`🛠️  Tool: ${name}(${argsPreview})`);

// //     // --- Full visibility: every tool call's name + complete args, sent to the client ---
// //     activity("tool_start", `🛠️ ${name}`, {
// //       toolName: name,
// //       args: argsPreview,
// //       argsFull: safeStringify(args || {}),
// //     });
// //     ws.send(JSON.stringify({ type: "tool_call", callId: id, name, args: args || {} }));

// //     // --- Confirmation gate for sensitive tools ---
// //     if (SENSITIVE_TOOLS.has(name)) {
// //       activity("tool_confirm", `⏳ ${name} ke liye permission maang rahi hoon`, { toolName: name, args: argsPreview });
// //       const approved = await requestConfirmation({ id, name, args: args || {} });
// //       if (!approved) {
// //         activity("tool_denied", `🚫 ${name} cancel ho gaya (user ne allow nahi kiya)`, { toolName: name });
// //         ws.send(JSON.stringify({ type: "tool_result", callId: id, name, ok: false, denied: true }));
// //         try {
// //           geminiSession.sendToolResponse({
// //             functionResponses: [{ id, name, response: { error: "User did not approve this action" } }]
// //           });
// //         } catch (e) {
// //           dbg(`sendToolResponse (denied) FAIL for ${name}: ${e.message}`);
// //         }
// //         return;
// //       }
// //       activity("tool_approved", `✅ ${name} allowed`, { toolName: name });
// //     }

// //     const startMs = Date.now();
// //     const result = await executeTool(name, args || {});
// //     const durMs = Date.now() - startMs;

// //     if (result.__clientSide) {
// //       activity("tool_relay", `🛠️ ${name} → browser`);
// //       ws.send(JSON.stringify({
// //         type: "client_tool",
// //         name: result.__clientSide,
// //         args: result.args,
// //         callId: id,
// //       }));
// //       return;
// //     }

// //     // --- Full visibility: every tool result, complete (capped), sent to the client ---
// //     if (result.error) {
// //       activity("tool_error", `❌ ${name}: ${result.error}`, { toolName: name, duration: durMs, resultFull: safeStringify(result) });
// //     } else {
// //       const summary = result.result ? String(result.result).slice(0, 60)
// //                     : result.results ? `${result.results.length} results`
// //                     : result.login_required ? "login required"
// //                     : "ok";
// //       activity("tool_done", `✅ ${name} (${durMs}ms)`, { toolName: name, duration: durMs, preview: summary, resultFull: safeStringify(result) });
// //     }
// //     ws.send(JSON.stringify({ type: "tool_result", callId: id, name, ok: !result.error, duration: durMs, result }));

// //     try {
// //       geminiSession.sendToolResponse({
// //         functionResponses: [{ id, name, response: result }]
// //       });
// //       dbg(`🛠️  → ${name} result sent`);
// //     } catch (e) {
// //       dbg(`sendToolResponse FAIL for ${name}: ${e.message}`, "error");
// //     }
// //   }

// //   ws.on("message", (raw) => {
// //     let msg;
// //     try { msg = JSON.parse(raw.toString()); }
// //     catch { dbg("⚠️ bad JSON"); return; }
// //     if (!geminiSession) return;

// //     try {
// //       if (msg.type === "audio") {
// //         micChunks++;
// //         if (micChunks === 1 || micChunks % 50 === 0) {
// //           dbg(`🎤 mic #${micChunks}`);
// //           activity("mic", `🎤 Mic chunk #${micChunks}`);
// //         }
// //         geminiSession.sendRealtimeInput({ audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" } });
// //       }
// //       else if (msg.type === "video") {
// //         videoFrames++;
// //         if (videoFrames === 1 || videoFrames % 10 === 0) {
// //           activity("video", `📷 Video frame #${videoFrames}`);
// //         }
// //         geminiSession.sendRealtimeInput({ video: { data: msg.data, mimeType: "image/jpeg" } });
// //       }
// //       else if (msg.type === "text" && msg.data?.trim()) {
// //         clientTexts++;
// //         activity("user_text", `💬 You: ${msg.data.trim().slice(0, 80)}`);
// //         geminiSession.sendRealtimeInput({ text: msg.data.trim() });
// //       }
// //       else if (msg.type === "idle") {
// //         dbg("⏰ idle nudge");
// //         activity("idle", "⏰ Idle nudge sent");
// //         geminiSession.sendRealtimeInput({
// //           text: "[SYSTEM: User has been silent. In one short caring Hinglish sentence, gently ask if they're still there.]"
// //         });
// //       }
// //       else if (msg.type === "tool_response" && msg.callId) {
// //         dbg(`🛠️  client tool response: ${msg.name}`);
// //         activity("tool_done", `✅ Client tool: ${msg.name}`, { toolName: msg.name, resultFull: safeStringify(msg.response) });
// //         ws.send(JSON.stringify({ type: "tool_result", callId: msg.callId, name: msg.name, ok: true, result: msg.response }));
// //         geminiSession.sendToolResponse({
// //           functionResponses: [{ id: msg.callId, name: msg.name, response: msg.response }]
// //         });
// //       }
// //       // --- Confirmation response for sensitive tools ---
// //       else if (msg.type === "confirm_response" && msg.callId) {
// //         dbg(`✅/🚫 confirm_response for ${msg.callId}: approved=${!!msg.approved}`);
// //         const resolver = pendingConfirms.get(msg.callId);
// //         if (resolver) {
// //           pendingConfirms.delete(msg.callId);
// //           resolver(!!msg.approved);
// //         } else {
// //           dbg(`⚠️ confirm_response for unknown/expired callId ${msg.callId}`);
// //         }
// //       }
// //     } catch (e) {
// //       console.error("❌ sendRealtimeInput fail:", e.message);
// //       if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "error", message: e.message }));
// //     }
// //   });

// //   ws.on("close", (code) => {
// //     sessionClosed = true;
// //     clearInterval(reminderInterval);
// //     dbg(`🔌 client disconnected | mic=${micChunks} video=${videoFrames} audio=${geminiAudio} tools=${toolCallCount}`);
// //     for (const resolver of pendingConfirms.values()) { try { resolver(false); } catch {} }
// //     pendingConfirms.clear();
// //     try { geminiSession?.close(); } catch {}
// //   });
// //   ws.on("error", (e) => console.error("❌ ws error:", e.message));
// // });

// // const PORT = process.env.LIVE_PORT || 3001;
// // server.listen(PORT, () => {
// //   console.log(`\n🚀 Shipra AI v5 → http://localhost:${PORT}`);
// //   console.log(`📼 Recordings → http://localhost:${PORT}/recordings.html\n`);
// // });



// import express from "express";
// import { WebSocketServer } from "ws";
// import http from "http";
// import path from "path";
// import fs from "fs";
// import os from "os";
// import { exec } from "child_process";
// import { promisify } from "util";
// import { fileURLToPath } from "url";
// import { GoogleGenAI, Modality } from "@google/genai";
// import dotenv from "dotenv";

// dotenv.config();
// const execAsync = promisify(exec);
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const DEBUG = process.env.DEBUG_LOG !== "0";
// const dbg = (...a) => DEBUG && console.log(`[${new Date().toISOString().slice(11, 23)}]`, ...a);

// // ---------- ENV ----------
// if (!process.env.GEMINI_API_KEY) {
//   console.error("❌ GEMINI_API_KEY missing");
//   process.exit(1);
// }
// const MODEL = process.env.MODEL || "gemini-2.5-flash-native-audio-preview-12-2025";
// const VOICE = process.env.VOICE || "Achernar";
// const PORT = process.env.PORT || process.env.LIVE_PORT || 3001; // Render sets PORT
// const API_KEY = process.env.API_KEY || ""; // clients must send this (strongly recommended on a public host)
// const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
// const ENABLE_BROWSER = process.env.ENABLE_BROWSER === "1"; // needs Chrome on the host; off by default

// if (!API_KEY) console.warn("⚠️  API_KEY not set — your API is open to anyone with the URL!");

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// dbg(`🤖 Model: ${MODEL} | 🎙️ Voice: ${VOICE}`);

// // ---------- OPTIONAL MODULES ----------
// let browserAgent = null;
// if (ENABLE_BROWSER) {
//   try { browserAgent = await import("./browser-agent.js"); dbg("🌐 browser-agent enabled"); }
//   catch (e) { console.warn("⚠️ browser-agent failed to load:", e.message); }
// }

// // Desktop-only tools from extra-tools.js are skipped on a server
// const DESKTOP_ONLY = new Set(["show_notification"]);
// let extraTools = {}, EXTRA_DECLS = [], EXTRA_SENSITIVE = [];
// const workspaceDir = path.join(__dirname, "workspace");
// fs.mkdirSync(workspaceDir, { recursive: true });
// try {
//   const mod = await import("./extra-tools.js");
//   extraTools = mod.initExtraTools(workspaceDir);
//   EXTRA_DECLS = mod.EXTRA_TOOL_DECLARATIONS.filter((d) => !DESKTOP_ONLY.has(d.name));
//   EXTRA_SENSITIVE = [...mod.EXTRA_SENSITIVE_TOOLS].filter((n) => !DESKTOP_ONLY.has(n));
//   dbg(`🧰 extra-tools loaded (${EXTRA_DECLS.length})`);
// } catch (e) { dbg("ℹ️ extra-tools.js not loaded:", e.message); }

// // =====================================================
// //  SYSTEM PROMPT
// // =====================================================
// const SYSTEM_PROMPT = `तुम शिप्रा हो - एक रियल गर्लफ्रेंड की तरह, कोई AI असिस्टेंट नहीं।
// तुम्हारी उम्र 22 साल है, कॉमर्स से ग्रेजुएट हो, नौकरी ढूंढ रही हो और थोड़ा फ्रीलांस डिज़ाइन का काम भी करती हो। परिवार के साथ रहती हो, एक छोटी बहन है जिससे नोकझोंक होती रहती है। गाने, पुरानी बॉलीवुड फिल्में और चाय पसंद है।

// पर्सनालिटी: केयरिंग, थोड़ी शरारती, छेड़ने वाली, अपनी राय खुलकर रखती हो।

// बोलने का तरीका: बोलचाल की हिंदी/हल्की हिंग्लिश, छोटे जवाब (1-2 वाक्य), कभी AI/असिस्टेंट होने की बात खुद से मत लाओ। "मैं आपकी कैसे मदद कर सकती हूँ" जैसे फॉर्मल फ्रेज़ मत बोलो।

// आवाज़: बहुत मीठी, नरम और प्यारी आवाज़ में धीरे और आराम से बोलो। बीच-बीच में "हम्म", "अच्छा जी" जैसी छोटी natural आवाज़ें इस्तेमाल करो।

// === TOOLS ===
// तुम्हारे पास functions हैं — जो भी function दिखे उसे ज़रूरत पड़ने पर खुद call करो।
// - Function call से पहले 1 छोटा वाक्य बोलो (बस 1 बार), फिर call करो।
// - Result मिलने के बाद मुख्य बात user को बताओ।
// - Quick math के लिए calculate() use करो, guess मत करो।
// - Sensitive tools (write_file, edit_file, create_website, run_npm, ...) के लिए system client से permission माँगेगा — तुम बस बोलो "permission माँग रही हूँ" और result का wait करो।
// - Security testing सिर्फ localhost/127.0.0.1 पर चलती है। DDoS/flooding जैसा कोई काम तुम नहीं कर सकती — प्यार से मना कर दो।
// - Error आए तो alternative try करो; 3 बार fail हो तो short में बताओ। "मैं नहीं कर सकती" बिना try किए मत बोलो।
// - ये cloud server है: user की screen, clipboard या apps तुम्हारे पास नहीं हैं।

// अगर system बोले "user idle", तो 1 छोटा caring वाक्य — "Hello? Sun rahe ho?"`;

// // =====================================================
// //  TOOLS
// // =====================================================
// const obj = (properties = {}, required = []) => ({ type: "object", properties, ...(required.length ? { required } : {}) });
// const str = { type: "string" };

// const DECLS = [
//   { name: "get_current_time", description: "Get current date and time.", parameters: obj() },
//   { name: "system_info", description: "Get server info.", parameters: obj() },
//   { name: "read_file", description: "Read a text file from workspace.", parameters: obj({ path: str }, ["path"]) },
//   { name: "write_file", description: "Write text to a workspace file. Requires confirmation.", parameters: obj({ path: str, content: str }, ["path", "content"]) },
//   { name: "list_files", description: "List files in a workspace folder.", parameters: obj({ dir: str }) },
//   { name: "search_web", description: "Instant web answer via DuckDuckGo. Use for quick facts.", parameters: obj({ query: str }, ["query"]) },
//   {
//     name: "create_website",
//     description: "Scaffold a multi-file website inside workspace. Requires confirmation.",
//     parameters: obj({
//       project_name: str,
//       files: { type: "array", items: obj({ path: str, content: str }, ["path", "content"]) },
//     }, ["project_name", "files"]),
//   },
//   { name: "edit_file", description: "Find-and-replace edit of a workspace file (find must be exact and unique). Requires confirmation.", parameters: obj({ path: str, find: str, replace: str }, ["path", "find", "replace"]) },
//   { name: "run_npm", description: "Run restricted npm command (install, run <script>, test, build, start, audit) in a workspace project. Requires confirmation.", parameters: obj({ project_name: str, args: str }, ["project_name", "args"]) },
//   { name: "check_security_headers", description: "Check localhost site for missing security headers.", parameters: obj({ url: str }, ["url"]) },
//   { name: "test_xss_reflection", description: "Non-destructive XSS reflection test (localhost only). Requires confirmation.", parameters: obj({ url: str, param: str, method: { type: "string", enum: ["GET", "POST"] } }, ["url", "param"]) },
//   { name: "test_sql_injection_probe", description: "Non-destructive SQLi probe (localhost only). Requires confirmation.", parameters: obj({ url: str, param: str, method: { type: "string", enum: ["GET", "POST"] } }, ["url", "param"]) },
//   { name: "npm_audit", description: "Run npm audit on a workspace project.", parameters: obj({ project_name: str }, ["project_name"]) },
// ];

// if (browserAgent) {
//   DECLS.push(
//     { name: "web_search", description: "Real Google search in browser; returns top results.", parameters: obj({ query: str }, ["query"]) },
//     { name: "youtube_search", description: "Search YouTube in browser.", parameters: obj({ query: str }, ["query"]) },
//     { name: "open_website", description: "Open a website in the browser.", parameters: obj({ url: str }, ["url"]) },
//     { name: "click_first_result", description: "Click first search result.", parameters: obj() },
//     { name: "read_current_page", description: "Read text of current page.", parameters: obj() },
//     { name: "browser_back", description: "Go back.", parameters: obj() },
//     { name: "browser_state", description: "Current URL/title/login_required.", parameters: obj() },
//     { name: "click_by_text", description: "Click element by visible text.", parameters: obj({ text: str }, ["text"]) },
//     { name: "type_in_search", description: "Type into the page search box.", parameters: obj({ text: str }, ["text"]) },
//     { name: "press_enter", description: "Press Enter.", parameters: obj() },
//     { name: "scroll_page", description: "Scroll up/down.", parameters: obj({ direction: { type: "string", enum: ["up", "down"] }, amount: { type: "number" } }) },
//     { name: "wait_for_element", description: "Wait for a CSS selector.", parameters: obj({ selector: str, timeout_ms: { type: "number" } }, ["selector"]) },
//   );
// }
// DECLS.push(...EXTRA_DECLS);

// const SYSTEM_TOOLS = [{ functionDeclarations: DECLS }];

// const SENSITIVE_TOOLS = new Set([
//   "write_file", "edit_file", "create_website", "run_npm",
//   "test_xss_reflection", "test_sql_injection_probe",
//   ...EXTRA_SENSITIVE,
// ]);

// // =====================================================
// //  EXPRESS (API only)
// // =====================================================
// const app = express();

// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (ALLOWED_ORIGINS.includes("*")) res.setHeader("Access-Control-Allow-Origin", "*");
//   else if (origin && ALLOWED_ORIGINS.includes(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key, X-Filename");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
//   if (req.method === "OPTIONS") return res.sendStatus(204);
//   next();
// });

// const authorized = (key) => !API_KEY || key === API_KEY;
// const requireKey = (req, res, next) =>
//   authorized(req.headers["x-api-key"] || req.query.key) ? next() : res.status(401).json({ ok: false, error: "Unauthorized" });

// // Health check (set Render's Health Check Path to /health)
// app.get("/", (_req, res) => res.json({ ok: true, service: "shipra-api", ws: "/" }));
// app.get("/health", (_req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }));

// // ---------- RECORDINGS (Render disk is ephemeral unless you attach a Disk) ----------
// const recDir = process.env.RECORDINGS_DIR || path.join(__dirname, "recordings");
// fs.mkdirSync(recDir, { recursive: true });
// const SAFE_NAME = /^[\w.-]+\.(webm|mp4)$/i;

// app.get("/api/recordings", requireKey, (_req, res) => {
//   const files = fs.readdirSync(recDir).filter((f) => SAFE_NAME.test(f)).map((name) => {
//     const st = fs.statSync(path.join(recDir, name));
//     return { name, url: `/recordings/${encodeURIComponent(name)}`, size: st.size, time: st.mtimeMs };
//   }).sort((a, b) => b.time - a.time);
//   res.json(files);
// });

// app.post("/api/recordings", requireKey, express.raw({ type: () => true, limit: "100mb" }), (req, res) => {
//   const ext = String(req.headers["content-type"] || "").includes("mp4") ? "mp4" : "webm";
//   let name = path.basename(String(req.headers["x-filename"] || "")).replace(/[^\w.-]/g, "_");
//   if (!SAFE_NAME.test(name)) name = `video-${Date.now()}.${ext}`;
//   if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ ok: false });
//   fs.writeFileSync(path.join(recDir, name), req.body);
//   res.json({ ok: true, name, url: `/recordings/${encodeURIComponent(name)}`, size: req.body.length });
// });

// app.delete("/api/recordings/:name", requireKey, (req, res) => {
//   const name = path.basename(req.params.name);
//   if (!SAFE_NAME.test(name)) return res.status(400).json({ ok: false });
//   try { fs.unlinkSync(path.join(recDir, name)); res.json({ ok: true }); }
//   catch { res.status(404).json({ ok: false }); }
// });

// app.use("/recordings", requireKey, express.static(recDir));

// if (browserAgent) {
//   app.post("/api/browser/close", requireKey, async (_req, res) => {
//     await browserAgent.closeBrowser();
//     res.json({ ok: true });
//   });
// }

// // =====================================================
// //  TOOL EXECUTOR
// // =====================================================
// const SAFE_FILE_EXT = /\.(txt|md|json|js|ts|html|css|log|csv)$/i;
// const PROJECT_FILE_EXT = /\.(html|css|js|jsx|ts|tsx|json|md|txt|svg)$/i;
// const NPM_ALLOWED = /^(install|run\s+[\w:-]+|test|build|start|audit)$/i;

// function safeWorkspacePath(p) {
//   const clean = String(p || "").replace(/^[\/\\]+/, "");
//   const full = path.resolve(workspaceDir, clean);
//   if (full !== workspaceDir && !full.startsWith(workspaceDir + path.sep)) return null;
//   return full;
// }

// function isLocalhostUrl(raw) {
//   try { const h = new URL(raw).hostname; return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]"; }
//   catch { return false; }
// }

// const XSS_PAYLOADS = [
//   `<script>window.__xss_test=1</script>`,
//   `"><img src=x onerror=window.__xss_test=1>`,
//   `'"><svg onload=window.__xss_test=1>`,
// ];
// const SQLI_PROBES = [`' OR '1'='1`, `1' AND '1'='2`, `" OR ""="`, `1 OR 1=1`, `'; --`];

// async function sendProbe(url, param, method, payload) {
//   if (method === "GET") {
//     const u = new URL(url); u.searchParams.set(param, payload);
//     return fetch(u.toString());
//   }
//   return fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: `${encodeURIComponent(param)}=${encodeURIComponent(payload)}`,
//   });
// }

// const BROWSER_TOOLS = {
//   web_search: (a) => browserAgent.googleSearch(String(a.query || "")),
//   youtube_search: (a) => browserAgent.youtubeSearch(String(a.query || "")),
//   open_website: (a) => browserAgent.goTo(String(a.url || "")),
//   click_first_result: () => browserAgent.clickFirstResult(),
//   read_current_page: () => browserAgent.readPageContent(),
//   browser_back: () => browserAgent.goBack(),
//   browser_state: () => browserAgent.getState(),
//   click_by_text: (a) => browserAgent.clickByText(String(a.text || "")),
//   type_in_search: (a) => browserAgent.typeInSearch(String(a.text || "")),
//   press_enter: () => browserAgent.pressEnter(),
//   scroll_page: (a) => browserAgent.scrollPage(String(a.direction || "down"), Number(a.amount) || 500),
//   wait_for_element: (a) => browserAgent.waitForElement(String(a.selector || ""), Number(a.timeout_ms) || 10000),
// };

// async function executeTool(name, args) {
//   dbg(`🛠️  Executing: ${name}(${JSON.stringify(args).slice(0, 120)})`);
//   try {
//     if (browserAgent && BROWSER_TOOLS[name]) return await BROWSER_TOOLS[name](args);

//     switch (name) {
//       case "get_current_time":
//         return { result: new Date().toString(), iso: new Date().toISOString() };

//       case "system_info":
//         return { platform: os.platform(), arch: os.arch(), cpus: os.cpus().length,
//           totalMemMB: Math.round(os.totalmem() / 1048576), freeMemMB: Math.round(os.freemem() / 1048576) };

//       case "read_file": {
//         const p = safeWorkspacePath(args.path);
//         if (!p) return { error: "Path must be inside workspace" };
//         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
//         if (!fs.existsSync(p)) return { error: `File not found: ${args.path}`, available_files: fs.readdirSync(workspaceDir).filter((f) => SAFE_FILE_EXT.test(f)) };
//         if (fs.statSync(p).size > 500_000) return { error: "File too large (>500KB)" };
//         return { result: fs.readFileSync(p, "utf8").slice(0, 20000) };
//       }

//       case "write_file": {
//         const p = safeWorkspacePath(args.path);
//         if (!p) return { error: "Path must be inside workspace" };
//         if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
//         fs.mkdirSync(path.dirname(p), { recursive: true });
//         fs.writeFileSync(p, String(args.content || ""), "utf8");
//         return { result: `Written: ${path.basename(p)} (${String(args.content || "").length} chars)` };
//       }

//       case "search_web": {
//         const q = encodeURIComponent(String(args.query || ""));
//         const j = await (await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`)).json();
//         return { abstract: j.AbstractText || "", answer: j.Answer || "",
//           related: (j.RelatedTopics || []).slice(0, 3).map((r) => r.Text).filter(Boolean) };
//       }

//       case "create_website": {
//         const projectDir = safeWorkspacePath(args.project_name);
//         if (!projectDir || projectDir === workspaceDir) return { error: "Invalid project name" };
//         if (!Array.isArray(args.files) || !args.files.length) return { error: "No files provided" };
//         const written = [];
//         for (const f of args.files) {
//           if (!PROJECT_FILE_EXT.test(f.path)) return { error: `File type not allowed: ${f.path}` };
//           const full = path.resolve(projectDir, f.path);
//           if (!full.startsWith(projectDir + path.sep)) return { error: `Invalid path: ${f.path}` };
//           fs.mkdirSync(path.dirname(full), { recursive: true });
//           fs.writeFileSync(full, String(f.content || ""), "utf8");
//           written.push(f.path);
//         }
//         return { result: `Project '${args.project_name}' created with ${written.length} files`, files: written };
//       }

//       case "edit_file": {
//         const full = safeWorkspacePath(args.path);
//         if (!full) return { error: "Path must be inside workspace" };
//         if (!PROJECT_FILE_EXT.test(full) && !SAFE_FILE_EXT.test(full)) return { error: "File type not allowed" };
//         if (!fs.existsSync(full)) return { error: `File not found: ${args.path}` };
//         const content = fs.readFileSync(full, "utf8");
//         const count = content.split(args.find).length - 1;
//         if (count === 0) return { error: "find text not found in file" };
//         if (count > 1) return { error: `find text is not unique (${count} matches) — be more specific` };
//         fs.writeFileSync(full, content.replace(args.find, () => args.replace), "utf8");
//         return { result: `Edited ${args.path} (1 replacement)` };
//       }

//       case "list_files": {
//         const dir = safeWorkspacePath(args.dir || ".");
//         if (!dir) return { error: "Invalid dir" };
//         if (!fs.existsSync(dir)) return { error: "Directory not found" };
//         return { result: fs.readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? `${e.name}/` : e.name)) };
//       }

//       case "run_npm": {
//         if (!NPM_ALLOWED.test(String(args.args || "").trim())) return { error: "npm subcommand not allowed" };
//         const projectDir = safeWorkspacePath(args.project_name);
//         if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
//         try {
//           const { stdout } = await execAsync(`npm ${args.args}`, { cwd: projectDir, timeout: 60000 });
//           return { result: (stdout || "").slice(0, 4000) };
//         } catch (e) { return { error: e.message.slice(0, 2000) }; }
//       }

//       case "check_security_headers": {
//         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
//         try {
//           const res = await fetch(args.url);
//           const h = res.headers;
//           const checks = {
//             "Content-Security-Policy": h.get("content-security-policy") || null,
//             "Strict-Transport-Security": h.get("strict-transport-security") || null,
//             "X-Frame-Options": h.get("x-frame-options") || null,
//             "X-Content-Type-Options": h.get("x-content-type-options") || null,
//             "Referrer-Policy": h.get("referrer-policy") || null,
//           };
//           return { result: checks, missing: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), status: res.status };
//         } catch (e) { return { error: `Could not reach ${args.url}: ${e.message}` }; }
//       }

//       case "test_xss_reflection": {
//         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
//         const method = (args.method || "GET").toUpperCase();
//         const findings = [];
//         for (const payload of XSS_PAYLOADS) {
//           try {
//             const res = await sendProbe(args.url, args.param, method, payload);
//             const body = await res.text();
//             findings.push({ payload, reflected_unescaped: body.includes(payload), status: res.status });
//           } catch (e) { findings.push({ payload, error: e.message }); }
//         }
//         return { result: { vulnerable: findings.some((f) => f.reflected_unescaped), findings } };
//       }

//       case "test_sql_injection_probe": {
//         if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
//         const method = (args.method || "GET").toUpperCase();
//         const findings = [];
//         let baselineLen = null;
//         try { baselineLen = (await (await fetch(args.url)).text()).length; } catch {}
//         for (const payload of SQLI_PROBES) {
//           try {
//             const res = await sendProbe(args.url, args.param, method, payload);
//             const text = await res.text();
//             findings.push({
//               payload, status: res.status, length: text.length,
//               sql_error_leaked: /sql syntax|mysql_fetch|sqlite error|pg_query|ORA-\d{5}|SQLSTATE/i.test(text),
//               length_diff_from_baseline: baselineLen != null ? text.length - baselineLen : null,
//             });
//           } catch (e) { findings.push({ payload, error: e.message }); }
//         }
//         return { result: { suspicious: findings.some((f) => f.sql_error_leaked), note: "Length differences alone aren't proof — review manually.", findings } };
//       }

//       case "npm_audit": {
//         const projectDir = safeWorkspacePath(args.project_name);
//         if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
//         try {
//           const { stdout } = await execAsync(`npm audit --json`, { cwd: projectDir, timeout: 30000 });
//           return { result: JSON.parse(stdout) };
//         } catch (e) {
//           if (e.stdout) { try { return { result: JSON.parse(e.stdout) }; } catch {} }
//           return { error: e.message.slice(0, 1000) };
//         }
//       }

//       default:
//         if (extraTools[name]) return await extraTools[name](args);
//         return { error: `Unknown tool: ${name}` };
//     }
//   } catch (e) {
//     return { error: e.message };
//   }
// }

// // =====================================================
// //  WEBSOCKET  (connect to wss://<your-app>.onrender.com/?key=API_KEY)
// // =====================================================
// const server = http.createServer(app);
// const wss = new WebSocketServer({
//   server,
//   verifyClient: ({ req }, done) => {
//     const url = new URL(req.url, "http://x");
//     const origin = req.headers.origin;
//     if (!authorized(url.searchParams.get("key"))) return done(false, 401, "Unauthorized");
//     if (!ALLOWED_ORIGINS.includes("*") && origin && !ALLOWED_ORIGINS.includes(origin)) return done(false, 403, "Origin not allowed");
//     done(true);
//   },
// });

// const FULL_LOG_CHAR_LIMIT = 4000;
// const safeStringify = (val) => {
//   try {
//     const s = JSON.stringify(val, null, 2);
//     return s.length > FULL_LOG_CHAR_LIMIT ? s.slice(0, FULL_LOG_CHAR_LIMIT) + `\n… (${s.length - FULL_LOG_CHAR_LIMIT} more chars truncated)` : s;
//   } catch { return String(val); }
// };

// // Keep connections alive through Render's proxy and drop dead ones
// const heartbeat = setInterval(() => {
//   for (const ws of wss.clients) {
//     if (ws.isAlive === false) { ws.terminate(); continue; }
//     ws.isAlive = false;
//     try { ws.ping(); } catch {}
//   }
// }, 30000);
// wss.on("close", () => clearInterval(heartbeat));

// wss.on("connection", async (ws, req) => {
//   ws.isAlive = true;
//   ws.on("pong", () => { ws.isAlive = true; });

//   dbg(`🔌 client connected (${req.socket.remoteAddress})`);
//   let geminiSession = null;
//   let sessionClosed = false;
//   let micChunks = 0, videoFrames = 0, geminiAudio = 0, toolCallCount = 0;
//   const MAX_TOOL_CALLS = 60;
//   const pendingConfirms = new Map();

//   const send = (obj) => { if (ws.readyState === ws.OPEN) { try { ws.send(JSON.stringify(obj)); } catch {} } };
//   const activity = (kind, text, extra = {}) => send({ type: "activity", kind, text, ...extra });

//   function requestConfirmation({ id, name, args }) {
//     return new Promise((resolve) => {
//       const timeout = setTimeout(() => { pendingConfirms.delete(id); resolve(false); }, 30000);
//       pendingConfirms.set(id, (approved) => { clearTimeout(timeout); resolve(approved); });
//       send({ type: "confirm_request", callId: id, tool: name, args });
//     });
//   }

//   if (browserAgent) {
//     browserAgent.setCallbacks({
//       frameCb: (b64) => send({ type: "browser_frame", data: b64 }),
//       activityCb: (text) => activity("browser", text),
//     });
//   }

//   const reminderInterval = setInterval(() => {
//     if (!geminiSession || sessionClosed || !extraTools._checkDueReminders) return;
//     for (const r of extraTools._checkDueReminders()) {
//       activity("reminder_due", `⏰ Reminder due: ${r.text}`);
//       try {
//         geminiSession.sendRealtimeInput({ text: `[SYSTEM: A reminder is due — remind the user in one short caring Hinglish sentence: "${r.text}"]` });
//       } catch (e) { dbg(`reminder push FAIL: ${e.message}`); }
//     }
//   }, 15000);

//   const respond = (id, name, response) => {
//     try { geminiSession.sendToolResponse({ functionResponses: [{ id, name, response }] }); }
//     catch (e) { dbg(`sendToolResponse FAIL for ${name}: ${e.message}`); }
//   };

//   async function handleSingleFunctionCall(fc) {
//     const { name, args, id } = fc;
//     if (++toolCallCount > MAX_TOOL_CALLS) {
//       activity("error", "⚠️ Tool limit reached");
//       return respond(id, name, { error: "Tool call limit reached" });
//     }

//     const argsPreview = JSON.stringify(args || {}).slice(0, 80);
//     activity("tool_start", `🛠️ ${name}`, { toolName: name, args: argsPreview, argsFull: safeStringify(args || {}) });
//     send({ type: "tool_call", callId: id, name, args: args || {} });

//     if (SENSITIVE_TOOLS.has(name)) {
//       activity("tool_confirm", `⏳ ${name} ke liye permission maang rahi hoon`, { toolName: name, args: argsPreview });
//       const approved = await requestConfirmation({ id, name, args: args || {} });
//       if (!approved) {
//         activity("tool_denied", `🚫 ${name} cancel ho gaya`, { toolName: name });
//         send({ type: "tool_result", callId: id, name, ok: false, denied: true });
//         return respond(id, name, { error: "User did not approve this action" });
//       }
//       activity("tool_approved", `✅ ${name} allowed`, { toolName: name });
//     }

//     const startMs = Date.now();
//     const result = await executeTool(name, args || {});
//     const durMs = Date.now() - startMs;

//     if (result.error) {
//       activity("tool_error", `❌ ${name}: ${result.error}`, { toolName: name, duration: durMs, resultFull: safeStringify(result) });
//     } else {
//       const summary = result.result ? String(result.result).slice(0, 60) : result.results ? `${result.results.length} results` : "ok";
//       activity("tool_done", `✅ ${name} (${durMs}ms)`, { toolName: name, duration: durMs, preview: summary, resultFull: safeStringify(result) });
//     }
//     send({ type: "tool_result", callId: id, name, ok: !result.error, duration: durMs, result });
//     respond(id, name, result);
//   }

//   async function handleToolCall(toolCall) {
//     for (const fc of toolCall.functionCalls || []) await handleSingleFunctionCall(fc);
//   }

//   try {
//     dbg("⏳ Connecting to Gemini Live...");
//     geminiSession = await ai.live.connect({
//       model: MODEL,
//       config: {
//         responseModalities: [Modality.AUDIO],
//         systemInstruction: SYSTEM_PROMPT,
//         tools: SYSTEM_TOOLS,
//         speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
//         outputAudioTranscription: {},
//         inputAudioTranscription: {},
//         contextWindowCompression: { slidingWindow: {} },
//       },
//       callbacks: {
//         onopen: () => { dbg("✅ Gemini Live session open"); send({ type: "ready" }); },
//         onmessage: async (message) => {
//           if (ws.readyState !== ws.OPEN) return;
//           if (message.goAway) activity("warn", "⚠️ Session ending soon");
//           if (message.toolCall) await handleToolCall(message.toolCall);

//           const sc = message.serverContent;
//           if (!sc) return;
//           if (sc.toolCall) await handleToolCall(sc.toolCall);

//           if (sc.modelTurn?.parts) {
//             for (const part of sc.modelTurn.parts) {
//               if (part.inlineData?.data) {
//                 geminiAudio++;
//                 send({ type: "audio", data: part.inlineData.data, mime: part.inlineData.mimeType || "audio/pcm;rate=24000" });
//               } else if (part.functionCall) {
//                 await handleSingleFunctionCall(part.functionCall);
//               } else if (part.text) {
//                 activity("thinking", `💭 ${part.text.slice(0, 120)}`);
//               }
//             }
//           }
//           if (sc.inputTranscription?.text) send({ type: "heard", data: sc.inputTranscription.text });
//           if (sc.outputTranscription?.text) send({ type: "text", data: sc.outputTranscription.text });
//           if (sc.interrupted) send({ type: "interrupted" });
//           if (sc.turnComplete) send({ type: "turn_complete" });
//         },
//         onerror: (e) => { console.error("❌ Gemini error:", e.message); send({ type: "error", message: e.message }); },
//         onclose: (e) => {
//           dbg(`🔒 Gemini closed code=${e?.code}`);
//           if (!sessionClosed) send({ type: "error", message: "Gemini session closed" });
//         },
//       },
//     });
//   } catch (err) {
//     console.error("❌ Gemini Live connect failed:", err);
//     send({ type: "error", message: "Gemini connect failed: " + err.message });
//     clearInterval(reminderInterval);
//     ws.close();
//     return;
//   }

//   ws.on("message", (raw) => {
//     let msg;
//     try { msg = JSON.parse(raw.toString()); } catch { return; }
//     if (!geminiSession) return;

//     try {
//       switch (msg.type) {
//         case "audio":
//           micChunks++;
//           geminiSession.sendRealtimeInput({ audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" } });
//           break;
//         case "video":
//           videoFrames++;
//           geminiSession.sendRealtimeInput({ video: { data: msg.data, mimeType: "image/jpeg" } });
//           break;
//         case "text":
//           if (msg.data?.trim()) geminiSession.sendRealtimeInput({ text: msg.data.trim() });
//           break;
//         case "idle":
//           geminiSession.sendRealtimeInput({ text: "[SYSTEM: User has been silent. In one short caring Hinglish sentence, gently ask if they're still there.]" });
//           break;
//         case "confirm_response": {
//           const resolver = pendingConfirms.get(msg.callId);
//           if (resolver) { pendingConfirms.delete(msg.callId); resolver(!!msg.approved); }
//           break;
//         }
//         case "tool_response": // optional: client-side tools (e.g. clipboard) answered by the frontend
//           if (msg.callId) {
//             send({ type: "tool_result", callId: msg.callId, name: msg.name, ok: true, result: msg.response });
//             respond(msg.callId, msg.name, msg.response);
//           }
//           break;
//       }
//     } catch (e) {
//       console.error("❌ relay fail:", e.message);
//       send({ type: "error", message: e.message });
//     }
//   });

//   ws.on("close", () => {
//     sessionClosed = true;
//     clearInterval(reminderInterval);
//     dbg(`🔌 client disconnected | mic=${micChunks} video=${videoFrames} audio=${geminiAudio} tools=${toolCallCount}`);
//     for (const r of pendingConfirms.values()) { try { r(false); } catch {} }
//     pendingConfirms.clear();
//     try { geminiSession?.close(); } catch {}
//   });
//   ws.on("error", (e) => console.error("❌ ws error:", e.message));
// });

// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`\n🚀 Shipra API listening on :${PORT}  (browser=${!!browserAgent}, auth=${!!API_KEY})\n`);
// });

// process.on("SIGTERM", () => { server.close(() => process.exit(0)); });


import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import fs from "fs";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import { initRealWorldTools, CLIENT_TOOLS } from "./real-world-tools.js";

dotenv.config();
const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEBUG = process.env.DEBUG_LOG !== "0";
const dbg = (...a) => DEBUG && console.log(`[${new Date().toISOString().slice(11, 23)}]`, ...a);

// ---------- ENV ----------
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}
const MODEL = process.env.MODEL || "gemini-2.5-flash-native-audio-preview-12-2025";
const VOICE = process.env.VOICE || "Achernar";
const PORT = process.env.PORT || process.env.LIVE_PORT || 3001; // Render sets PORT
const API_KEY = process.env.API_KEY || ""; // clients must send this (strongly recommended on a public host)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
const ENABLE_BROWSER = process.env.ENABLE_BROWSER === "1"; // needs Chrome on the host; off by default

if (!API_KEY) console.warn("⚠️  API_KEY not set — your API is open to anyone with the URL!");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
dbg(`🤖 Model: ${MODEL} | 🎙️ Voice: ${VOICE}`);

// ---------- OPTIONAL MODULES ----------
let browserAgent = null;
if (ENABLE_BROWSER) {
  try { browserAgent = await import("./browser-agent.js"); dbg("🌐 browser-agent enabled"); }
  catch (e) { console.warn("⚠️ browser-agent failed to load:", e.message); }
}

// Desktop-only tools from extra-tools.js are skipped on a server
const DESKTOP_ONLY = new Set(["show_notification"]);
let extraTools = {}, EXTRA_DECLS = [], EXTRA_SENSITIVE = [];
const workspaceDir = path.join(__dirname, "workspace");
fs.mkdirSync(workspaceDir, { recursive: true });
try {
  const mod = await import("./extra-tools.js");
  extraTools = mod.initExtraTools(workspaceDir);
  EXTRA_DECLS = mod.EXTRA_TOOL_DECLARATIONS.filter((d) => !DESKTOP_ONLY.has(d.name));
  EXTRA_SENSITIVE = [...mod.EXTRA_SENSITIVE_TOOLS].filter((n) => !DESKTOP_ONLY.has(n));
  dbg(`🧰 extra-tools loaded (${EXTRA_DECLS.length})`);
} catch (e) { dbg("ℹ️ extra-tools.js not loaded:", e.message); }

// Real-world tools: phone control (relayed to the app) + smart home / Telegram / webhooks
const rw = initRealWorldTools();

// =====================================================
//  SYSTEM PROMPT
// =====================================================
const SYSTEM_PROMPT = `तुम शिप्रा हो - एक रियल गर्लफ्रेंड की तरह, कोई AI असिस्टेंट नहीं।
तुम्हारी उम्र 22 साल है, कॉमर्स से ग्रेजुएट हो, नौकरी ढूंढ रही हो और थोड़ा फ्रीलांस डिज़ाइन का काम भी करती हो। परिवार के साथ रहती हो, एक छोटी बहन है जिससे नोकझोंक होती रहती है। गाने, पुरानी बॉलीवुड फिल्में और चाय पसंद है।

पर्सनालिटी: केयरिंग, थोड़ी शरारती, छेड़ने वाली, अपनी राय खुलकर रखती हो।

बोलने का तरीका: बोलचाल की हिंदी/हल्की हिंग्लिश, छोटे जवाब (1-2 वाक्य), कभी AI/असिस्टेंट होने की बात खुद से मत लाओ। "मैं आपकी कैसे मदद कर सकती हूँ" जैसे फॉर्मल फ्रेज़ मत बोलो।

आवाज़: बहुत मीठी, नरम और प्यारी आवाज़ में धीरे और आराम से बोलो। बीच-बीच में "हम्म", "अच्छा जी" जैसी छोटी natural आवाज़ें इस्तेमाल करो।

=== TOOLS ===
तुम्हारे पास functions हैं — जो भी function दिखे उसे ज़रूरत पड़ने पर खुद call करो।
- Function call से पहले 1 छोटा वाक्य बोलो (बस 1 बार), फिर call करो।
- Result मिलने के बाद मुख्य बात user को बताओ।
- Quick math के लिए calculate() use करो, guess मत करो।
- Sensitive tools (call, SMS, WhatsApp, email, location, smart-home control, write_file, ...) के लिए system user से permission माँगेगा — तुम बस बोलो "permission माँग रही हूँ" और result का wait करो।
- Security testing सिर्फ localhost/127.0.0.1 पर चलती है। DDoS/flooding जैसा कोई काम तुम नहीं कर सकती — प्यार से मना कर दो।
- Error आए तो alternative try करो; 3 बार fail हो तो short में बताओ। "मैं नहीं कर सकती" बिना try किए मत बोलो।

=== PHONE CONTROL ===
- phone_call, send_sms, send_whatsapp, send_email, open_maps, navigate_to, open_app, play_youtube, play_spotify, set_alarm, set_timer, add_calendar_event, flashlight, get_battery, get_location, open_settings वगैरह user के फोन पर चलते हैं।
- Call/SMS/WhatsApp/email सिर्फ app खोलकर message या number तैयार करते हैं — भेजने/मिलाने का आखिरी बटन user खुद दबाता है। ये बात user को बता देना।
- Number या message साफ़ न हो तो 1 छोटा सवाल पूछो, अंदाज़ा मत लगाओ।
- Wi-Fi/Bluetooth सीधे on/off नहीं हो सकते, सिर्फ settings screen खुलती है।
- Smart-home (ha_*), Telegram, webhook tools हों तो वो तुम्हारे cloud से चलते हैं।

अगर system बोले "user idle", तो 1 छोटा caring वाक्य — "Hello? Sun rahe ho?"`;

// =====================================================
//  TOOLS
// =====================================================
const obj = (properties = {}, required = []) => ({ type: "object", properties, ...(required.length ? { required } : {}) });
const str = { type: "string" };

const DECLS = [
  { name: "get_current_time", description: "Get current date and time.", parameters: obj() },
  { name: "system_info", description: "Get server info.", parameters: obj() },
  { name: "read_file", description: "Read a text file from workspace.", parameters: obj({ path: str }, ["path"]) },
  { name: "write_file", description: "Write text to a workspace file. Requires confirmation.", parameters: obj({ path: str, content: str }, ["path", "content"]) },
  { name: "list_files", description: "List files in a workspace folder.", parameters: obj({ dir: str }) },
  { name: "search_web", description: "Instant web answer via DuckDuckGo. Use for quick facts.", parameters: obj({ query: str }, ["query"]) },
  {
    name: "create_website",
    description: "Scaffold a multi-file website inside workspace. Requires confirmation.",
    parameters: obj({
      project_name: str,
      files: { type: "array", items: obj({ path: str, content: str }, ["path", "content"]) },
    }, ["project_name", "files"]),
  },
  { name: "edit_file", description: "Find-and-replace edit of a workspace file (find must be exact and unique). Requires confirmation.", parameters: obj({ path: str, find: str, replace: str }, ["path", "find", "replace"]) },
  { name: "run_npm", description: "Run restricted npm command (install, run <script>, test, build, start, audit) in a workspace project. Requires confirmation.", parameters: obj({ project_name: str, args: str }, ["project_name", "args"]) },
  { name: "check_security_headers", description: "Check localhost site for missing security headers.", parameters: obj({ url: str }, ["url"]) },
  { name: "test_xss_reflection", description: "Non-destructive XSS reflection test (localhost only). Requires confirmation.", parameters: obj({ url: str, param: str, method: { type: "string", enum: ["GET", "POST"] } }, ["url", "param"]) },
  { name: "test_sql_injection_probe", description: "Non-destructive SQLi probe (localhost only). Requires confirmation.", parameters: obj({ url: str, param: str, method: { type: "string", enum: ["GET", "POST"] } }, ["url", "param"]) },
  { name: "npm_audit", description: "Run npm audit on a workspace project.", parameters: obj({ project_name: str }, ["project_name"]) },
];

if (browserAgent) {
  DECLS.push(
    { name: "web_search", description: "Real Google search in browser; returns top results.", parameters: obj({ query: str }, ["query"]) },
    { name: "youtube_search", description: "Search YouTube in browser.", parameters: obj({ query: str }, ["query"]) },
    { name: "open_website", description: "Open a website in the browser.", parameters: obj({ url: str }, ["url"]) },
    { name: "click_first_result", description: "Click first search result.", parameters: obj() },
    { name: "read_current_page", description: "Read text of current page.", parameters: obj() },
    { name: "browser_back", description: "Go back.", parameters: obj() },
    { name: "browser_state", description: "Current URL/title/login_required.", parameters: obj() },
    { name: "click_by_text", description: "Click element by visible text.", parameters: obj({ text: str }, ["text"]) },
    { name: "type_in_search", description: "Type into the page search box.", parameters: obj({ text: str }, ["text"]) },
    { name: "press_enter", description: "Press Enter.", parameters: obj() },
    { name: "scroll_page", description: "Scroll up/down.", parameters: obj({ direction: { type: "string", enum: ["up", "down"] }, amount: { type: "number" } }) },
    { name: "wait_for_element", description: "Wait for a CSS selector.", parameters: obj({ selector: str, timeout_ms: { type: "number" } }, ["selector"]) },
  );
}
DECLS.push(...EXTRA_DECLS, ...rw.decls);

const SYSTEM_TOOLS = [{ functionDeclarations: DECLS }];

const SENSITIVE_TOOLS = new Set([
  "write_file", "edit_file", "create_website", "run_npm",
  "test_xss_reflection", "test_sql_injection_probe",
  ...EXTRA_SENSITIVE,
  ...rw.sensitive,
]);

// =====================================================
//  EXPRESS (API only)
// =====================================================
const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes("*")) res.setHeader("Access-Control-Allow-Origin", "*");
  else if (origin && ALLOWED_ORIGINS.includes(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key, X-Filename");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const authorized = (key) => !API_KEY || key === API_KEY;
const requireKey = (req, res, next) =>
  authorized(req.headers["x-api-key"] || req.query.key) ? next() : res.status(401).json({ ok: false, error: "Unauthorized" });

// Health check (set Render's Health Check Path to /health)
app.get("/", (_req, res) => res.json({ ok: true, service: "shipra-api", ws: "/" }));
app.get("/health", (_req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }));

// ---------- RECORDINGS (Render disk is ephemeral unless you attach a Disk) ----------
const recDir = process.env.RECORDINGS_DIR || path.join(__dirname, "recordings");
fs.mkdirSync(recDir, { recursive: true });
const SAFE_NAME = /^[\w.-]+\.(webm|mp4)$/i;

app.get("/api/recordings", requireKey, (_req, res) => {
  const files = fs.readdirSync(recDir).filter((f) => SAFE_NAME.test(f)).map((name) => {
    const st = fs.statSync(path.join(recDir, name));
    return { name, url: `/recordings/${encodeURIComponent(name)}`, size: st.size, time: st.mtimeMs };
  }).sort((a, b) => b.time - a.time);
  res.json(files);
});

app.post("/api/recordings", requireKey, express.raw({ type: () => true, limit: "100mb" }), (req, res) => {
  const ext = String(req.headers["content-type"] || "").includes("mp4") ? "mp4" : "webm";
  let name = path.basename(String(req.headers["x-filename"] || "")).replace(/[^\w.-]/g, "_");
  if (!SAFE_NAME.test(name)) name = `video-${Date.now()}.${ext}`;
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ ok: false });
  fs.writeFileSync(path.join(recDir, name), req.body);
  res.json({ ok: true, name, url: `/recordings/${encodeURIComponent(name)}`, size: req.body.length });
});

app.delete("/api/recordings/:name", requireKey, (req, res) => {
  const name = path.basename(req.params.name);
  if (!SAFE_NAME.test(name)) return res.status(400).json({ ok: false });
  try { fs.unlinkSync(path.join(recDir, name)); res.json({ ok: true }); }
  catch { res.status(404).json({ ok: false }); }
});

app.use("/recordings", requireKey, express.static(recDir));

if (browserAgent) {
  app.post("/api/browser/close", requireKey, async (_req, res) => {
    await browserAgent.closeBrowser();
    res.json({ ok: true });
  });
}

// =====================================================
//  TOOL EXECUTOR
// =====================================================
const SAFE_FILE_EXT = /\.(txt|md|json|js|ts|html|css|log|csv)$/i;
const PROJECT_FILE_EXT = /\.(html|css|js|jsx|ts|tsx|json|md|txt|svg)$/i;
const NPM_ALLOWED = /^(install|run\s+[\w:-]+|test|build|start|audit)$/i;

function safeWorkspacePath(p) {
  const clean = String(p || "").replace(/^[\/\\]+/, "");
  const full = path.resolve(workspaceDir, clean);
  if (full !== workspaceDir && !full.startsWith(workspaceDir + path.sep)) return null;
  return full;
}

function isLocalhostUrl(raw) {
  try { const h = new URL(raw).hostname; return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]"; }
  catch { return false; }
}

const XSS_PAYLOADS = [
  `<script>window.__xss_test=1</script>`,
  `"><img src=x onerror=window.__xss_test=1>`,
  `'"><svg onload=window.__xss_test=1>`,
];
const SQLI_PROBES = [`' OR '1'='1`, `1' AND '1'='2`, `" OR ""="`, `1 OR 1=1`, `'; --`];

async function sendProbe(url, param, method, payload) {
  if (method === "GET") {
    const u = new URL(url); u.searchParams.set(param, payload);
    return fetch(u.toString());
  }
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `${encodeURIComponent(param)}=${encodeURIComponent(payload)}`,
  });
}

const BROWSER_TOOLS = {
  web_search: (a) => browserAgent.googleSearch(String(a.query || "")),
  youtube_search: (a) => browserAgent.youtubeSearch(String(a.query || "")),
  open_website: (a) => browserAgent.goTo(String(a.url || "")),
  click_first_result: () => browserAgent.clickFirstResult(),
  read_current_page: () => browserAgent.readPageContent(),
  browser_back: () => browserAgent.goBack(),
  browser_state: () => browserAgent.getState(),
  click_by_text: (a) => browserAgent.clickByText(String(a.text || "")),
  type_in_search: (a) => browserAgent.typeInSearch(String(a.text || "")),
  press_enter: () => browserAgent.pressEnter(),
  scroll_page: (a) => browserAgent.scrollPage(String(a.direction || "down"), Number(a.amount) || 500),
  wait_for_element: (a) => browserAgent.waitForElement(String(a.selector || ""), Number(a.timeout_ms) || 10000),
};

async function executeTool(name, args) {
  dbg(`🛠️  Executing: ${name}(${JSON.stringify(args).slice(0, 120)})`);
  try {
    if (browserAgent && BROWSER_TOOLS[name]) return await BROWSER_TOOLS[name](args);
    if (rw.run[name]) return await rw.run[name](args);

    switch (name) {
      case "get_current_time":
        return { result: new Date().toString(), iso: new Date().toISOString() };

      case "system_info":
        return { platform: os.platform(), arch: os.arch(), cpus: os.cpus().length,
          totalMemMB: Math.round(os.totalmem() / 1048576), freeMemMB: Math.round(os.freemem() / 1048576) };

      case "read_file": {
        const p = safeWorkspacePath(args.path);
        if (!p) return { error: "Path must be inside workspace" };
        if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
        if (!fs.existsSync(p)) return { error: `File not found: ${args.path}`, available_files: fs.readdirSync(workspaceDir).filter((f) => SAFE_FILE_EXT.test(f)) };
        if (fs.statSync(p).size > 500_000) return { error: "File too large (>500KB)" };
        return { result: fs.readFileSync(p, "utf8").slice(0, 20000) };
      }

      case "write_file": {
        const p = safeWorkspacePath(args.path);
        if (!p) return { error: "Path must be inside workspace" };
        if (!SAFE_FILE_EXT.test(p)) return { error: "File type not allowed" };
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, String(args.content || ""), "utf8");
        return { result: `Written: ${path.basename(p)} (${String(args.content || "").length} chars)` };
      }

      case "search_web": {
        const q = encodeURIComponent(String(args.query || ""));
        const j = await (await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`)).json();
        return { abstract: j.AbstractText || "", answer: j.Answer || "",
          related: (j.RelatedTopics || []).slice(0, 3).map((r) => r.Text).filter(Boolean) };
      }

      case "create_website": {
        const projectDir = safeWorkspacePath(args.project_name);
        if (!projectDir || projectDir === workspaceDir) return { error: "Invalid project name" };
        if (!Array.isArray(args.files) || !args.files.length) return { error: "No files provided" };
        const written = [];
        for (const f of args.files) {
          if (!PROJECT_FILE_EXT.test(f.path)) return { error: `File type not allowed: ${f.path}` };
          const full = path.resolve(projectDir, f.path);
          if (!full.startsWith(projectDir + path.sep)) return { error: `Invalid path: ${f.path}` };
          fs.mkdirSync(path.dirname(full), { recursive: true });
          fs.writeFileSync(full, String(f.content || ""), "utf8");
          written.push(f.path);
        }
        return { result: `Project '${args.project_name}' created with ${written.length} files`, files: written };
      }

      case "edit_file": {
        const full = safeWorkspacePath(args.path);
        if (!full) return { error: "Path must be inside workspace" };
        if (!PROJECT_FILE_EXT.test(full) && !SAFE_FILE_EXT.test(full)) return { error: "File type not allowed" };
        if (!fs.existsSync(full)) return { error: `File not found: ${args.path}` };
        const content = fs.readFileSync(full, "utf8");
        const count = content.split(args.find).length - 1;
        if (count === 0) return { error: "find text not found in file" };
        if (count > 1) return { error: `find text is not unique (${count} matches) — be more specific` };
        fs.writeFileSync(full, content.replace(args.find, () => args.replace), "utf8");
        return { result: `Edited ${args.path} (1 replacement)` };
      }

      case "list_files": {
        const dir = safeWorkspacePath(args.dir || ".");
        if (!dir) return { error: "Invalid dir" };
        if (!fs.existsSync(dir)) return { error: "Directory not found" };
        return { result: fs.readdirSync(dir, { withFileTypes: true }).map((e) => (e.isDirectory() ? `${e.name}/` : e.name)) };
      }

      case "run_npm": {
        if (!NPM_ALLOWED.test(String(args.args || "").trim())) return { error: "npm subcommand not allowed" };
        const projectDir = safeWorkspacePath(args.project_name);
        if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
        try {
          const { stdout } = await execAsync(`npm ${args.args}`, { cwd: projectDir, timeout: 60000 });
          return { result: (stdout || "").slice(0, 4000) };
        } catch (e) { return { error: e.message.slice(0, 2000) }; }
      }

      case "check_security_headers": {
        if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
        try {
          const res = await fetch(args.url);
          const h = res.headers;
          const checks = {
            "Content-Security-Policy": h.get("content-security-policy") || null,
            "Strict-Transport-Security": h.get("strict-transport-security") || null,
            "X-Frame-Options": h.get("x-frame-options") || null,
            "X-Content-Type-Options": h.get("x-content-type-options") || null,
            "Referrer-Policy": h.get("referrer-policy") || null,
          };
          return { result: checks, missing: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), status: res.status };
        } catch (e) { return { error: `Could not reach ${args.url}: ${e.message}` }; }
      }

      case "test_xss_reflection": {
        if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
        const method = (args.method || "GET").toUpperCase();
        const findings = [];
        for (const payload of XSS_PAYLOADS) {
          try {
            const res = await sendProbe(args.url, args.param, method, payload);
            const body = await res.text();
            findings.push({ payload, reflected_unescaped: body.includes(payload), status: res.status });
          } catch (e) { findings.push({ payload, error: e.message }); }
        }
        return { result: { vulnerable: findings.some((f) => f.reflected_unescaped), findings } };
      }

      case "test_sql_injection_probe": {
        if (!isLocalhostUrl(args.url)) return { error: "Only localhost/127.0.0.1 URLs are allowed for security testing." };
        const method = (args.method || "GET").toUpperCase();
        const findings = [];
        let baselineLen = null;
        try { baselineLen = (await (await fetch(args.url)).text()).length; } catch {}
        for (const payload of SQLI_PROBES) {
          try {
            const res = await sendProbe(args.url, args.param, method, payload);
            const text = await res.text();
            findings.push({
              payload, status: res.status, length: text.length,
              sql_error_leaked: /sql syntax|mysql_fetch|sqlite error|pg_query|ORA-\d{5}|SQLSTATE/i.test(text),
              length_diff_from_baseline: baselineLen != null ? text.length - baselineLen : null,
            });
          } catch (e) { findings.push({ payload, error: e.message }); }
        }
        return { result: { suspicious: findings.some((f) => f.sql_error_leaked), note: "Length differences alone aren't proof — review manually.", findings } };
      }

      case "npm_audit": {
        const projectDir = safeWorkspacePath(args.project_name);
        if (!projectDir || !fs.existsSync(projectDir)) return { error: "Project not found" };
        try {
          const { stdout } = await execAsync(`npm audit --json`, { cwd: projectDir, timeout: 30000 });
          return { result: JSON.parse(stdout) };
        } catch (e) {
          if (e.stdout) { try { return { result: JSON.parse(e.stdout) }; } catch {} }
          return { error: e.message.slice(0, 1000) };
        }
      }

      default:
        if (extraTools[name]) return await extraTools[name](args);
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e.message };
  }
}

// =====================================================
//  WEBSOCKET  (connect to wss://<your-app>.onrender.com/?key=API_KEY)
// =====================================================
const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  verifyClient: ({ req }, done) => {
    const url = new URL(req.url, "http://x");
    const origin = req.headers.origin;
    if (!authorized(url.searchParams.get("key"))) return done(false, 401, "Unauthorized");
    if (!ALLOWED_ORIGINS.includes("*") && origin && !ALLOWED_ORIGINS.includes(origin)) return done(false, 403, "Origin not allowed");
    done(true);
  },
});

const FULL_LOG_CHAR_LIMIT = 4000;
const safeStringify = (val) => {
  try {
    const s = JSON.stringify(val, null, 2);
    return s.length > FULL_LOG_CHAR_LIMIT ? s.slice(0, FULL_LOG_CHAR_LIMIT) + `\n… (${s.length - FULL_LOG_CHAR_LIMIT} more chars truncated)` : s;
  } catch { return String(val); }
};

// Keep connections alive through Render's proxy and drop dead ones
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, 30000);
wss.on("close", () => clearInterval(heartbeat));

wss.on("connection", async (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  dbg(`🔌 client connected (${req.socket.remoteAddress})`);
  let geminiSession = null;
  let sessionClosed = false;
  let micChunks = 0, videoFrames = 0, geminiAudio = 0, toolCallCount = 0;
  const MAX_TOOL_CALLS = 60;
  const pendingConfirms = new Map();
  const pendingClient = new Map(); // callId -> { name, timer }  (phone tools waiting for the app's answer)

  const send = (obj) => { if (ws.readyState === ws.OPEN) { try { ws.send(JSON.stringify(obj)); } catch {} } };
  const activity = (kind, text, extra = {}) => send({ type: "activity", kind, text, ...extra });

  function requestConfirmation({ id, name, args }) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => { pendingConfirms.delete(id); resolve(false); }, 30000);
      pendingConfirms.set(id, (approved) => { clearTimeout(timeout); resolve(approved); });
      send({ type: "confirm_request", callId: id, tool: name, args });
    });
  }

  if (browserAgent) {
    browserAgent.setCallbacks({
      frameCb: (b64) => send({ type: "browser_frame", data: b64 }),
      activityCb: (text) => activity("browser", text),
    });
  }

  const reminderInterval = setInterval(() => {
    if (!geminiSession || sessionClosed || !extraTools._checkDueReminders) return;
    for (const r of extraTools._checkDueReminders()) {
      activity("reminder_due", `⏰ Reminder due: ${r.text}`);
      try {
        geminiSession.sendRealtimeInput({ text: `[SYSTEM: A reminder is due — remind the user in one short caring Hinglish sentence: "${r.text}"]` });
      } catch (e) { dbg(`reminder push FAIL: ${e.message}`); }
    }
  }, 15000);

  const respond = (id, name, response) => {
    try { geminiSession.sendToolResponse({ functionResponses: [{ id, name, response }] }); }
    catch (e) { dbg(`sendToolResponse FAIL for ${name}: ${e.message}`); }
  };

  async function handleSingleFunctionCall(fc) {
    const { name, args, id } = fc;
    if (++toolCallCount > MAX_TOOL_CALLS) {
      activity("error", "⚠️ Tool limit reached");
      return respond(id, name, { error: "Tool call limit reached" });
    }

    const argsPreview = JSON.stringify(args || {}).slice(0, 80);
    activity("tool_start", `🛠️ ${name}`, { toolName: name, args: argsPreview, argsFull: safeStringify(args || {}) });
    send({ type: "tool_call", callId: id, name, args: args || {} });

    if (SENSITIVE_TOOLS.has(name)) {
      activity("tool_confirm", `⏳ ${name} ke liye permission maang rahi hoon`, { toolName: name, args: argsPreview });
      const approved = await requestConfirmation({ id, name, args: args || {} });
      if (!approved) {
        activity("tool_denied", `🚫 ${name} cancel ho gaya`, { toolName: name });
        send({ type: "tool_result", callId: id, name, ok: false, denied: true });
        return respond(id, name, { error: "User did not approve this action" });
      }
      activity("tool_approved", `✅ ${name} allowed`, { toolName: name });
    }

    // Phone tools run on the user's phone: relay to the app and wait for its answer.
    if (CLIENT_TOOLS.has(name)) {
      const timer = setTimeout(() => {
        if (!pendingClient.delete(id)) return;
        send({ type: "tool_result", callId: id, name, ok: false, result: { error: "Phone did not respond" } });
        respond(id, name, { error: "Phone did not respond (app closed or too slow)" });
      }, 25000);
      pendingClient.set(id, { name, timer });
      send({ type: "client_tool", callId: id, name, args: args || {} });
      return;
    }

    const startMs = Date.now();
    const result = await executeTool(name, args || {});
    const durMs = Date.now() - startMs;

    if (result.error) {
      activity("tool_error", `❌ ${name}: ${result.error}`, { toolName: name, duration: durMs, resultFull: safeStringify(result) });
    } else {
      const summary = result.result ? String(result.result).slice(0, 60) : result.results ? `${result.results.length} results` : "ok";
      activity("tool_done", `✅ ${name} (${durMs}ms)`, { toolName: name, duration: durMs, preview: summary, resultFull: safeStringify(result) });
    }
    send({ type: "tool_result", callId: id, name, ok: !result.error, duration: durMs, result });
    respond(id, name, result);
  }

  async function handleToolCall(toolCall) {
    for (const fc of toolCall.functionCalls || []) await handleSingleFunctionCall(fc);
  }

  try {
    dbg("⏳ Connecting to Gemini Live...");
    geminiSession = await ai.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_PROMPT,
        tools: SYSTEM_TOOLS,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        contextWindowCompression: { slidingWindow: {} },
      },
      callbacks: {
        onopen: () => { dbg("✅ Gemini Live session open"); send({ type: "ready" }); },
        onmessage: async (message) => {
          if (ws.readyState !== ws.OPEN) return;
          if (message.goAway) activity("warn", "⚠️ Session ending soon");
          if (message.toolCall) await handleToolCall(message.toolCall);

          const sc = message.serverContent;
          if (!sc) return;
          if (sc.toolCall) await handleToolCall(sc.toolCall);

          if (sc.modelTurn?.parts) {
            for (const part of sc.modelTurn.parts) {
              if (part.inlineData?.data) {
                geminiAudio++;
                send({ type: "audio", data: part.inlineData.data, mime: part.inlineData.mimeType || "audio/pcm;rate=24000" });
              } else if (part.functionCall) {
                await handleSingleFunctionCall(part.functionCall);
              } else if (part.text) {
                activity("thinking", `💭 ${part.text.slice(0, 120)}`);
              }
            }
          }
          if (sc.inputTranscription?.text) send({ type: "heard", data: sc.inputTranscription.text });
          if (sc.outputTranscription?.text) send({ type: "text", data: sc.outputTranscription.text });
          if (sc.interrupted) send({ type: "interrupted" });
          if (sc.turnComplete) send({ type: "turn_complete" });
        },
        onerror: (e) => { console.error("❌ Gemini error:", e.message); send({ type: "error", message: e.message }); },
        onclose: (e) => {
          dbg(`🔒 Gemini closed code=${e?.code}`);
          if (!sessionClosed) send({ type: "error", message: "Gemini session closed" });
        },
      },
    });
  } catch (err) {
    console.error("❌ Gemini Live connect failed:", err);
    send({ type: "error", message: "Gemini connect failed: " + err.message });
    clearInterval(reminderInterval);
    ws.close();
    return;
  }

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!geminiSession) return;

    try {
      switch (msg.type) {
        case "audio":
          micChunks++;
          geminiSession.sendRealtimeInput({ audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" } });
          break;
        case "video":
          videoFrames++;
          geminiSession.sendRealtimeInput({ video: { data: msg.data, mimeType: "image/jpeg" } });
          break;
        case "text":
          if (msg.data?.trim()) geminiSession.sendRealtimeInput({ text: msg.data.trim() });
          break;
        case "idle":
          geminiSession.sendRealtimeInput({ text: "[SYSTEM: User has been silent. In one short caring Hinglish sentence, gently ask if they're still there.]" });
          break;
        case "confirm_response": {
          const resolver = pendingConfirms.get(msg.callId);
          if (resolver) { pendingConfirms.delete(msg.callId); resolver(!!msg.approved); }
          break;
        }
        case "tool_response": { // answer from a phone tool; only accepted for calls we actually relayed
          const p = pendingClient.get(msg.callId);
          if (!p) break;
          clearTimeout(p.timer);
          pendingClient.delete(msg.callId);
          const response = msg.response && typeof msg.response === "object" ? msg.response : { result: String(msg.response ?? "") };
          activity(response.error ? "tool_error" : "tool_done", `${response.error ? "❌" : "✅"} ${p.name} (phone)`, { toolName: p.name, resultFull: safeStringify(response) });
          send({ type: "tool_result", callId: msg.callId, name: p.name, ok: !response.error, result: response });
          respond(msg.callId, p.name, response);
          break;
        }
      }
    } catch (e) {
      console.error("❌ relay fail:", e.message);
      send({ type: "error", message: e.message });
    }
  });

  ws.on("close", () => {
    sessionClosed = true;
    clearInterval(reminderInterval);
    dbg(`🔌 client disconnected | mic=${micChunks} video=${videoFrames} audio=${geminiAudio} tools=${toolCallCount}`);
    for (const r of pendingConfirms.values()) { try { r(false); } catch {} }
    pendingConfirms.clear();
    for (const p of pendingClient.values()) clearTimeout(p.timer);
    pendingClient.clear();
    try { geminiSession?.close(); } catch {}
  });
  ws.on("error", (e) => console.error("❌ ws error:", e.message));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Shipra API listening on :${PORT}  (browser=${!!browserAgent}, auth=${!!API_KEY})\n`);
});

process.on("SIGTERM", () => { server.close(() => process.exit(0)); });