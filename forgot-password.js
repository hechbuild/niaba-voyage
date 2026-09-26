const form=document.getElementById("recoveryForm");
const emailInput=document.getElementById("recoveryEmail");
const statusNode=document.getElementById("recoveryStatus");

const savedEmail=sessionStorage.getItem("niabaRecoveryEmail");
if(savedEmail){
  emailInput.value=savedEmail;
  sessionStorage.removeItem("niabaRecoveryEmail");
}

function showStatus(message,type=""){
  statusNode.textContent=message;
  statusNode.className="form-status"+(type?" "+type:"");
}

form.addEventListener("submit",async(event)=>{
  event.preventDefault();
  if(!form.reportValidity()) return;
  const button=form.querySelector('button[type="submit"]');
  button.disabled=true;
  button.textContent="Envoi en cours…";
  showStatus("");
  try{
    if(!window.niabaSupabase) throw new Error("Service de récupération indisponible. Rechargez la page.");
    const redirectTo=window.location.origin+"/reinitialiser-mot-de-passe.html";
    const {error}=await window.niabaSupabase.auth.resetPasswordForEmail(emailInput.value.trim(),{redirectTo});
    if(error) throw error;
    form.hidden=true;
    document.getElementById("recoveryIntro").textContent="Consultez votre boîte e-mail pour continuer.";
    showStatus("Si cette adresse correspond à un compte, un lien sécurisé vient d’être envoyé. Vérifiez aussi vos courriers indésirables.","success");
  }catch(error){
    showStatus(error.message||"Impossible d’envoyer le lien de récupération pour le moment.","error");
    button.disabled=false;
    button.textContent="Envoyer le lien de réinitialisation";
  }
});
