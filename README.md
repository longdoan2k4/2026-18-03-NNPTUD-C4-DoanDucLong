# 2026-18-03-NNPTUD-C4-DoanDucLong

## Setup RS256 (2048-bit)

1. Generate RSA keys:

```bash
npm run gen:keys
```

This creates:
- keys/jwtRS256.key
- keys/jwtRS256.key.pub

2. Start server:

```bash
npm start
```

## Auth APIs

### Login

- Method: POST
- URL: /api/v1/auth/login
- Body:

```json
{
	"username": "your_username",
	"password": "Your@Password1"
}
```

Save `token` from response.

### Get current user (/me)

- Method: GET
- URL: /api/v1/auth/me
- Header:

```text
Authorization: Bearer <token>
```

### Change password (requires login)

- Method: POST
- URL: /api/v1/auth/change-password
- Header:

```text
Authorization: Bearer <token>
```

- Body:

```json
{
	"oldpassword": "Your@Password1",
	"newpassword": "Your@Password2"
}
```

`newpassword` is validated as strong password (min 8 chars, upper, lower, number, symbol).

## Postman

Import 2 file sau vao Postman:

- `postman/NNPTUD-C4.postman_collection.json`
- `postman/NNPTUD-C4.local.postman_environment.json`

Thu tu test de nhat:

1. Chay `npm run gen:keys`
2. Chay `npm start`
3. Goi `Health -> API Home`
4. Goi `Auth -> Register` hoac `Auth -> Login`
5. Goi `Auth -> Get Me`

Collection da co san:

- bien `baseUrl`, `token`, `userId`, `targetUserId`, `roleId`, `categoryId`, `productId`, `collectionName`
- test script tu dong luu `token` sau `Register` va `Login`
- test script tu dong luu ID sau khi tao `role`, `category`, `product`, `user`

Luu y:

- Cac route trong `Users`, `Roles`, `System` va request tao/sua/xoa `Categories`, `Products` can token cua tai khoan co role `admin`
- `Register` mac dinh tao user voi role `user`, nen token tu request nay khong du de test cac route admin
- Neu muon test route admin, hay dang nhap bang tai khoan admin co san trong database

## Postman screenshot checklist

Capture and commit 2 images:

1. Login request + response (contains `token`)
2. /me request + response (with Bearer token)

Recommended path in repo:
- docs/images/postman-login.png
- docs/images/postman-me.png
