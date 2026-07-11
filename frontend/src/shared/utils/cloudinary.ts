/**
 * Optimizes a Cloudinary image URL with auto format, quality, and optional sizing.
 *
 * Input (no size):  https://res.cloudinary.com/<cloud>/image/upload/v12345/id.jpg
 * Output:           https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/v12345/id.jpg
 *
 * Input (with size):  pass size=400
 * Output:             https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,c_fit,w_400,h_400/v12345/id.jpg
 *
 * If the URL is not a Cloudinary URL, it is returned unchanged.
 */
export function transformCloudinaryUrl(url: string, size?: number): string {
  if (!url?.includes('res.cloudinary.com')) return url;

  const transforms = size
    ? `f_auto,q_auto,c_fit,w_${Math.round(size)},h_${Math.round(size)}`
    : 'f_auto,q_auto';

  return url.replace('/image/upload/', `/image/upload/${transforms}/`);
}
