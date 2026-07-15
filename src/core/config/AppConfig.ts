declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

export const AppConfig = {
  // Replace these with your actual Supabase Project URL and Anon Key
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key',
  
  // Public URL for general application content (Duas, Kalimas, Naats, Live Streams, Kids Section)
  contentApiUrl: 'https://raw.githubusercontent.com/Arkan17/UmmatiReact/main/ummati_app_data.json',
  
  storageKeys: {
    USER_INFO: 'ummati_user_info',
    ONBOARDING_COMPLETED: 'ummati_onboarding_completed',
    LAST_READ_SURAH: 'ummati_last_read_surah',
    LAST_READ_AYAH: 'ummati_last_read_ayah',
    DYNAMIC_CONTENT_CACHE: 'ummati_dynamic_content_cache',
  },
};
