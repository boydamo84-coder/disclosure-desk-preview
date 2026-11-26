-- Development-only private quota accounting. NOT A MIGRATION; no hosted application.
-- No client role access, no exposed RPC, no Storage API, no publication privileges.
BEGIN;
CREATE SCHEMA dd_cr_quarantine_internal;
REVOKE ALL ON SCHEMA dd_cr_quarantine_internal FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE dd_cr_quarantine_internal.budget (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  used_bytes bigint NOT NULL DEFAULT 0 CHECK (used_bytes BETWEEN 0 AND 250000000)
);
INSERT INTO dd_cr_quarantine_internal.budget(singleton) VALUES(true);

CREATE TABLE dd_cr_quarantine_internal.reservations (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  copy_kind text NOT NULL CHECK (copy_kind IN ('quarantine','approved_copy')),
  expected_sha256 text NOT NULL CHECK (expected_sha256 ~ '^[a-f0-9]{64}$'),
  bytes integer NOT NULL CHECK (bytes BETWEEN 1 AND 5000000),
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved','present','delete_pending','released')),
  reserved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  deletion_confirmed_at timestamptz,
  CHECK ((state = 'released') = (deletion_confirmed_at IS NOT NULL)),
  CHECK (deletion_confirmed_at IS NULL OR deletion_confirmed_at >= reserved_at)
);
-- Private role only. No policies/grants yet; future trusted worker role is a
-- separate reviewed decision. Even service_role cannot reach the ledger via API.
ALTER TABLE dd_cr_quarantine_internal.budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE dd_cr_quarantine_internal.reservations ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION dd_cr_quarantine_internal.guard_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $guard$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'reservation_history_retained' USING ERRCODE='23514';
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'reserved' OR NEW.deletion_confirmed_at IS NOT NULL THEN
      RAISE EXCEPTION 'initial_state_invalid' USING ERRCODE='23514';
    END IF;
    NEW.reserved_at := clock_timestamp();
    NEW.changed_at := NEW.reserved_at;
    RETURN NEW;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.copy_kind IS DISTINCT FROM OLD.copy_kind
     OR NEW.expected_sha256 IS DISTINCT FROM OLD.expected_sha256
     OR NEW.bytes IS DISTINCT FROM OLD.bytes OR NEW.reserved_at IS DISTINCT FROM OLD.reserved_at THEN
    RAISE EXCEPTION 'reservation_immutable' USING ERRCODE='23514';
  END IF;
  IF NEW.state = OLD.state AND NEW.deletion_confirmed_at IS NOT DISTINCT FROM OLD.deletion_confirmed_at THEN
    NEW.changed_at := OLD.changed_at;
    RETURN NEW;
  END IF;
  IF NOT (
    (OLD.state='reserved' AND NEW.state IN ('present','delete_pending')) OR
    (OLD.state='present' AND NEW.state='delete_pending') OR
    (OLD.state='delete_pending' AND NEW.state='released')
  ) THEN
    RAISE EXCEPTION 'reservation_transition_invalid' USING ERRCODE='23514';
  END IF;
  IF NEW.state='released' AND (NEW.deletion_confirmed_at IS NULL
    OR NEW.deletion_confirmed_at < OLD.changed_at
    OR NEW.deletion_confirmed_at > clock_timestamp()) THEN
    RAISE EXCEPTION 'deletion_confirmation_required' USING ERRCODE='23514';
  END IF;
  NEW.changed_at := clock_timestamp();
  RETURN NEW;
END;
$guard$;

CREATE FUNCTION dd_cr_quarantine_internal.account_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $account$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- After-insert, so an idempotent ON CONFLICT DO NOTHING cannot consume
    -- quota. UPDATE obtains the single shared row lock and rechecks the cap.
    UPDATE dd_cr_quarantine_internal.budget
       SET used_bytes=used_bytes+NEW.bytes
     WHERE singleton AND used_bytes+NEW.bytes <= 250000000;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'quota_exceeded' USING ERRCODE='23514';
    END IF;
  ELSIF OLD.state <> 'released' AND NEW.state='released' THEN
    UPDATE dd_cr_quarantine_internal.budget
       SET used_bytes=used_bytes-NEW.bytes
     WHERE singleton AND used_bytes>=NEW.bytes;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'quota_accounting_unconfirmed' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$account$;

CREATE TRIGGER dd_cr_reservation_guard
BEFORE INSERT OR UPDATE OR DELETE ON dd_cr_quarantine_internal.reservations
FOR EACH ROW EXECUTE FUNCTION dd_cr_quarantine_internal.guard_reservation();
CREATE TRIGGER dd_cr_reservation_accounting
AFTER INSERT OR UPDATE ON dd_cr_quarantine_internal.reservations
FOR EACH ROW EXECUTE FUNCTION dd_cr_quarantine_internal.account_reservation();

REVOKE ALL ON ALL TABLES IN SCHEMA dd_cr_quarantine_internal FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA dd_cr_quarantine_internal FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA dd_cr_quarantine_internal
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
COMMIT;
