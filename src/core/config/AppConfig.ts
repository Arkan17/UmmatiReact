export const AppConfig = {
  // Replace these with your actual Supabase Project URL and Anon Key
  supabaseUrl: 'https://uuonrjrlehizarmaqyjo.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b25yanJsZWhpemFybWFxeWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzY4MjYsImV4cCI6MjA5OTc1MjgyNn0.WSqrp91H_zxnigGX40VQB6Us1Cvjb0uS6Uwm4rBj3ac',

  // Public URL for general application content (Duas, Kalimas, Naats, Live Streams, Kids Section)
  contentApiUrl: 'https://raw.githubusercontent.com/Arkan17/UmmatiReact/main/ummati_app_data.json',

  // CARTO Basemaps API key for Mosque map tiles
  cartoApiKey: 'cb1_4xh4_1_c06cef7c5b37ca3686f5d017',

  storageKeys: {
    USER_INFO: 'ummati_user_info',
    ONBOARDING_COMPLETED: 'ummati_onboarding_completed',
    LAST_READ_SURAH: 'ummati_last_read_surah',
    LAST_READ_AYAH: 'ummati_last_read_ayah',
    DYNAMIC_CONTENT_CACHE: 'ummati_dynamic_content_cache',
  },
};
