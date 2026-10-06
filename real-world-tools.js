// =====================================================
//  REAL-WORLD TOOLS
//  1) PHONE tools  -> declared here, EXECUTED ON THE PHONE (see src/phoneTools.ts)
//  2) CLOUD tools  -> executed on this server (Home Assistant, Telegram, webhooks)
//
//  ENV (all optional — a cloud tool is only enabled if its env is set):
//    HA_URL, HA_TOKEN                  Home Assistant (lights, AC, TV, locks, scenes ...)
//    TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID   send yourself / someone a Telegram message
//    WEBHOOKS='{"lights_off":"https://maker.ifttt.com/trigger/x/with/key/KEY"}'
//                                      named webhooks (IFTTT / Make / n8n / Zapier). Only
//                                      names listed here can be called (no arbitrary URLs).
// =====================================================

const obj = (properties = {}, required = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});
const str = { type: "string" };
const num = { type: "number" };

// ---------- PHONE TOOLS (relayed to the app) ----------
export const PHONE_TOOL_DECLARATIONS = [
  { name: "phone_call", description: "Open the phone dialer with a number ready to call. Requires confirmation.", parameters: obj({ number: str }, ["number"]) },
  { name: "send_sms", description: "Open the SMS composer with number and message prefilled. Requires confirmation.", parameters: obj({ number: str, message: str }, ["number", "message"]) },
  { name: "send_whatsapp", description: "Open WhatsApp chat with message prefilled. 10-digit Indian numbers get +91. Requires confirmation.", parameters: obj({ number: str, message: str }, ["number"]) },
  { name: "send_email", description: "Open the email app with recipient/subject/body prefilled. Requires confirmation.", parameters: obj({ to: str, subject: str, body: str }, ["to"]) },
  { name: "open_maps", description: "Search a place on the phone's maps app.", parameters: obj({ query: str }, ["query"]) },
  { name: "navigate_to", description: "Start turn-by-turn navigation to a destination.", parameters: obj({ destination: str }, ["destination"]) },
  { name: "open_url", description: "Open an http(s) link on the phone.", parameters: obj({ url: str }, ["url"]) },
  { name: "open_app", description: "Open an app on the phone. Supported: youtube, whatsapp, spotify, instagram, facebook, telegram, x, maps, gmail, dialer, messages, browser.", parameters: obj({ app: str }, ["app"]) },
  { name: "play_youtube", description: "Search YouTube for something in the YouTube app.", parameters: obj({ query: str }, ["query"]) },
  { name: "play_spotify", description: "Search Spotify for a song/artist in the Spotify app.", parameters: obj({ query: str }, ["query"]) },
  { name: "set_alarm", description: "Set an alarm on the phone (Android). hour is 0-23.", parameters: obj({ hour: num, minute: num, label: str }, ["hour", "minute"]) },
  { name: "set_timer", description: "Start a countdown timer on the phone (Android).", parameters: obj({ seconds: num, label: str }, ["seconds"]) },
  { name: "add_calendar_event", description: "Open a prefilled calendar event. start_iso/end_iso like 2026-10-07T18:00:00 (phone local time).", parameters: obj({ title: str, start_iso: str, end_iso: str, location: str, details: str }, ["title", "start_iso"]) },
  { name: "vibrate_phone", description: "Vibrate the phone.", parameters: obj({ ms: num }) },
  { name: "share_text", description: "Open the phone's share sheet with some text.", parameters: obj({ text: str }, ["text"]) },
  { name: "copy_to_clipboard", description: "Copy text to the phone's clipboard.", parameters: obj({ text: str }, ["text"]) },
  { name: "read_clipboard", description: "Read the phone's clipboard text. Requires confirmation.", parameters: obj() },
  { name: "flashlight", description: "Turn the phone flashlight on or off.", parameters: obj({ on: { type: "boolean" } }, ["on"]) },
  { name: "get_battery", description: "Get phone battery level and charging state.", parameters: obj() },
  { name: "get_location", description: "Get the phone's current GPS location. Requires confirmation.", parameters: obj() },
  { name: "open_settings", description: "Open a phone settings screen. page: main, wifi, bluetooth, display, sound, airplane, location, app.", parameters: obj({ page: str }) },
  { name: "get_device_info", description: "Get phone OS and version.", parameters: obj() },
];

export const CLIENT_TOOLS = new Set(PHONE_TOOL_DECLARATIONS.map((d) => d.name));

// These need the user's tap on Allow before running
const PHONE_SENSITIVE = ["phone_call", "send_sms", "send_whatsapp", "send_email", "read_clipboard", "get_location"];

// ---------- CLOUD TOOLS ----------
export function initRealWorldTools() {
  const decls = [...PHONE_TOOL_DECLARATIONS];
  const sensitive = [...PHONE_SENSITIVE];
  const run = {};

  const HA_URL = (process.env.HA_URL || "").replace(/\/+$/, "");
  const HA_TOKEN = process.env.HA_TOKEN || "";
  const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
  const TG_CHAT = process.env.TELEGRAM_CHAT_ID || "";
  let WEBHOOKS = {};
  try { WEBHOOKS = JSON.parse(process.env.WEBHOOKS || "{}"); } catch { console.warn("⚠️ WEBHOOKS env is not valid JSON"); }

  // ---- Home Assistant (smart home) ----
  if (HA_URL && HA_TOKEN) {
    const ha = async (pathname, init = {}) => {
      const res = await fetch(`${HA_URL}${pathname}`, {
        ...init,
        headers: { Authorization: `Bearer ${HA_TOKEN}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`Home Assistant ${res.status}: ${text.slice(0, 200)}`);
      try { return JSON.parse(text); } catch { return text; }
    };

    decls.push(
      { name: "ha_list_entities", description: "List smart-home devices (entity ids + state). Optionally filter by domain: light, switch, climate, fan, lock, media_player, cover, scene, sensor.", parameters: obj({ domain: str }) },
      { name: "ha_get_state", description: "Get the state of one smart-home entity, e.g. light.bedroom.", parameters: obj({ entity_id: str }, ["entity_id"]) },
      { name: "ha_call_service", description: "Control a smart-home device. Examples: domain=light service=turn_on entity_id=light.bedroom data_json={\"brightness_pct\":50}; domain=climate service=set_temperature data_json={\"temperature\":24}. Requires confirmation.", parameters: obj({ domain: str, service: str, entity_id: str, data_json: str }, ["domain", "service"]) },
    );
    sensitive.push("ha_call_service");

    run.ha_list_entities = async (a) => {
      const all = await ha("/api/states");
      const dom = String(a.domain || "").toLowerCase();
      const list = all
        .filter((s) => !dom || s.entity_id.startsWith(dom + "."))
        .slice(0, 80)
        .map((s) => ({ entity_id: s.entity_id, state: s.state, name: s.attributes?.friendly_name }));
      return { result: list, count: list.length };
    };
    run.ha_get_state = async (a) => {
      if (!/^[a-z_]+\.[\w]+$/.test(String(a.entity_id || ""))) return { error: "Invalid entity_id" };
      const s = await ha(`/api/states/${a.entity_id}`);
      return { result: { entity_id: s.entity_id, state: s.state, attributes: s.attributes } };
    };
    run.ha_call_service = async (a) => {
      const domain = String(a.domain || ""), service = String(a.service || "");
      if (!/^[a-z_]+$/.test(domain) || !/^[a-z_]+$/.test(service)) return { error: "Invalid domain/service" };
      let data = {};
      if (a.data_json) { try { data = JSON.parse(a.data_json); } catch { return { error: "data_json is not valid JSON" }; } }
      if (a.entity_id) {
        if (!/^[a-z_]+\.[\w]+$/.test(String(a.entity_id))) return { error: "Invalid entity_id" };
        data.entity_id = a.entity_id;
      }
      await ha(`/api/services/${domain}/${service}`, { method: "POST", body: JSON.stringify(data) });
      return { result: `${domain}.${service} done` };
    };
  }

  // ---- Telegram ----
  if (TG_TOKEN && TG_CHAT) {
    decls.push({ name: "send_telegram", description: "Send a Telegram message to the owner's chat. Requires confirmation.", parameters: obj({ text: str }, ["text"]) });
    sensitive.push("send_telegram");
    run.send_telegram = async (a) => {
      const text = String(a.text || "").slice(0, 3500);
      if (!text) return { error: "No text" };
      const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT, text }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return { error: `Telegram error ${res.status}` };
      return { result: "Telegram message sent" };
    };
  }

  // ---- Named webhooks (IFTTT / Make / n8n / Zapier) ----
  const hookNames = Object.keys(WEBHOOKS);
  if (hookNames.length) {
    decls.push(
      { name: "list_webhooks", description: "List the names of available automation webhooks.", parameters: obj() },
      { name: "trigger_webhook", description: `Trigger an automation by name. Available: ${hookNames.join(", ")}. Requires confirmation.`, parameters: obj({ name: str, payload_json: str }, ["name"]) },
    );
    sensitive.push("trigger_webhook");
    run.list_webhooks = async () => ({ result: hookNames });
    run.trigger_webhook = async (a) => {
      const url = WEBHOOKS[String(a.name || "")];
      if (!url) return { error: `Unknown webhook. Available: ${hookNames.join(", ")}` };
      let payload = {};
      if (a.payload_json) { try { payload = JSON.parse(a.payload_json); } catch { return { error: "payload_json is not valid JSON" }; } }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      return res.ok ? { result: `Webhook '${a.name}' triggered` } : { error: `Webhook returned ${res.status}` };
    };
  }

  console.log(`🌍 real-world tools: phone=${PHONE_TOOL_DECLARATIONS.length}, cloud=${Object.keys(run).length} (${Object.keys(run).join(", ") || "none"})`);
  return { decls, sensitive, run };
}