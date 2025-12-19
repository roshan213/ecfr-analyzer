---
description: Deploy frontend to GitHub Pages
---

# Deploy to GitHub Pages

## Quick Deploy (UI changes only)
// turbo
1. Build the frontend:
```bash
cd frontend && npm run build && cd ..
```

// turbo
2. Deploy to GitHub Pages:
```bash
cd frontend && npx gh-pages -d dist && cd ..
```

3. Commit source changes:
```bash
git add . && git commit -m "Update frontend" && git push origin website
```

---

## Full Deploy (data/metrics changed)

// turbo
1. Regenerate static JSON data:
```bash
cd server && npx tsx src/scripts/exportStaticData.ts && cd ..
```

// turbo
2. Build the frontend:
```bash
cd frontend && npm run build && cd ..
```

// turbo
3. Deploy to GitHub Pages:
```bash
cd frontend && npx gh-pages -d dist && cd ..
```

4. Commit source changes:
```bash
git add . && git commit -m "Update data and frontend" && git push origin website
```

---

## Fresh Data Download (new CFR data)

// turbo
1. Download latest CFR data (~3 min):
```bash
npm run download
```

// turbo
2. Export static data:
```bash
cd server && npx tsx src/scripts/exportStaticData.ts && cd ..
```

// turbo
3. Build and deploy:
```bash
cd frontend && npm run build && npx gh-pages -d dist && cd ..
```

4. Commit:
```bash
git add . && git commit -m "Update CFR data" && git push origin website
```
