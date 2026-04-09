# Cloud Plan Phase 1 and 2

## Summary
- No new user-facing feature work is required in `sitepulse` for Phase 1 or Phase 2 if the backend preserves the current snapshot APIs.
- The frontend already consumes backend APIs and signed snapshot metadata, so the main work here is compatibility, configuration validation, and documentation cleanup.
- Phase 3 snapshot work is already mostly in place and should remain stable through the GCS migration.

## Frontend Impact
### Phase 1: backend adds `GcsObjectStorage`, behavior preserved
- No required UI changes if the backend preserves:
  - `GET /api/projects/{projectId}/snapshot`
  - `GET /api/projects/{projectId}/snapshots`
- Keep the current `fetchSnapshots()` fallback behavior during backend transition so the UI still works if `/snapshots` is temporarily unavailable.
- Do not introduce any frontend branching by storage provider.
- Keep timeline and compare rendering URL-based via backend-provided URLs.

### Phase 2: GCP deployment switches to GCS
- Keep `NEXT_PUBLIC_API_URL` pointed at the deployed backend.
- Verify that the deployed FE origin is allowed by:
  - backend CORS
  - GCS bucket CORS for signed URL loading
- After the backend rollout is proven stable, optionally remove the legacy `/snapshot/dates` fallback from `src/lib/api.ts`.
- Update frontend repo guidance/docs to reflect the current snapshot behavior:
  - timeline and compare use bulk signed snapshot metadata
  - snapshots are no longer described only as byte-proxy URLs

## Sequencing
1. Leave frontend code behavior unchanged while backend Phase 1 is implemented.
2. Validate that staging/prod backend with `STORAGE_PROVIDER=gcs` still satisfies the current FE contract.
3. After successful rollout, remove legacy snapshot fallback only if desired.
4. Update repo guidance/docs once the backend deployment switch is stable.

## Test Plan
- Verify timeline loads from backend-provided signed URLs in staging/prod.
- Verify compare view still preserves date selection and signed URL refresh recovery.
- Verify `NEXT_PUBLIC_API_URL` targets the correct backend environment.
- Verify browser loading of signed URLs succeeds after GCS cutover.
- Verify no MinIO-specific assumptions remain in user-visible frontend flows.

## Assumptions
- Backend preserves `/snapshot` and `/snapshots` contracts during Phase 1 and Phase 2.
- Local frontend development continues to work against local backend + MinIO.
- Production frontend remains storage-provider-agnostic and only depends on backend API contracts.
