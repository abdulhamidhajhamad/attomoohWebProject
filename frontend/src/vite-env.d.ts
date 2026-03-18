/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Cloudinary
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
  // Admin
  readonly VITE_ADMIN_USERNAME: string;
  readonly VITE_ADMIN_PASSWORD: string;
  // Contact
  readonly VITE_CONTACT_PHONE: string;
  readonly VITE_CONTACT_WHATSAPP: string;
  readonly VITE_CONTACT_EMAIL: string;
  // Branches
  readonly VITE_BRANCH_NABLUS_PHONE: string;
  readonly VITE_BRANCH_HEBRON_PHONE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
