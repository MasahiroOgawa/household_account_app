"""Login autofill, click recording and recipe replay against a fake bank served through request routing."""

from dataclasses import replace
from datetime import date

import pytest
from playwright.sync_api import sync_playwright

from bank_fetcher import recipe, session
from bank_fetcher.config import Target
from bank_fetcher.institutions import Field, Institution

CSV = '"日付","摘要","金額","残高"\n"2026/6/3","カード","100","900"\n'.encode("cp932")
PAGES = {
    "/login": """<form action="/home"><input id="user" name="user"><input id="pw" name="pw" type="password">
                 <input type="checkbox" id="softkb" checked><button type="submit">ログイン</button></form>""",
    "/home": """<a href="/logout">ログアウト</a> <a href="/stmt">入出金明細</a> <a href="/transfer">振込</a>""",
    "/stmt": """<a href="/logout">ログアウト</a><input id="from" name="from"><select id="acct"><option>1111111</option>
                <option>2222222</option></select><a id="dl" href="/file.csv">CSVダウンロード</a>""",
    "/confirm": """<a href="/logout">ログアウト</a>
                   <button id="dl" onclick="if (confirm('ダウンロードしますか？')) location.href='/file.csv'">ダウンロード</button>
                   <button id="pay" onclick="document.title = confirm('振込を実行しますか？') ? 'paid' : 'kept'">実行</button>""",
}

BANK = Institution(
    name="fake",
    display="Fake",
    login_url="https://bank.test/login",
    fields=(Field("user", "user", ("#user",)), Field("password", "pw", ("#pw",), secret=True)),
    submit="button:has-text('ログイン')",
    uncheck=("#softkb",),
)
TARGET = Target("fake", BANK, ("1111111",), date(2026, 6, 1))
SINCE, UNTIL = date(2026, 6, 2), date(2026, 6, 4)


def _serve(route):
    path = route.request.url.split("bank.test", 1)[1].split("?")[0]
    if path == "/file.csv":
        route.fulfill(
            body=CSV, headers={"Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="1111111_x.csv"'}
        )
    else:
        route.fulfill(body=f"<html><body>{PAGES.get(path, 'bye')}</body></html>", content_type="text/html; charset=utf-8")


@pytest.fixture
def context():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=True)
        ctx = session.instrument(browser.new_context(accept_downloads=True))
        ctx.route("https://bank.test/**", _serve)
        yield ctx
        browser.close()


def test_login_autofills_and_detects_logged_in(context):
    session.login(context, TARGET, {"user": "u1", "password": "p1"}, timeout_sec=10)
    assert context.pages[-1].url == "https://bank.test/home?user=u1&pw=p1"


def test_login_times_out_without_logout_marker(context):
    with pytest.raises(TimeoutError):
        session.login(
            context, replace(TARGET, institution=replace(BANK, logged_in_text="存在しない")), {"user": "u", "password": "p"}, 2
        )


def test_record_then_replay_downloads(context):
    rec = recipe.Recorder(context)
    session.login(context, TARGET, {"user": "u", "password": "p"}, timeout_sec=10)
    rec.active = True
    page = context.pages[-1]
    page.click("text=入出金明細")
    page.wait_for_url("**/stmt")
    page.fill("#from", "2026/06/02")
    page.press("#from", "Tab")
    page.select_option("#acct", label="1111111")
    with page.expect_download():
        page.click("#dl")
        rec.mark_download()
    page.wait_for_timeout(300)
    steps = rec.recipe(SINCE, UNTIL)
    assert [s.action for s in steps] == ["click", "fill", "select", "click"]
    assert steps[1].value == "{since:%Y/%m/%d}" and steps[-1].download

    page.goto("https://bank.test/home")
    downloads = recipe.replay(context, steps, date(2026, 10, 5), date(2026, 10, 9))
    assert [session.read(d).content for d in downloads] == [CSV]
    assert context.pages[-1].locator("#from").input_value() == "2026/10/05"


def test_replay_refuses_money_operations(context):
    session.login(context, TARGET, {"user": "u", "password": "p"}, timeout_sec=10)
    with pytest.raises(PermissionError):
        recipe.replay(context, [recipe.Step("click", "a", "", "", "振込", "")], SINCE, UNTIL)


def test_confirm_gated_download_is_accepted(context):
    page = context.new_page()
    page.goto("https://bank.test/confirm")
    downloads = recipe.replay(context, [recipe.Step("click", "button", "dl", "", "ダウンロード", "", True)], SINCE, UNTIL)
    assert [session.read(d).content for d in downloads] == [CSV]


def test_money_confirm_is_dismissed(context):
    page = context.new_page()
    page.goto("https://bank.test/confirm")
    page.click("#pay")
    assert page.title() == "kept"
