# feat/transacciones QA Notes

## Blocking Before Merge

- Checkout reservation currently receives `HTTP 400` from `POST /api/v1/transactions` in at least one local backend state.
- Backend detail observed on 2026-05-24:

```json
{
  "path": "/api/v1/transactions",
  "detail": "Dorsal 55555555-5555-4555-8555-555555555555 is not available (status: published)",
  "event": "domain_exception"
}
```

## Interpretation

Frontend currently sends the expected reserve payload: `dorsal_id` and `buyer_id`.
The phrase `not available (status: published)` is contract-inconsistent unless backend intentionally requires another status for reservable dorsals.

## Required Resolution

- If `published` is reservable, fix backend Transaction availability rule or error message.
- If another status is required, update Catalog UI and Transaction frontend copy to expose that precondition before checkout.
