const NIABA_SUPABASE_URL="https://bzfvfpfbusfmfvtohrph.supabase.co";
const NIABA_SUPABASE_KEY="sb_publishable_9YJkPMzoEfhu25VosgPzDw_hwP1_ygR";
const niabaSupabase=window.supabase.createClient(NIABA_SUPABASE_URL,NIABA_SUPABASE_KEY);
window.niabaSupabase=niabaSupabase;

window.niabaRequireUser=async function(redirect=true){
  const {data:{user}}=await niabaSupabase.auth.getUser();
  if(!user&&redirect) location.href="/?login=1";
  return user;
};
window.niabaLogout=async function(){await niabaSupabase.auth.signOut();location.href="/";};

function niabaRenderAuthState(user){
  document.querySelectorAll(".account-actions").forEach(el=>{
    el.hidden=!!user;
    el.style.display=user?"none":"";
  });
  document.querySelectorAll(".nav-logout").forEach(el=>{
    el.hidden=!user;
    el.style.display=user?"":"none";
  });
}

(async()=>{
  const {data:{session}}=await niabaSupabase.auth.getSession();
  niabaRenderAuthState(session?.user||null);
})();

niabaSupabase.auth.onAuthStateChange((_event,session)=>{
  niabaRenderAuthState(session?.user||null);
});