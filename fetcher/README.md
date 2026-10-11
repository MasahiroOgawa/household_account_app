# bank-fetcher

Downloads statement CSVs from the bank and card sites into `data/<year>/transaction/`, where the app reads them.

| institution | site | file |
|---|---|---|
| `mufg` | 三菱UFJ銀行 | `<口座番号>_<timestamp>.csv` |
| `smbc` | 三井住友銀行 | `meisai.csv` |
| `paypay_card` | PayPayカード | `detail<YYYYMM>(<card>).csv` |
| `paypay_bank` | PayPay銀行 (Visaデビット) | `NBG….csv` |
| `jre` | JRE BANK (楽天銀行) | `RB-torihikimeisai.csv` |
| `kyoto` | 京都銀行 | (format not yet supported by the app's parser) |

## Setup

```bash
cd fetcher
uv sync
cp fetch.example.toml ../data/fetch.toml   # then edit targets
```

By default nothing is stored: each run opens the login page and waits for you to log in, then does the rest.
To have the login form filled in for you, optionally run `uv run bank-fetcher-credentials ../data/fetch.toml`. This stores the
values only in the encrypted OS keyring (`bank-fetcher/<target name>`), and the tool refuses any plaintext keyring backend.
The browser profiles in `profile_root` keep cookies and "trusted device" tokens, like any browser. The tool logs out at the
end of each run; PayPay Card (Yahoo! JAPAN login) stays logged in until you delete `profiles/paypay_card`.

## Run

```bash
uv run bank-fetcher ../data/fetch.toml
```

For each target, a Chrome window opens with its own kept profile (`profile_root`) and the login form is filled in.
Finish any one-time password, SMS or captcha in the browser. Then:

- **First run, or when the site has changed:** the terminal says which period to download. Click through to the CSV download yourself.
  Every download is captured, and your clicks are saved as a recipe in `data/fetch_recipes/<target>.json`.
  Choose preset periods (e.g. 過去3ヶ月) over typed dates where the site offers them.
- **Later runs:** the recipe is replayed automatically. If a step can no longer be found, the run falls back to the assisted mode above and records the recipe again.
  Steps that look like money or settings operations (振込, 送金, 解約, …) are refused.
- Browser dialogs (e.g. 「ダウンロードしますか？」) are accepted and printed in the terminal; dialogs that look like money
  operations are cancelled. The terminal also logs `[page]`, `[net]` and `[download]` events, to show where a download got stuck.

## Where downloads go

- The raw download is kept in `data/raw/<target>/`.
- **Daily statements:** only rows dated after the last fetched day and up to yesterday are written to `data/<year>/transaction/`.
  The bank's encoding and line format are kept byte for byte. Overlapping downloads therefore never duplicate transactions.
  A fixed filename that already exists gets a `_<timestamp>` suffix.
- **Monthly statements (PayPay Card):** the newest month already filed is fetched again and replaced, because it may still have been provisional.
- `data/fetch_manifest.json` records, for every download, the target, account, covered dates, sha256 and whether it came from a recipe or a manual run.
  The next run's period is computed from it; `since` in the config applies only while a target has no record yet.

## Test

```bash
uv run pytest
```
