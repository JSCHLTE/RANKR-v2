# RANKR Pass

The source of truth is `users/{uid}.rankrPass.expiresAt` in Firestore.

- New accounts start with `rankrPass: { expiresAt: null }`. Missing fields on existing accounts also mean no pass; no migration is required.
- To grant a pass now, use the Firebase console to add a `rankrPass` map with an `expiresAt` **Timestamp** set to the end of the paid subscription period.
- To renew, replace that timestamp with the new paid-through date. To revoke immediately, set it to null.
- A pass is active only while its expiration is in the future. No scheduled reset is needed. Cancellation can leave the timestamp intact to preserve access through the paid period.
- The UI receives milliseconds, never a Firestore Timestamp instance. Open badges recheck expiration and browser focus; changes made in Firestore appear when the relevant profile/page is loaded again.
- Ranking reads resolve the current user document, rather than persisting pass status in ranking author snapshots. List reads deduplicate author lookups.

Pricing, tiers, checkout, automatic billing renewals, and feature restrictions are not implemented. A future verified billing webhook should update the timestamp using the Admin SDK and the billing provider's period end (not a hardcoded 30 days). Future paywalls must validate the current pass on the server.

## Firestore permissions

Only trusted admin/server writes should modify `rankrPass`. The username API accepts only username and avatar fields and initializes the pass itself. This repository does not contain deployed Firestore rules; ensure direct client writes cannot grant passes before using this field for paid access. If profile editing is allowed by your rules, restrict allowed changed fields to profile fields and require a null/missing pass on client creates. Admin SDK writes bypass these rules.
