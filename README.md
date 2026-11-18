# 天命签 · Fortune Reel

A cinematic, weighted Chinese fortune reel built as a dependency-free static website.

## Run locally

You can open `index.html` directly, or serve the folder with any static server:

```powershell
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Fortune odds

| Fortune | Chance |
| --- | ---: |
| 小吉 / 小凶 | 24% each |
| 吉 / 凶 | 13% each |
| 再来一次 | 10% |
| 大吉 / 大凶 | 5% each |
| 超大吉 / 超大凶 | 2% each |
| 神祈 / 核弹 | 1% each |

Total: **100%**.

The visual reel intentionally places rare fortunes near the final result for dramatic near-misses. The selected result is generated independently using the published weighted probabilities.

## GitHub Pages

1. Create a GitHub repository and upload the contents of this folder.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Add your custom domain under **Custom domain** when it is ready.

No build command or backend is required.
