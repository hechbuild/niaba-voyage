const NIABA_SUPABASE_URL="https://bzfvfpfbusfmfvtohrph.supabase.co";
const NIABA_SUPABASE_KEY="sb_publishable_9YJkPMzoEfhu25VosgPzDw_hwP1_ygR";
const niabaSupabase=window.supabase.createClient(NIABA_SUPABASE_URL,NIABA_SUPABASE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}
});
window.niabaSupabase=niabaSupabase;

window.niabaRequireUser=async function(redirect=true){
  if(window.niabaAuthReady) await window.niabaAuthReady;
  const {data:{user},error}=await niabaSupabase.auth.getUser();
  if(error) console.error("Niaba auth user:",error.message);
  const verifiedUser=user||null;
  if(!verifiedUser&&redirect) location.replace("/?login=1");
  return verifiedUser;
};
window.niabaLogout=async function(){
  try{
    const {error}=await niabaSupabase.auth.signOut({scope:"local"});
    if(error) throw error;
  }catch(error){
    console.error("Niaba logout:",error?.message||error);
  }finally{
    location.replace("/");
  }
};

function niabaRenderAuthState(user){
  document.documentElement.dataset.authReady="true";
  document.body?.classList.toggle("is-authenticated",!!user);
  document.querySelectorAll(".account-actions").forEach(el=>{
    el.hidden=!!user;
    el.style.display=user?"none":"";
  });
  document.querySelectorAll(".nav-logout").forEach(el=>{
    el.hidden=!user;
    el.style.display=user?"":"none";
  });
}
document.addEventListener("click",(event)=>{
  const logout=event.target.closest(".nav-logout");
  if(logout){event.preventDefault();window.niabaLogout();}
});

window.niabaAuthReady=(async()=>{
  try{
    const {data:{session},error}=await niabaSupabase.auth.getSession();
    if(error) throw error;
    niabaRenderAuthState(session?.user||null);
    return session||null;
  }catch(error){
    console.error("Niaba auth session:",error?.message||error);
    niabaRenderAuthState(null);
    return null;
  }
})();

niabaSupabase.auth.onAuthStateChange((event,session)=>{
  if(event==="PASSWORD_RECOVERY"&&!location.pathname.endsWith("/reinitialiser-mot-de-passe.html")){
    location.replace("/reinitialiser-mot-de-passe.html");
    return;
  }
  niabaRenderAuthState(session?.user||null);
});
