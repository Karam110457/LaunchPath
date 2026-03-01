# Connecting GitHub to Your Local Project

This guide explains how to connect your local project to a new repository on GitHub.

## Step 1: Create a New Repository on GitHub

1. Go to [GitHub](https://github.com) and log in.
2. Click the **+** icon in the top right corner and select **New repository**.
3. Give your repository a name (e.g., `My-Project`).
4. Choose whether to make it **Public** or **Private**.
5. **Important:** Do *not* initialize the repository with a `README`, `.gitignore`, or license. Your local project already has files, and initializing here will create a conflicting history.
6. Click **Create repository**.

## Step 2: Initialize Git Locally (If Needed)

If your local project isn't already a Git repository, you need to initialize it. Open your terminal in your project directory and run:

```bash
git init
```

## Step 3: Stage and Commit Existing Files

Add all your project files to the staging area and create your first commit:

```bash
git add .
git commit -m "Initial commit"
```

## Step 4: Add the GitHub Remote URL

On the GitHub page for your new repository, look for the section titled *"...or push an existing repository from the command line"*. Copy those commands, which typically look like this:

```bash
# Rename the default branch to 'main' (if it isn't already)
git branch -M main

# Link your local repo to the GitHub remote
git remote add origin https://github.com/YourUsername/YourRepositoryName.git
```

## Step 5: Push Your Code to GitHub

Finally, push your local commits to the GitHub repository. The `-u` flag sets the "upstream" tracking, so next time you only need to type `git push`:

```bash
git push -u origin main
```

---

## Troubleshooting Authentication

If you are prompted for a password when trying to push, note that GitHub **no longer accepts account passwords** for command-line authentication. You must use a Personal Access Token (PAT) or the GitHub CLI.

### Option A: Use a Personal Access Token (PAT)
If prompted for a password in the terminal, paste your PAT instead of your account password. You can generate a PAT in your GitHub developer settings.

### Option B: Use the GitHub CLI (Recommended)
You can easily authenticate using the GitHub CLI:

```bash
# Login via the browser
gh auth login
```
Follow the interactive prompts to log in securely.
