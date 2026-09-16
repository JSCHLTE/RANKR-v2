# RANKR Pass

The source of truth is `users/{uid}.rankrPass.expiresAt` in Firestore.

- New accounts start with `rankrPass: { expiresAt: null }`. Missing fields on existing accounts also mean no pass; no migration is required.
- To grant a pass now, use the Firebase console to add a `rankrPass` map with an `expiresAt` **Timestamp** set to the end of the paid subscription period.
- To renew, replace that timestamp with the new paid-through date. To revoke immediately, set it to null.
- A pass is active only while its expiration is in the future. No scheduled reset is needed. Cancellation can leave the timestamp intact to preserve access through the paid period.
- The UI receives milliseconds, never a Firestore Timestamp instance. Open badges recheck expiration and browser focus; changes made in Firestore appear when the relevant profile/page is loaded again.
- Ranking reads resolve the current user document, rather than persisting pass status in ranking author snapshots. List reads deduplicate author lookups.

Pricing, tiers, checkout, and automatic billing renewals are not implemented. A future verified billing webhook should update the timestamp using the Admin SDK and the billing provider's period end (not a hardcoded 30 days).

## Ranking limits and editing

Free accounts can create up to 2 saved rankings; active Pass holders can create up to 20. Both public and private rankings count. Creation checks the count and current pass in a transaction.

Without an active Pass, only the two oldest remaining rankings are editable. Creation timestamps determine order; document IDs break ties. Legacy records without a creation timestamp use the Firestore document creation time. Deleting an older ranking promotes the next-oldest. An active Pass restores editing for every owned ranking, including existing rankings above the creation limit.

The update API checks ownership and editing access inside the save transaction, covering names, descriptions, player order, and tiers. The UI checks access on load and focus and disables editing when the pass expires. Locked rankings remain viewable, downloadable, and deletable by their owner.

## Firestore permissions

Only trusted admin/server writes should modify `rankrPass`. The username API accepts only username and avatar fields and initializes the pass itself. This repository does not contain deployed Firestore rules; ensure direct client writes cannot grant passes before using this field for paid access. If profile editing is allowed by your rules, restrict allowed changed fields to profile fields and require a null/missing pass on client creates. Admin SDK writes bypass these rules.

Direct client writes to ranking metadata and ranks must also be denied so clients cannot bypass API creation/editing limits or alter creation timestamps.
