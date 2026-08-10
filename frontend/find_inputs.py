import sys

with open("src/components/PacienteCreateView.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '<input type="text"' in l or '<input type="email"' in l or '<textarea' in l or '<input type="date"' in l:
        print(f"{i+1}: {l.strip()}")
