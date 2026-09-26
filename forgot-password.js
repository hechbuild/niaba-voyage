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

function recoveryErrorMessage(error){
  const code=String(error?.code||"");
  const message=String(error?.message||"").toLowerCase();
  if(code==="over_email_send_rate_limit"||message.includes("email rate limit")){
    return "La limite temporaire d’envoi d’e-mails a été atteinte. Patientez environ une heure avant de demander un nouveau lien. Un lien déjà reçu peut encore être utilisé s’il n’a pas expiré.";
  }
  if(code==="over_request_rate_limit"||message.includes("rate limit")){
    return "Trop de demandes ont été effectuées. Patientez quelques minutes avant de réessayer.";
  }
  if(message.includes("network")||message.includes("fetch")){
    return "Le service est momentanément inaccessible. Vérifiez votre connexion internet puis réessayez.";
  }
  return "Impossible d’envoyer le lien pour le moment. Patientez quelques minutes puis réessayez.";
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
    showStatus(recoveryErrorMessage(error),"error");
    button.disabled=false;
    button.textContent="Envoyer le lien de réinitialisation";
  }
});
