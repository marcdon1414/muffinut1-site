# Deploying the Muffinut Static Site

This project is a static website with:
- `index.html`
- `styles.css`
- `script.js`
- `PRODUCT/` assets

## Option 1: Local Preview
### Using Live Server extension
1. Install the **Live Server** extension in VS Code.
2. Open `index.html`.
3. Click `Go Live` in the status bar.

### Using Python
1. Open a terminal in this folder.
2. Run:

```bash
python -m http.server 8000
```

3. Open `http://localhost:8000` in your browser.

## Option 2: Deploy to GitHub Pages
### Prerequisites
- Install Git: https://git-scm.com/downloads
- Create a GitHub account if you do not have one.

### Steps
1. Create a new repository on GitHub.
2. Open a terminal in this folder.
3. Run:

```bash
git init
git add .
git commit -m "Initial site deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

4. On GitHub, open the repository settings.
5. Go to **Pages** and set the source branch to `main` and folder to `/root`.
6. Save and wait for the site URL to appear.

## Option 3: Deploy with Netlify or Vercel
### Netlify
1. Sign in at https://app.netlify.com.
2. Create a new site from Git.
3. Connect your GitHub repo and deploy.

### Vercel
1. Sign in at https://vercel.com.
2. Import project from GitHub.
3. Deploy the static site.

## Notes
- Any static hosting service works because this is plain HTML/CSS/JS.
- If you need help with GitHub Pages specifically, I can give you the exact terminal commands for your GitHub repo name.
