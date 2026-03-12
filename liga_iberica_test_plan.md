# Liga Ibérica Portal — Plan de Pruebas Manuales

---

## Bloque 1 — Autenticación y control de acceso

1. Ve a `http://localhost:3000` — debe redirigirte a `/login`
2. Intenta ir a `http://localhost:3000/admin` sin estar logado — debe redirigirte a `/login`
3. Inicia sesión como **Super Admin** (`admin@liga.com` / `admin123`) — debe llevarte a `/admin`
4. Cierra sesión — debe volverte a `/login`
5. Inicia sesión como **Team Admin** (`carlos@liga.com` / `admin123`) — debe llevarte a `/team`
6. Con Carlos logado, intenta ir manualmente a `/admin` — debe redirigirte a `/team`
7. Cierra sesión e inicia como Super Admin, intenta ir a `/team` — debe redirigirte a `/admin`

---

## Bloque 2 — SUPER_ADMIN: Gestión de sedes

Con `admin@liga.com`:

8. Entra a **Sedes** (`/admin/clubes`) — deben aparecer las 2 sedes del seeder
9. Entra al detalle de una sede — ve su info y el contador de jornadas
10. Edita el nombre de una sede — guarda y verifica que se actualizó
11. Crea una sede nueva con nombre y dirección — verifica que aparece en la lista
12. Intenta eliminar la sede nueva — debe eliminarse sin error
13. Intenta eliminar una sede que ya tiene jornadas — debe mostrar un error de conflicto

---

## Bloque 3 — SUPER_ADMIN: Gestión de torneos y jornadas

14. Entra a **Torneos** (`/admin/torneos`) — deben aparecer los 2 torneos del seeder
15. Crea un torneo nuevo con nombre, fecha inicio y fecha fin
16. Desde el detalle del torneo, haz clic en **"Nueva jornada"** — verifica que el torneo ya viene preseleccionado en el formulario
17. Crea una jornada asignándole una sede y fecha — verifica que aparece en `/admin/jornadas` y en el detalle del torneo
18. Edita la fecha de la jornada — verifica el cambio
19. Entra a **Jornadas** (`/admin/jornadas`) — verifica que aparece el listado completo

---

## Bloque 4 — SUPER_ADMIN: Gestión de usuarios

20. Entra a **Usuarios** (`/admin/usuarios`) — deben aparecer los 3 usuarios del seeder
21. Entra al detalle de un TEAM_ADMIN — verifica que se muestran su rol y datos
22. Edita el nombre de un usuario — guarda y verifica
23. Crea un usuario nuevo con rol TEAM_ADMIN
24. Intenta eliminar ese usuario nuevo — debe eliminarse correctamente
25. Entra a **Perfil** (`/admin/perfil`) — verifica que se muestran los datos del Super Admin y puedes editarlos

---

## Bloque 5 — TEAM_ADMIN: Gestión de equipo y jugadores

Cierra sesión, entra como `carlos@liga.com` / `admin123`:

26. Entra a **Mis Equipos** (`/team/teams`) — debe aparecer "Los Tigres"
27. Entra al detalle del equipo — deben aparecer los 8 jugadores del seeder
28. Añade un jugador nuevo (nombre + documento) — verifica que aparece en la lista
29. Edita el nombre del jugador recién creado
30. Desactiva un jugador (toggle estado) — verifica que se marca como inactivo
31. Entra a **Perfil** (`/team/perfil`) — verifica tus datos y edítalos

---

## Bloque 6 — TEAM_ADMIN: Inscripción en torneo y pagos

32. Entra a **Torneos** (`/team/torneos`) — deben aparecer los torneos disponibles
33. Inscríbete en el torneo nuevo que creaste en el paso 15 — introduce el monto de inscripción
34. Entra a **Pagos** (`/team/pagos`) — verifica que aparece la inscripción con balance pendiente
35. Registra un pago nuevo (`/team/pagos/new`): selecciona la inscripción, monto, método y fecha
36. Verifica que el pago aparece con estado **Pendiente**

Ahora vuelve a entrar como **Super Admin** (`admin@liga.com`):

37. Entra a **Pagos** (`/admin/pagos`) — debe aparecer el pago registrado por Carlos
38. Entra al detalle del pago — haz clic en **Aprobar** — verifica que cambia a **Aprobado**
39. Registra otro pago como Team Admin y desde Super Admin haz clic en **Rechazar** — verifica el estado

---

## Bloque 7 — TEAM_ADMIN: Asistencia a jornadas

Vuelve a entrar como `carlos@liga.com`:

40. Entra a **Asistencia** (`/team/asistencia`) — deben aparecer las jornadas próximas
41. Entra a una jornada — se carga automáticamente "Los Tigres"
42. Activa el switch de algunos jugadores para marcarlos como asistentes
43. Guarda — verifica la confirmación y que vuelves al listado
44. Vuelve a entrar a la misma jornada — los switches deben mantener el estado guardado
45. Cambia un switch y guarda de nuevo — verifica que se actualiza correctamente

Como **Super Admin**:

46. Entra al detalle de una jornada en `/admin/jornadas/:id` — debe mostrar el conteo de asistentes

---

## Bloque 8 — Invitados

47. Como Super Admin, entra a **Invitados** (`/admin/invitados`) — verifica que aparecen los invitados registrados
48. Busca un invitado por nombre o documento
49. Entra al detalle de un invitado — verifica su historial de asistencias
50. Crea un invitado nuevo desde `/admin/invitados/new`

---

## Credenciales de acceso

| Usuario     | Email           | Contraseña | Rol         |
| ----------- | --------------- | ---------- | ----------- |
| Super Admin | admin@liga.com  | admin123   | SUPER_ADMIN |
| Carlos      | carlos@liga.com | admin123   | TEAM_ADMIN  |
| Ana         | ana@liga.com    | admin123   | TEAM_ADMIN  |

## URLs del proyecto

| Servicio     | URL                            |
| ------------ | ------------------------------ |
| Frontend     | http://localhost:3000          |
| Backend API  | http://localhost:3001          |
| Swagger Docs | http://localhost:3001/api/docs |

---

## Flujos críticos (los más importantes)

1. **Flujo completo de torneo**: crear torneo → crear jornada → equipo se inscribe → paga → Super Admin aprueba el pago
2. **Flujo de asistencia**: Team Admin marca qué jugadores van a una jornada y guarda
3. **Protección de rutas**: ningún rol puede acceder a las secciones del otro
