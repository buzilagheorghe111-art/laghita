// Supabase Edge Function: sends a work-status email through a private Google Apps Script Gmail relay.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://buzilagheorghe111-art.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Autentificare necesară." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const relayUrl = Deno.env.get("MAIL_RELAY_URL");
  const relayToken = Deno.env.get("MAIL_RELAY_TOKEN");
  if (!relayUrl || !relayToken) return json({ error: "Relay-ul Gmail nu este configurat încă." }, 503);

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.email?.toLowerCase() !== "buzilagheorghe111@gmail.com") {
    return json({ error: "Acces interzis." }, 403);
  }

  let body: { booking_id?: string; status?: string };
  try { body = await req.json(); } catch { return json({ error: "Cerere invalidă." }, 400); }
  const allowed = ["in_progress", "waiting_parts", "completed"];
  if (!body.booking_id || !allowed.includes(body.status || "")) return json({ error: "Date invalide." }, 400);

  const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", body.booking_id).single();
  if (error || !booking) return json({ error: "Programarea nu a fost găsită." }, 404);
  if (!booking.email) return json({ error: "Clientul nu a furnizat o adresă de e-mail." }, 422);

  const labels: Record<string, string> = {
    in_progress: "În lucru",
    waiting_parts: "Așteaptă piese",
    completed: "Finalizată",
  };
  const payload = {
    token: relayToken,
    to: booking.email,
    customer: booking.name || booking.nume || "client",
    car: booking.car || booking.masina || "autovehiculul dumneavoastră",
    tracking_code: booking.tracking_code || "",
    status: body.status,
    status_label: labels[body.status!],
  };

  try {
    const response = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      return json({ error: result.error || "Gmail nu a confirmat trimiterea mesajului." }, 502);
    }
    return json({ success: true });
  } catch (_e) {
    return json({ error: "Nu am putut contacta serviciul Gmail." }, 502);
  }
});
