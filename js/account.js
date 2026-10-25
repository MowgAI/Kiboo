"use strict";
/* =====================================================================
   COMPTES (sur invitation), avec Supabase.
   - Kiboo reste jouable sans compte : tout est gardé dans le navigateur
     (localStorage, clés « kiboo.* »).
   - Une personne invitée (Supabase > Authentication > Users) se connecte
     avec un lien magique reçu par e-mail. Sa sauvegarde suit alors son
     compte d'un appareil à l'autre : progression, collection, historique
     d'évaluation et réglages (toutes les clés « kiboo.* »), plus un pseudo.
   - Un journal (donnes jouées, réponses, évaluations) est envoyé pour la
     personnalisation.
   - La base est décrite dans supabase/schema.sql : chacun ne peut lire et
     modifier que ses propres données (Row Level Security).
   La bibliothèque Supabase (js/vendor/supabase.js) n'est chargée que si on
   en a besoin : session déjà ouverte, retour d'un lien magique, ou clic sur
   « Se connecter ». Les comptes ne marchent que sur le site GitHub Pages
   (c'est là que le lien magique ramène).
   ===================================================================== */
const Account = (() => {
  const SB_URL = "https://hhihpabzhscbouqaflko.supabase.co";
  const SB_KEY = "sb_publishable_86PeLKip3feazaHj438HjA_8PNLuN6_";      // clé publique : la sécurité vient de la base
  const HOME = "https://mowgai.github.io/Kiboo/";
  const SESSION = "sb-hhihpabzhscbouqaflko-auth-token";                  // où Supabase garde la session
  const SKIP_INTRO = "kiboo.skipIntroOnce";                              // après une synchronisation qui recharge la page
  const allowed = () => location.hostname === "mowgai.github.io" || ["localhost", "127.0.0.1"].includes(location.hostname);

  let sb = null, user = null, pseudo = "", lastSync = null, busy = false, context = "";
  let pushTimer = null, queue = [];

  /* ---------- Chargement de la bibliothèque Supabase ---------- */
  let loading = null;
  function client() {
    if (sb) return Promise.resolve(sb);
    if (!loading) loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "js/vendor/supabase.js?v=" + (window.KIBOO_VERSION || "");
      s.onload = () => {
        sb = window.supabase.createClient(SB_URL, SB_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
        });
        sb.auth.onAuthStateChange((event, session) => { setUser(session ? session.user : null); });
        resolve(sb);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return loading;
  }

  /* ---------- La sauvegarde : toutes les clés « kiboo.* » du navigateur ---------- */
  const OWN = k => k.startsWith("kiboo.") && k !== SKIP_INTRO;
  function snapshot() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (OWN(k)) data[k] = localStorage.getItem(k);
      }
    } catch (e) { /* stockage indisponible */ }
    return data;
  }
  const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
  // Fusion du navigateur et du compte : rien n'est perdu (collection et
  // historique réunis, meilleure progression) ; pour le reste, le compte gagne.
  function merge(local, remote) {
    const out = { ...local, ...remote };
    const R = "kiboo.rewards.v1", E = "kiboo.eval.v1";
    const lr = parse(local[R]), rr = parse(remote[R]);
    if (lr && rr) out[R] = JSON.stringify({
      progress: Math.max(lr.progress | 0, rr.progress | 0),
      collection: [...new Set([...(lr.collection || []), ...(rr.collection || [])])].sort((a, b) => a - b),
    });
    const le = parse(local[E]), re = parse(remote[E]);
    if (Array.isArray(le) && Array.isArray(re)) {
      const byTime = new Map([...le, ...re].map(h => [h.t, h]));
      out[E] = JSON.stringify([...byTime.values()].sort((a, b) => a.t - b.t).slice(-200));
    }
    return out;
  }

  // Première synchronisation après la connexion : on fusionne, on écrit des
  // deux côtés, et on recharge la page si le navigateur a reçu des données.
  async function pull() {
    const { data, error } = await sb.from("saves").select("data").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    const local = snapshot();
    const merged = merge(local, (data && data.data) || {});
    let changed = false;
    for (const [k, v] of Object.entries(merged)) {
      if (local[k] !== v) { try { localStorage.setItem(k, v); changed = true; } catch (e) { /* idem */ } }
    }
    await push(merged);
    const p = await sb.from("profiles").select("pseudo").eq("id", user.id).maybeSingle();
    pseudo = (p.data && p.data.pseudo) || "";
    if (!p.data) await sb.from("profiles").upsert({ id: user.id, pseudo: null });
    if (changed) {
      try { sessionStorage.setItem(SKIP_INTRO, "1"); } catch (e) { /* idem */ }
      location.reload();
    }
  }
  async function push(data = snapshot()) {
    if (!sb || !user) return;
    const { error } = await sb.from("saves").upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
    if (error) throw error;
    lastSync = new Date();
    render();
  }
  // Chaque fois que Kiboo enregistre quelque chose, on envoie la sauvegarde quelques secondes après.
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    setItem.call(this, k, v);
    if (this === window.localStorage && user && OWN(String(k))) {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => push().catch(() => {}), 4000);
    }
  };

  /* ---------- Le journal ---------- */
  // kind : "deal" (donne finie), "answer" (question ou exercice), "eval" (score duplicate).
  function log(kind, data = {}) {
    if (!user) return;
    queue.push({ kind, data: { ...data, lang: I18N.lang, v: window.KIBOO_VERSION || "" } });
    if (queue.length >= 10) flush();
  }
  async function flush() {
    if (!sb || !user || !queue.length) return;
    const rows = queue.splice(0);
    const { error } = await sb.from("events").insert(rows);
    if (error) queue.unshift(...rows.slice(-50));    // on réessaiera plus tard
  }
  setInterval(() => flush().catch(() => {}), 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && user) { flush().catch(() => {}); push().catch(() => {}); }
  });
  // Où en est le joueur (question ou exercice en cours), pour le journal des réponses.
  const setContext = c => { context = c; };
  const answered = ok => log("answer", { ok, where: context });

  /* ---------- Connexion ---------- */
  async function setUser(u) {
    const was = user && user.id;
    user = u;
    if (u && u.id !== was) {
      busy = true; render();
      try { await pull(); } catch (e) { status(T("account.syncError")); }
      busy = false;
    }
    render();
  }

  async function sendLink(email) {
    await client();
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: HOME } });
    if (!error) return status(T("account.sent", { email }), true);
    const m = (error.message || "").toLowerCase();
    if (m.includes("signup") || m.includes("not allowed") || m.includes("not found")) status(T("account.notInvited"));
    else if (m.includes("rate") || m.includes("seconds")) status(T("account.rate"));
    else status(T("account.error", { msg: error.message }));
  }

  /* ---------- La fenêtre « Mon compte » ---------- */
  let message = "", messageOk = false;
  function status(text, ok = false) { message = text; messageOk = ok; render(); }

  function render() {
    const btn = $("btn-account");
    if (btn) btn.querySelector(".lbl").textContent = user ? (pseudo || T("account.me")) : T("account.login");
    const body = $("account-body");
    if (!body || !$("account").open) return;
    const msg = message ? `<p class="ex-result ${messageOk ? "ok" : "ko"}">${message}</p>` : "";
    if (!allowed()) {
      body.innerHTML = `<p>${T("account.elsewhere", { url: HOME })}</p>`;
      return;
    }
    if (!user) {
      body.innerHTML = `<p>${T("account.intro")}</p>
        <form class="account-form" data-role="login">
          <label class="field"><span>${T("account.email")}</span>
            <input type="email" required autocomplete="email" data-role="email" placeholder="nom@exemple.fr"></label>
          <button class="act" type="submit">${T("account.send")}</button>
        </form>${msg}
        <details class="account-privacy"><summary>${T("account.privacyTitle")}</summary>${T("account.privacy")}</details>`;
      body.querySelector("[data-role=login]").onsubmit = e => {
        e.preventDefault();
        const email = body.querySelector("[data-role=email]").value.trim();
        if (email) { status(T("account.sending"), true); sendLink(email).catch(err => status(T("account.error", { msg: err.message || err }))); }
      };
      return;
    }
    const when = lastSync ? lastSync.toLocaleTimeString(I18N.lang, { hour: "2-digit", minute: "2-digit" }) : "";
    body.innerHTML = `<p>${T("account.connected", { email: user.email })}</p>
      <form class="account-form" data-role="pseudo">
        <label class="field"><span>${T("account.pseudo")}</span>
          <input type="text" maxlength="40" data-role="pseudo-input" value="${pseudo.replace(/"/g, "&quot;")}"></label>
        <button class="act ghost" type="submit">${T("account.save")}</button>
      </form>
      <p class="coco-legend">${busy ? T("account.syncing") : when ? T("account.synced", { when }) : ""}</p>${msg}
      <div class="ex-actions">
        <button class="act ghost" type="button" data-a="sync">${T("account.syncNow")}</button>
        <button class="act ghost" type="button" data-a="logout">${T("account.logout")}</button>
      </div>
      <details class="account-privacy"><summary>${T("account.privacyTitle")}</summary>${T("account.privacy")}
        <p><button class="act ghost account-delete" type="button" data-a="delete">${T("account.delete")}</button></p></details>`;
    body.querySelector("[data-role=pseudo]").onsubmit = async e => {
      e.preventDefault();
      const v = body.querySelector("[data-role=pseudo-input]").value.trim().slice(0, 40);
      const { error } = await sb.from("profiles").upsert({ id: user.id, pseudo: v || null, updated_at: new Date().toISOString() });
      if (error) return status(T("account.error", { msg: error.message }));
      pseudo = v;
      status(T("account.saved"), true);
    };
    body.querySelector("[data-a=sync]").onclick = () => { flush().catch(() => {}); push().then(() => status(T("account.saved"), true), err => status(T("account.error", { msg: err.message }))); };
    body.querySelector("[data-a=logout]").onclick = async () => { await flush().catch(() => {}); await push().catch(() => {}); await sb.auth.signOut(); pseudo = ""; status(T("account.loggedOut"), true); };
    body.querySelector("[data-a=delete]").onclick = async () => {
      if (!confirm(T("account.deleteConfirm"))) return;
      const { error } = await sb.rpc("delete_my_account");
      if (error) return status(T("account.error", { msg: error.message }));
      await sb.auth.signOut();
      pseudo = ""; queue = [];
      status(T("account.deleted"), true);
    };
  }

  function open() {
    message = "";
    $("account").showModal();
    render();
    if (allowed()) client().catch(() => status(T("account.loadError")));
  }

  window.addEventListener("DOMContentLoaded", () => {
    $("btn-account").addEventListener("click", open);
    $("btn-account-close").addEventListener("click", () => $("account").close());
    $("account").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    render();
    // Session déjà ouverte, ou retour d'un lien magique / d'une invitation : on se reconnecte.
    let has = false;
    try { has = !!localStorage.getItem(SESSION); } catch (e) { /* idem */ }
    if (allowed() && (has || /access_token|error_description|type=(magiclink|invite|recovery)/.test(location.hash))) {
      client().then(() => sb.auth.getSession()).then(({ data }) => {
        if (data.session) setUser(data.session.user);
        if (/access_token|error_description/.test(location.hash)) {
          if (/error_description/.test(location.hash)) { open(); status(T("account.linkError")); }
          history.replaceState(null, "", location.pathname + location.search);
        }
      }).catch(() => {});
    }
  });
  document.addEventListener("kiboo-lang", render);

  // Recharge après synchronisation : l'accueil ne se réaffiche pas.
  const skipIntro = () => { try { const s = sessionStorage.getItem(SKIP_INTRO) === "1"; sessionStorage.removeItem(SKIP_INTRO); return s; } catch (e) { return false; } };

  return { log, setContext, answered, skipIntro, get user() { return user; } };
})();
