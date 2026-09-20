const $=id=>document.getElementById(id);
$("year").textContent=new Date().getFullYear();
$("menuBtn").addEventListener("click",()=>$("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>$("nav").classList.remove("open")));

$("flightForm").addEventListener("submit",e=>{
  e.preventDefault();
  const q=["vol",$("from").value,$("to").value,$("depart").value,$("return").value?("retour "+$("return").value):"", $("pax").value+" voyageur(s)"].filter(Boolean).join(" ");
  window.open("https://www.google.com/travel/flights?q="+encodeURIComponent(q),"_blank","noopener");
});

$("quoteForm").addEventListener("submit",e=>{
  e.preventDefault();
  const msg=["Bonjour Niaba Voyage, je souhaite un devis.","","Nom : "+$("qName").value,"Destination : "+$("qDestination").value,"Date souhaitée : "+($("qDate").value||"À définir"),"Voyageurs : "+$("qPeople").value,"Besoin : "+$("qNeed").value].join("\n");
  window.open("https://wa.me/22891813448?text="+encodeURIComponent(msg),"_blank","noopener");
});