# Data Model

Document your MongoDB/Mongoose data model here.

Include:

## User Model

Collection: `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required, 1-120 characters |
| `email` | String | Required, unique, lowercased before save |
| `passwordHash` | String | Required. Bcrypt hash (10 salt rounds). `select: false` — never returned by default queries; must be explicitly selected with `.select("+passwordHash")` (used only during login). Also stripped via a `toJSON` transform as a second safeguard, so it never appears in any API response even if selected. |
| `createdAt` | Date | Auto-managed (timestamps) |
| `updatedAt` | Date | Auto-managed (timestamps) |

**Indexes:** `email` (unique)

**Ownership:** Users own their own account only; there is no admin/shared access to other users' records.

---

## Meeting Model

Collection: `meetings`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `ownerId` | ObjectId (ref: `User`) | Required, indexed. Identifies the owning user for all ownership checks. |
| `title` | String | Required, 3-120 characters |
| `meetingType` | String (enum) | Required. One of: `PROJECT`, `CUSTOMER_INTERVIEW`, `SALES_CALL`, `TEAM_STANDUP` |
| `meetingDate` | Date | Required, must be a valid date |
| `participants` | Array of `{ name: String }` | Optional, max 30 entries |
| `projectOrAccountName` | String | Optional, max 120 characters |
| `context` | String | Optional, max 2000 characters |
| `desiredOutcome` | String | Optional, max 1000 characters |
| `transcript` | String | Required, 200-60,000 characters. Can be set via pasted text (JSON body) or `.txt`/`.md` file upload (max 200KB). |
| `status` | String (enum) | One of: `DRAFT`, `QUEUED`, `RUNNING`, `PARTIAL_FAILURE`, `NEEDS_REVIEW`, `FINALIZED`, `FAILED`. Defaults to `DRAFT`. |
| `createdAt` | Date | Auto-managed (timestamps) |
| `updatedAt` | Date | Auto-managed (timestamps) |

- Analysis run model.
- Indexes.
- Ownership rules.
- Transcript storage behavior.
- Sanitized metrics storage.

TODO: replace this scaffold with your data model documentation.

