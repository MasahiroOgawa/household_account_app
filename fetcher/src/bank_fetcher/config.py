from __future__ import annotations

import tomllib
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .institutions import Institution, resolve


@dataclass(frozen=True)
class Target:
    """One login: its credentials, browser profile, recipe and manifest records are keyed by `name`."""

    name: str
    institution: Institution
    accounts: tuple[str, ...]
    # First date (or, for monthly institutions, first billing month) to fetch when the manifest has no record.
    since: date


@dataclass(frozen=True)
class Config:
    data_root: Path
    profile_root: Path
    auth_timeout_sec: int
    manual_timeout_sec: int
    targets: tuple[Target, ...]

    @property
    def manifest_path(self) -> Path:
        return self.data_root / "fetch_manifest.json"

    @property
    def recipe_dir(self) -> Path:
        return self.data_root / "fetch_recipes"

    @property
    def raw_dir(self) -> Path:
        return self.data_root / "raw"


def _path(base: Path, value: str) -> Path:
    p = Path(value).expanduser()
    return p if p.is_absolute() else (base / p).resolve()


def load(path: str | Path) -> Config:
    path = Path(path).resolve()
    raw = tomllib.loads(path.read_text(encoding="utf-8"))
    fetch = raw.get("fetch", {})
    targets = tuple(
        Target(
            name=t["name"],
            institution=resolve(t["institution"]),
            accounts=tuple(str(a) for a in t.get("accounts", ())),
            since=date.fromisoformat(str(t["since"])),
        )
        for t in raw.get("target", ())
        if t.get("enabled", True)
    )
    if not targets:
        raise ValueError(f"{path}: no enabled [[target]] entries")
    names = [t.name for t in targets]
    if len(set(names)) != len(names):
        raise ValueError(f"{path}: target names must be unique, got {names}")
    return Config(
        data_root=_path(path.parent, fetch.get("data_root", ".")),
        profile_root=_path(path.parent, fetch.get("profile_root", "~/.local/share/bank-fetcher/profiles")),
        auth_timeout_sec=int(fetch.get("auth_timeout_sec", 300)),
        manual_timeout_sec=int(fetch.get("manual_timeout_sec", 900)),
        targets=targets,
    )
