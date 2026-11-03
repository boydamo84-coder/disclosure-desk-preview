#!/usr/bin/env python3
"""BDS Finance Centre L1: offline, encrypted, SYNTHETIC-ONLY demo vault.

Requires PyCA cryptography. No server, no payment API, no real-data entry.
The vault never writes decrypted data to disk. Not yet approved for real finances.
"""

from __future__ import annotations

import argparse
import base64
import contextlib
import datetime as dt
import fcntl
import getpass
import json
import os
from pathlib import Path
import re
import secrets
import stat
import sys

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt

FORMAT_MAGIC = "BDS-FINANCE-SYNTHETIC-L1"
FORMAT_VERSION = 1
AAD = b"BDS-FINANCE-SYNTHETIC-L1-v1"
SCRYPT_N = 32768
SCRYPT_R = 8
SCRYPT_P = 1
SALT_SIZE = 16
NONCE_SIZE = 12
MAX_FILE = 1024 * 1024
VAULT_NAME = "vault.bds"
DEMO_MODE = "synthetic-demo"
PRODUCTS = {"Disclosure Desk", "Our Cinema", "W.NE", "BDS shared"}
PROVIDERS = {"Ko-fi", "AdSense", "Google Play", "Hosting", "Other"}
KINDS = {"income", "estimate", "fee", "refund", "expense", "payout"}
YEAR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# These are the only transactions that this L1 sample command can write.
# No import or user-entered financial records are supported.
DEMO_PRESETS = {
    "coffee": {"ref": "demo:coffee-2026", "date": "2026-11-02", "product": "Disclosure Desk", "provider": "Ko-fi", "kind": "income", "pence": 2500, "description": "[SIMULATED] Coffee support"},
    "ads": {"ref": "demo:ads-final-2026", "date": "2026-10-31", "product": "Disclosure Desk", "provider": "AdSense", "kind": "income", "pence": 11000, "description": "[SIMULATED] Finalised adverts"},
    "ads-estimate": {"ref": "demo:ads-estimate-2026", "date": "2026-10-20", "product": "Disclosure Desk", "provider": "AdSense", "kind": "estimate", "pence": 12000, "description": "[SIMULATED] Unfinalised estimate"},
    "cinema": {"ref": "demo:cinema-sales-2026", "date": "2026-11-01", "product": "Our Cinema", "provider": "Google Play", "kind": "income", "pence": 19000, "description": "[SIMULATED] App sales"},
    "fees": {"ref": "demo:cinema-fees-2026", "date": "2026-11-01", "product": "Our Cinema", "provider": "Google Play", "kind": "fee", "pence": 2850, "description": "[SIMULATED] Store fees"},
    "refund": {"ref": "demo:cinema-refund-2026", "date": "2026-11-02", "product": "Our Cinema", "provider": "Google Play", "kind": "refund", "pence": 1900, "description": "[SIMULATED] Sale refund"},
    "hosting": {"ref": "demo:hosting-2026", "date": "2026-11-01", "product": "BDS shared", "provider": "Hosting", "kind": "expense", "pence": 1200, "description": "[SIMULATED] Hosting"},
    "payout": {"ref": "demo:payout-2026", "date": "2026-11-03", "product": "Our Cinema", "provider": "Google Play", "kind": "payout", "pence": 17500, "description": "[SIMULATED] Bank transfer (not revenue)"},
    "previous-year": {"ref": "demo:prevyear-2026", "date": "2026-04-05", "product": "Disclosure Desk", "provider": "Ko-fi", "kind": "income", "pence": 1500, "description": "[SIMULATED] Previous tax year"},
    "new-year": {"ref": "demo:newyear-2026", "date": "2026-04-06", "product": "Disclosure Desk", "provider": "Ko-fi", "kind": "income", "pence": 1200, "description": "[SIMULATED] New tax year"},
}


class VaultError(Exception):
    """Expected validation/auth/storage failure, safe for terminal display."""


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _unb64(value: object, n: int | None = None) -> bytes:
    if not isinstance(value, str):
        raise VaultError("Invalid encrypted vault format")
    try:
        data = base64.b64decode(value.encode("ascii"), validate=True)
    except (UnicodeError, ValueError) as exc:
        raise VaultError("Invalid encrypted vault encoding") from exc
    if n is not None and len(data) != n:
        raise VaultError("Invalid encrypted vault header")
    return data


def uk_tax_year(when: str) -> str:
    if not isinstance(when, str) or not YEAR_RE.fullmatch(when):
        raise VaultError("Invalid ISO date")
    try:
        date = dt.date.fromisoformat(when)
    except ValueError as exc:
        raise VaultError("Invalid calendar date") from exc
    start = date.year if (date.month, date.day) >= (4, 6) else date.year - 1
    return f"{start}/{(start + 1) % 100:02d}"


def _entry(entry: object) -> dict:
    if not isinstance(entry, dict) or set(entry) != {"ref", "date", "product", "provider", "kind", "pence", "description"}:
        raise VaultError("Unexpected synthetic ledger fields")
    if any(not isinstance(entry[key], str) for key in ("ref", "date", "product", "provider", "kind", "description")):
        raise VaultError("Invalid synthetic entry")
    if not entry["ref"].startswith("demo:") or len(entry["ref"]) > 120:
        raise VaultError("Only sample references are accepted")
    if not entry["description"].startswith("[SIMULATED]") or len(entry["description"]) > 160:
        raise VaultError("Only fictional descriptions are accepted")
    if entry["product"] not in PRODUCTS or entry["provider"] not in PROVIDERS or entry["kind"] not in KINDS:
        raise VaultError("Unknown synthetic ledger category")
    if type(entry["pence"]) is not int or not 1 <= entry["pence"] <= 999999900:
        raise VaultError("Invalid sample amount")
    uk_tax_year(entry["date"])
    return dict(entry)


def _validate_payload(value: object) -> dict:
    if not isinstance(value, dict) or set(value) != {"mode", "version", "entries"}:
        raise VaultError("Unexpected vault payload fields")
    if value["mode"] != DEMO_MODE or value["version"] != FORMAT_VERSION:
        raise VaultError("Only synthetic L1 records are allowed")
    if not isinstance(value["entries"], list) or len(value["entries"]) > 100:
        raise VaultError("Invalid demo ledger size")
    cleaned = [_entry(row) for row in value["entries"]]
    seen = set()
    for row in cleaned:
        key = (row["provider"], row["kind"], row["ref"])
        if key in seen:
            raise VaultError("Duplicate synthetic ledger identity")
        seen.add(key)
    return {"mode": DEMO_MODE, "version": FORMAT_VERSION, "entries": cleaned}


def _new_payload() -> dict:
    return {"mode": DEMO_MODE, "version": FORMAT_VERSION, "entries": []}


def _key(passphrase: str, salt: bytes) -> bytes:
    if not isinstance(passphrase, str) or len(passphrase) < 14 or len(passphrase) > 200:
        raise VaultError("Passphrase must be between 14 and 200 characters")
    if "\x00" in passphrase:
        raise VaultError("Passphrase contains an invalid character")
    return Scrypt(salt=salt, length=32, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P).derive(passphrase.encode("utf-8"))


def seal(value: dict, passphrase: str) -> bytes:
    clean = _validate_payload(value)
    salt, nonce = os.urandom(SALT_SIZE), os.urandom(NONCE_SIZE)
    plain = json.dumps(clean, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    if len(plain) > MAX_FILE // 2:
        raise VaultError("Demo data too large")
    cipher = AESGCM(_key(passphrase, salt)).encrypt(nonce, plain, AAD)
    blob = {"magic": FORMAT_MAGIC, "version": FORMAT_VERSION, "salt": _b64(salt), "nonce": _b64(nonce), "ciphertext": _b64(cipher)}
    result = json.dumps(blob, separators=(",", ":"), sort_keys=True).encode("ascii")
    if len(result) > MAX_FILE:
        raise VaultError("Encrypted demo data too large")
    return result


def unseal(data: bytes, passphrase: str) -> dict:
    if not 0 < len(data) <= MAX_FILE:
        raise VaultError("Encrypted vault size invalid")
    try:
        envelope = json.loads(data)
    except (UnicodeError, ValueError) as exc:
        raise VaultError("Invalid encrypted vault JSON") from exc
    if not isinstance(envelope, dict) or set(envelope) != {"magic", "version", "salt", "nonce", "ciphertext"}:
        raise VaultError("Invalid encrypted vault structure")
    if envelope["magic"] != FORMAT_MAGIC or type(envelope["version"]) is not int or envelope["version"] != FORMAT_VERSION:
        raise VaultError("Unsupported vault format")
    salt, nonce = _unb64(envelope["salt"], SALT_SIZE), _unb64(envelope["nonce"], NONCE_SIZE)
    ciphertext = _unb64(envelope["ciphertext"])
    try:
        decoded = AESGCM(_key(passphrase, salt)).decrypt(nonce, ciphertext, AAD)
    except (InvalidTag, ValueError) as exc:
        raise VaultError("Incorrect passphrase or encrypted vault corrupted") from exc
    try:
        payload = json.loads(decoded)
    except (UnicodeError, ValueError) as exc:
        raise VaultError("Vault payload corrupted") from exc
    return _validate_payload(payload)


def _secure_root(root: Path, create: bool) -> Path:
    root = Path(root).expanduser()
    # The CLI uses a FIXED app-private path under Path.home(); never accepts arbitrary --dir.
    if root.is_symlink():
        raise VaultError("Vault directory may not be a symbolic link")
    if create:
        root.mkdir(mode=0o700, parents=False, exist_ok=True)
    if not root.is_dir() or root.is_symlink():
        raise VaultError("Vault directory unavailable")
    st = root.stat(follow_symlinks=False)
    if st.st_mode & 0o077:
        raise VaultError("Vault directory permissions must be private (chmod 700)")
    return root


@contextlib.contextmanager
def _lock(root: Path):
    lockfile = root / ".vault.lock"
    flags = os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW
    fd = os.open(lockfile, flags, 0o600)
    try:
        if os.fstat(fd).st_mode & 0o077:
            raise VaultError("Lock file has unsafe permissions")
        fcntl.flock(fd, fcntl.LOCK_EX)
        yield
    finally:
        fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)


def _read_file(path: Path, *, protected: bool) -> bytes:
    try:
        st = path.lstat()
    except FileNotFoundError as exc:
        raise VaultError("Encrypted vault/backup not found") from exc
    if not stat.S_ISREG(st.st_mode) or st.st_size < 10 or st.st_size > MAX_FILE:
        raise VaultError("Not a valid encrypted file")
    if protected and st.st_mode & 0o077:
        raise VaultError("Vault file permissions must be private (chmod 600)")
    with path.open("rb") as f:
        data = f.read(MAX_FILE + 1)
    if len(data) > MAX_FILE:
        raise VaultError("Encrypted file too large")
    return data


def _atomic_write(path: Path, blob: bytes, *, replace: bool):
    if len(blob) > MAX_FILE:
        raise VaultError("Encrypted data too large")
    if path.is_symlink():
        raise VaultError("Refusing to write through a symbolic link")
    if not replace and path.exists():
        raise VaultError("Destination already exists; refusing overwrite")
    if replace and path.exists() and not stat.S_ISREG(path.lstat().st_mode):
        raise VaultError("Vault target not a regular file")
    tmp = path.with_name("." + path.name + "." + secrets.token_hex(8) + ".tmp")
    fd = None
    reserved_identity = None
    try:
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, "wb") as stream:
            fd = None
            stream.write(blob)
            stream.flush()
            os.fsync(stream.fileno())
        if not replace:
            # Android/Termux Python may not expose os.link(). Reserve the destination
            # exclusively *after* the encrypted temp file is durable. Only our
            # app-private locked writer may replace that empty reservation.
            # O_EXCL protects against overwriting an existing vault or backup.
            reserve_fd = os.open(
                path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600
            )
            try:
                reserved = os.fstat(reserve_fd)
                reserved_identity = (reserved.st_dev, reserved.st_ino)
            finally:
                os.close(reserve_fd)
        os.replace(tmp, path)
        reserved_identity = None
        try:
            directory_fd = os.open(str(path.parent), os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
        except OSError:
            # Some Android file providers cannot fsync directories; ciphertext was fsynced.
            pass
    except FileExistsError as exc:
        raise VaultError("Destination already exists; refusing overwrite") from exc
    finally:
        if fd is not None:
            os.close(fd)
        # If committing a fresh vault fails, remove ONLY the exact empty file
        # that this call reserved. Never remove a pre-existing user file.
        if reserved_identity is not None:
            try:
                current = path.lstat()
                if (stat.S_ISREG(current.st_mode) and current.st_size == 0
                        and (current.st_dev, current.st_ino) == reserved_identity):
                    path.unlink()
            except FileNotFoundError:
                pass
        tmp.unlink(missing_ok=True)


def init(root: Path, passphrase: str):
    _key(passphrase, b"0" * SALT_SIZE)  # validate passphrase before any writing
    root = _secure_root(root, create=True)
    with _lock(root):
        _atomic_write(root / VAULT_NAME, seal(_new_payload(), passphrase), replace=False)


def load(root: Path, passphrase: str) -> dict:
    root = _secure_root(root, create=False)
    with _lock(root):
        return unseal(_read_file(root / VAULT_NAME, protected=True), passphrase)


def add_preset(root: Path, passphrase: str, preset: str) -> bool:
    if preset not in DEMO_PRESETS:
        raise VaultError("Unknown fictional preset")
    root = _secure_root(root, create=False)
    with _lock(root):
        vault_path = root / VAULT_NAME
        data = unseal(_read_file(vault_path, protected=True), passphrase)
        item = _entry(DEMO_PRESETS[preset])
        identity = (item["provider"], item["kind"], item["ref"])
        for existing in data["entries"]:
            if (existing["provider"], existing["kind"], existing["ref"]) == identity:
                if existing != item:
                    raise VaultError("Conflicting synthetic transaction identity")
                return False
        data["entries"].append(item)
        _atomic_write(vault_path, seal(data, passphrase), replace=True)
        return True


def fill_demo(root: Path, passphrase: str) -> int:
    """Add all fixed fictional examples with one unlock; never import real records."""
    root = _secure_root(root, create=False)
    with _lock(root):
        path = root / VAULT_NAME
        data = unseal(_read_file(path, protected=True), passphrase)
        existing = {(e["provider"], e["kind"], e["ref"]): e for e in data["entries"]}
        added = 0
        for sample in DEMO_PRESETS.values():
            entry = _entry(sample)
            ident = (entry["provider"], entry["kind"], entry["ref"])
            previous = existing.get(ident)
            if previous is None:
                data["entries"].append(entry)
                existing[ident] = entry
                added += 1
            elif previous != entry:
                raise VaultError("Conflicting fictional transaction reference")
        if added:
            _atomic_write(path, seal(data, passphrase), replace=True)
        return added


def demo_summary(data: dict, year: str | None = None) -> dict:
    value = _validate_payload(data)
    amounts = {kind: 0 for kind in KINDS}
    count = 0
    for entry in value["entries"]:
        if year and uk_tax_year(entry["date"]) != year:
            continue
        amounts[entry["kind"]] += entry["pence"]
        count += 1
    amounts["profit"] = amounts["income"] - amounts["fee"] - amounts["refund"] - amounts["expense"]
    amounts["count"] = count
    return amounts


def _new_backup_file(destination: Path, blob: bytes):
    """Write portable ciphertext to an exclusive path, including Android shared storage.

    Shared storage may not support rename/link/fsync-dir semantics. This is NOT the
    atomic writer for the primary vault; a failed backup is removed and rejected.
    """
    if destination.is_symlink() or destination.exists():
        raise VaultError("Backup destination already exists; refusing overwrite")
    fd = None
    created = False
    try:
        fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        created = True
        with os.fdopen(fd, "wb") as stream:
            fd = None
            stream.write(blob)
            stream.flush()
            os.fsync(stream.fileno())
        # A backup is usable only when the bytes can be read back in full.
        if _read_file(destination, protected=False) != blob:
            raise VaultError("Backup verification failed")
    except Exception:
        if created:
            destination.unlink(missing_ok=True)
        raise
    finally:
        if fd is not None:
            os.close(fd)


def backup(root: Path, passphrase: str, destination: Path):
    root = _secure_root(root, create=False)
    destination = Path(destination).expanduser()
    if not destination.parent.is_dir():
        raise VaultError("Backup destination parent missing")
    if destination.parent == root or destination == root / VAULT_NAME:
        raise VaultError("Backup must be outside the vault directory")
    with _lock(root):
        blob = _read_file(root / VAULT_NAME, protected=True)
        unseal(blob, passphrase)  # Verify AES tag before copying ciphertext.
        _new_backup_file(destination, blob)


def restore(destination_root: Path, backup_path: Path, passphrase: str):
    backup_path = Path(backup_path).expanduser()
    blob = _read_file(backup_path, protected=False)
    unseal(blob, passphrase)  # Wrong password/corruption cannot create a 'restored' vault.
    destination_root = Path(destination_root).expanduser()
    if destination_root.exists() and any(destination_root.iterdir()):
        raise VaultError("Restore target not empty; existing data will not be overwritten")
    root = _secure_root(destination_root, create=True)
    with _lock(root):
        if (root / VAULT_NAME).exists():
            raise VaultError("Existing encrypted vault will not be overwritten")
        _atomic_write(root / VAULT_NAME, blob, replace=False)


def _ask_passphrase(confirm: bool = False) -> str:
    secret = getpass.getpass("Vault passphrase (hidden): ")
    if confirm:
        second = getpass.getpass("Confirm passphrase: ")
        if secret != second:
            raise VaultError("Passphrases did not match")
    return secret


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="BDS Finance L1 — fictional encrypted offline vault ONLY; no real records")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init", help="Create sample-only encrypted vault in private Termux HOME")
    sub.add_parser("status", help="Unlock briefly and show fictional record count")
    sub.add_parser("demo-fill", help="Load all fixed fictional transactions in one step")
    demo = sub.add_parser("demo-add", help="Insert one predefined fictional event, safely idempotent")
    demo.add_argument("preset", choices=sorted(DEMO_PRESETS))
    summary = sub.add_parser("summary", help="Show fictional totals, no tax calculation")
    summary.add_argument("--year", help="UK tax year, e.g. 2026/27")
    bk = sub.add_parser("backup", help="Export ciphertext only, refusing overwrite")
    bk.add_argument("destination", type=Path, help="Absolute output path, e.g. USB drive (encrypted)")
    vb = sub.add_parser("verify-backup", help="Check an encrypted backup without restoring it")
    vb.add_argument("source", type=Path, help="Previously exported encrypted backup")
    rr = sub.add_parser("restore", help="Restore encrypted backup into empty private HOME")
    rr.add_argument("source", type=Path, help="Previously exported encrypted backup")
    args = parser.parse_args(argv)
    root = Path.home() / ".bds-finance"
    try:
        if args.command == "init":
            init(root, _ask_passphrase(confirm=True))
            print("Created a synthetic-only encrypted vault in Termux-private HOME; no real data accepted.")
        elif args.command == "status":
            data = load(root, _ask_passphrase())
            print(f"Vault unlocked and closed after command. SIMULATED entries: {len(data['entries'])}")
        elif args.command == "demo-fill":
            n = fill_demo(root, _ask_passphrase())
            print(f"Added {n} predefined fictional records (duplicates skipped).")
        elif args.command == "demo-add":
            added = add_preset(root, _ask_passphrase(), args.preset)
            print("Fictional entry added." if added else "Identical fictional reference already present; no duplicate added.")
        elif args.command == "summary":
            if args.year and not re.fullmatch(r"20\d\d/\d\d", args.year):
                raise VaultError("Year must be YYYY/YY")
            results = demo_summary(load(root, _ask_passphrase()), args.year)
            print(f"SIMULATED records: {results['count']} | income £{results['income']/100:.2f} | "
                  f"refunds £{results['refund']/100:.2f} | fees £{results['fee']/100:.2f} | "
                  f"expenses £{results['expense']/100:.2f} | fictional profit £{results['profit']/100:.2f}")
            print("Estimates and bank payouts are not counted as income; no tax amount calculated.")
        elif args.command == "backup":
            backup(root, _ask_passphrase(), args.destination)
            print("Verified encrypted backup exported; NOT plaintext. Keep a tested second copy.")
        elif args.command == "verify-backup":
            unsealed = unseal(_read_file(args.source.expanduser(), protected=False), _ask_passphrase())
            print(f"Encrypted backup verified. Fictional entries: {len(unsealed['entries'])}. No restore performed.")
        elif args.command == "restore":
            restore(root, args.source, _ask_passphrase())
            print("Encrypted backup restored into private Termux HOME. No previous vault overwritten.")
        return 0
    except (VaultError, OSError) as exc:
        print(f"BDS L1 error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
