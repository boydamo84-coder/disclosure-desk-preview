"""Run using `python -m unittest discover -s finance_local/tests -v`."""
import base64
import datetime
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

from finance_local import vault

PASS = "this is a long sample vault passphrase"
WRONG = "an entirely different wrong secret"


class EncryptedVaultTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name) / "private"
        self.dest = Path(self.folder.name) / "backup-encrypted.bds"

    def create(self):
        vault.init(self.root, PASS)
        return self.root / vault.VAULT_NAME

    def test_private_permissions_and_ciphertext_only(self):
        path = self.create()
        self.assertEqual(stat.S_IMODE(self.root.stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
        original = path.read_bytes()
        self.assertNotIn(b"entries", original)
        self.assertNotIn(b"SIMULATED", original)
        self.assertNotIn(b"our cinema", original.lower())
        self.assertIn(b"BDS-FINANCE-SYNTHETIC-L1", original)
        self.assertEqual(vault.load(self.root, PASS)["entries"], [])
        self.assertNotEqual(vault.seal(vault._new_payload(), PASS), vault.seal(vault._new_payload(), PASS))

    def test_wrong_password_and_tampered_ciphertext(self):
        path = self.create()
        with self.assertRaisesRegex(vault.VaultError, "Incorrect passphrase"):
            vault.load(self.root, WRONG)
        body = json.loads(path.read_text())
        encrypted = bytearray(base64.b64decode(body["ciphertext"]))
        encrypted[0] ^= 1
        body["ciphertext"] = base64.b64encode(encrypted).decode()
        path.write_text(json.dumps(body))
        with self.assertRaisesRegex(vault.VaultError, "corrupted"):
            vault.load(self.root, PASS)

    def test_weak_password_and_new_init_never_overwrites(self):
        with self.assertRaisesRegex(vault.VaultError, "14"):
            vault.init(self.root, "too-short")
        self.assertFalse(self.root.exists())
        path = self.create()
        old = path.read_bytes()
        with self.assertRaisesRegex(vault.VaultError, "already exists"):
            vault.init(self.root, PASS)
        self.assertEqual(path.read_bytes(), old)

    def test_sample_preset_deduplication_and_totals(self):
        self.create()
        for name in vault.DEMO_PRESETS:
            self.assertTrue(vault.add_preset(self.root, PASS, name))
        self.assertFalse(vault.add_preset(self.root, PASS, "coffee"))
        current = vault.demo_summary(vault.load(self.root, PASS), "2026/27")
        self.assertEqual(current["income"], 33700)
        self.assertEqual(current["refund"], 1900)
        self.assertEqual(current["fee"], 2850)
        self.assertEqual(current["expense"], 1200)
        self.assertEqual(current["profit"], 27750)
        self.assertEqual(current["estimate"], 12000)
        self.assertEqual(current["payout"], 17500)
        self.assertEqual(current["count"], 9)
        self.assertEqual(vault.demo_summary(vault.load(self.root, PASS), "2025/26")["profit"], 1500)

    def test_fill_all_fictional_records_and_skip_duplicate(self):
        self.create()
        self.assertEqual(vault.fill_demo(self.root, PASS), 10)
        before = (self.root / vault.VAULT_NAME).read_bytes()
        self.assertEqual(vault.fill_demo(self.root, PASS), 0)
        self.assertEqual((self.root / vault.VAULT_NAME).read_bytes(), before)
        self.assertEqual(vault.demo_summary(vault.load(self.root, PASS), "2026/27")["profit"], 27750)

    def test_backup_verifies_without_overwrite(self):
        self.create()
        vault.fill_demo(self.root, PASS)
        vault.backup(self.root, PASS, self.dest)
        self.assertEqual(len(vault.unseal(self.dest.read_bytes(), PASS)["entries"]), 10)
        with self.assertRaises(vault.VaultError):
            vault.unseal(self.dest.read_bytes(), WRONG)

    def test_tax_year_boundary_and_invalid_dates(self):
        self.assertEqual(vault.uk_tax_year("2026-04-05"), "2025/26")
        self.assertEqual(vault.uk_tax_year("2026-04-06"), "2026/27")
        self.assertEqual(vault.uk_tax_year("2027-04-05"), "2026/27")
        self.assertEqual(vault.uk_tax_year("2027-04-06"), "2027/28")
        for bad in ("2026-02-30", "2026-04-31", "2026-4-05", "../../bad"):
            with self.assertRaises(vault.VaultError):
                vault.uk_tax_year(bad)

    def test_export_encrypted_backup_restore_new_home(self):
        self.create()
        vault.add_preset(self.root, PASS, "cinema")
        vault.backup(self.root, PASS, self.dest)
        self.assertTrue(self.dest.exists())
        raw = self.dest.read_bytes()
        self.assertNotIn(b"[SIMULATED]", raw)
        self.assertNotIn(b"App sales", raw)
        self.assertEqual(raw, (self.root / vault.VAULT_NAME).read_bytes())
        new_root = Path(self.folder.name) / "restored"
        vault.restore(new_root, self.dest, PASS)
        self.assertEqual(vault.load(new_root, PASS), vault.load(self.root, PASS))
        self.assertEqual(stat.S_IMODE((new_root / vault.VAULT_NAME).stat().st_mode), 0o600)
        self.assertEqual(stat.S_IMODE(new_root.stat().st_mode), 0o700)
        with self.assertRaisesRegex(vault.VaultError, "not empty"):
            vault.restore(new_root, self.dest, PASS)

    def test_corrupt_backup_or_wrong_password_makes_no_recovered_vault(self):
        self.create()
        vault.backup(self.root, PASS, self.dest)
        target = Path(self.folder.name) / "new-vault"
        with self.assertRaises(vault.VaultError):
            vault.restore(target, self.dest, WRONG)
        self.assertFalse(target.exists())
        raw = bytearray(self.dest.read_bytes())
        raw[-8] ^= 1
        self.dest.write_bytes(raw)
        with self.assertRaises(vault.VaultError):
            vault.restore(target, self.dest, PASS)
        self.assertFalse(target.exists())

    def test_no_overwrite_existing_backup_and_failed_restore(self):
        path = self.create()
        self.dest.write_text("existing important file", encoding="utf-8")
        with self.assertRaisesRegex(vault.VaultError, "already exists"):
            vault.backup(self.root, PASS, self.dest)
        self.assertEqual(self.dest.read_text(), "existing important file")
        self.dest.unlink()
        vault.backup(self.root, PASS, self.dest)
        with self.assertRaisesRegex(vault.VaultError, "not empty"):
            vault.restore(self.root, self.dest, PASS)
        self.assertEqual(path.read_bytes(), self.dest.read_bytes())

    def test_reject_unsafe_permissions_symlink_and_bad_format(self):
        path = self.create()
        os.chmod(self.root, 0o755)
        with self.assertRaisesRegex(vault.VaultError, "permissions"):
            vault.load(self.root, PASS)
        os.chmod(self.root, 0o700)
        os.chmod(path, 0o644)
        with self.assertRaisesRegex(vault.VaultError, "permissions"):
            vault.load(self.root, PASS)
        os.chmod(path, 0o600)
        link = Path(self.folder.name) / "fake-root"
        link.symlink_to(self.root, target_is_directory=True)
        with self.assertRaisesRegex(vault.VaultError, "symbolic link"):
            vault.load(link, PASS)
        b = json.loads(path.read_bytes())
        b["version"] = 999
        path.write_text(json.dumps(b))
        with self.assertRaisesRegex(vault.VaultError, "Unsupported vault format"):
            vault.load(self.root, PASS)

    def test_atomic_write_failure_preserves_last_good_vault(self):
        path = self.create()
        vault.add_preset(self.root, PASS, "coffee")
        before = path.read_bytes()
        with mock.patch.object(vault.os, "replace", side_effect=OSError("simulated power loss before rename")):
            with self.assertRaisesRegex(OSError, "power loss"):
                vault.add_preset(self.root, PASS, "ads")
        self.assertEqual(path.read_bytes(), before)
        self.assertEqual(len(vault.load(self.root, PASS)["entries"]), 1)
        self.assertEqual(list(self.root.glob("*.tmp")), [])

    def test_invalid_demo_entry_and_duplicate_identity(self):
        self.create()
        data = vault._new_payload()
        entry = dict(vault.DEMO_PRESETS["coffee"])
        entry["description"] = "A REAL PERSON'S NAME"
        data["entries"] = [entry]
        with self.assertRaisesRegex(vault.VaultError, "fictional"):
            vault.seal(data, PASS)
        entry = dict(vault.DEMO_PRESETS["coffee"])
        data["entries"] = [entry, dict(entry)]
        with self.assertRaisesRegex(vault.VaultError, "Duplicate"):
            vault.seal(data, PASS)

    def test_terminal_errors_do_not_print_passphrases(self):
        # Exercises actual command against isolated HOME, no real user's Termux data.
        with mock.patch.object(vault, "_ask_passphrase", return_value=PASS):
            from io import StringIO
            with mock.patch("sys.stdout", new_callable=StringIO) as output:
                with mock.patch("pathlib.Path.home", return_value=Path(self.folder.name)):
                    self.assertEqual(vault.main(["init"]), 0)
                    self.assertEqual(vault.main(["status"]), 0)
            self.assertNotIn(PASS, output.getvalue())
            self.assertIn("SIMULATED", output.getvalue())


if __name__ == "__main__":
    unittest.main()
