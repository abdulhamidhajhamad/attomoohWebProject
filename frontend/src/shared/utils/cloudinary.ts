/**
 * Optimizes a Cloudinary image URL with auto format and quality.
 *
 * Input:  https://res.cloudinary.com/<cloud>/image/upload/v12345/id.jpg
 * Output: https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/v12345/id.jpg
 *
 * If the URL is not a Cloudinary URL, it is returned unchanged.
 */
export function transformCloudinaryUrl(url: string): string {
  if (!url?.includes('res.cloudinary.com')) return url;
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
}
