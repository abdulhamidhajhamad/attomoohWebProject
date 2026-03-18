/**
 * ===== Cloudinary Upload Service =====
 * يرفع الصور مباشرة من المتصفح إلى Cloudinary عن طريق Unsigned Upload
 *
 * الإعدادات المطلوبة:
 * 1. أنشئ ملف .env في جذر المشروع (بجانب package.json)
 * 2. أضف القيم التالية:
 *    VITE_CLOUDINARY_CLOUD_NAME=اسم_الـCloud_تاعك
 *    VITE_CLOUDINARY_UPLOAD_PRESET=اسم_الـUpload_Preset
 *
 * 3. ادخل على Cloudinary Dashboard → Settings → Upload → Upload Presets
 * 4. أنشئ Upload Preset جديد من نوع "Unsigned"
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * رفع صورة واحدة إلى Cloudinary
 * @param file - ملف الصورة
 * @param folder - اسم المجلد في Cloudinary (اختياري)
 * @param onProgress - callback لمتابعة نسبة الرفع
 */
export function uploadToCloudinary(
  file: File,
  folder = 'attomooh/products',
  onProgress?: (progress: UploadProgress) => void,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          publicId: data.public_id,
          secureUrl: data.secure_url,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', CLOUDINARY_URL);
    xhr.send(formData);
  });
}

/**
 * رفع عدة صور إلى Cloudinary
 * @param files - مصفوفة ملفات الصور
 * @param folder - اسم المجلد
 * @param onFileProgress - callback لمتابعة رفع كل ملف
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder = 'attomooh/products',
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void,
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCloudinary(files[i], folder, (progress) => {
      onFileProgress?.(i, progress);
    });
    results.push(result);
  }

  return results;
}

/** التحقق من صحة الملف قبل الرفع */
export function validateImageFile(file: File): string | null {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, WebP, GIF';
  }

  if (file.size > MAX_SIZE) {
    return 'حجم الملف يتجاوز الحد الأقصى (5 ميغابايت)';
  }

  return null;
}
