from datetime import date

import pytest

from bank_fetcher import config, recipe
from bank_fetcher.institutions import REGISTRY, resolve


def test_resolve_aliases_and_unknown():
    assert resolve("UFJ").name == "mufg"
    assert resolve("kyotobank").name == "kyoto"
    with pytest.raises(ValueError, match="unknown institution"):
        resolve("orico")


def test_every_institution_has_login_url_and_password_last():
    for inst in REGISTRY.values():
        assert inst.login_url.startswith("https://")
        assert not inst.fields or inst.fields[-1].secret


def test_config_load(tmp_path):
    p = tmp_path / "fetch.toml"
    p.write_text(
        "[fetch]\nauth_timeout_sec = 60\n"
        '[[target]]\nname = "a"\ninstitution = "ufj"\naccounts = [1111111]\nsince = "2026-06-02"\n'
        '[[target]]\nname = "b"\ninstitution = "smbc"\nsince = 2026-01-01\nenabled = false\n'
    )
    c = config.load(p)
    assert c.data_root == tmp_path and c.auth_timeout_sec == 60
    assert [(t.name, t.institution.name, t.accounts, t.since) for t in c.targets] == [
        ("a", "mufg", ("1111111",), date(2026, 6, 2))
    ]
    assert c.manifest_path == tmp_path / "fetch_manifest.json"


def test_config_rejects_duplicate_names(tmp_path):
    p = tmp_path / "fetch.toml"
    p.write_text('[[target]]\nname = "a"\ninstitution = "smbc"\nsince = "2026-01-01"\n' * 2)
    with pytest.raises(ValueError, match="unique"):
        config.load(p)


def test_templatize_render_roundtrip():
    since, until = date(2026, 6, 2), date(2026, 10, 4)
    t = recipe.templatize("2026/06/02 - 20261004", since, until)
    assert t == "{since:%Y/%m/%d} - {until:%Y%m%d}"
    assert recipe.render(t, date(2026, 10, 5), date(2026, 11, 1)) == "2026/10/05 - 20261101"


def test_recipe_save_load(tmp_path):
    steps = [recipe.Step("click", "a", "", "", "入出金明細", ""), recipe.Step("click", "button", "dl", "", "CSV", "", True)]
    recipe.save(tmp_path / "r.json", steps)
    assert recipe.load(tmp_path / "r.json") == steps
    assert recipe.load(tmp_path / "missing.json") == []


def test_credentials_refuse_plaintext_backend(monkeypatch):
    import keyring
    from keyring.backend import KeyringBackend

    from bank_fetcher import credentials

    class Plain(KeyringBackend):
        priority = 1

        def get_password(self, service, username):
            return None

        def set_password(self, service, username, password):
            pass

        def delete_password(self, service, username):
            pass

    monkeypatch.setattr(keyring, "get_keyring", lambda: Plain())
    with pytest.raises(SystemExit, match="refusing"):
        credentials._secure_backend()
