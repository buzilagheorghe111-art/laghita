// Google Apps Script – relay Gmail pentru notificările Service Auto La Ghiță.
// Configurează Script Property MAIL_RELAY_TOKEN cu același token ca în Supabase.
function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var token = PropertiesService.getScriptProperties().getProperty("MAIL_RELAY_TOKEN");
    if (!token || data.token !== token) return output({ success: false, error: "Unauthorized" });
    var allowed = {
      in_progress: "În lucru",
      waiting_parts: "Așteaptă piese",
      completed: "Finalizată"
    };
    if (!allowed[data.status] || !data.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
      return output({ success: false, error: "Date invalide" });
    }
    var customer = String(data.customer || "client").slice(0, 100);
    var car = String(data.car || "autovehiculul dumneavoastră").slice(0, 150);
    var label = allowed[data.status];
    var code = String(data.tracking_code || "").slice(0, 30);
    var subject = "Actualizare lucrare – Service Auto La Ghiță: " + label;
    var message = "Bună ziua, " + customer + "!\n\n" +
      "Vă informăm că starea lucrării pentru " + car + " a fost actualizată: " + label + ".\n" +
      (data.status === "in_progress" ? "Autovehiculul dumneavoastră se află în lucru." :
       data.status === "waiting_parts" ? "Lucrarea este în așteptarea pieselor necesare. Vă vom ține la curent." :
       "Lucrarea a fost finalizată. Vă așteptăm să ridicați autovehiculul.") +
      (code ? "\nCod programare: " + code : "") +
      "\n\nCu stimă,\nService Auto „La Ghiță”\nTelefon: 0741 826 476";
    MailApp.sendEmail({ to: data.to, subject: subject, body: message, name: "Service Auto La Ghiță" });
    return output({ success: true });
  } catch (err) {
    return output({ success: false, error: String(err && err.message || err) });
  }
}
function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
