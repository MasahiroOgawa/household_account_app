"""Registry of supported institutions: the one place that knows each site's login form and file shape."""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date

DATE_PATTERNS = (
    re.compile(r"^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$"),
    re.compile(r"^(\d{4})(\d{2})(\d{2})$"),
    re.compile(r"^(\d{4})年(\d{1,2})月(\d{1,2})日$"),
)


def parse_date(cell: str) -> date | None:
    for pattern in DATE_PATTERNS:
        if m := pattern.match(cell.strip()):
            try:
                return date(*map(int, m.groups()))
            except ValueError:
                return None
    return None


def first_date(cells: list[str]) -> date | None:
    return next((d for d in map(parse_date, cells) if d), None)


def split_ymd(year_col: int) -> Callable[[list[str]], date | None]:
    def row_date(cells: list[str]) -> date | None:
        try:
            return date(*(int(c) for c in cells[year_col : year_col + 3]))
        except (ValueError, TypeError):
            return None

    return row_date


@dataclass(frozen=True)
class Field:
    key: str
    prompt: str
    selectors: tuple[str, ...]
    secret: bool = False


@dataclass(frozen=True)
class Institution:
    name: str
    display: str
    login_url: str
    fields: tuple[Field, ...]
    # None: press Enter in the last filled field.
    submit: str | None = None
    # Checkboxes that must be cleared before typing (e.g. software-keyboard toggles).
    uncheck: tuple[str, ...] = ()
    logged_in_text: str = "ログアウト"
    # "daily": statements are trimmed to dates not yet fetched.
    # "monthly": one file per billing month, named by month; a refetch replaces it.
    period: str = "daily"
    row_date: Callable[[list[str]], date | None] = first_date
    # Captures the account number from a downloaded filename when one login holds several accounts.
    account_in_filename: str | None = None

    def __str__(self) -> str:
        return f"{self.name} ({self.display})"


def _password(*selectors: str) -> Field:
    return Field("password", "login password", selectors, secret=True)


REGISTRY: dict[str, Institution] = {
    i.name: i
    for i in (
        Institution(
            name="mufg",
            display="三菱UFJ銀行",
            login_url="https://entry11.bk.mufg.jp/ibg/dfw/APLIN/loginib/login?_TRANID=AA000_001",
            fields=(
                Field("contract_number", "ご契約番号 (leave empty to log in by 店番+口座番号)", ("#tx-contract-number",)),
                Field("branch", "店番 (3 digits; empty if using ご契約番号)", ("#tx-branch-number",)),
                Field("account", "口座番号 (7 digits; empty if using ご契約番号)", ("#tx-account-number",)),
                _password("#tx-ib-password"),
            ),
            submit="button:has-text('ログイン'):not(:has-text('パスワード'))",
            account_in_filename=r"^(\d{7})_\d{14}",
        ),
        Institution(
            name="smbc",
            display="三井住友銀行",
            login_url="https://direct.smbc.co.jp/aib/aibgsjsw5001.jsp",
            fields=(
                Field("branch", "店番号", ("input[name='branchNo']",)),
                Field("account", "口座番号", ("input[name='accountNo']",)),
                _password("#inputpassword", "input[name='password']"),
            ),
        ),
        Institution(
            name="paypay_card",
            display="PayPayカード",
            # Yahoo! JAPAN ID login with SMS / captcha: logged in by hand once, then kept by the browser profile.
            login_url="https://www.paypay-card.co.jp/member/",
            fields=(),
            period="monthly",
        ),
        Institution(
            name="paypay_bank",
            display="PayPay銀行",
            login_url="https://login.paypay-bank.co.jp/wctx/1D1DFxFDg.do",
            fields=(
                Field("branch", "店番号", ("#idTenNo",)),
                Field("account", "口座番号", ("#idKozaNo",)),
                _password("#idPw"),
            ),
            submit="input[name='login']",
            row_date=split_ymd(1),
        ),
        Institution(
            name="jre",
            display="JRE BANK (楽天銀行)",
            login_url="https://sfes.rakuten-bank.co.jp/MS/main/RbS?CID=M_START&CMD=LOGIN&BAAS_CODE=JRE",
            fields=(
                # The user-ID input carries a generated JSF name; it is the form's only text input.
                Field("user_id", "ユーザID", ("input[name$='USER_ID']", "input[type='text']")),
                _password("input[name$=':LOGIN_PASSWORD']", "input[type='password']"),
            ),
            submit="input[type='submit'][value='ログイン']",
        ),
        Institution(
            name="kyoto",
            display="京都銀行",
            login_url="https://www.parasol.anser.ne.jp/ib/index.do?PT=BS&CCT0080=0158",
            fields=(
                Field("member_number", "会員番号 (leave empty to log in by 支店番号+口座番号)", ("#txtBox005",)),
                Field("branch", "支店番号 (empty if using 会員番号)", ("#txtBox022",)),
                Field("account", "口座番号 (empty if using 会員番号)", ("#txtBox006",)),
                _password("#pswd010"),
            ),
            submit="#btn015",
            uncheck=("#pswd010_check",),
        ),
    )
}

ALIASES = {
    "ufj": "mufg",
    "mitsubishi_ufj": "mufg",
    "paypay": "paypay_card",
    "jre_bank": "jre",
    "kyotobank": "kyoto",
    "kyoto_bank": "kyoto",
}


def resolve(name: str) -> Institution:
    key = ALIASES.get(name.lower(), name.lower())
    if key not in REGISTRY:
        raise ValueError(f"unknown institution {name!r}; known: {', '.join(REGISTRY)}")
    return REGISTRY[key]
