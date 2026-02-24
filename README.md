# 2.1 Dizajn sistema

Ovaj repozitorijum implementira mikroservisnu aplikaciju sa API gateway-em i zajedničkom MongoDB bazom (razdvojenom po bazama/šemama po servisu).

## Servisi

| Servis | Tehnologija | Odgovornost | Persistence |
|---|---|---|---|
| `users-service` | Go (Gin) | Registracija, potvrda naloga, login (lozinka + OTP), refresh/logout, change/reset password, magic link, role | MongoDB: `users_db` |
| `content-service` | Go (Gin) | Umetnici, albumi i pesme (CRUD, veze Artist→Album→Song) | MongoDB: `content_db` |
| `notification-service` | Go (Gin) | Čuvanje i čitanje notifikacija korisnika | MongoDB: `notifications_db` |
| `api-gateway` | Node.js (Express) | Jedinstvena ulazna tačka; prosleđuje REST pozive ka servisima; štiti rute JWT verifikacijom | Nema |
| `nginx` | Nginx | Reverse proxy za klijenta; terminira HTTPS prema klijentu (opciono) | Nema |

## Model podataka (entiteti)

### `users-service` (`users_db`)

**Kolekcija: `users`**
- `id` (`_id`): ObjectId
- `username`: string (jedinstven)
- `email`: string (jedinstven)
- `firstName`: string
- `lastName`: string
- `passwordHash`: string
- `role`: string (normalizovano: `ADMIN` ili `USER`)
- `isConfirmed`: bool
- `passwordChangedAt`: datetime
- `passwordLockUntil`: datetime? (zaključavanje posle isteka lozinke)
- `createdAt`: datetime

**Kolekcija: `email_tokens`** (koristi se i za potvrdu mejla i za OTP)
- `id` (`_id`): ObjectId
- `userId`: ObjectId
- `token`: string (confirm token = 64 hex; OTP = 6 cifara)
- `expiresAt`: datetime
- `createdAt`: datetime

**Kolekcija: `refresh_tokens`**
- `id` (`_id`): ObjectId
- `user_id`: ObjectId
- `token`: string
- `expires_at`: datetime
- `created_at`: datetime
- `is_revoked`: bool

**Kolekcija: `password_reset_tokens`**
- `id` (`_id`): ObjectId
- `userId`: ObjectId
- `tokenHash`: string (SHA-256 heš tokena)
- `expiresAt`: datetime
- `usedAt`: datetime?
- `createdAt`: datetime

**Kolekcija: `magic_link_tokens`**
- `id` (`_id`): ObjectId
- `userId`: ObjectId
- `tokenHash`: string (SHA-256 heš tokena)
- `expiresAt`: datetime
- `usedAt`: datetime?
- `createdAt`: datetime

### `content-service` (`content_db`)

**Kolekcija: `artists`**
- `id` (`_id`): ObjectId
- `name`: string
- `image`: string? (opciono)
- `biography`: string
- `genres`: string[]

**Kolekcija: `albums`**
- `id` (`_id`): ObjectId
- `title`: string
- `releaseDate`: string
- `genres`: string[]
- `artistId`: ObjectId (referenca na `artists._id`)

**Kolekcija: `songs`**
- `id` (`_id`): ObjectId
- `title`: string
- `duration`: string
- `trackNo`: int
- `albumId`: ObjectId (referenca na `albums._id`)

### `notification-service` (`notifications_db`)

**Kolekcija: `notifications`**
- `id` (`_id`): ObjectId
- `userId`: ObjectId
- `message`: string
- `createdAt`: datetime
- `isRead`: bool

## Stilovi komunikacije između servisa

### Klijent → sistem
- Klijent (frontend) komunicira isključivo sa `nginx` na:
  - HTTP: `http://localhost:8080`
  - HTTPS (opciono, dev): `https://localhost:8443`
- Stil: REST/JSON.
- Autentifikacija: JWT kroz `Authorization: Bearer <token>` i/ili `httpOnly` cookie (`access_token`, `refresh_token`), zavisno od rute.

### `nginx` → `api-gateway`
- Reverse proxy (HTTP), prosleđuje URL i headere (uključujući `Authorization`).

### `api-gateway` → mikroservisi
- Stil: sinhroni REST/JSON proxy.
- Rute:
  - `/api/auth/**` → `users-service`
  - `/api/content/artists/**` → javno dostupno kroz `content-service`
  - `/api/content/**` → zaštićeno JWT-om (gateway proverava JWT pre prosleđivanja)
  - `/api/notifications/**` → zaštićeno JWT-om (gateway proverava JWT pre prosleđivanja)

### Servis → servis (notifikacije)
- `users-service` i `content-service` šalju notifikacije ka `notification-service` preko HTTP `POST /api/notifications`.
- Servisna autentifikacija: header `X-Service-API-Key` (vrednost dolazi iz env var `SERVICE_API_KEY`).
- Stil: sinhroni HTTP poziv, ali se šalje “fire-and-forget” (u gorutini) da ne blokira korisnički zahtev.

### Persistence
- Svi servisi koriste istu instancu MongoDB, ali različite baze:
  - `users_db`, `content_db`, `notifications_db`
- Time se logički odvaja model podataka po servisu (svaki servis “poseduje” svoju bazu/entitete).

# 2.7 Otpornost na parcijalne otkaze

Implementirano (minimum za vežbe):
- Konfigurisan HTTP klijent (keep-alive + dial/TLS timeouts) u `shared-utils/httpclient` i u gateway-u.
- Timeout na nivou downstream poziva (`axios` timeout u `api-gateway`, `context.WithTimeout` u Go servisima).
- Fallback kada upstream ne odgovori (gateway vraća prazan rezultat za `GET /api/recommendations`).
- Circuit breaker + retry za downstream pozive (gateway i Go klijent za notifikacije).
- Eksplicitni timeout za vraćanje odgovora korisniku (net/http server timeouts u svim Go servisima + `res.setTimeout` u gateway-u).
- Upstream odustaje od obrade nakon isteka timeout-a (otkazivanje preko `context`/`AbortController`).

Gateway env var-ovi (opciono): `UPSTREAM_TIMEOUT_MS`, `USER_RESPONSE_TIMEOUT_MS`, `RETRY_MAX_ATTEMPTS`, `CIRCUIT_FAILURE_THRESHOLD`, `CIRCUIT_OPEN_MS` (vidi `.env.example`).

