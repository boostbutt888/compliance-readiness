"""Build the website from src/.

Outputs:
  index.html     front page (what we do, how the check helps)
  check.html     the Readiness Check tool, standalone
  artifact.html  the tool as a body-only page for a claude.ai artifact
"""
from pathlib import Path

src = Path(__file__).parent / "src"
read = lambda n: (src / n).read_text()

HEAD = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n')

def page(head_html, body_html):
    return HEAD + head_html + "</head>\n<body>\n" + body_html + "</body>\n</html>\n"

# Tool
js = "\n".join(read(f) for f in ["controls.js", "catalogue.js", "engine.js", "flows.js", "app.js"])
style = f"<style>\n{read('styles.css')}</style>\n"
body = f"{read('body.html')}<script>\n{js}</script>\n"
Path("artifact.html").write_text(read("head.html") + style + body)
site_body = body.replace('<nav class="appnav" aria-label="Main">',
                         '<nav class="appnav" aria-label="Main">\n      <a href="index.html" class="navhome">About</a>', 1)
Path("check.html").write_text(page(read("head.html") + style, site_body))

# Front page: everything before </style> goes in <head>
landing = read("landing.html")
cut = landing.index("</style>") + len("</style>")
Path("index.html").write_text(page(landing[:cut] + "\n", landing[cut:].lstrip()))
print("Built index.html, check.html and artifact.html")
