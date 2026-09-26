const $ = (id) => document.getElementById(id);

// Authentication launcher is initialized first so a later page feature cannot
// prevent the login/signup modal from opening if another script section fails.
function niabaSetAccountMode(mode){
  const signup=mode==="signup";
  const modal=$("accountModal");
  if(!modal) return;
  $("accountTitle").textContent=signup?"Créer votre compte":"Se connecter";
  $("accountSubtitle").textContent=signup?"Gérez vos voyages simplement.":"Retrouvez vos demandes et préparez vos prochains voyages.";
  $("loginTab")?.classList.toggle("active",!signup);
  $("signupTab")?.classList.toggle("active",signup);
  document.querySelectorAll(".signup-only").forEach(el=>el.hidden=!signup);
  const submit=$("accountForm")?.querySelector('button[type="submit"]');
  if(submit) submit.textContent=signup?"Créer mon compte":"Se connecter";
  const password=$("accountPassword");
  if(password) password.autocomplete=signup?"new-password":"current-password";
  const confirm=$("accountPasswordConfirm");
  if(confirm){confirm.required=signup;confirm.disabled=!signup;}
  ["accountFirstName","accountName"].forEach(id=>{const field=$(id);if(field){field.required=signup;field.disabled=!signup;}});
}
function niabaOpenAccount(mode="login"){
  const modal=$("accountModal");
  if(!modal) return;
  niabaSetAccountMode(mode);
  modal.hidden=false;
  document.body.classList.add("modal-open");
}
document.addEventListener("click",(event)=>{
  const trigger=event.target.closest("[data-account-open]");
  if(!trigger) return;
  event.preventDefault();
  niabaOpenAccount(trigger.dataset.accountOpen||"login");
});
window.niabaOpenAccount=niabaOpenAccount;

if ($("year")) $("year").textContent = new Date().getFullYear();

$("menuBtn")?.addEventListener("click", () => {
  const nav = $("nav");
  const open = nav.classList.toggle("open");
  $("menuBtn").setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#nav a").forEach((a) => {
  a.addEventListener("click", () => {
    $("nav").classList.remove("open");
    $("menuBtn").setAttribute("aria-expanded", "false");
  });
});

$("swapBtn")?.addEventListener("click", () => {
  const from = $("from").value;
  $("from").value = $("to").value;
  $("to").value = from;
});

document.querySelectorAll('input[name="tripType"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const oneWay = document.querySelector('input[name="tripType"]:checked').value === "oneway";
    $("returnField").style.display = oneWay ? "none" : "";
    $("return").required = !oneWay;
    if (oneWay) $("return").value = "";
  });
});

const today = new Date().toISOString().slice(0, 10);
if ($("depart")) $("depart").min = today;
if ($("return")) $("return").min = today;

$("depart")?.addEventListener("change", () => {
  $("return").min = $("depart").value || today;
  if ($("return").value && $("return").value < $("depart").value) {
    $("return").value = "";
  }
});

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(amount, currency) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "XOF" || currency === "XAF" ? 0 : 2
    }).format(amount);
  } catch {
    return amount + " " + currency;
  }
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDuration(value = "") {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) return value;
  const hours = match[1] ? match[1] + " h" : "";
  const minutes = match[2] ? match[2] + " min" : "";
  return [hours, minutes].filter(Boolean).join(" ");
}


async function submitInquiryLead(payload){
  if(!window.niabaSupabase) throw new Error("Le service de demande est momentanément indisponible.");
  let userId=null;
  try{
    const {data}=await window.niabaSupabase.auth.getSession();
    userId=data?.session?.user?.id||null;
  }catch(_err){}
  const row={
    user_id:userId,
    lead_type:payload.lead_type,
    customer_type:payload.customer_type||"individual",
    full_name:String(payload.full_name||"").trim(),
    email:String(payload.email||"").trim()||null,
    phone:String(payload.phone||"").trim()||null,
    company_name:String(payload.company_name||"").trim()||null,
    subject:String(payload.subject||"").trim()||null,
    message:String(payload.message||"").trim()||null,
    details:payload.details||{},
    source:payload.source||"website",
    priority:payload.priority||"normal"
  };
  if(!row.full_name) throw new Error("Le nom est obligatoire.");
  if(!row.email&&!row.phone) throw new Error("Ajoutez un e-mail ou un numéro de téléphone.");
  const {error}=await window.niabaSupabase.from("inquiry_leads").insert(row);
  if(error) throw error;
  return true;
}

function setInquiryType(type){
  const select=$("inquiryType");
  if(!select) return;
  const allowed=["flight","hotel","car","visa","corporate","custom"];
  if(allowed.includes(type)) select.value=type;
  select.dispatchEvent(new Event("change"));
}

function itineraryHtml(itinerary, label) {
  const segments = itinerary?.segments || [];
  if (!segments.length) return "";

  const first = segments[0];
  const last = segments[segments.length - 1];
  const stops = Math.max(0, segments.length - 1);

  return `
    <div class="route-line">
      <div>
        <small>${escapeHtml(label)}</small>
        <strong>${escapeHtml(first.from)} → ${escapeHtml(last.to)}</strong>
      </div>
      <div>
        <span>${escapeHtml(formatDateTime(first.departureAt))}</span>
        <span>${escapeHtml(formatDateTime(last.arrivalAt))}</span>
      </div>
      <div class="route-meta">
        <span>${escapeHtml(formatDuration(itinerary.duration))}</span>
        <span>${stops === 0 ? "Direct" : stops + " escale" + (stops > 1 ? "s" : "")}</span>
      </div>
    </div>
  `;
}

function bookingLink(offer) {
  const outbound = offer.itineraries?.[0];
  const first = outbound?.segments?.[0];
  const last = outbound?.segments?.[outbound.segments.length - 1];
  const message = [
    "Bonjour Niaba Voyage, je souhaite réserver ce vol.",
    "",
    "Trajet : " + (offer.origin || first?.from || "") + " → " + (offer.destination || last?.to || ""),
    "Compagnie : " + (offer.airline?.name || offer.airline?.code || ""),
    "Départ : " + formatDateTime(first?.departureAt),
    "Prix affiché : " + formatPrice(offer.price.amount, offer.price.currency),
    "Référence offre : " + offer.id
  ].join("\n");

  return "https://wa.me/22891813448?text=" + encodeURIComponent(message);
}

function renderOffers(data) {
  const container = $("flightResults");
  const notice = $("flightResultsNotice");
  const offers = Array.isArray(data.offers) ? data.offers : [];

  if (data.testMode) {
    notice.textContent = "Mode test : les tarifs affichés proviennent de l'environnement de test du fournisseur et ne sont pas encore des tarifs de vente réels.";
    notice.className = "results-notice warning";
  } else {
    notice.textContent = "Tarifs Niaba Voyage, sous réserve de disponibilité et de confirmation au moment de la réservation.";
    notice.className = "results-notice";
  }

  if (!offers.length) {
    container.innerHTML = '<div class="results-empty">Aucun vol trouvé pour ces critères. Essayez d’autres dates ou aéroports.</div>';
    return;
  }

  container.innerHTML = offers.map((offer) => {
    const seats = offer.seats ? `<span class="seat-note">${offer.seats} place${offer.seats > 1 ? "s" : ""} disponible${offer.seats > 1 ? "s" : ""}</span>` : "";
    return `
      <article class="flight-result-card">
        <div class="flight-result-main">
          <div class="airline-name">
            <span class="airline-code">${escapeHtml(offer.airline?.code || "VOL")}</span>
            <div>
              <strong>${escapeHtml(offer.airline?.name || "Compagnie aérienne")}</strong>
              ${seats}
            </div>
          </div>
          <div class="itineraries">
            ${itineraryHtml(offer.itineraries?.[0], "Aller")}
            ${offer.itineraries?.[1] ? itineraryHtml(offer.itineraries[1], "Retour") : ""}
          </div>
        </div>
        <div class="flight-result-price">
          <small>Prix Niaba Voyage</small>
          <strong>${escapeHtml(formatPrice(offer.price.amount, offer.price.currency))}</strong>
          <button class="btn primary reserve-btn" type="button" data-offer-id="${escapeHtml(offer.id)}">Choisir ce vol</button>
        </div>
      </article>
    `;
  }).join("");
  container.querySelectorAll("[data-offer-id]").forEach(btn=>btn.addEventListener("click",()=>openBooking(offers.find(o=>String(o.id)===btn.dataset.offerId))));
}

let pendingFlightQuoteContext=null;

$("flightForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const oneWay = document.querySelector('input[name="tripType"]:checked').value === "oneway";
  if (!oneWay && !$("return").value) {
    $("return").focus();
    return;
  }

  const button = e.currentTarget.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Recherche en cours…";

  $("flightResultsSection").hidden = false;
  $("flightResults").innerHTML = '<div class="results-loading">Recherche des meilleurs vols disponibles…</div>';
  $("flightResultsNotice").textContent = "";
  $("flightResultsSection").scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const paxRaw = $("pax").value;
    const adults = paxRaw === "4+" ? "4" : paxRaw;
    const params = new URLSearchParams({
      origin: $("from").value,
      destination: $("to").value,
      departureDate: $("depart").value,
      adults
    });

    if (!oneWay && $("return").value) {
      params.set("returnDate", $("return").value);
    }

    const response = await fetch("/api/flights?" + params.toString());
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerError=new Error(data.error || "Impossible de rechercher les vols actuellement.");
      providerError.status=response.status;
      throw providerError;
    }

    renderOffers(data);
  } catch (error) {
    $("flightResultsNotice").textContent = "";
    const isProviderUnavailable=error.status===503 || /moteur de vols.*pas encore connecté/i.test(error.message||"");
    if(isProviderUnavailable){
      const oneWay=document.querySelector('input[name="tripType"]:checked')?.value==="oneway";
      pendingFlightQuoteContext={
        origin:$("from").value.trim(),
        destination:$("to").value.trim(),
        departure_date:$("depart").value,
        return_date:oneWay?null:($("return").value||null),
        adults:$("adults")?.value||$("pax").value||"1",
        children:$("children")?.value||"0",
        infants:$("infants")?.value||"0",
        cabin:$("cabin")?.value||"ECONOMY"
      };
      setInquiryType("flight");
      if($("inquiryDestination")) $("inquiryDestination").value=pendingFlightQuoteContext.destination;
      if($("inquiryDate")) $("inquiryDate").value=pendingFlightQuoteContext.departure_date||"";
      if($("inquiryMessage")) $("inquiryMessage").value=[
        "Je souhaite recevoir un devis de vol.",
        "Trajet : "+pendingFlightQuoteContext.origin+" → "+pendingFlightQuoteContext.destination,
        "Aller : "+(pendingFlightQuoteContext.departure_date||"À définir"),
        "Retour : "+(pendingFlightQuoteContext.return_date||"Aller simple / à définir"),
        "Voyageurs : "+pendingFlightQuoteContext.adults+" adulte(s), "+pendingFlightQuoteContext.children+" enfant(s), "+pendingFlightQuoteContext.infants+" bébé(s)",
        "Classe : "+pendingFlightQuoteContext.cabin
      ].join("\n");
      $("flightResults").innerHTML =
        '<div class="results-error quote-fallback"><strong>Recevez un devis personnalisé.</strong><span>La tarification automatique Amadeus est en cours d’activation. Vos critères de recherche sont déjà préparés pour un conseiller Niaba Voyage.</span><div class="results-error-actions"><button id="flightQuoteFallback" class="btn primary" type="button">Continuer ma demande de devis</button><a href="https://wa.me/22891813448" target="_blank" rel="noopener">Ou continuer sur WhatsApp</a></div></div>';
      $("flightQuoteFallback")?.addEventListener("click",()=>{
        $("contact")?.scrollIntoView({behavior:"smooth",block:"start"});
        setTimeout(()=>$("inquiryName")?.focus(),450);
      });
    }else{
      $("flightResults").innerHTML =
        '<div class="results-error"><strong>Recherche indisponible.</strong><span>' +
        escapeHtml(error.message) +
        '</span><a href="https://wa.me/22891813448" target="_blank" rel="noopener">Contacter Niaba Voyage sur WhatsApp</a></div>';
    }
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});


const inquiryType=$("inquiryType");
function refreshInquiryForm(){
  const type=inquiryType?.value;
  const customer=$("inquiryCustomerType");
  const company=$("inquiryCompany");
  const visaNote=$("visaInlineDisclaimer");
  if(visaNote) visaNote.hidden=type!=="visa";
  const business=type==="corporate"||customer?.value==="company"||customer?.value==="organization";
  if(company) company.required=business;
}
inquiryType?.addEventListener("change",refreshInquiryForm);
$("inquiryCustomerType")?.addEventListener("change",refreshInquiryForm);
document.querySelectorAll("[data-lead-type]").forEach(link=>link.addEventListener("click",()=>{
  setInquiryType(link.dataset.leadType||"custom");
}));
const leadParam=new URLSearchParams(location.search).get("lead");
if(leadParam) setInquiryType(leadParam);
refreshInquiryForm();

$("inquiryForm")?.addEventListener("submit",async(e)=>{
  e.preventDefault();
  const email=$("inquiryEmail").value.trim(), phone=$("inquiryPhone").value.trim();
  const status=$("inquiryStatus"), button=e.currentTarget.querySelector('button[type="submit"]');
  if(!email&&!phone){
    status.textContent="Indiquez au moins un e-mail ou un numéro de téléphone.";
    status.className="form-status error";
    $("inquiryEmail").focus();
    return;
  }
  const type=$("inquiryType").value;
  button.disabled=true;
  const original=button.textContent;
  button.textContent="Envoi en cours…";
  status.textContent="";
  try{
    await submitInquiryLead({
      lead_type:type,
      customer_type:$("inquiryCustomerType").value,
      full_name:$("inquiryName").value,
      email,
      phone,
      company_name:$("inquiryCompany").value,
      subject:type==="corporate"?"Demande entreprise":type==="visa"?"Assistance visa":"Demande de devis",
      message:$("inquiryMessage").value,
      details:{
        destination:$("inquiryDestination").value.trim()||null,
        desired_date:$("inquiryDate").value||null,
        flight_search:type==="flight" ? pendingFlightQuoteContext : null,
        consent:true,
        page:location.pathname
      },
      source:type==="visa"?"visa_form":type==="corporate"?"corporate_form":type==="flight"&&pendingFlightQuoteContext?"flight_search":"contact_form",
      priority:type==="corporate"||type==="flight"?"high":"normal"
    });
    status.textContent="Demande enregistrée. Un conseiller Niaba Voyage pourra maintenant la suivre depuis le back-office.";
    status.className="form-status success";
    pendingFlightQuoteContext=null;
    e.currentTarget.reset();
    refreshInquiryForm();
  }catch(err){
    console.error("Inquiry lead:",err);
    status.textContent=err.message||"Impossible d’enregistrer la demande pour le moment. Vous pouvez aussi nous contacter sur WhatsApp.";
    status.className="form-status error";
  }finally{
    button.disabled=false;
    button.textContent=original;
  }
});


$("quoteForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const msg = [
    "Bonjour Niaba Voyage, je souhaite un devis.",
    "",
    "Nom : " + $("qName").value,
    "Téléphone : " + $("qPhone").value,
    "Besoin : " + $("qNeed").value,
    "Destination : " + $("qDestination").value,
    "Date souhaitée : " + ($("qDate").value || "À définir"),
    "Voyageurs : " + $("qPeople").value,
    "Budget estimatif : " + ($("qBudget").value || "À définir"),
    "Paiement souhaité : " + $("qPayment").value,
    "Précisions : " + ($("qNotes").value || "Aucune")
  ].join("\n");

  try{
    await submitInquiryLead({
      lead_type:"custom",
      customer_type:"individual",
      full_name:$("qName").value,
      phone:$("qPhone").value,
      subject:"Demande de devis",
      message:msg,
      details:{destination:$("qDestination").value,date:$("qDate").value||null,people:$("qPeople").value,budget:$("qBudget").value||null,payment:$("qPayment").value},
      source:"contact_form"
    });
  }catch(err){console.warn("Quote lead not stored:",err);}
  window.open(
    "https://wa.me/22891813448?text=" + encodeURIComponent(msg),
    "_blank",
    "noopener"
  );
});

const accountModal = $("accountModal");
function setAccountMode(mode){
  const signup=mode==="signup";
  $("accountTitle").textContent=signup?"Créer votre compte":"Se connecter";
  $("accountSubtitle").textContent=signup?"Gérez vos voyages simplement.":"Retrouvez vos demandes et préparez vos prochains voyages.";
  $("loginTab").classList.toggle("active",!signup); $("signupTab").classList.toggle("active",signup);
  document.querySelectorAll(".signup-only").forEach(el=>el.hidden=!signup);
  document.querySelectorAll(".login-only").forEach(el=>el.hidden=signup);
  $("accountForm").querySelector('button[type="submit"]').textContent=signup?"Créer mon compte":"Se connecter";
  $("accountPassword").autocomplete=signup?"new-password":"current-password";
  const confirm=$("accountPasswordConfirm");
  if(confirm){confirm.required=signup;confirm.disabled=!signup;}
  const note=document.querySelector("#accountForm .account-note");
  if(note){note.textContent=signup?"Utilisez au moins 8 caractères avec majuscule, minuscule et chiffre.":"Compte sécurisé par Supabase. Vos informations de connexion sont protégées.";note.style.color="#667085";}
}
function openAccountModal(mode){ niabaOpenAccount(mode); }
function closeAccountModal(){
  if(accountModal) accountModal.hidden=true;
  document.body.classList.remove("modal-open");
}
document.querySelectorAll("[data-account-open]").forEach(btn=>btn.addEventListener("click",()=>openAccountModal(btn.dataset.accountOpen)));
const accountParams=new URLSearchParams(location.search);
if(accountParams.get("login")==="1"){
  openAccountModal("login");
  history.replaceState({},document.title,location.pathname+location.hash);
}
document.querySelectorAll("[data-account-close]").forEach(btn=>btn.addEventListener("click",closeAccountModal));
$("loginTab")?.addEventListener("click",()=>setAccountMode("login")); $("signupTab")?.addEventListener("click",()=>setAccountMode("signup"));
function passwordChecks(value){
  return {length:value.length>=8,upper:/[A-Z]/.test(value),lower:/[a-z]/.test(value),number:/\d/.test(value)};
}
function friendlyAuthError(error){
  const code=error?.code||"";
  const message=String(error?.message||"").toLowerCase();
  if(code==="invalid_credentials"||message.includes("invalid login credentials")) return "Adresse e-mail ou mot de passe incorrect.";
  if(code==="email_not_confirmed"||message.includes("email not confirmed")) return "Votre adresse e-mail n’est pas encore confirmée. Ouvrez l’e-mail de confirmation reçu.";
  if(code==="over_request_rate_limit"||message.includes("rate limit")) return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  if(message.includes("network")||message.includes("fetch")) return "Connexion au service momentanément impossible. Vérifiez votre connexion internet puis réessayez.";
  return "Connexion impossible pour le moment. Vérifiez vos informations puis réessayez.";
}
function updatePasswordRules(){
  const checks=passwordChecks($("accountPassword")?.value||"");
  document.querySelectorAll("#passwordRules [data-rule]").forEach(el=>{
    const ok=checks[el.dataset.rule];
    el.classList.toggle("valid",!!ok);
    el.textContent=(ok?"✓ ":"○ ")+el.textContent.replace(/^[✓○]\s*/,"");
  });
}
$("accountPassword")?.addEventListener("input",updatePasswordRules);
$("accountPasswordConfirm")?.addEventListener("input",function(){
  this.setCustomValidity(this.value===$("accountPassword").value?"":"Les mots de passe ne correspondent pas.");
});
document.getElementById("googleAuthBtn")?.addEventListener("click",async()=>{
  const note=document.querySelector("#accountForm .account-note");
  const button=document.getElementById("googleAuthBtn");
  try{
    if(!window.niabaSupabase) throw new Error("Service de connexion indisponible. Rechargez la page.");
    if(button) button.disabled=true;
    if(note){note.textContent="Ouverture de Google…";note.style.color="#667085";}
    const redirectTo=window.location.origin+"/espace-client.html";
    const {data,error}=await window.niabaSupabase.auth.signInWithOAuth({
      provider:"google",
      options:{redirectTo,skipBrowserRedirect:true}
    });
    if(error) throw error;
    if(data?.url) window.location.assign(data.url);
  }catch(err){
    if(note){note.textContent=err.message||"Connexion Google indisponible.";note.style.color="#b42318";}
    if(button) button.disabled=false;
  }
});

$("forgotPasswordBtn")?.addEventListener("click",()=>{
  const email=$("accountEmail")?.value.trim()||"";
  if(email && !$("accountEmail").checkValidity()){
    $("accountEmail").reportValidity();
    return;
  }
  if(email) sessionStorage.setItem("niabaRecoveryEmail",email);
  window.location.assign("/mot-de-passe-oublie.html");
});

$("accountForm")?.addEventListener("submit",async(e)=>{
  e.preventDefault();
  const signup=$("signupTab").classList.contains("active");
  const email=$("accountEmail").value.trim().toLowerCase(), password=$("accountPassword").value;
  const button=e.currentTarget.querySelector('button[type="submit"]'), note=e.currentTarget.querySelector(".account-note");
  if(!window.niabaSupabase){note.textContent="Service de connexion indisponible. Rechargez la page.";note.style.color="#b42318";return;}
  if(signup){
    const confirm=$("accountPasswordConfirm")?.value||"";
    const checks=passwordChecks(password);
    if(!Object.values(checks).every(Boolean)){note.textContent="Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.";note.style.color="#b42318";updatePasswordRules();return;}
    if(password!==confirm){note.textContent="Les deux mots de passe ne correspondent pas.";note.style.color="#b42318";$("accountPasswordConfirm")?.focus();return;}
  }
  button.disabled=true; button.textContent=signup?"Création…":"Connexion…";
  try{
    let result;
    if(signup){
      result=await window.niabaSupabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/espace-client.html",data:{first_name:$("accountFirstName")?.value.trim()||"",last_name:$("accountName").value.trim(),full_name:[$("accountFirstName")?.value.trim(),$("accountName").value.trim()].filter(Boolean).join(" ")}}});
    }else{
      result=await window.niabaSupabase.auth.signInWithPassword({email,password});
    }
    if(result.error) throw result.error;
    if(signup && !result.data.session){
      closeAccountModal();
      e.currentTarget.reset();
      setAccountMode("login");
      window.alert("Compte créé. Un e-mail de confirmation vient de vous être envoyé. Ouvrez-le puis cliquez sur le lien pour activer votre compte.");
    }else{
      if(!result.data?.session) throw new Error("missing_session");
      closeAccountModal();
      location.assign("/espace-client.html");
    }
  }catch(err){
    note.textContent=friendlyAuthError(err);
    note.style.color="#b42318";
  }finally{button.disabled=false;button.textContent=signup?"Créer mon compte":"Se connecter";}
});


// Professional result controls (compatible with live Amadeus cards)
function getCardStops(card){
  const text=(card.textContent||"").toLowerCase();
  if(text.includes("direct")||text.includes("0 escale")) return 0;
  const m=text.match(/(\d+)\s*escale/);
  return m ? Number(m[1]) : 99;
}
function getCardPrice(card){
  const el=card.querySelector(".flight-result-price strong");
  if(!el) return Number.MAX_SAFE_INTEGER;
  const n=(el.textContent||"").replace(/[^0-9,\.]/g,"").replace(/\s/g,"").replace(",",".");
  return Number.parseFloat(n)||Number.MAX_SAFE_INTEGER;
}
function applyFlightControls(){
  const results=document.getElementById("flightResults");
  if(!results) return;
  const filter=document.querySelector(".filter-chip.active")?.dataset.flightFilter||"all";
  const cards=[...results.querySelectorAll(".flight-result-card")];
  cards.forEach(card=>{
    const stops=getCardStops(card);
    card.hidden=filter==="direct" ? stops!==0 : filter==="one-stop" ? stops>1 : false;
  });
  if(document.getElementById("flightSort")?.value==="price"){
    cards.sort((a,b)=>getCardPrice(a)-getCardPrice(b)).forEach(c=>results.appendChild(c));
  }
}
document.querySelectorAll(".filter-chip").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter-chip").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active"); applyFlightControls();
}));
document.getElementById("flightSort")?.addEventListener("change",applyFlightControls);
const flightResultsNode=document.getElementById("flightResults");
if(flightResultsNode) new MutationObserver(()=>applyFlightControls()).observe(flightResultsNode,{childList:true});


// Advanced passenger, cabin and multi-city UI
const travelerBtn=document.getElementById("travelerBtn"), travelerPanel=document.getElementById("travelerPanel");
function updateTravelerSummary(){
  const a=Number(document.getElementById("adults")?.value||1),c=Number(document.getElementById("children")?.value||0),i=Number(document.getElementById("infants")?.value||0);
  const cabin=document.getElementById("cabin");
  if(document.getElementById("pax")) document.getElementById("pax").value=String(a+c+i);
  if(travelerBtn) travelerBtn.textContent=[a+" adulte"+(a>1?"s":""),c?c+" enfant"+(c>1?"s":""):"",i?i+" bébé"+(i>1?"s":""):""].filter(Boolean).join(" · ");
}
travelerBtn?.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();if(travelerPanel){travelerPanel.hidden=!travelerPanel.hidden;travelerBtn.setAttribute("aria-expanded",String(!travelerPanel.hidden));}});
document.querySelectorAll("[data-count]").forEach(btn=>btn.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();const id=btn.dataset.count,input=document.getElementById(id),display=document.getElementById(id+"Value");if(!input)return;const min=id==="adults"?1:0,max=id==="adults"?9:id==="children"?8:4;let value=Number(input.value||0)+Number(btn.dataset.step||0);value=Math.max(min,Math.min(max,value));input.value=String(value);if(display)display.textContent=String(value);updateTravelerSummary();}));
document.getElementById("travelerDone")?.addEventListener("click",()=>{updateTravelerSummary();travelerPanel.hidden=true});
["adults","children","infants","cabin"].forEach(id=>document.getElementById(id)?.addEventListener("change",updateTravelerSummary));
function addMultiLeg(){
  const wrap=document.getElementById("multiCityLegs"); if(!wrap||wrap.children.length>=4)return;
  const row=document.createElement("div"); row.className="multi-city-leg";
  row.innerHTML='<input aria-label="Départ du trajet" placeholder="Départ (ex. LFW)"><input aria-label="Destination du trajet" placeholder="Destination"><input aria-label="Date du trajet" type="date" min="'+today+'"><button class="remove-leg" type="button" aria-label="Supprimer ce trajet">×</button>';
  row.querySelector(".remove-leg").addEventListener("click",()=>row.remove()); wrap.appendChild(row);
}
document.getElementById("addLegBtn")?.addEventListener("click",addMultiLeg);
document.querySelectorAll('input[name="tripType"]').forEach(r=>r.addEventListener("change",()=>{
  const multi=document.querySelector('input[name="tripType"]:checked')?.value==="multicity", panel=document.getElementById("multiCityPanel");
  if(panel) panel.hidden=!multi;
  if(multi && document.getElementById("multiCityLegs")?.children.length===0){addMultiLeg();addMultiLeg();}
}));
updateTravelerSummary();


// Guided booking flow: ready to connect to Amadeus production/payment later
let selectedBookingOffer=null;
function openBooking(offer){
  if(!offer)return; selectedBookingOffer=offer;
  const modal=document.getElementById("bookingModal"), summary=document.getElementById("bookingSummary");
  const out=offer.itineraries?.[0], first=out?.segments?.[0], last=out?.segments?.[out.segments.length-1];
  summary.innerHTML="<strong>"+escapeHtml((first?.from||offer.origin||"")+" → "+(last?.to||offer.destination||""))+"</strong><br>"+escapeHtml(offer.airline?.name||offer.airline?.code||"Compagnie aérienne")+" · "+escapeHtml(formatDateTime(first?.departureAt))+"<br><strong>"+escapeHtml(formatPrice(offer.price.amount,offer.price.currency))+"</strong> <small>— tarif à confirmer avant paiement</small>";
  modal.hidden=false; document.body.style.overflow="hidden";
}
function closeBooking(){const m=document.getElementById("bookingModal");if(m)m.hidden=true;document.body.style.overflow=""}
document.querySelectorAll("[data-booking-close]").forEach(x=>x.addEventListener("click",closeBooking));
document.getElementById("bookingForm")?.addEventListener("submit",async e=>{
  e.preventDefault(); if(!selectedBookingOffer)return;
  const button=e.currentTarget.querySelector('button[type="submit"]'), original=button.textContent;
  button.disabled=true; button.textContent="Enregistrement…";
  const opts=[["optBaggage","Bagage supplémentaire"],["optSeat","Choix du siège"],["optMeal","Repas spécial"],["optAssistance","Assistance spéciale"]].filter(([id])=>document.getElementById(id)?.checked).map(([,v])=>v);
  const out=selectedBookingOffer.itineraries?.[0], first=out?.segments?.[0], last=out?.segments?.[out.segments.length-1];
  const fullName=(document.getElementById("bookFirstName").value+" "+document.getElementById("bookLastName").value).trim();
  const msg=["Bonjour Niaba Voyage, je souhaite finaliser cette réservation.","","Passager : "+fullName,"Email : "+document.getElementById("bookEmail").value,"Téléphone : "+document.getElementById("bookPhone").value,"Trajet : "+(first?.from||"")+" → "+(last?.to||""),"Départ : "+formatDateTime(first?.departureAt),"Prix affiché : "+formatPrice(selectedBookingOffer.price.amount,selectedBookingOffer.price.currency),"Options : "+(opts.join(", ")||"Aucune"),"Référence offre : "+selectedBookingOffer.id,"","Merci de confirmer le tarif et la disponibilité avant paiement."].join("\n");
  try{
    await submitInquiryLead({
      lead_type:"flight",
      customer_type:"individual",
      full_name:fullName,
      email:document.getElementById("bookEmail").value,
      phone:document.getElementById("bookPhone").value,
      subject:"Demande de réservation de vol",
      message:msg,
      details:{
        offer_id:selectedBookingOffer.id,
        origin:first?.from||selectedBookingOffer.origin||null,
        destination:last?.to||selectedBookingOffer.destination||null,
        departure_at:first?.departureAt||null,
        price:selectedBookingOffer.price,
        airline:selectedBookingOffer.airline,
        options:opts
      },
      source:"booking_flow",
      priority:"high"
    });
    button.textContent="Demande enregistrée ✓";
    setTimeout(()=>{button.disabled=false;button.textContent=original;},1500);
  }catch(err){
    console.warn("Booking lead not stored:",err);
    button.disabled=false; button.textContent=original;
  }
  window.open("https://wa.me/22891813448?text="+encodeURIComponent(msg),"_blank","noopener");
});

// Airport/city/country suggestions (starter catalog; ready to replace with Amadeus autocomplete)
const airportCatalog = [
 ["LFW","Lomé","Togo","Aéroport international Gnassingbé Eyadéma"],["ACC","Accra","Ghana","Kotoka International Airport"],["COO","Cotonou","Bénin","Aéroport international de Cotonou"],["ABJ","Abidjan","Côte d’Ivoire","Aéroport Félix-Houphouët-Boigny"],["DSS","Dakar","Sénégal","Aéroport international Blaise-Diagne"],["LOS","Lagos","Nigeria","Murtala Muhammed International Airport"],["ABV","Abuja","Nigeria","Nnamdi Azikiwe International Airport"],["CMN","Casablanca","Maroc","Aéroport Mohammed V"],["RAK","Marrakech","Maroc","Aéroport Marrakech-Ménara"],["CAI","Le Caire","Égypte","Cairo International Airport"],
 ["CDG","Paris","France","Paris Charles-de-Gaulle"],["ORY","Paris","France","Paris Orly"],["BRU","Bruxelles","Belgique","Brussels Airport"],["LHR","Londres","Royaume-Uni","Heathrow Airport"],["LGW","Londres","Royaume-Uni","Gatwick Airport"],["AMS","Amsterdam","Pays-Bas","Amsterdam Schiphol"],["FRA","Francfort","Allemagne","Frankfurt Airport"],["IST","Istanbul","Turquie","Istanbul Airport"],["FCO","Rome","Italie","Rome Fiumicino"],["MAD","Madrid","Espagne","Adolfo Suárez Madrid-Barajas"],["LIS","Lisbonne","Portugal","Humberto Delgado Airport"],["GVA","Genève","Suisse","Geneva Airport"],["ZRH","Zurich","Suisse","Zurich Airport"],
 ["YUL","Montréal","Canada","Montréal-Trudeau"],["YYZ","Toronto","Canada","Toronto Pearson"],["JFK","New York","États-Unis","John F. Kennedy International"],["EWR","Newark / New York","États-Unis","Newark Liberty International"],["IAD","Washington","États-Unis","Washington Dulles"],["ATL","Atlanta","États-Unis","Hartsfield-Jackson Atlanta"],["DXB","Dubaï","Émirats arabes unis","Dubai International"],["DOH","Doha","Qatar","Hamad International"],["JED","Djeddah","Arabie saoudite","King Abdulaziz International"],["ADD","Addis-Abeba","Éthiopie","Bole International Airport"],["NBO","Nairobi","Kenya","Jomo Kenyatta International"],["JNB","Johannesburg","Afrique du Sud","O.R. Tambo International"]
];
const airportList=document.getElementById("airportList");
if(airportList){airportList.innerHTML=airportCatalog.map(([code,city,country,airport])=>'<option value="'+city+' ('+code+')">'+airport+' — '+country+'</option>').join("");}

// Menu logout
const logoutBtn=document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click",()=>window.niabaLogout ? window.niabaLogout() : (window.location.href="/"));
