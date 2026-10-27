#!/usr/bin/env python3
"""Snapshot of the live WordPress <title>/description/robots/canonical/H1 for every non-product URL
(posts, pages, product categories, blog categories) — kept 1:1 after the migration (what Google knows).

    live-meta-snapshot.py <export-dir> [--ld]   → <export-dir>/live-meta.json   (resumable; --ld refetches entries without JSON-LD)

Reads the URL lists from the live Rank Math sitemaps + categories.ndjson (noindex categories are not in the sitemap).
Serial, ~1 request/s, straight to the WEDOS origin (Cloudflare challenges Malina).
"""
import html
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ORIGIN = "89.221.213.39"


def get(path):
    for attempt in range(4):
        r = subprocess.run(["curl", "-sk", "-m", "90", "--resolve", f"alkoholicky.cz:443:{ORIGIN}", "-A", "Mozilla/5.0 (alkoholicky-migrace)",
                            "-w", "\n%{http_code}", f"https://alkoholicky.cz{path}"], capture_output=True)
        body, _, code = r.stdout.rpartition(b"\n")
        if code.strip().isdigit() and int(code) < 500:
            return int(code), body.decode("utf-8", "replace")
        time.sleep(5 * (attempt + 1))
    return 0, ""


def meta(t):
    def m(rx):
        x = re.search(rx, t, re.S)
        return html.unescape(x.group(1)).strip() if x else ""
    return {
        "title": m(r"<title>(.*?)</title>"),
        "desc": m(r'<meta name="description" content="([^"]*)"'),
        "robots": m(r'<meta name="robots" content="([^"]*)"'),
        "canonical": m(r'<link rel="canonical" href="([^"]*)"'),
        "h1": re.sub(r"<[^>]+>", "", m(r"<h1[^>]*>(.*?)</h1>")).strip(),
        # every JSON-LD block as printed (posts/pages re-emit theirs: FAQPage, Recipe, WebApplication … from mu-plugins)
        "ld": [x for x in (_json(s) for s in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', t, re.S)) if x is not None],
    }


def _json(s):
    try:
        return json.loads(s)
    except ValueError:
        return None


def main():
    exp = Path(sys.argv[1])
    out = exp / "live-meta.json"
    snap = json.load(open(out)) if out.exists() else {}
    paths = []
    for sm in ("post-sitemap.xml", "page-sitemap.xml", "category-sitemap.xml", "product_cat-sitemap.xml"):
        _, x = get("/" + sm)
        paths += [u.replace("https://alkoholicky.cz", "") for u in re.findall(r"<loc>(https://alkoholicky\.cz/[^<]*)</loc>", x)]
    for line in open(exp / "categories.ndjson"):
        c = json.loads(line)
        paths.append(f"/{c['slug']}/")
    paths = list(dict.fromkeys(paths))
    print(len(paths), "urls", flush=True)
    for i, p in enumerate(paths):
        if p in snap and ("ld" in snap[p] or snap[p].get("status") != 200 or "--ld" not in sys.argv):
            continue
        code, t = get(p)
        snap[p] = {"status": code, **(meta(t) if code == 200 else {})}
        if i % 20 == 0:
            json.dump(snap, open(out, "w"), ensure_ascii=False, indent=0)
            print(i, p, code, flush=True)
        time.sleep(0.8)
    json.dump(snap, open(out, "w"), ensure_ascii=False, indent=0)
    print("done", len(snap))


if __name__ == "__main__":
    main()
