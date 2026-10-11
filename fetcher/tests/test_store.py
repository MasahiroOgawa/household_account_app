from datetime import date, datetime

import pytest

from bank_fetcher import store
from bank_fetcher.config import Target
from bank_fetcher.institutions import first_date, parse_date, resolve, split_ymd

MUFG = (
    '"日付","摘要","摘要内容","支払い金額","預かり金額","差引残高","メモ","未資金化区分","入払区分"\r\n'
    '"2026/6/1","振込ＩＢ１","テスト","73,800","","1,000","","","振替支払い"\r\n'
    '"2026/6/3","カ−ド","","5,000","","900","","","支払い"\r\n'
    '"2026/6/3","為替手数料","フリコミ","154","","746","","","振替支払い"\r\n'
    '"2026/6/9","カ−ド","","1,000","","0","","","支払い"\r\n'
).encode("cp932")

NBG = (
    '"カード番号","利用年","利用月","利用日","利用店名","利用金額（円）"\n'
    '"1234 56** **** 0000","2026","6","2","店A","2044"\n'
    '"1234 56** **** 0000","2026","6","5","店B","100"\n'
).encode("cp932")


def target(institution="mufg", accounts=("1111111", "2222222"), since=date(2026, 6, 2), name="t"):
    return Target(name, resolve(institution), accounts, since)


@pytest.mark.parametrize(
    "cell, expected",
    [
        ("2026/6/3", date(2026, 6, 3)),
        ("20260105", date(2026, 1, 5)),
        ("2026年1月27日", date(2026, 1, 27)),
        ("2026-13-01", None),
        ("3,000", None),
        ("", None),
    ],
)
def test_parse_date(cell, expected):
    assert parse_date(cell) == expected


def test_row_date_variants():
    assert first_date(["x", "2026/1/2", "2026/1/27"]) == date(2026, 1, 2)
    assert split_ymd(1)(["card", "2026", "6", "2", "shop"]) == date(2026, 6, 2)
    assert split_ymd(1)(["カード番号", "利用年", "利用月", "利用日"]) is None


def test_trim_keeps_header_and_rows_in_range_byte_exact():
    t = store.trim(MUFG, date(2026, 6, 2), date(2026, 6, 4), first_date)
    lines = MUFG.splitlines(keepends=True)
    assert t.content == lines[0] + lines[2] + lines[3]
    assert (t.kept, t.dropped, t.first, t.last) == (2, 2, date(2026, 6, 3), date(2026, 6, 3))


def test_trim_split_date_columns():
    t = store.trim(NBG, date(2026, 6, 3), date(2026, 6, 30), split_ymd(1))
    assert t.kept == 1 and t.last == date(2026, 6, 5) and t.content.startswith('"カード番号"'.encode("cp932"))


def test_manifest_next_since_per_account(tmp_path):
    m = store.Manifest(tmp_path / "m.json")
    tg = target()
    assert m.next_since(tg, "1111111") == date(2026, 6, 2)
    m.entries.append(store.Entry("t", "mufg", "1111111", "f", "r", "2026-06-02", "2026-06-10", 3, "x", "now", "manual"))
    assert m.next_since(tg, "1111111") == date(2026, 6, 11)
    assert m.next_since(tg, "2222222") == date(2026, 6, 2)
    m.save()
    assert store.Manifest(tmp_path / "m.json").next_since(tg, "1111111") == date(2026, 6, 11)


def test_ingest_files_only_new_rows_and_records_coverage(tmp_path):
    m = store.Manifest(tmp_path / "fetch_manifest.json")
    tg = target()
    now = datetime(2026, 6, 5, 9, 0, 0)
    e = store.ingest(MUFG, "1111111_20260605090000.csv", tg, tmp_path, tmp_path / "raw", m, "manual", now)
    assert e.account == "1111111" and e.covered_through == "2026-06-03" and e.rows == 2
    filed = tmp_path / "2026/transaction/1111111_20260605090000.csv"
    assert filed.read_bytes().count(b"\n") == 3
    assert (tmp_path / e.raw).read_bytes() == MUFG
    # Same bytes again: recognised, not filed twice.
    assert store.ingest(MUFG, "1111111_20260605090000.csv", tg, tmp_path, tmp_path / "raw", m, "manual", now) is None


def test_ingest_fixed_filename_does_not_overwrite(tmp_path):
    tg = target("smbc", ("main",), date(2026, 6, 1))
    existing = tmp_path / "2026/transaction/meisai.csv"
    existing.parent.mkdir(parents=True)
    existing.write_bytes(b"old")
    content = "年月日,お引出し,お預入れ,お取り扱い内容,残高\n2026/6/2,100,,ATM,900\n".encode("cp932")
    e = store.ingest(
        content,
        "meisai.csv",
        tg,
        tmp_path,
        tmp_path / "raw",
        store.Manifest(tmp_path / "m.json"),
        "manual",
        datetime(2026, 6, 5, 1, 2, 3),
    )
    assert existing.read_bytes() == b"old"
    assert e.file == "2026/transaction/meisai_20260605010203.csv"


def test_ingest_nothing_new_files_nothing(tmp_path):
    tg = target(since=date(2026, 6, 10))
    e = store.ingest(
        MUFG,
        "1111111_x.csv",
        tg,
        tmp_path,
        tmp_path / "raw",
        store.Manifest(tmp_path / "m.json"),
        "recipe",
        datetime(2026, 6, 20),
    )
    assert e.file is None and e.covered_through is None
    assert not (tmp_path / "2026").exists()


def test_ingest_monthly_replaces_and_tracks_month(tmp_path):
    tg = Target("card", resolve("paypay_card"), (), date(2026, 5, 1))
    m = store.Manifest(tmp_path / "m.json")
    assert m.next_month(tg) == date(2026, 5, 1)
    for body in (b"provisional", b"final"):
        e = store.ingest(body, "detail202606(2156).csv", tg, tmp_path, tmp_path / "raw", m, "manual", datetime(2026, 6, 20))
    assert (tmp_path / "2026/transaction/detail202606(2156).csv").read_bytes() == b"final"
    assert e.covered_through == "2026-06-01" and m.next_month(tg) == date(2026, 6, 1)
