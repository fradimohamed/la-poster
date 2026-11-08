/*
 * Configuration navigateur La Poster.
 * Remplacez les deux valeurs ci-dessous par Project URL et Publishable key de votre projet.
 * N'utilisez jamais ici une clé secret ou service_role : ce fichier est public.
 */
(function initialiseLaPosterSupabase() {
  const projectUrl = "https://lanqonokqcsnxhkxpujp.supabase.co";
  const publishableKey = "sb_publishable_bQ8Abuc1B3-wCkxbAMxE-g_TDoNztek";
  const placeholdersRemain = /YOUR_SUPABASE_URL|PROJECT_URL|SUPABASE_URL/i.test(projectUrl)
    || /YOUR_PUBLISHABLE_KEY|PUBLISHABLE_KEY|ANON_KEY/i.test(publishableKey);

  window.LaPosterConfig = {
    projectUrl,
    isConfigured: !placeholdersRemain,
    error: null,
  };

  if (placeholdersRemain) return;
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    window.LaPosterConfig.error = "La bibliothèque Supabase n'a pas pu être chargée. Vérifiez la connexion Internet et rechargez la page.";
    return;
  }

  // Client unique : tous les modules réutilisent window.supabaseClient.
  window.supabaseClient = window.supabase.createClient(projectUrl, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
})();

