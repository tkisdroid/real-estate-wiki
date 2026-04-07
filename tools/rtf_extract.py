import re, os, sys
sys.stdout.reconfigure(encoding='utf-8')

def rtf_to_text_custom(rtf_content):
    """Extract text from RTF including Korean unicode escapes."""
    text = []
    i = 0
    in_group = 0
    skip_depth = 0

    while i < len(rtf_content):
        c = rtf_content[i]

        if c == '{':
            in_group += 1
            rest = rtf_content[i+1:i+25]
            skips = ['\\fonttbl', '\\colortbl', '\\stylesheet', '\\*\\listtable',
                     '\\*\\generator', '\\header', '\\footer', '\\*\\pnseclvl']
            if any(rest.startswith(s) for s in skips):
                skip_depth = in_group
            i += 1
            continue

        if c == '}':
            if skip_depth == in_group:
                skip_depth = 0
            in_group -= 1
            i += 1
            continue

        if skip_depth:
            i += 1
            continue

        if c == '\\' and i + 1 < len(rtf_content):
            nc = rtf_content[i+1]

            # Unicode escape: \uN?
            if nc == 'u':
                m = re.match(r'u(-?\d+)', rtf_content[i+1:i+12])
                if m:
                    num = int(m.group(1))
                    if num < 0:
                        num = 65536 + num
                    try:
                        text.append(chr(num))
                    except:
                        pass
                    i += len(m.group(0)) + 1
                    if i < len(rtf_content) and rtf_content[i] == '?':
                        i += 1
                    continue

            # Hex escape \'XX (Korean cp949)
            if nc == "'":
                if i + 3 < len(rtf_content):
                    hexval = rtf_content[i+2:i+4]
                    try:
                        byte1 = int(hexval, 16)
                        if byte1 >= 0x80:
                            # Double-byte cp949
                            if i + 5 < len(rtf_content) and rtf_content[i+4:i+6] == "\\'":
                                hexval2 = rtf_content[i+6:i+8]
                                byte2 = int(hexval2, 16)
                                text.append(bytes([byte1, byte2]).decode('cp949'))
                                i += 8
                                continue
                        text.append(bytes([byte1]).decode('cp949'))
                    except:
                        pass
                    i += 4
                    continue

            # Named control words
            m = re.match(r'([a-z]+)(-?\d+)?\s?', rtf_content[i+1:i+30])
            if m:
                word = m.group(1)
                if word in ('par', 'line'):
                    text.append('\n')
                elif word == 'tab':
                    text.append('\t')
                i += len(m.group(0)) + 1
                continue

            # Other escapes
            i += 2
            continue

        if c not in '\r\n':
            text.append(c)
        i += 1

    result = ''.join(text)
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip()


laws_dir = r'C:\Users\TG\Desktop\LLMproject\sources\laws'
out_dir = r'C:\Users\TG\Desktop\LLMproject\sources\laws\extracted'
os.makedirs(out_dir, exist_ok=True)

for f in sorted(os.listdir(laws_dir)):
    if not f.endswith('.doc'):
        continue
    fpath = os.path.join(laws_dir, f)
    with open(fpath, 'r', encoding='ascii', errors='ignore') as fh:
        rtf = fh.read()
    text = rtf_to_text_custom(rtf)
    if len(text) > 200:
        outname = f.replace('.doc', '.txt')
        outpath = os.path.join(out_dir, outname)
        with open(outpath, 'w', encoding='utf-8') as of:
            of.write(text)
        size = os.path.getsize(outpath)
        print(f'{f[:55]:55s} {size:>10,} bytes')
    else:
        print(f'{f[:55]:55s} TOO SHORT ({len(text)})')
