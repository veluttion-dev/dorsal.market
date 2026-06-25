# Transaction Runner Requirements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect estimated time, shirt size, and emergency contact per purchase only when required by the published dorsal, while keeping emergency contact optional in the permanent profile.

**Architecture:** Catalog owns the requirement configuration, Transaction validates it and stores immutable buyer answers, and Identity only supplies stable identity/contact data plus an optional emergency-contact default. Backend changes land against `MVP-Dorsales/main`; frontend contract and UI changes land against `dorsal.market/feat/foundation`.

**Tech Stack:** Python 3.12, FastAPI, Pydantic, SQLAlchemy, Alembic, pytest, TypeScript, Next.js 16, React Hook Form, Zod, TanStack Query, Vitest.

---

## File Map

### Backend repository: `../MVP-Dorsales`

- Catalog configuration:
  - `dorsales_api/domain/model/catalog/entities/dorsal.py`
  - `dorsales_api/domain/model/catalog/value_objects/purchase_requirements.py`
  - `dorsales_api/domain/model/use_cases/catalog/publish_dorsal_use_case.py`
  - `dorsales_api/domain/application/services/dorsal/dorsal_mapper.py`
  - `dorsales_api/infrastructure/input/rest/schemas/catalog_schemas.py`
  - `dorsales_api/infrastructure/input/rest/mappers/catalog_mappers.py`
  - `dorsales_api/infrastructure/output/persistence/catalog/models/sqlalchemy_dorsal_model.py`
  - `dorsales_api/infrastructure/output/persistence/catalog/mappers/dorsal_mapper.py`
- Transaction snapshot and validation:
  - `dorsales_api/domain/model/transaction/entities/transaction.py`
  - `dorsales_api/domain/model/transaction/ports/dorsal_order_summary_checker_port.py`
  - `dorsales_api/domain/model/use_cases/transaction/reserve_listing_use_case.py`
  - `dorsales_api/domain/application/use_cases/transaction/reserve_listing_use_case_impl.py`
  - `dorsales_api/infrastructure/input/rest/schemas/transaction_schemas.py`
  - `dorsales_api/infrastructure/input/rest/controllers/transaction/purchase_controller.py`
  - `dorsales_api/infrastructure/output/persistence/transaction/models/sqlalchemy_transaction_model.py`
  - `dorsales_api/infrastructure/output/persistence/transaction/mappers/transaction_mapper.py`
  - `dorsales_api/infrastructure/output/persistence/transaction/adapters/sqlalchemy_dorsal_order_summary_checker_adapter.py`
- Seller detail and profile semantics:
  - `dorsales_api/domain/model/identity/entities/user.py`
  - `dorsales_api/domain/application/use_cases/transaction/get_seller_transaction_detail_use_case_impl.py`
- Migration:
  - `alembic/versions/20260626_add_transaction_runner_requirements.py`

### Frontend repository: `.`

- Shared contracts:
  - `packages/schemas/src/dorsal.ts`
  - `packages/schemas/src/transaction.ts`
  - `packages/schemas/src/user.ts`
  - `packages/api-client/src/ports/transactions.ts`
  - `packages/api-client/src/adapters/transactions-http.ts`
- Publication:
  - `apps/web/features/dorsals/components/publish-wizard.client.tsx`
- Profile:
  - `apps/web/features/users/components/profile-form.client.tsx`
  - `apps/web/features/users/lib/profile-completion.ts`
  - `apps/web/features/transactions/components/buyer-data-notice.client.tsx`
- Checkout:
  - `apps/web/features/transactions/components/checkout-form.client.tsx`
  - `apps/web/features/transactions/hooks/use-reserve-listing.ts`

---

### Task 1: Add Catalog Purchase Requirements

**Files:**
- Create: `../MVP-Dorsales/dorsales_api/domain/model/catalog/value_objects/purchase_requirements.py`
- Modify: `../MVP-Dorsales/dorsales_api/domain/model/catalog/entities/dorsal.py`
- Modify: `../MVP-Dorsales/dorsales_api/domain/model/use_cases/catalog/publish_dorsal_use_case.py`
- Modify: `../MVP-Dorsales/dorsales_api/domain/application/services/dorsal/dorsal_mapper.py`
- Test: `../MVP-Dorsales/tests/unit/domain/model/catalog/test_catalog_value_objects.py`
- Test: `../MVP-Dorsales/tests/unit/domain/model/catalog/test_dorsal.py`

- [ ] **Step 1: Write failing value-object tests**

Add tests that define the valid and invalid shirt configurations:

```python
def test_purchase_requirements_allow_independent_requested_fields() -> None:
    requirements = PurchaseRequirements(
        requires_estimated_time=True,
        requires_shirt_size=False,
        requires_emergency_contact=True,
    )
    assert requirements.requires_estimated_time is True
    assert requirements.requires_emergency_contact is True


def test_purchase_requirements_reject_fixed_and_requested_shirt_size() -> None:
    with pytest.raises(ValueError, match="fixed shirt size"):
        PurchaseRequirements(requires_shirt_size=True, fixed_shirt_size="M")


def test_purchase_requirements_reject_fixed_size_without_included_shirt() -> None:
    requirements = PurchaseRequirements(fixed_shirt_size="M")
    with pytest.raises(ValueError, match="included shirt"):
        requirements.validate_for_included_shirt(False)
```

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
uv run pytest tests/unit/domain/model/catalog/test_catalog_value_objects.py -q
```

Expected: collection or assertion failure because `PurchaseRequirements` does not exist.

- [ ] **Step 3: Implement the value object**

Create:

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class PurchaseRequirements:
    requires_estimated_time: bool = False
    requires_shirt_size: bool = False
    requires_emergency_contact: bool = False
    fixed_shirt_size: str | None = None

    def __post_init__(self) -> None:
        fixed = self.fixed_shirt_size.strip() if self.fixed_shirt_size else None
        object.__setattr__(self, "fixed_shirt_size", fixed)
        if fixed and self.requires_shirt_size:
            raise ValueError("Cannot request buyer shirt size when a fixed shirt size is configured")

    def validate_for_included_shirt(self, shirt_included: bool) -> None:
        if self.fixed_shirt_size and not shirt_included:
            raise ValueError("A fixed shirt size requires an included shirt")
```

Add `purchase_requirements: PurchaseRequirements` to `Dorsal`, validate it when publishing, and pass it through `PublishDorsalInput` and `DorsalMapper`.

- [ ] **Step 4: Run catalog domain tests**

```powershell
uv run pytest tests/unit/domain/model/catalog/test_catalog_value_objects.py tests/unit/domain/model/catalog/test_dorsal.py tests/unit/domain/application/use_cases/catalog/test_publish_dorsal_use_case_impl.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add dorsales_api/domain/model/catalog tests/unit/domain/model/catalog tests/unit/domain/application/use_cases/catalog
git commit -m "feat(catalog): model per-dorsal purchase requirements"
```

---

### Task 2: Persist and Expose Dorsal Requirements

**Files:**
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/input/rest/schemas/catalog_schemas.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/input/rest/mappers/catalog_mappers.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/output/persistence/catalog/models/sqlalchemy_dorsal_model.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/output/persistence/catalog/mappers/dorsal_mapper.py`
- Create: `../MVP-Dorsales/alembic/versions/20260626_add_transaction_runner_requirements.py`
- Test: `../MVP-Dorsales/tests/unit/infrastructure/test_catalog_controller.py`
- Test: `../MVP-Dorsales/tests/integration/test_dorsal_repository_adapter.py`

- [ ] **Step 1: Write failing REST and repository tests**

Use this request shape:

```python
"purchase_requirements": {
    "requires_estimated_time": True,
    "requires_shirt_size": False,
    "requires_emergency_contact": True,
    "fixed_shirt_size": "M",
}
```

Assert the same object is returned by dorsal detail and survives a repository round trip.

- [ ] **Step 2: Verify failures**

```powershell
uv run pytest tests/unit/infrastructure/test_catalog_controller.py tests/integration/test_dorsal_repository_adapter.py -q
```

Expected: schema and model failures for missing purchase-requirement fields.

- [ ] **Step 3: Add API schema and persistence columns**

Add:

```python
class PurchaseRequirementsSchema(BaseModel):
    requires_estimated_time: bool = False
    requires_shirt_size: bool = False
    requires_emergency_contact: bool = False
    fixed_shirt_size: str | None = Field(default=None, max_length=16)
```

Store the four values as explicit dorsal columns:

```python
requires_estimated_time: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
requires_shirt_size: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
requires_emergency_contact: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
fixed_shirt_size: Mapped[str | None] = mapped_column(String(16), nullable=True)
```

Create an Alembic revision with `down_revision = "4f3b523d7f06"` and server defaults of `false` for the three flags. Drop the server defaults after populating existing rows.

- [ ] **Step 4: Run migration and focused tests**

```powershell
uv run alembic -c alembic/alembic.ini upgrade head
uv run pytest tests/unit/infrastructure/test_catalog_controller.py tests/integration/test_dorsal_repository_adapter.py -q
```

Expected: migration succeeds and tests pass.

- [ ] **Step 5: Commit**

```powershell
git add alembic/versions/20260626_add_transaction_runner_requirements.py dorsales_api/infrastructure tests/unit/infrastructure/test_catalog_controller.py tests/integration/test_dorsal_repository_adapter.py
git commit -m "feat(catalog): persist purchase requirements"
```

---

### Task 3: Store Runner Answers on the Transaction

**Files:**
- Modify: `../MVP-Dorsales/dorsales_api/domain/model/transaction/entities/transaction.py`
- Modify: `../MVP-Dorsales/dorsales_api/domain/model/transaction/ports/dorsal_order_summary_checker_port.py`
- Modify: `../MVP-Dorsales/dorsales_api/domain/model/use_cases/transaction/reserve_listing_use_case.py`
- Modify: `../MVP-Dorsales/dorsales_api/domain/application/use_cases/transaction/reserve_listing_use_case_impl.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/input/rest/schemas/transaction_schemas.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/input/rest/controllers/transaction/purchase_controller.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/output/persistence/transaction/models/sqlalchemy_transaction_model.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/output/persistence/transaction/mappers/transaction_mapper.py`
- Modify: `../MVP-Dorsales/dorsales_api/infrastructure/output/persistence/transaction/adapters/sqlalchemy_dorsal_order_summary_checker_adapter.py`
- Test: `../MVP-Dorsales/tests/unit/domain/application/use_cases/transaction/test_reserve_listing_use_case_impl.py`
- Test: `../MVP-Dorsales/tests/unit/domain/model/transaction/test_transaction.py`
- Test: `../MVP-Dorsales/tests/unit/infrastructure/test_transaction_controller.py`
- Test: `../MVP-Dorsales/tests/unit/infrastructure/persistence/test_transaction_mapper.py`

- [ ] **Step 1: Write failing reservation validation tests**

Cover each requested field independently:

```python
def test_given_estimated_time_required_when_missing_then_reservation_is_rejected():
    dorsal_checker.get_order_summary.return_value = _dorsal(
        requires_estimated_time=True,
    )
    with pytest.raises(ValidationError, match="estimated_time"):
        uc.execute(ReserveListingInput(dorsal_id=uuid4(), buyer_id=uuid4()))


def test_given_runner_answers_when_reserved_then_transaction_snapshots_them():
    result = uc.execute(
        ReserveListingInput(
            dorsal_id=dorsal_id,
            buyer_id=buyer_id,
            estimated_time="01:45:00",
            t_shirt_size="M",
            emergency_contact="Ana +34600000000",
        )
    )
    saved = tx_repo.save.call_args.args[0]
    assert saved.estimated_time == "01:45:00"
    assert saved.t_shirt_size == "M"
    assert saved.emergency_contact == "Ana +34600000000"
```

Also test malformed estimated time and fixed shirt size copying to the transaction.

- [ ] **Step 2: Verify reservation tests fail**

```powershell
uv run pytest tests/unit/domain/application/use_cases/transaction/test_reserve_listing_use_case_impl.py -q
```

Expected: constructor/type failures because runner-answer fields do not exist.

- [ ] **Step 3: Extend transaction contracts and validation**

Extend `DorsalOrderSummary` with the four catalog requirement fields. Extend the input:

```python
@dataclass(frozen=True)
class ReserveListingInput:
    dorsal_id: UUID
    buyer_id: UUID
    estimated_time: str | None = None
    t_shirt_size: str | None = None
    emergency_contact: str | None = None
```

Validate requested data before creating Stripe state:

```python
if dorsal.requires_estimated_time and not input.estimated_time:
    raise ValidationError("estimated_time is required for this dorsal")
if input.estimated_time and not re.fullmatch(r"\d{2}:\d{2}:\d{2}", input.estimated_time):
    raise ValidationError("estimated_time must use HH:MM:SS")
if dorsal.requires_shirt_size and not input.t_shirt_size:
    raise ValidationError("t_shirt_size is required for this dorsal")
if dorsal.requires_emergency_contact and not input.emergency_contact:
    raise ValidationError("emergency_contact is required for this dorsal")

shirt_size = dorsal.fixed_shirt_size or input.t_shirt_size
```

Pass the accepted snapshot into `Transaction.reserve`.

- [ ] **Step 4: Extend REST schema and mapper**

```python
class RunnerDataSchema(BaseModel):
    estimated_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}:\d{2}$")
    t_shirt_size: str | None = Field(default=None, max_length=16)
    emergency_contact: str | None = Field(default=None, max_length=120)


class ReserveListingRequestSchema(BaseModel):
    dorsal_id: UUID
    buyer_id: UUID
    runner_data: RunnerDataSchema | None = None
```

Flatten `runner_data` into `ReserveListingInput` in the controller.

- [ ] **Step 5: Persist transaction snapshot**

Add nullable `String` columns for `estimated_time`, `t_shirt_size`, and `emergency_contact` to the transaction model and the same Alembic migration from Task 2. Update both mapper directions.

- [ ] **Step 6: Run focused tests**

```powershell
uv run pytest tests/unit/domain/model/transaction/test_transaction.py tests/unit/domain/application/use_cases/transaction/test_reserve_listing_use_case_impl.py tests/unit/infrastructure/test_transaction_controller.py tests/unit/infrastructure/persistence/test_transaction_mapper.py -q
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add dorsales_api/domain/model/transaction dorsales_api/domain/model/use_cases/transaction dorsales_api/domain/application/use_cases/transaction dorsales_api/infrastructure/input/rest dorsales_api/infrastructure/output/persistence/transaction alembic/versions/20260626_add_transaction_runner_requirements.py tests
git commit -m "feat(transactions): snapshot required runner data"
```

---

### Task 4: Use Transaction Data in Seller Detail and Relax Profile Completion

**Files:**
- Modify: `../MVP-Dorsales/dorsales_api/domain/model/identity/entities/user.py`
- Modify: `../MVP-Dorsales/dorsales_api/domain/application/use_cases/transaction/get_seller_transaction_detail_use_case_impl.py`
- Test: `../MVP-Dorsales/tests/unit/domain/model/identity/test_user.py`
- Test: `../MVP-Dorsales/tests/unit/domain/application/use_cases/transaction/test_get_seller_transaction_detail_use_case_impl.py`

- [ ] **Step 1: Write failing semantic tests**

```python
def test_profile_completion_does_not_require_runner_fields() -> None:
    user = _complete_identity_user(
        estimated_time=None,
        t_shirt_size=None,
        emergency_contact=None,
    )
    assert user.profile_complete is True


def test_seller_detail_uses_transaction_runner_snapshot() -> None:
    transaction.estimated_time = "02:10:00"
    transaction.t_shirt_size = "L"
    transaction.emergency_contact = "Transaction contact"
    buyer.estimated_time = "09:00:00"
    buyer.t_shirt_size = "XS"
    buyer.emergency_contact = "Profile contact"

    result = uc.execute(input_data)

    assert result.buyer_profile.estimated_time == "02:10:00"
    assert result.buyer_profile.t_shirt_size == "L"
    assert result.buyer_profile.emergency_contact == "Transaction contact"
```

- [ ] **Step 2: Verify failures**

```powershell
uv run pytest tests/unit/domain/model/identity/test_user.py tests/unit/domain/application/use_cases/transaction/test_get_seller_transaction_detail_use_case_impl.py -q
```

- [ ] **Step 3: Implement semantics**

Keep `profile_complete` identity-only. Mark `runner_data_complete` as deprecated compatibility behavior returning `True`, because no runner field is globally required:

```python
@property
def runner_data_complete(self) -> bool:
    return True
```

Build seller `BuyerTransferProfile` from `transaction.estimated_time`, `transaction.t_shirt_size`, and `transaction.emergency_contact`; continue reading name, DNI, and phone from Identity.

- [ ] **Step 4: Run tests and commit**

```powershell
uv run pytest tests/unit/domain/model/identity/test_user.py tests/unit/domain/application/use_cases/transaction/test_get_seller_transaction_detail_use_case_impl.py -q
git add dorsales_api/domain/model/identity/entities/user.py dorsales_api/domain/application/use_cases/transaction/get_seller_transaction_detail_use_case_impl.py tests/unit/domain
git commit -m "fix(profile): remove global runner completion requirements"
```

---

### Task 5: Extend Frontend Schemas and API Client

**Files:**
- Modify: `packages/schemas/src/dorsal.ts`
- Modify: `packages/schemas/src/transaction.ts`
- Modify: `packages/api-client/src/ports/transactions.ts`
- Modify: `packages/api-client/src/adapters/transactions-http.ts`
- Modify: `apps/web/features/transactions/hooks/use-reserve-listing.ts`
- Test: `packages/schemas/src/__tests__/dorsal.test.ts`
- Test: `packages/api-client/src/__tests__/transactions-http.test.ts`

- [ ] **Step 1: Write failing contract tests**

Add a dorsal-detail fixture containing:

```typescript
purchase_requirements: {
  requires_estimated_time: true,
  requires_shirt_size: false,
  requires_emergency_contact: true,
  fixed_shirt_size: 'M',
}
```

Add an adapter assertion:

```typescript
await adapter.reserveListing({
  dorsalId,
  buyerId,
  runnerData: {
    estimated_time: '01:45:00',
    emergency_contact: 'Ana +34600000000',
  },
});

expect(fetchBody).toEqual({
  dorsal_id: dorsalId,
  buyer_id: buyerId,
  runner_data: {
    estimated_time: '01:45:00',
    emergency_contact: 'Ana +34600000000',
  },
});
```

- [ ] **Step 2: Verify failures**

```powershell
pnpm --filter @dorsal/schemas test -- dorsal.test.ts
pnpm --filter @dorsal/api-client test -- transactions-http.test.ts
```

- [ ] **Step 3: Add frontend contracts**

```typescript
export const PurchaseRequirements = z.object({
  requires_estimated_time: z.boolean().default(false),
  requires_shirt_size: z.boolean().default(false),
  requires_emergency_contact: z.boolean().default(false),
  fixed_shirt_size: z.string().max(16).nullable(),
});

export const RunnerDataInput = z.object({
  estimated_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional(),
  t_shirt_size: z.string().max(16).optional(),
  emergency_contact: z.string().max(120).optional(),
});
```

Extend `DorsalDetail` and `PublishDorsalInput` with `purchase_requirements`. Extend `reserveListing` with `runnerData?: RunnerDataInput`.

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm --filter @dorsal/schemas test
pnpm --filter @dorsal/api-client test
git add packages/schemas packages/api-client apps/web/features/transactions/hooks/use-reserve-listing.ts
git commit -m "feat(contracts): add per-purchase runner data"
```

---

### Task 6: Add Publication Requirement Controls

**Files:**
- Modify: `apps/web/features/dorsals/components/publish-wizard.client.tsx`
- Modify: `apps/web/features/dorsals/lib/publish-draft-storage.ts`
- Test: `apps/web/features/dorsals/components/__tests__/publish-wizard.test.tsx`
- Test: `apps/web/features/dorsals/lib/__tests__/publish-draft-storage.test.ts`

- [ ] **Step 1: Write failing UI tests**

Test these behaviors:

```typescript
it('submits configurable buyer requirements', async () => {
  await actor.click(screen.getByLabelText('Solicitar tiempo estimado'));
  await actor.click(screen.getByLabelText('Solicitar contacto de emergencia'));
  await actor.click(screen.getByRole('button', { name: 'Publicar dorsal' }));

  expect(mocks.mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      purchase_requirements: expect.objectContaining({
        requires_estimated_time: true,
        requires_emergency_contact: true,
      }),
    }),
    expect.anything(),
  );
});

it('does not allow fixed and requested shirt size together', async () => {
  await includeShirt(actor);
  await actor.type(screen.getByLabelText('Talla incluida'), 'M');
  expect(screen.getByLabelText('Solicitar talla al comprador')).toBeDisabled();
});
```

- [ ] **Step 2: Verify tests fail**

```powershell
pnpm --filter @dorsal/web test -- publish-wizard.test.tsx
```

- [ ] **Step 3: Implement publication controls**

Add a compact "Datos que debe aportar el comprador" block with three checkboxes. When `included_items.shirt` is enabled, show:

- `Talla incluida (opcional)` input.
- `Solicitar talla al comprador` checkbox.

Setting a fixed size clears and disables `requires_shirt_size`. Removing the included shirt clears both shirt settings. Keep all values in React Hook Form so draft persistence remains automatic.

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm --filter @dorsal/web test -- publish-wizard.test.tsx publish-draft-storage.test.ts
git add apps/web/features/dorsals
git commit -m "feat(dorsals): configure checkout runner requirements"
```

---

### Task 7: Simplify Profile Form and Completion Gate

**Files:**
- Modify: `apps/web/features/users/components/profile-form.client.tsx`
- Modify: `apps/web/features/users/lib/profile-completion.ts`
- Modify: `apps/web/features/transactions/components/buyer-data-notice.client.tsx`
- Test: `apps/web/features/users/components/__tests__/profile-form.test.tsx`
- Test: `apps/web/features/users/__tests__/profile-completion.test.ts`
- Test: `apps/web/features/transactions/components/__tests__/buyer-data-notice.test.tsx`

- [ ] **Step 1: Write failing profile tests**

```typescript
it('does not render estimated time or shirt size in the profile', () => {
  render(<ProfileForm user={user} onSubmit={vi.fn()} />);
  expect(screen.queryByLabelText('Tiempo estimado')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Talla camiseta')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Contacto de emergencia (opcional)')).toBeVisible();
});

it('re-enables save after a rejected submission', async () => {
  const onSubmit = vi.fn().mockRejectedValue(new Error('failed'));
  render(<ProfileForm user={user} onSubmit={onSubmit} />);
  await actor.click(screen.getByRole('button', { name: 'Guardar perfil' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Guardar perfil' })).toBeEnabled(),
  );
});
```

Update completion tests so only `profile_complete` gates checkout.

- [ ] **Step 2: Verify failures**

```powershell
pnpm --filter @dorsal/web test -- profile-form.test.tsx profile-completion.test.ts buyer-data-notice.test.tsx
```

- [ ] **Step 3: Implement profile behavior**

Remove estimated time and shirt size from form values and patch generation. Keep emergency contact under Contact, label optional fields explicitly, and mark identity labels with `*` plus a short `* Campos obligatorios` legend.

Use `finally`:

```typescript
setSaving(true);
try {
  await onSubmit(buildPatch(initial, values));
} finally {
  setSaving(false);
}
```

Change:

```typescript
export function canBuyWithProfile(user: UserProfile | null | undefined) {
  return Boolean(user?.profile_complete);
}
```

Update `BuyerDataNotice` copy to explain that race-specific information is requested in checkout.

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm --filter @dorsal/web test -- profile-form.test.tsx profile-completion.test.ts buyer-data-notice.test.tsx
git add apps/web/features/users apps/web/features/transactions/components/buyer-data-notice.client.tsx apps/web/features/transactions/components/__tests__/buyer-data-notice.test.tsx
git commit -m "fix(profile): keep race-specific data out of user profiles"
```

---

### Task 8: Collect Required Data in Checkout

**Files:**
- Modify: `apps/web/features/transactions/components/checkout-form.client.tsx`
- Test: `apps/web/features/transactions/components/__tests__/checkout-form.test.tsx`

- [ ] **Step 1: Write failing conditional-field tests**

```typescript
it('renders only fields required by the dorsal', () => {
  renderCheckout({
    requirements: {
      requires_estimated_time: true,
      requires_shirt_size: false,
      requires_emergency_contact: true,
      fixed_shirt_size: null,
    },
  });

  expect(screen.getByLabelText('Tiempo estimado')).toBeVisible();
  expect(screen.queryByLabelText('Talla')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Contacto de emergencia')).toHaveValue(profile.emergency_contact);
});

it('sends checkout answers without patching the profile', async () => {
  await actor.type(screen.getByLabelText('Tiempo estimado'), '01:45:00');
  await actor.clear(screen.getByLabelText('Contacto de emergencia'));
  await actor.type(screen.getByLabelText('Contacto de emergencia'), 'Solo esta compra');
  await actor.click(screen.getByRole('button', { name: 'Continuar al pago' }));

  expect(mocks.mutateAsync).toHaveBeenCalledWith({
    dorsalId,
    buyerId,
    runnerData: {
      estimated_time: '01:45:00',
      emergency_contact: 'Solo esta compra',
    },
  });
  expect(mocks.patchProfile).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Verify failures**

```powershell
pnpm --filter @dorsal/web test -- checkout-form.test.tsx
```

- [ ] **Step 3: Implement checkout fields**

Pass `purchaseRequirements` from the checkout page into `CheckoutForm`. Maintain local values:

```typescript
const [runnerData, setRunnerData] = useState({
  estimated_time: '',
  t_shirt_size: '',
  emergency_contact: me.data?.emergency_contact ?? '',
});
```

Because profile data loads asynchronously, initialize the emergency contact once when it first becomes available and the buyer has not edited the field.

Before reserving, validate each enabled field and render field-level messages. Submit only enabled fields. If `fixed_shirt_size` exists, display it as read-only purchase information and do not send buyer shirt size.

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm --filter @dorsal/web test -- checkout-form.test.tsx
git add apps/web/app/\(app\)/compra/checkout apps/web/features/transactions
git commit -m "feat(checkout): collect runner data per transaction"
```

---

### Task 9: Verify Both Repositories and Exercise Local Flow

**Files:**
- No production edits expected.

- [ ] **Step 1: Verify backend**

```powershell
$env:DEBUG='false'
uv run pytest -q
uv run ruff check .
uv run alembic -c alembic/alembic.ini upgrade head
```

Expected: all tests pass, Ruff reports no errors, migration reaches head.

- [ ] **Step 2: Verify frontend**

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit with code 0.

- [ ] **Step 3: Run local smoke flow**

Start from the workspace root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-all.ps1 -SkipInstall
```

Verify:

1. Publish a dorsal requiring estimated time and emergency contact.
2. Open checkout and confirm only those fields appear.
3. Change the prefilled emergency contact.
4. Reserve the dorsal and confirm `transactions` stores the submitted snapshot.
5. Confirm `users.emergency_contact` remains unchanged.
6. Confirm seller detail returns the transaction snapshot.

- [ ] **Step 4: Push branches and open draft PRs**

Frontend:

```powershell
git push -u origin feat/transaction-runner-requirements
gh pr create --draft --base feat/foundation --head feat/transaction-runner-requirements
```

Backend:

```powershell
git push -u origin feat/transaction-runner-requirements
gh pr create --draft --base main --head feat/transaction-runner-requirements
```

