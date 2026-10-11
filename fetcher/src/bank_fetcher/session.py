"""Browser side: persistent profile per target, credential autofill, waiting for the person on 2FA, collecting downloads."""

from __future__ import annotations

import sys
import threading
import time
from dataclasses import dataclass
from pathlib import Path

from playwright.sync_api import BrowserContext, Download, Error, Page, Playwright

from .config import Target
from .recipe import FORBIDDEN


@dataclass
class Downloaded:
    filename: str
    content: bytes


def _on_dialog(dialog) -> None:
    # Playwright silently dismisses dialogs nobody handles, which cancels confirm()-gated downloads.
    if FORBIDDEN.search(dialog.message):
        print(f"  [dialog] dismissed (looks like a money/settings operation): {dialog.message!r}")
        dialog.dismiss()
    else:
        print(f"  [dialog] accepted: {dialog.message!r}")
        dialog.accept()


def _on_response(response) -> None:
    disposition = response.headers.get("content-disposition", "")
    content_type = response.headers.get("content-type", "")
    if "attachment" in disposition or any(t in content_type for t in ("csv", "octet-stream", "ms-excel")):
        print(f"  [net] file response {response.status} {content_type} {disposition} {response.url[:100]}")


def _watch_page(page: Page) -> None:
    page.on("dialog", _on_dialog)
    page.on("close", lambda p: print(f"  [page] closed {p.url[:100]}"))


def instrument(context: BrowserContext) -> BrowserContext:
    for page in context.pages:
        _watch_page(page)
    context.on("page", lambda p: (print("  [page] new window/tab opened"), _watch_page(p)))
    context.on("response", _on_response)
    return context


def open_context(pw: Playwright, profile_dir: Path) -> BrowserContext:
    profile_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Real Chrome with a kept profile: banks and Yahoo remember the device, so 2FA and captchas come up far less often.
    return instrument(
        pw.chromium.launch_persistent_context(
            profile_dir,
            channel="chrome",
            headless=False,
            accept_downloads=True,
            locale="ja-JP",
            viewport=None,
            args=["--disable-blink-features=AutomationControlled"],
            ignore_default_args=["--enable-automation"],
        )
    )


def _first_visible(page: Page, selectors: tuple[str, ...]):
    for sel in selectors:
        loc = page.locator(sel).filter(visible=True)
        if loc.count():
            return loc.first
    return None


def _logged_in(page: Page, target: Target) -> bool:
    return page.get_by_text(target.institution.logged_in_text).filter(visible=True).count() > 0


def _active(context: BrowserContext) -> Page:
    return context.pages[-1]


def login(context: BrowserContext, target: Target, creds: dict[str, str], timeout_sec: int) -> None:
    inst = target.institution
    page = context.pages[0] if context.pages else context.new_page()
    page.goto(inst.login_url, wait_until="domcontentloaded")
    page.wait_for_timeout(2000)
    if _logged_in(_active(context), target):
        print("  already logged in (kept session)")
        return

    filled = None
    if inst.fields and creds:
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline and _first_visible(_active(context), inst.fields[-1].selectors) is None:
            _active(context).wait_for_timeout(500)
        page = _active(context)
        for sel in inst.uncheck:
            box = page.locator(sel)
            if box.count() and box.is_checked():
                box.uncheck()
        for f in inst.fields:
            value = creds.get(f.key, "")
            loc = _first_visible(page, f.selectors) if value else None
            if loc is not None:
                loc.fill(value)
                filled = loc
            elif value:
                print(f"  could not find the {f.key} field; please fill it in the browser")
        if filled is not None:
            submit = _first_visible(page, (inst.submit,)) if inst.submit else None
            if submit is not None:
                submit.click()
            else:
                filled.press("Enter")

    print(f"  finish logging in in the browser if asked (one-time password, SMS, captcha) — waiting up to {timeout_sec}s")
    deadline = time.monotonic() + timeout_sec
    while time.monotonic() < deadline:
        try:
            if _logged_in(_active(context), target):
                print("  logged in")
                return
            _active(context).wait_for_timeout(1000)
        except Error:
            # Navigation in progress or a popup closing; check again.
            time.sleep(1)
    raise TimeoutError(f"{target.name}: not logged in after {timeout_sec}s")


def logout(context: BrowserContext, target: Target) -> None:
    try:
        link = _active(context).get_by_text(target.institution.logged_in_text).filter(visible=True)
        if link.count():
            link.first.click()
            _active(context).wait_for_timeout(2000)
    except Error:
        pass


def read(download: Download) -> Downloaded | None:
    if failure := download.failure():
        print(f"  download of {download.suggested_filename} failed in the browser: {failure}")
        return None
    return Downloaded(download.suggested_filename, Path(download.path()).read_bytes())


def collect_manually(context: BrowserContext, instructions: str, timeout_sec: int, on_download) -> list[Downloaded]:
    """Let the person drive the browser; every download is captured. Ends on Enter, closed browser, or timeout."""
    got: list[Downloaded] = []
    pending: list[Download] = []

    def watch(page: Page) -> None:
        page.on("download", lambda d: (print(f"  [download] started {d.suggested_filename}"), pending.append(d), on_download()))

    for page in context.pages:
        watch(page)
    context.on("page", watch)

    print(instructions)
    print("  Each CSV you download is captured. Press Enter here when done (or close the browser).")
    done = threading.Event()
    threading.Thread(target=lambda: (sys.stdin.readline(), done.set()), daemon=True).start()
    deadline = time.monotonic() + timeout_sec
    while not done.is_set() and time.monotonic() < deadline and context.pages:
        try:
            # The first page outlives download pop-ups, which may close right after the file arrives.
            context.pages[0].wait_for_timeout(500)
        except Error:
            continue
        while pending:
            if d := read(pending.pop(0)):
                got.append(d)
                print(f"  captured {d.filename}")
    got += [d for d in map(read, pending) if d]
    return got
