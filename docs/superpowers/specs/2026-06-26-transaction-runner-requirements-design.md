# Transaction Runner Requirements Design

## Goal

Move race-specific runner data out of the permanent user profile and collect it
per purchase only when the seller requires it for that dorsal.

## Scope

The configurable purchase fields are:

- Estimated finish time.
- Buyer shirt size.
- Emergency contact.

The seller configures these requirements while publishing a dorsal. The buyer
provides only the enabled fields during checkout, and the submitted values are
stored as an immutable snapshot on the transaction.

## Profile Behavior

- `estimated_time` and `t_shirt_size` are removed from the profile form and no
  longer participate in profile completion.
- `emergency_contact` remains an optional profile field.
- Profile completion continues to require the existing identity fields:
  first name, last name, DNI, gender, and age, together with the identity
  provider subject and email already managed by the backend.
- Runner fields do not globally block purchases.

When a checkout requires an emergency contact, the frontend may prefill it from
the profile. The value submitted at checkout belongs only to that transaction.
Changing it does not update the user profile.

## Dorsal Publication

Each dorsal stores a purchase requirements configuration with three independent
booleans:

- `requires_estimated_time`
- `requires_shirt_size`
- `requires_emergency_contact`

If the dorsal includes a shirt, the seller may provide `fixed_shirt_size`.
When a fixed shirt size is present, `requires_shirt_size` must be false because
the buyer cannot choose a different size.

The publication wizard presents these settings in the included-items area:

- Enabling "Camiseta" reveals the fixed-size option.
- The seller can either set a fixed size or request the buyer's size.
- Estimated time and emergency contact remain independent toggles.

Draft dorsals may keep incomplete requirement configuration. Publishing rejects
contradictory shirt settings.

## Checkout

The checkout reads the dorsal requirement configuration before reservation.
It renders only the requested fields:

- Estimated time uses the existing `HH:MM:SS` contract.
- Shirt size uses the existing supported shirt-size values.
- Emergency contact is a bounded text field, prefilled from the profile when
  available.

The buyer can edit all displayed values. The "Continuar al pago" action remains
disabled or returns field-level validation until every requested value is
valid. Fields that were not requested are omitted from the reservation request.

The profile gate checks identity completion only. It no longer depends on a
`runner_data_complete` aggregate.

## Backend Contract

`POST /api/v1/transactions` accepts the authenticated buyer, dorsal ID, and an
optional `runner_data` object containing:

- `estimated_time`
- `t_shirt_size`
- `emergency_contact`

The backend is authoritative:

1. Load the dorsal and its purchase requirements.
2. Reject missing requested values with a validation error.
3. Reject values supplied for contradictory shirt configuration.
4. Create the transaction with a snapshot of the accepted values.

The existing request `buyer_id` remains during this change to avoid expanding
the scope into actor-ID migration, but the supplied value must continue to
match the authenticated session behavior used by the current flow.

## Persistence

The dorsal table gains requirement flags and an optional fixed shirt size.

The transaction table gains nullable snapshot columns:

- `estimated_time`
- `t_shirt_size`
- `emergency_contact`

Existing rows remain valid with null values. Existing dorsals default all
requirement flags to false and have no fixed shirt size.

Identity user columns are retained for compatibility in this iteration, but
`estimated_time` and `t_shirt_size` are no longer exposed for editing or used
for completion. Removing the legacy columns is a separate migration after all
consumers stop reading them.

## Seller View

While the transaction state allows access to buyer transfer data, the seller
sees:

- The fixed shirt size from the dorsal when one exists.
- Otherwise the buyer-selected transaction shirt size when requested.
- The transaction estimated time when requested.
- The transaction emergency contact when requested.

These values are read from the transaction snapshot, never from the buyer's
current profile. Identity and general contact data continue to come from the
user record under the existing access rules.

## Error Handling

- Publication returns a validation error for fixed and requested shirt size at
  the same time.
- Reservation returns field-specific validation details when required runner
  data is missing or malformed.
- The checkout preserves entered values and displays the backend error without
  starting Stripe payment.
- Profile submission always resets its saving state with `finally`, so a failed
  request cannot leave the button permanently disabled.

## Testing

Backend tests cover:

- Dorsal publication requirement validation and persistence.
- Reservation with each individual requirement.
- Rejection when requested data is absent or malformed.
- Transaction mapper and repository round trips for snapshot fields.
- Seller detail reads transaction data rather than changed profile data.
- Profile completion no longer depends on estimated time or shirt size.

Frontend tests cover:

- Publication toggles and the fixed-shirt-size conflict.
- Dorsal detail contract parsing for requirement metadata.
- Checkout conditionally renders and validates requested fields.
- Emergency contact is prefilled but only sent to the transaction endpoint.
- Profile form omits estimated time and shirt size and marks required and
  optional fields clearly.
- Failed profile submissions re-enable the save button.

Full repository test, typecheck, lint, build, migration upgrade, and local
checkout smoke checks are required before opening the implementation PRs.
