"""Recording the clicks a person makes from the logged-in page to a CSV download, and replaying them.

A recipe is learned from the first assisted run of each target, so no post-login page structure is hardcoded.
"""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path

from playwright.sync_api import BrowserContext, Download, Page

RECORDER_JS = r"""
(() => {
  if (window.__bfRecorder) return;
  window.__bfRecorder = true;
  const desc = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    name: el.getAttribute('name') || '',
    text: el.tagName === 'SELECT' ? '' :
      (el.innerText || el.value || el.getAttribute('aria-label') || el.title || '').trim().replace(/\s+/g, ' ').slice(0, 60),
  });
  const send = (ev) => { try { window.bfRecord(ev); } catch (e) {} };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a,button,input[type=submit],input[type=button],input[type=image],input[type=radio],input[type=checkbox],[role=button],[role=tab],[role=link],[onclick]');
    if (el) send({action: 'click', value: '', ...desc(el)});
  }, true);
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.tagName === 'SELECT') send({action: 'select', ...desc(el), value: (el.options[el.selectedIndex] || {}).text?.trim() || ''});
    else if (el.tagName === 'INPUT' && ['text', 'tel', 'date', 'number'].includes(el.type)) send({action: 'fill', ...desc(el), value: el.value});
  }, true);
})();
"""

# Defensive: a recipe must only ever navigate to statements, never move money or change settings.
FORBIDDEN = re.compile(r"振込|送金|振替|解約|申込|申し込み|購入|売却|削除|取消|払戻")
DATE_FORMATS = ("%Y/%m/%d", "%Y-%m-%d", "%Y%m%d")


@dataclass
class Step:
    action: str
    tag: str
    id: str
    name: str
    text: str
    value: str
    download: bool = False


def templatize(value: str, since: date, until: date) -> str:
    """Turn the dates a person typed while recording into placeholders, so a replay asks for the current period."""
    for fmt in DATE_FORMATS:
        value = value.replace(since.strftime(fmt), f"{{since:{fmt}}}").replace(until.strftime(fmt), f"{{until:{fmt}}}")
    return value


def render(value: str, since: date, until: date) -> str:
    return re.sub(r"\{(since|until):([^}]+)\}", lambda m: (since if m.group(1) == "since" else until).strftime(m.group(2)), value)


class Recorder:
    def __init__(self, context: BrowserContext):
        self.steps: list[Step] = []
        self.active = False
        context.expose_binding("bfRecord", self._on_event)
        context.add_init_script(RECORDER_JS)
        for page in context.pages:
            page.evaluate(RECORDER_JS)

    def _on_event(self, _source, event: dict) -> None:
        if self.active:
            self.steps.append(Step(**event))

    def mark_download(self) -> None:
        clicks = [s for s in self.steps if s.action == "click"]
        if clicks:
            clicks[-1].download = True

    def recipe(self, since: date, until: date) -> list[Step]:
        last_download = max((i for i, s in enumerate(self.steps) if s.download), default=-1)
        return [Step(**{**asdict(s), "value": templatize(s.value, since, until)}) for s in self.steps[: last_download + 1]]


def save(path: Path, steps: list[Step]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps([asdict(s) for s in steps], ensure_ascii=False, indent=1))


def load(path: Path) -> list[Step]:
    return [Step(**s) for s in json.loads(path.read_text())] if path.exists() else []


def _locate(page: Page, step: Step):
    candidates = []
    if step.text and step.action == "click":
        candidates.append(page.locator(step.tag, has_text=step.text))
    if step.id:
        candidates.append(page.locator(f"[id='{step.id}']"))
    if step.name:
        candidates.append(page.locator(f"{step.tag}[name='{step.name}']"))
    for loc in candidates:
        visible = loc.filter(visible=True)
        if visible.count():
            return visible.first
    raise LookupError(f"step not found on {page.url}: {step}")


def replay(context: BrowserContext, steps: list[Step], since: date, until: date, timeout_ms: int = 20000) -> list[Download]:
    downloads = []
    for i, step in enumerate(steps, 1):
        if FORBIDDEN.search(step.text):
            raise PermissionError(f"recipe step {i} looks like a money/settings operation, refusing: {step.text!r}")
        page = context.pages[-1]
        page.wait_for_load_state("domcontentloaded")
        loc = None
        for _ in range(timeout_ms // 500):
            try:
                loc = _locate(page, step)
                break
            except LookupError:
                page.wait_for_timeout(500)
        if loc is None:
            raise LookupError(f"recipe step {i} not found on {page.url}: {step.action} {step.text or step.id or step.name!r}")
        print(f"  step {i}/{len(steps)}: {step.action} {step.text or step.id or step.name}")
        if step.action == "select":
            loc.select_option(label=render(step.value, since, until))
        elif step.action == "fill":
            loc.fill(render(step.value, since, until))
        elif step.download:
            with page.expect_download(timeout=60000) as d:
                loc.click()
            downloads.append(d.value)
        else:
            loc.click()
    return downloads
