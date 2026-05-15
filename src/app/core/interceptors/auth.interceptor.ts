  import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
  import { inject } from '@angular/core';
  import { AuthService } from '../services/auth.service';

  export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
      const authService = inject(AuthService);
      const token = authService.getToken();

      if (token) {
          const requestWithToken = req.clone({
              setHeaders: {
                  Authorization: `Bearer ${token}`
              }
          });
          return next(requestWithToken);
      }

      return next(req);
  }