# Library Management API

Backend NestJS rieng cho he thong quan ly thu vien. Project nay chay doc lap voi frontend Next.js hien co va chua duoc ket noi vao giao dien.

## Yeu cau

- Node.js
- PostgreSQL
- npm

## Cai dat

```bash
npm install
```

Tao file `.env` trong thu muc `library-management-api` dua tren `.env.example`:

```bash
cp .env.example .env
```

Neu dung PowerShell tren Windows va lenh `npm` bi chan execution policy, dung `npm.cmd` thay cho `npm`.

## Chay backend rieng

Trong thu muc backend:

```bash
npm run start:dev
```

Hoac tu thu muc root cua repo:

```bash
npm run backend
```

Mac dinh API chay tai:

```text
http://localhost:3001
```

## Build va test

```bash
npm run build
npm run test
```

Tu thu muc root:

```bash
npm run backend:build
npm run backend:test
```

## Migration database

```bash
npm run migration:run
npm run migration:revert
```

Tao migration moi sau khi sua entity:

```bash
npm run migration:generate
```

## Endpoint hien co

- `POST /auths/register`
- `POST /auths/login`
- `POST /auths/refresh`
- `GET /books`
- `GET /books/:id`
- `POST /books`
- `PUT /books/:id`
- `DELETE /books/:id`
- `POST /loans`
- `GET /loans`
- `GET /loans/:id`
- `PATCH /loans/:id`
- `PATCH /loans/:id/status`
- `GET /role-permissions`
- `GET /role-permissions/:role`
- `PUT /role-permissions/:role`
- `GET /lms-notifications/user/:userId`
- `PATCH /lms-notifications/read`

Nhung endpoint ngoai `auths` can gui JWT bang header:

```text
Authorization: Bearer <access_token>
```
