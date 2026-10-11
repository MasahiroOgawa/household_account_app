"""Filing downloaded statements into data/<year>/transaction and recording what each file covers."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from collections.abc import Callable
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

from .config import Target

MIN_DATA_CELLS = 3
MONTH_IN_NAME = re.compile(r"(20\d{2})(0[1-9]|1[0-2])")


def _decode(line: bytes) -> str:
    for encoding in ("utf-8-sig", "cp932"):
        try:
            return line.decode(encoding)
        except UnicodeDecodeError:
            continue
    return line.decode("cp932", errors="replace")


@dataclass(frozen=True)
class Trimmed:
    content: bytes
    kept: int
    dropped: int
    first: date | None
    last: date | None


def trim(content: bytes, since: date, until: date, row_date: Callable[[list[str]], date | None]) -> Trimmed:
    """Keep header/preamble lines and the data rows dated within [since, until].

    Works line by line on the raw bytes so the bank's encoding, quoting and line endings survive untouched.
    """
    kept_lines, dates, dropped = [], [], 0
    for line in content.splitlines(keepends=True):
        cells = next(csv.reader([_decode(line).strip("\r\n")]), [])
        d = row_date(cells) if len(cells) >= MIN_DATA_CELLS else None
        if d is None:
            kept_lines.append(line)
        elif since <= d <= until:
            kept_lines.append(line)
            dates.append(d)
        else:
            dropped += 1
    return Trimmed(b"".join(kept_lines), len(dates), dropped, min(dates, default=None), max(dates, default=None))


@dataclass
class Entry:
    target: str
    institution: str
    account: str | None
    file: str | None
    raw: str
    covered_from: str | None
    covered_through: str | None
    rows: int | None
    sha256: str
    fetched_at: str
    via: str


class Manifest:
    def __init__(self, path: Path):
        self.path = path
        self.entries = [Entry(**e) for e in json.loads(path.read_text())["entries"]] if path.exists() else []

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps({"entries": [asdict(e) for e in self.entries]}, ensure_ascii=False, indent=1))

    def _covered(self, target: Target, account: str | None) -> list[str]:
        return [
            e.covered_through
            for e in self.entries
            if e.target == target.name and e.covered_through and (account is None or e.account in (account, None))
        ]

    def next_since(self, target: Target, account: str | None) -> date:
        covered = self._covered(target, account)
        return date.fromisoformat(max(covered)) + timedelta(days=1) if covered else target.since

    def next_month(self, target: Target) -> date:
        """The latest month already filed is fetched again: its statement may still have been provisional."""
        covered = self._covered(target, None)
        return date.fromisoformat(max(covered)) if covered else target.since.replace(day=1)

    def has_sha(self, sha: str) -> bool:
        return any(e.sha256 == sha for e in self.entries)


def _account_for(target: Target, filename: str) -> str | None:
    if len(target.accounts) == 1:
        return target.accounts[0]
    pattern = target.institution.account_in_filename
    m = re.search(pattern, filename) if pattern else None
    return m.group(1) if m and m.group(1) in target.accounts else None


def _free_name(dest: Path, stamp: str) -> Path:
    return dest if not dest.exists() else dest.with_name(f"{dest.stem}_{stamp}{dest.suffix}")


def ingest(
    content: bytes, filename: str, target: Target, data_root: Path, raw_dir: Path, manifest: Manifest, via: str, now: datetime
) -> Entry | None:
    """Archive the raw download, then file only what the manifest does not already cover. Returns None for a repeat download."""
    sha = hashlib.sha256(content).hexdigest()
    if manifest.has_sha(sha):
        print(f"  {filename}: identical to an earlier download, skipped")
        return None
    stamp = now.strftime("%Y%m%d%H%M%S")
    raw_path = raw_dir / target.name / f"{stamp}_{filename}"
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    raw_path.write_bytes(content)

    account = _account_for(target, filename)
    inst = target.institution
    if inst.period == "monthly":
        m = MONTH_IN_NAME.search(filename)
        month = date(int(m.group(1)), int(m.group(2)), 1) if m else now.date().replace(day=1)
        dest = data_root / str(month.year) / "transaction" / filename
        if dest.exists() and dest.read_bytes() != content:
            print(f"  {filename}: replacing the earlier (provisional) copy")
        out, covered_from, covered_through, rows = content, month, month, None
    else:
        since, until = manifest.next_since(target, account), now.date() - timedelta(days=1)
        t = trim(content, since, until, inst.row_date)
        print(f"  {filename}: {t.kept} new rows {since}..{until} kept, {t.dropped} outside dropped")
        dest = _free_name(data_root / str(t.last.year) / "transaction" / filename, stamp) if t.kept else None
        out, covered_from, covered_through, rows = t.content, t.first, t.last, t.kept

    if dest is not None:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(out)
        print(f"  -> {dest.relative_to(data_root)}")
    entry = Entry(
        target=target.name,
        institution=inst.name,
        account=account,
        file=str(dest.relative_to(data_root)) if dest else None,
        raw=str(raw_path.relative_to(data_root)),
        covered_from=covered_from.isoformat() if covered_from else None,
        covered_through=covered_through.isoformat() if covered_through else None,
        rows=rows,
        sha256=sha,
        fetched_at=now.isoformat(timespec="seconds"),
        via=via,
    )
    manifest.entries.append(entry)
    manifest.save()
    return entry
