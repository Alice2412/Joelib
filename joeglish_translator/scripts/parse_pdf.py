import urllib.request
import os
import re
import json

def fetch_and_parse():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(script_dir, 'entries.pdf')
    out_json = os.path.join(script_dir, 'entries_words.json')

    if not os.path.exists(pdf_path):
        url = 'https://www.wordfrequency.info/files/entries.pdf'
        print(f"Fetching {url}...")
        urllib.request.urlretrieve(url, pdf_path)
        print(f"Downloaded entries.pdf ({os.path.getsize(pdf_path)} bytes)")

    try:
        import pymupdf
        doc = pymupdf.open(pdf_path)
    except ImportError:
        import fitz
        doc = fitz.open(pdf_path)

    words_in_order = []
    seen_words = set()

    def add_w(w):
        w = w.lower().strip()
        if re.match(r'^[a-z]+$', w) and len(w) >= 6 and 'joe' not in w:
            if w not in seen_words:
                seen_words.add(w)
                words_in_order.append(w)

    # 1. Pages 267-313 (Index and POS ranking)
    for p in range(266, len(doc)):
        tokens = doc[p].get_text('words')
        for i, t in enumerate(tokens):
            word_text = t[4]
            if i > 0 and re.match(r'^\d+$', tokens[i-1][4]):
                add_w(word_text)

    # 2. Headwords 1-266
    headword_pattern = re.compile(r'^\s*(\d+)\s+([a-zA-Z]+)\s+([a-z]+)\s*$')
    for p in range(266):
        for line in doc[p].get_text().splitlines():
            m = headword_pattern.match(line)
            if m:
                add_w(m.group(2))

    # 3. All vocabulary from entries 1-266
    for p in range(266):
        text = doc[p].get_text()
        for w in re.findall(r'[a-zA-Z]+', text):
            add_w(w)

    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(words_in_order, f, indent=2)

    print(f"Extracted {len(words_in_order)} unique long words and saved to {out_json}")

if __name__ == '__main__':
    fetch_and_parse()
