# Contrato de Integração API REST (v1)
## Educa Fora da Caixa — Nota Fiscal
### Plataforma: `Educa-nota-fiscal-back` ↔ `educa-nota-fiscal-app` (Flutter: `br.com.educaforadacaixa`)

Este documento define as especificações completas de endpoints, formatos de dados (JSON), fluxos de autenticação, cabeçalhos HTTP e tratamento de erros para a integração do aplicativo móvel/tablet com o back-end.

---

## 1. Padrões Globais da API

- **Base URL (Local):** `http://localhost:3000/api/v1`
- **Base URL (Vercel Produção):** `https://seu-dominio.vercel.app/api/v1`
- **Content-Type:** `application/json; charset=utf-8`
- **Autenticação no App:** `Authorization: Bearer <access_token>`
- **Tratamento Padronizado de Erros JSON:**
  Em caso de falha (status `>= 400`), a API sempre retorna:
  ```json
  {
    "error": "Descrição amigável da mensagem de erro",
    "code": "CODIGO_DO_ERRO",
    "details": null
  }
  ```

---

## 2. Autenticação e Sessão (`/api/v1/auth/*`)

### 2.1 Login Híbrido (E-mail ou CPF)
- **Método:** `POST`
- **Rota:** `/api/v1/auth/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "login": "diretora@cas1.org.br",
    "password": "Educa@2026!"
  }
  ```
  *(Nota: O campo `login` aceita tanto o e-mail quanto o CPF da usuária com ou sem formatação, ex: `33333333333` ou `333.333.333-33`).*

- **Response `200 OK`:**
  ```json
  {
    "user": {
      "id": "uuid-v4",
      "name": "Dra. Sandra Regina",
      "email": "diretora@cas1.org.br",
      "cpf": "33333333333",
      "role": "DIRETORA",
      "ceiId": "uuid-cei",
      "ceiName": "CEI Caminhar com Amor I",
      "avatarUrl": null
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "eyJhbGciOiJIUzI1Ni..."
  }
  ```
  *(Nota: O Painel Web também recebe automaticamente os cookies `educa_token` e `educa_refresh_token` com flags `HttpOnly; SameSite=Lax`).*

---

### 2.2 Renovação de Token (Refresh Token)
- **Método:** `POST`
- **Rota:** `/api/v1/auth/refresh`
- **Request Body (Flutter):**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1Ni..."
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "uuid-v4",
      "name": "Dra. Sandra Regina",
      "email": "diretora@cas1.org.br",
      "cpf": "33333333333",
      "role": "DIRETORA",
      "ceiId": "uuid-cei",
      "ceiName": "CEI Caminhar com Amor I"
    }
  }
  ```

---

### 2.3 Logout e Revogação
- **Método:** `POST`
- **Rota:** `/api/v1/auth/logout`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1Ni..."
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "message": "Sessão encerrada com sucesso"
  }
  ```

---

### 2.4 Perfil Autenticado
- **Método:** `GET`
- **Rota:** `/api/v1/auth/me`
- **Headers:** `Authorization: Bearer <access_token>`
- **Response `200 OK`:**
  ```json
  {
    "user": {
      "id": "uuid-v4",
      "name": "Prof. Juliana Mendes",
      "email": "professora@cas1.org.br",
      "cpf": "55555555555",
      "phone": "(11) 94321-0987",
      "avatarUrl": null,
      "role": "PROFESSORA",
      "ceiId": "uuid-cei",
      "isActive": true,
      "lastLoginAt": "2026-11-24T20:00:00.000Z"
    },
    "cei": {
      "id": "uuid-cei",
      "cnpj": "03.456.789/0001-99",
      "razaoSocial": "ASSOCIACAO BENEFICENTE CAMINHAR COM AMOR",
      "nomeFantasia": "CEI Caminhar com Amor I",
      "endereco": "Rua Carlo Formes, 45 - Vila Império, São Paulo - SP",
      "telefone": "(11) 5621-7151",
      "email": "diretoria@cas1.org.br",
      "taxaComissao": 10.0
    },
    "teacherClassrooms": [
      {
        "id": "sample-classroom-b2a",
        "name": "Berçário II A",
        "code": "B2-A",
        "capacity": 18
      }
    ],
    "guardian": null
  }
  ```

---

## 3. Bootstrap Unificado do App (`/api/v1/app/bootstrap`)

Este endpoint foi desenhado especificamente para o ciclo de vida do Flutter: chamado uma única vez logo após o login ou retorno ao app em primeiro plano para alimentar o `AppState`.

- **Método:** `GET`
- **Rota:** `/api/v1/app/bootstrap`
- **Headers:** `Authorization: Bearer <access_token>`

### 3.1 Exemplo de Resposta para `PROFESSORA` (Tablet Sala de Aula)
```json
{
  "user": {
    "id": "uuid-professora",
    "name": "Prof. Juliana Mendes",
    "email": "professora@cas1.org.br",
    "cpf": "55555555555",
    "role": "PROFESSORA",
    "avatarUrl": null
  },
  "tenant": {
    "id": "uuid-cei",
    "cnpj": "03.456.789/0001-99",
    "razaoSocial": "ASSOCIACAO BENEFICENTE CAMINHAR COM AMOR",
    "nomeFantasia": "CEI Caminhar com Amor I",
    "endereco": "Rua Carlo Formes, 45 - Vila Império, São Paulo - SP",
    "telefone": "(11) 5621-7151",
    "taxaComissao": 10.0
  },
  "roleData": {
    "classrooms": [
      {
        "id": "sample-classroom-b2a",
        "name": "Berçário II A",
        "code": "B2-A",
        "capacity": 18,
        "studentsCount": 1,
        "students": [
          {
            "id": "sample-student-arthur",
            "name": "Arthur Silva Santos",
            "birthDate": "2024-04-15T00:00:00.000Z",
            "motherName": "Mariana Silva Santos",
            "photoUrl": "https://images.unsplash.com/photo-...",
            "imageConsent": true,
            "hasSpecialDiet": true,
            "hasAllergies": true,
            "statusToday": "CHECK_IN",
            "lastAttendanceAt": "2026-11-24T07:22:15.000Z"
          }
        ]
      }
    ]
  },
  "activeCampaign": {
    "id": "hook-date-maes-2026",
    "title": "Dia das Mães - Multiplique o Amor na Nota Fiscal Paulista!",
    "date": "2026-05-10T00:00:00.000Z",
    "description": "Campanha de incentivo ao pedido de CPF na NFP.",
    "bannerUrl": "https://...",
    "pushTitle": "🎁 Dia das Mães: Peça CPF na Nota e ajude nosso CEI!",
    "pushBody": "Ao comprar o presente da mamãe, peça CPF na nota!"
  },
  "recentPosts": [
    {
      "id": "post-exemplo-01",
      "title": "Campanha Nota Fiscal Paulista: Juntos pelas nossas crianças!",
      "content": "Queridas famílias! Ao realizarem suas compras neste mês...",
      "type": "HOOK_DATE_CAMPAIGN",
      "authorName": "Dra. Sandra Regina",
      "authorRole": "Diretora",
      "mediaUrls": ["https://..."],
      "isNfpCampaign": true,
      "nfpActionUrl": "https://www.nfp.fazenda.sp.gov.br/",
      "createdAt": "2026-11-24T18:00:00.000Z"
    }
  ],
  "appConfig": {
    "appName": "Educa Fora da Caixa - Nota Fiscal",
    "platformVersion": "1.0.0",
    "nfpSupportEnabled": true,
    "controlIdIntegrated": true,
    "serverTime": "2026-11-24T20:30:00.000Z"
  }
}
```

---

### 3.2 Exemplo de Resposta para `RESPONSAVEL` (App Mobile da Família)
```json
{
  "user": {
    "id": "uuid-mae",
    "name": "Mariana Silva Santos",
    "email": "responsavel@cas1.org.br",
    "cpf": "66666666666",
    "role": "RESPONSAVEL",
    "avatarUrl": null
  },
  "tenant": {
    "id": "uuid-cei",
    "nomeFantasia": "CEI Caminhar com Amor I"
  },
  "roleData": {
    "guardian": {
      "id": "uuid-guardian",
      "qrCodeToken": "QR-TOKEN-MARIANA-2026",
      "favoritouNfp": true
    },
    "children": [
      {
        "studentId": "sample-student-arthur",
        "name": "Arthur Silva Santos",
        "classroomName": "Berçário II A",
        "classroomCode": "B2-A",
        "photoUrl": "https://...",
        "activeCard": {
          "cardNumber": "CR-2026-0042",
          "qrCodeToken": "QR-CARD-ARTHUR-01"
        },
        "relationship": "MÃE",
        "isPrimary": true,
        "todayTimeline": [
          {
            "type": "CHECK_IN",
            "method": "CONTROL_ID",
            "time": "2026-11-24T07:22:15.000Z",
            "triageStatus": "NORMAL"
          }
        ]
      }
    ]
  },
  "activeCampaign": { ... },
  "recentPosts": [ ... ],
  "appConfig": { ... }
}
```

---

## 4. Gerenciamento de Unidades e Usuários

### 4.1 Listar Usuários
- **Método:** `GET`
- **Rota:** `/api/v1/users?ceiId={ceiId}&role={role}`
- **Headers:** `Authorization: Bearer <access_token>`
- **Permissão:** `ADM_GERAL`, `ADM_CEI`, `DIRETORA`, `SECRETARIA`

### 4.2 Criar Usuário
- **Método:** `POST`
- **Rota:** `/api/v1/users`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "name": "Nome do Usuário",
    "email": "usuario@cas1.org.br",
    "cpf": "12345678900",
    "password": "SenhaSegura123!",
    "role": "PROFESSORA",
    "ceiId": "uuid-do-cei",
    "phone": "(11) 98765-4321"
  }
  ```

### 4.3 Listar Unidades (CEIs)
- **Método:** `GET`
- **Rota:** `/api/v1/ceis`
- **Headers:** `Authorization: Bearer <access_token>`
- **Permissão:** `ADM_GERAL` (lista todas), outros perfis (retorna a própria unidade)

### 4.4 Criar Unidade (CEI)
- **Método:** `POST`
- **Rota:** `/api/v1/ceis`
- **Headers:** `Authorization: Bearer <access_token>`
- **Permissão:** `ADM_GERAL`
- **Request Body:**
  ```json
  {
    "cnpj": "12.345.678/0001-00",
    "razaoSocial": "ASSOCIACAO EXEMPLO BENEFICENTE",
    "nomeFantasia": "CEI Exemplo I",
    "endereco": "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
    "telefone": "(11) 3200-0000",
    "email": "contato@ceiexemplo.org.br",
    "taxaComissao": 10.0
  }
  ```

---

## 5. Códigos de Erro da API

| Código HTTP | `code` | Motivo |
|---|---|---|
| `400` | `BAD_REQUEST` | Requisição malformada ou parâmetros obrigatórios ausentes |
| `401` | `UNAUTHORIZED` | Token de autenticação não enviado ou ausente |
| `401` | `INVALID_TOKEN` | Token JWT inválido, adulterado ou expirado |
| `401` | `INVALID_CREDENTIALS` | E-mail/CPF ou senha incorretos |
| `401` | `SESSION_EXPIRED` | Refresh token revogado ou expirado |
| `403` | `FORBIDDEN` | Papel (role) do usuário não tem permissão para a rota |
| `403` | `TENANT_ACCESS_DENIED` | Tentativa de acessar ou modificar dados de outro CEI |
| `403` | `USER_INACTIVE` | Conta de usuário desativada pelo administrador |
| `404` | `USER_NOT_FOUND` | Recurso solicitado não foi encontrado no banco |
| `409` | `EMAIL_EXISTS` / `CPF_EXISTS` | Conflito de unicidade em cadastro |
| `422` | `VALIDATION_ERROR` | Falha na validação dos campos pelo schema Zod |
| `500` | `INTERNAL_SERVER_ERROR` | Falha inesperada no servidor |
