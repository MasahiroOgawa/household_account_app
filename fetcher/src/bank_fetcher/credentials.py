"""Login secrets live only in the OS keyring (Secret Service), one JSON entry per target."""

from __future__ import annotations

import getpass
import json
import sys

import keyring

from . import config as config_mod
from .config import Target

SERVICE = "bank-fetcher"
# keyring silently picks whatever backend is installed; only an encrypted system store is acceptable.
ALLOWED_BACKENDS = ("keyring.backends.SecretService", "keyring.backends.libsecret", "keyring.backends.kwallet")


def _secure_backend() -> None:
    backends = getattr(keyring.get_keyring(), "backends", [keyring.get_keyring()])
    modules = [type(b).__module__ for b in backends]
    if not modules or not all(m.startswith(ALLOWED_BACKENDS) for m in modules):
        sys.exit(f"refusing to use keyring backend(s) {modules}: not an encrypted system keyring")


def get(target: Target) -> dict[str, str]:
    _secure_backend()
    stored = keyring.get_password(SERVICE, target.name)
    return json.loads(stored) if stored else {}


def prompt_and_store(target: Target) -> None:
    fields = target.institution.fields
    if not fields:
        print(f"[{target.name}] {target.institution}: logs in by hand in the browser, nothing to store")
        return
    current = get(target)
    print(f"[{target.name}] {target.institution} — Enter keeps the stored value")
    values = {}
    for f in fields:
        ask = getpass.getpass if f.secret else input
        shown = "" if f.secret or not current.get(f.key) else f" [{current[f.key]}]"
        values[f.key] = ask(f"  {f.prompt}{shown}: ").strip() or current.get(f.key, "")
    keyring.set_password(SERVICE, target.name, json.dumps(values))
    print(f"  stored in keyring as {SERVICE}/{target.name}")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: bank-fetcher-credentials <config.toml>")
    for target in config_mod.load(sys.argv[1]).targets:
        prompt_and_store(target)
