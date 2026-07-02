/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
  readonly VITE_CONTACT_PHONE: string;
  readonly VITE_CONTACT_WHATSAPP: string;
  readonly VITE_CONTACT_EMAIL: string;
  readonly VITE_BRANCH_NABLUS_PHONE: string;
  readonly VITE_BRANCH_HEBRON_PHONE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
