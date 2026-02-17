# career guidiance info system
# Career Guidance Information System

This project is a simple web app for career guidance using:
- HTML/CSS/JavaScript
- Firebase Auth + Firestore
- Third-party APIs for jobs/news

Live demo (Netlify):
- https://augustinecareerapp.netlify.app/

---

## Beginner-friendly workflow: from local change -> GitHub -> Netlify live site

### 1) Make your changes locally
Edit files in this project folder.

### 2) Check your code quickly
Run:

```bash
node --check js/main.js
node --check js/dashboard.js
node --check js/firebase-config.js
```

If there is no output, the syntax check passed.

### 3) Commit your changes
Run:

```bash
git add .
git commit -m "Describe what you changed"
```

### 4) Push to GitHub
Run:

```bash
git push origin <your-branch-name>
```

If you are working on `main`, use:

```bash
git push origin main
```

### 5) Netlify auto-deploy
If Netlify is connected to your GitHub repo, pushing to the tracked branch will start a deploy automatically.

In Netlify:
1. Open your site dashboard.
2. Click **Deploys**.
3. Watch for the newest deploy to turn **Published**.

### 6) Verify live site
Open your live URL and hard refresh:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

---

## Common beginner issues and simple fixes

### "I changed code but live site did not change"
- Make sure you **committed** and **pushed**.
- Confirm Netlify deploy finished successfully.
- Hard refresh browser cache.

### "The app shows errors in console"
- Open browser DevTools (`F12`) -> **Console**.
- Check for:
  - missing scripts
  - network/CORS errors
  - Firebase permission errors

### "News/jobs data not loading"
- External APIs can fail due quota/CORS/network limits.
- The app includes fallback sample content for resilience.

### "Firebase login not working"
- Confirm Firebase project config in `js/firebase-config.js`.
- In Firebase Console, ensure Auth providers are enabled.
- Check Firestore security rules.

---

## Important security note
This project currently uses client-side config and API keys in JavaScript.
For production apps, move sensitive third-party API calls to a backend/proxy.

---

## Useful commands

```bash
# See changed files
git status

# See commit history
git log --oneline -10

# Run a local static server
python3 -m http.server 8000
```

Then open: `http://127.0.0.1:8000`

## Exact step-by-step: how to type and run `git push` in your repo

1. Open your terminal (Command Prompt, PowerShell, or VS Code Terminal).
2. Move into your project folder:

```bash
cd /workspace/career-guidiance-info-system
```

3. Confirm you are in a Git repo:

```bash
git status
```

4. Check your current branch name:

```bash
git branch --show-current
```

5. Add your changed files:

```bash
git add .
```

6. Create a commit:

```bash
git commit -m "Update project"
```

7. Push your branch to GitHub:

```bash
git push origin $(git branch --show-current)
```

8. If Git asks for username/password:
   - Use your GitHub username.
   - Use a **GitHub Personal Access Token (PAT)** as password (not your normal GitHub password).

9. Verify push worked:

```bash
git log --oneline -5
```

Then open your GitHub repo in browser and confirm the latest commit is visible.

### If you get "Everything up-to-date"
It means there was nothing new to push. Run `git status` and confirm whether you actually made and committed changes.

### If you get "fatal: not a git repository"
You are in the wrong folder. Use `cd` to enter the project folder first, then retry.