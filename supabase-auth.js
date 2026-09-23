const NIABA_SUPABASE_URL="https://bzfvfpfbusfmfvtohrph.supabase.co";
const NIABA_SUPABASE_KEY="sb_publishable_9YJkPMzoEfhu25VosgPzDw_hwP1_ygR";
const niabaSupabase=window.supabase.createClient(NIABA_SUPABASE_URL,NIABA_SUPABASE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}
});
window.niabaSupabase=niabaSupabase;

window.niabaRequireUser=async function(redirect=true){
  const {data:{user},error}=await niabaSupabase.auth.getUser();
  if(error) console.error("Niaba auth user:",error.message);
  const verifiedUser=user||null;
  if(!verifiedUser&&redirect) location.replace("/?login=1");
  return verifiedUser;
};
window.niabaLogout=async function(){
  try{await niabaSupabase.auth.signOut();}finally{location.replace("/");}
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

(async()=>{
  const {data:{session}}=await niabaSupabase.auth.getSession();
  niabaRenderAuthState(session?.user||null);
})();

niabaSupabase.auth.onAuthStateChange((_event,session)=>{
  niabaRenderAuthState(session?.user||null);
});
