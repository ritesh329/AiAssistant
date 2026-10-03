// =====================================================
//  EXTRA TOOLS — drop-in addition to server.js
//  Import and merge into SYSTEM_TOOLS / SENSITIVE_TOOLS / executeTool
//  (see wiring notes at the bottom of this file)
// =====================================================
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

// ---------- storage ----------
// Pass the same workspaceDir you already use in server.js
export function initExtraTools(workspaceDir) {
  const notesFile = path.join(workspaceDir, "notes.json");
  const remindersFile = path.join(workspaceDir, "reminders.json");
  const qrDir = path.join(workspaceDir, "qrcodes");
  fs.mkdirSync(qrDir, { recursive: true });

  const readJson = (file, fallback) => {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
  };
  const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");

  // ---------- safe calculator (no eval) ----------
  // Supports + - * / % ^ ( ) and decimals. Rejects anything else.
  function safeCalc(expr) {
    const clean = String(expr).replace(/\s+/g, "");
    if (!/^[0-9+\-*/%^().]+$/.test(clean)) throw new Error("Invalid characters in expression");
    if (clean.length > 200) throw new Error("Expression too long");

    let i = 0;
    const peek = () => clean[i];
    const next = () => clean[i++];

    function parseExpr() {
      let v = parseTerm();
      while (peek() === "+" || peek() === "-") {
        const op = next();
        const rhs = parseTerm();
        v = op === "+" ? v + rhs : v - rhs;
      }
      return v;
    }
    function parseTerm() {
      let v = parseFactor();
      while (peek() === "*" || peek() === "/" || peek() === "%") {
        const op = next();
        const rhs = parseFactor();
        if ((op === "/" || op === "%") && rhs === 0) throw new Error("Division by zero");
        v = op === "*" ? v * rhs : op === "/" ? v / rhs : v % rhs;
      }
      return v;
    }
    function parseFactor() {
      let v = parseBase();
      if (peek() === "^") { next(); v = Math.pow(v, parseFactor()); }
      return v;
    }
    function parseBase() {
      if (peek() === "-") { next(); return -parseBase(); }
      if (peek() === "(") {
        next();
        const v = parseExpr();
        if (next() !== ")") throw new Error("Mismatched parens");
        return v;
      }
      let start = i;
      while (/[0-9.]/.test(peek() || "")) next();
      if (start === i) throw new Error("Unexpected token");
      return parseFloat(clean.slice(start, i));
    }

    const result = parseExpr();
    if (i !== clean.length) throw new Error("Unexpected trailing input");
    if (!isFinite(result)) throw new Error("Result is not finite");
    return result;
  }

  // ---------- unit conversion ----------
  const LENGTH_TO_M = { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 };
  const WEIGHT_TO_KG = { mg: 0.000001, g: 0.001, kg: 1, lb: 0.453592, oz: 0.0283495 };
  function convertUnits(value, from, to) {
    from = from.toLowerCase(); to = to.toLowerCase();
    if (from === "c" || from === "celsius") {
      const c = value;
      if (to === "f" || to === "fahrenheit") return c * 9 / 5 + 32;
      if (to === "k" || to === "kelvin") return c + 273.15;
      if (to === "c" || to === "celsius") return c;
    }
    if (from === "f" || from === "fahrenheit") {
      const c = (value - 32) * 5 / 9;
      if (to === "c" || to === "celsius") return c;
      if (to === "k" || to === "kelvin") return c + 273.15;
      if (to === "f" || to === "fahrenheit") return value;
    }
    if (from === "k" || from === "kelvin") {
      const c = value - 273.15;
      if (to === "c" || to === "celsius") return c;
      if (to === "f" || to === "fahrenheit") return c * 9 / 5 + 32;
      if (to === "k" || to === "kelvin") return value;
    }
    if (LENGTH_TO_M[from] && LENGTH_TO_M[to]) return (value * LENGTH_TO_M[from]) / LENGTH_TO_M[to];
    if (WEIGHT_TO_KG[from] && WEIGHT_TO_KG[to]) return (value * WEIGHT_TO_KG[from]) / WEIGHT_TO_KG[to];
    throw new Error(`Cannot convert ${from} -> ${to}`);
  }

  // ---------- desktop notification ----------
  async function showNotification(title, message) {
    const platform = os.platform();
    const t = String(title || "Shipra").replace(/"/g, "'");
    const m = String(message || "").replace(/"/g, "'");
    if (platform === "win32") {
      const ps = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);
        $texts = $template.GetElementsByTagName("text");
        $texts[0].AppendChild($template.CreateTextNode("${t}")) | Out-Null;
        $texts[1].AppendChild($template.CreateTextNode("${m}")) | Out-Null;
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template);
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Shipra").Show($toast);
      `;
      await execAsync(`powershell -NoProfile -Command "${ps.replace(/\n/g, " ")}"`, { windowsHide: true, timeout: 8000 });
    } else if (platform === "darwin") {
      await execAsync(`osascript -e 'display notification "${m}" with title "${t}"'`, { timeout: 8000 });
    } else {
      await execAsync(`notify-send "${t}" "${m}"`, { timeout: 8000 });
    }
  }

  return {
    // ===== calculate =====
    calculate: async (args) => {
      try { return { result: safeCalc(args.expression) }; }
      catch (e) { return { error: e.message }; }
    },

    // ===== weather (Open-Meteo, no API key) =====
    get_weather: async (args) => {
      const city = String(args.city || "").trim();
      if (!city) return { error: "No city given" };
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r => r.json());
      const loc = geo?.results?.[0];
      if (!loc) return { error: `Could not find location: ${city}` };
      const wx = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      ).then(r => r.json());
      return {
        location: `${loc.name}, ${loc.country || ""}`.trim(),
        temperature_c: wx.current?.temperature_2m,
        humidity_pct: wx.current?.relative_humidity_2m,
        wind_kmh: wx.current?.wind_speed_10m,
        weather_code: wx.current?.weather_code,
      };
    },

    // ===== currency conversion (frankfurter.app, no API key) =====
    convert_currency: async (args) => {
      const { amount, from, to } = args;
      const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`).then(r => r.json());
      if (!res.rates) return { error: "Conversion failed — check currency codes" };
      return { amount, from, to, converted: res.rates[to], date: res.date };
    },

    // ===== unit conversion =====
    convert_units: async (args) => {
      try { return { result: convertUnits(Number(args.value), args.from_unit, args.to_unit) }; }
      catch (e) { return { error: e.message }; }
    },

    // ===== notes =====
    add_note: async (args) => {
      const notes = readJson(notesFile, []);
      const note = { id: Date.now(), text: String(args.text || ""), created: new Date().toISOString() };
      notes.push(note);
      writeJson(notesFile, notes);
      return { result: "Note saved", id: note.id };
    },
    list_notes: async () => {
      return { result: readJson(notesFile, []) };
    },
    search_notes: async (args) => {
      const q = String(args.query || "").toLowerCase();
      const notes = readJson(notesFile, []).filter(n => n.text.toLowerCase().includes(q));
      return { result: notes };
    },
    delete_note: async (args) => {
      const notes = readJson(notesFile, []);
      const filtered = notes.filter(n => n.id !== Number(args.id));
      if (filtered.length === notes.length) return { error: "Note id not found" };
      writeJson(notesFile, filtered);
      return { result: "Note deleted" };
    },

    // ===== reminders (checked by polling — see wiring notes) =====
    set_reminder: async (args) => {
      const minutes = Number(args.minutes_from_now);
      if (!minutes || minutes <= 0) return { error: "minutes_from_now must be a positive number" };
      const reminders = readJson(remindersFile, []);
      const reminder = {
        id: Date.now(),
        text: String(args.text || ""),
        due: Date.now() + minutes * 60000,
        fired: false,
      };
      reminders.push(reminder);
      writeJson(remindersFile, reminders);
      return { result: `Reminder set for ${minutes} min from now`, id: reminder.id };
    },
    list_reminders: async () => {
      return { result: readJson(remindersFile, []).filter(r => !r.fired) };
    },
    cancel_reminder: async (args) => {
      const reminders = readJson(remindersFile, []);
      const filtered = reminders.filter(r => r.id !== Number(args.id));
      if (filtered.length === reminders.length) return { error: "Reminder id not found" };
      writeJson(remindersFile, filtered);
      return { result: "Reminder cancelled" };
    },
    // Called on an interval from server.js (see wiring notes) — returns newly-due reminders
    _checkDueReminders: () => {
      const reminders = readJson(remindersFile, []);
      const now = Date.now();
      const due = reminders.filter(r => !r.fired && r.due <= now);
      if (due.length) {
        for (const r of due) r.fired = true;
        writeJson(remindersFile, reminders);
      }
      return due;
    },

    // ===== notification =====
    show_notification: async (args) => {
      try { await showNotification(args.title, args.message); return { result: "Notification shown" }; }
      catch (e) { return { error: e.message }; }
    },

    // ===== QR code (api.qrserver.com, no API key) =====
    generate_qr_code: async (args) => {
      const text = String(args.text || "");
      if (!text) return { error: "No text given" };
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      const buf = Buffer.from(await fetch(url).then(r => r.arrayBuffer()));
      const filename = `qr-${Date.now()}.png`;
      fs.writeFileSync(path.join(qrDir, filename), buf);
      return { result: `QR code saved: qrcodes/${filename}`, path: `qrcodes/${filename}` };
    },

    // ===== misc utilities =====
    get_public_ip: async () => {
      const ip = await fetch("https://api.ipify.org?format=json").then(r => r.json());
      return { result: ip.ip };
    },
    shorten_url: async (args) => {
      const url = String(args.url || "");
      if (!/^https?:\/\//i.test(url)) return { error: "Provide a full URL starting with http(s)://" };
      const short = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`).then(r => r.text());
      if (!/^https?:\/\//i.test(short)) return { error: short.slice(0, 200) };
      return { result: short.trim() };
    },
  };
}

// =====================================================
//  TOOL DECLARATIONS — merge into SYSTEM_TOOLS[0].functionDeclarations
// =====================================================
export const EXTRA_TOOL_DECLARATIONS = [
  { name: "calculate", description: "Evaluate a math expression (+ - * / % ^ and parentheses). Use for any arithmetic the user asks for.", parameters: { type: "object", properties: { expression: { type: "string" } }, required: ["expression"] } },
  { name: "get_weather", description: "Get current weather for a city.", parameters: { type: "object", properties: { city: { type: "string" } }, required: ["city"] } },
  { name: "convert_currency", description: "Convert an amount between currencies using live rates.", parameters: { type: "object", properties: { amount: { type: "number" }, from: { type: "string", description: "3-letter currency code, e.g. USD" }, to: { type: "string", description: "3-letter currency code, e.g. INR" } }, required: ["amount", "from", "to"] } },
  { name: "convert_units", description: "Convert between units of length, weight, or temperature (e.g. km<->mi, kg<->lb, C<->F).", parameters: { type: "object", properties: { value: { type: "number" }, from_unit: { type: "string" }, to_unit: { type: "string" } }, required: ["value", "from_unit", "to_unit"] } },
  { name: "add_note", description: "Save a short note/reminder text for later.", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  { name: "list_notes", description: "List all saved notes.", parameters: { type: "object", properties: {} } },
  { name: "search_notes", description: "Search saved notes by keyword.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "delete_note", description: "Delete a note by its id. Requires confirmation.", parameters: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
  { name: "set_reminder", description: "Set a reminder that will be spoken after N minutes.", parameters: { type: "object", properties: { text: { type: "string" }, minutes_from_now: { type: "number" } }, required: ["text", "minutes_from_now"] } },
  { name: "list_reminders", description: "List upcoming reminders.", parameters: { type: "object", properties: {} } },
  { name: "cancel_reminder", description: "Cancel a reminder by its id.", parameters: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
  { name: "show_notification", description: "Show a desktop notification popup.", parameters: { type: "object", properties: { title: { type: "string" }, message: { type: "string" } }, required: ["message"] } },
  { name: "generate_qr_code", description: "Generate a QR code image for text/URL and save it to workspace.", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  { name: "get_public_ip", description: "Get the machine's public IP address.", parameters: { type: "object", properties: {} } },
  { name: "shorten_url", description: "Shorten a long URL.", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
];

// Only destructive/irreversible actions need confirmation; reads and additive
// writes (notes, reminders, QR files) don't need to interrupt the conversation.
export const EXTRA_SENSITIVE_TOOLS = ["delete_note", "cancel_reminder"];

/* =====================================================
   WIRING NOTES — 4 small edits to server.js

   1. Import at the top:
        import { initExtraTools, EXTRA_TOOL_DECLARATIONS, EXTRA_SENSITIVE_TOOLS } from "./extra-tools.js";

   2. After `const workspaceDir = ...` / `fs.mkdirSync(workspaceDir, ...)`:
        const extraTools = initExtraTools(workspaceDir);

   3. In SYSTEM_TOOLS, merge the declarations:
        SYSTEM_TOOLS[0].functionDeclarations.push(...EXTRA_TOOL_DECLARATIONS);

      And extend the sensitive set:
        for (const t of EXTRA_SENSITIVE_TOOLS) SENSITIVE_TOOLS.add(t);

   4. In executeTool()'s switch, add a fallback before `default:`:
        default:
          if (extraTools[name]) return await extraTools[name](args);
          return { error: `Unknown tool: ${name}` };

   5. (Optional but recommended) Proactive reminders: reminders are stored
      but only "fire" when checked. Add a polling loop per-connection, e.g.
      right after `let pendingConfirms = new Map();` in the wss.on("connection")
      handler:

        const reminderInterval = setInterval(() => {
          const due = extraTools._checkDueReminders();
          for (const r of due) {
            geminiSession?.sendRealtimeInput({
              text: `[SYSTEM: Reminder due — remind the user in one short caring sentence: "${r.text}"]`
            });
          }
        }, 15000);

      ...and clear it in ws.on("close", ...):
        clearInterval(reminderInterval);
===================================================== */