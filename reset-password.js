const form=document.getElementById("resetPasswordForm");
const statusNode=document.getElementById("resetStatus");
const intro=document.getElementById("resetIntro");

function showStatus(message,type=""){
  statusNode.textContent=message;
  statusNode.className="form-status"+(type?" "+type:"");
}

function passwordIsStrong(value){
  return value.length>=8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

async function activateRecoveryForm(){
  const {data}=await window.niabaSupabase.auth.getSession();
  if(data?.session){
    form.hidden=false;
    intro.textContent="Votre lien est valide. Choisissez maintenant un nouveau mot de passe.";
    showStatus("");
  }
}

window.niabaSupabase.auth.onAuthStateChange((event)=>{
  if(event==="PASSWORD_RECOVERY" || event==="SIGNED_IN") activateRecoveryForm();
});
activateRecoveryForm();

form.addEventListener("submit",async(event)=>{
  event.preventDefault();
  const password=document.getElementById("newPassword").value;
  const confirmation=document.getElementById("confirmNewPassword").value;
  const button=form.querySelector('button[type="submit"]');
  if(!passwordIsStrong(password)){
    showStatus("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.","error");
    return;
  }
  if(password!==confirmation){
    showStatus("Les deux mots de passe ne correspondent pas.","error");
    return;
  }
  button.disabled=true;
  button.textContent="Enregistrement…";
  const {error}=await window.niabaSupabase.auth.updateUser({password});
  if(error){
    showStatus(error.message||"Impossible de modifier le mot de passe.","error");
    button.disabled=false;
    button.textContent="Enregistrer le nouveau mot de passe";
    return;
  }
  await window.niabaSupabase.auth.signOut();
  form.hidden=true;
  intro.textContent="Votre mot de passe a été modifié avec succès.";
  showStatus("Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.","success");
  window.setTimeout(()=>location.replace("/?login=1"),1800);
});
