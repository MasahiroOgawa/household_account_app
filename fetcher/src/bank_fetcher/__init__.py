"""Fetch statement CSVs from each configured bank/card site into data/<year>/transaction.

Usage: bank-fetcher <config.toml>
"""

from __future__ import annotations

import sys
from datetime import date, datetime, timedelta

from playwright.sync_api import Error, sync_playwright

from . import config as config_mod
from . import credentials, recipe, session, store
from .config import Config, Target


def _period(target: Target, manifest: store.Manifest, today: date) -> tuple[date, date, str]:
    until = today - timedelta(days=1)
    if target.institution.period == "monthly":
        since = manifest.next_month(target)
        return since, until, f"every monthly statement from {since:%Y-%m} through the newest available (CSV)"
    accounts = target.accounts or (None,)
    since = min(manifest.next_since(target, a) for a in accounts)
    which = f"accounts {', '.join(target.accounts)}" if len(target.accounts) > 1 else "the account"
    return since, until, f"the transaction history (入出金明細) CSV of {which} covering {since} .. {until}"


def fetch_target(pw, cfg: Config, target: Target, manifest: store.Manifest) -> int:
    print(f"\n=== {target.name}: {target.institution}")
    today = date.today()
    since, until, wanted = _period(target, manifest, today)
    if since > until:
        print("  already up to date")
        return 0
    recipe_path = cfg.recipe_dir / f"{target.name}.json"
    steps = recipe.load(recipe_path)
    context = session.open_context(pw, cfg.profile_root / target.name)
    try:
        recorder = recipe.Recorder(context)
        session.login(context, target, credentials.get(target), cfg.auth_timeout_sec)

        downloads, via = [], "recipe"
        if steps:
            print(f"  replaying {recipe_path.name} ({len(steps)} steps)")
            try:
                downloads = [d for d in map(session.read, recipe.replay(context, steps, since, until)) if d]
            except (Error, LookupError, PermissionError) as e:
                print(f"  recipe failed: {e}\n  switching to assisted mode; your clicks will be recorded as the new recipe")
        if not downloads:
            via = "manual"
            recorder.active = True
            downloads = session.collect_manually(
                context, f"  >>> In the browser, download {wanted}.", cfg.manual_timeout_sec, recorder.mark_download
            )
            learned = recorder.recipe(since, until)
            if downloads and learned:
                recipe.save(recipe_path, learned)
                print(f"  recipe saved ({len(learned)} steps): next run downloads automatically")

        now = datetime.now()
        filed = [store.ingest(d.content, d.filename, target, cfg.data_root, cfg.raw_dir, manifest, via, now) for d in downloads]
        session.logout(context, target)
        return sum(1 for e in filed if e and e.file)
    finally:
        try:
            context.close()
        except Error:
            pass


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: bank-fetcher <config.toml>")
    cfg = config_mod.load(sys.argv[1])
    manifest = store.Manifest(cfg.manifest_path)
    print(f"data root: {cfg.data_root}")
    print(f"targets: {', '.join(f'{t.name}={t.institution.name}' for t in cfg.targets)}")
    results = {}
    with sync_playwright() as pw:
        for target in cfg.targets:
            try:
                results[target.name] = f"{fetch_target(pw, cfg, target, manifest)} file(s) filed"
            except (Error, TimeoutError) as e:
                results[target.name] = f"FAILED: {e}"
                print(f"  {results[target.name]}")
    print("\n=== summary")
    for name, result in results.items():
        print(f"  {name}: {result}")
    if any(r.startswith("FAILED") for r in results.values()):
        sys.exit(1)
