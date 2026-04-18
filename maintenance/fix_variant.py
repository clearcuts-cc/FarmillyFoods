with open(r'd:\Farmily Web\app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact line to replace
old_line = "    <div class=\"m-add-btn-image\" onclick=\"event.stopPropagation(); window.openVariantSheet('${p.name.replace(/'/g, \"\\\\'\")}')\""
new_line = "    <div class=\"m-add-btn-image\" onclick=\"event.stopPropagation(); window.openVariantSheet('${p.name.replace(/'/g, \"\\\\'\")}',[${variants.map(v=>v.id).join(',')}])\""

print("Looking for old_line...")
if old_line in content:
    print("FOUND! Replacing...")
    content = content.replace(old_line, new_line, 1)
    with open(r'd:\Farmily Web\app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done!")
else:
    # Try to find partial
    partial = "openVariantSheet('${p.name"
    idx = content.find(partial)
    if idx >= 0:
        print(f"Found partial at {idx}:")
        print(repr(content[idx-50:idx+200]))
    else:
        print("Not found at all")
