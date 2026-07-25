  import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
  import { inject } from '@angular/core';
  import { catchError, throwError } from 'rxjs';
  import { AuthService } from '../services/auth.service';

  export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
      const authService = inject(AuthService);
      const token = authService.getToken();

      const requestWithToken = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;

      // Un 401 acá significa "el token venció (o es inválido)" — sin esto, la sesión quedaba
      // "rota" en silencio hasta que el usuario iba al menú y le daba Salir a mano. logout() ya
      // limpia el token guardado y manda a /auth/login, así que alcanza con dispararlo acá.
      return next(requestWithToken).pipe(
          catchError((error: unknown) => {
              if (error instanceof HttpErrorResponse && error.status === 401) {
                  authService.logout();
              }
              return throwError(() => error);
          })
      );
  }