import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://cvkwmnirizycmciqnaok.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2a3dtbmlyaXp5Y21jaXFuYW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDI0ODQsImV4cCI6MjA5MzA3ODQ4NH0.9j12O0d9gRccO1pit_R4xgfp2uI_sT7jcpzBCWiY8Ek"
);