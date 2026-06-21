import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const volunteerAvailableGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const profile = auth.currentUser?.volunteerProfile;
  if (profile?.capabilities?.length && profile.isAvailable) return true;
  router.navigate(['/my-claimed']);
  return false;
};
