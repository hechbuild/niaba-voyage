const $ = (id) => document.getElementById(id);

$("year").textContent = new Date().getFullYear();

$("menuBtn").addEventListener("click", () => {
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

$("swapBtn").addEventListener("click", () => {
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
$("depart").min = today;
$("return").min = today;

$("depart").addEventListener("change", () => {
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

$("flightForm").addEventListener("submit", async (e) => {
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
      throw new Error(data.error || "Impossible de rechercher les vols actuellement.");
    }

    renderOffers(data);
  } catch (error) {
    $("flightResultsNotice").textContent = "";
    $("flightResults").innerHTML =
      '<div class="results-error"><strong>Recherche indisponible.</strong><span>' +
      escapeHtml(error.message) +
      '</span><a href="https://wa.me/22891813448" target="_blank" rel="noopener">Contacter Niaba Voyage sur WhatsApp</a></div>';
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

$("quoteForm")?.addEventListener("submit", (e) => {
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
  $("accountSubtitle").textContent=signup?"Créez votre espace Niaba Voyage pour préparer et suivre vos voyages.":"Retrouvez vos demandes et préparez vos prochains voyages.";
  $("loginTab").classList.toggle("active",!signup); $("signupTab").classList.toggle("active",signup);
  document.querySelectorAll(".signup-only").forEach(el=>el.hidden=!signup);
  $("accountForm").querySelector('button[type="submit"]').textContent=signup?"Créer mon compte":"Se connecter";
  $("accountPassword").autocomplete=signup?"new-password":"current-password";
}
document.querySelectorAll("[data-account-open]").forEach(btn=>btn.addEventListener("click",()=>{setAccountMode(btn.dataset.accountOpen);accountModal.hidden=false;}));
document.querySelectorAll("[data-account-close]").forEach(btn=>btn.addEventListener("click",()=>accountModal.hidden=true));
$("loginTab").addEventListener("click",()=>setAccountMode("login")); $("signupTab").addEventListener("click",()=>setAccountMode("signup"));
$("accountForm").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const signup=$("signupTab").classList.contains("active");
  const email=$("accountEmail").value.trim(), password=$("accountPassword").value;
  const button=e.currentTarget.querySelector('button[type="submit"]'), note=e.currentTarget.querySelector(".account-note");
  button.disabled=true; button.textContent=signup?"Création…":"Connexion…";
  try{
    let result;
    if(signup){
      result=await window.niabaSupabase.auth.signUp({email,password,options:{data:{first_name:$("accountFirstName")?.value.trim()||"",last_name:$("accountName").value.trim(),full_name:[$("accountFirstName")?.value.trim(),$("accountName").value.trim()].filter(Boolean).join(" ")}}});
    }else{
      result=await window.niabaSupabase.auth.signInWithPassword({email,password});
    }
    if(result.error) throw result.error;
    if(signup && !result.data.session){
      note.textContent="Compte créé. Consultez votre e-mail pour confirmer votre inscription.";
      note.style.color="#067647";
    }else location.href="/espace-client.html";
  }catch(err){
    note.textContent=err.message||"Impossible de poursuivre. Vérifiez vos informations.";
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
document.getElementById("bookingForm")?.addEventListener("submit",e=>{
  e.preventDefault(); if(!selectedBookingOffer)return;
  const opts=[["optBaggage","Bagage supplémentaire"],["optSeat","Choix du siège"],["optMeal","Repas spécial"],["optAssistance","Assistance spéciale"]].filter(([id])=>document.getElementById(id)?.checked).map(([,v])=>v);
  const out=selectedBookingOffer.itineraries?.[0], first=out?.segments?.[0], last=out?.segments?.[out.segments.length-1];
  const msg=["Bonjour Niaba Voyage, je souhaite finaliser cette réservation.","","Passager : "+document.getElementById("bookFirstName").value+" "+document.getElementById("bookLastName").value,"Email : "+document.getElementById("bookEmail").value,"Téléphone : "+document.getElementById("bookPhone").value,"Trajet : "+(first?.from||"")+" → "+(last?.to||""),"Départ : "+formatDateTime(first?.departureAt),"Prix affiché : "+formatPrice(selectedBookingOffer.price.amount,selectedBookingOffer.price.currency),"Options : "+(opts.join(", ")||"Aucune"),"Référence offre : "+selectedBookingOffer.id,"","Merci de confirmer le tarif et la disponibilité avant paiement."].join("\n");
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
