"""Build index.html (standalone page) and artifact.html (body-only page for claude.ai artifacts) from src/."""
from pathlib import Path
src = Path(__file__).parent / "src"
read = lambda n: (src / n).read_text()
js = "\n".join(read(f) for f in ["controls.js", "catalogue.js", "engine.js", "flows.js", "app.js"])
style = f"<style>\n{read('styles.css')}</style>\n"
body = f"{read('body.html')}<script>\n{js}</script>\n"
Path("artifact.html").write_text(read("head.html") + style + body)
Path("index.html").write_text(
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n'
    + read("head.html") + style + "</head>\n<body>\n" + body + "</body>\n</html>\n")
print("Built index.html and artifact.html")
