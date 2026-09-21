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
    if (oneWay) $("return").value = "";
  });
});

$("flightForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const tripType = document.querySelector('input[name="tripType"]:checked').value;
  const parts = [
    "vol",
    $("from").value,
    $("to").value,
    $("depart").value,
    tripType === "roundtrip" && $("return").value ? "retour " + $("return").value : "",
    $("pax").value + " voyageur(s)"
  ].filter(Boolean);

  window.open(
    "https://www.google.com/travel/flights?q=" + encodeURIComponent(parts.join(" ")),
    "_blank",
    "noopener"
  );
});

$("quoteForm").addEventListener("submit", (e) => {
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
