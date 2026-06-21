import { environment } from '../../environments/environment';

/** Resolve profile image URL — supports Cloudinary URLs and legacy local paths. */
export function resolveProfileImageUrl(profileImage?: string): string {
  if (!profileImage) return '';
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
    return profileImage;
  }
  const base = environment.socketUrl || '';
  return `${base}${profileImage}`;
}
