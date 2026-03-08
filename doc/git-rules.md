# Trading Lab – Git Rules

Rules for using Git in this project. Follow them so the history stays clear and the team can work in parallel without stepping on each other.

**See also:** [developer-tasks.md](developer-tasks.md) (task IDs like L0-BE-1, L1-FE-2)

---

## 1. Branches

### Long-lived branches

| Branch    | Purpose |
|----------|---------|
| `main`   | Production-ready code. Only merge from `develop` (or release branches) after review. |
| `develop`| Integration branch. Feature branches merge here. Default branch for day-to-day work. |

### Short-lived branches (feature / fix / chore)

Create a branch from `develop` for each task or small set of related changes. Delete the branch after merge.

**Naming:**

- **Feature:** `feature/<task-id>-short-name` or `feature/<scope>-short-name`  
  Examples: `feature/L0-BE-1-user-entity`, `feature/L1-FE-1-backtest-form`, `feature/auth-login-page`
- **Bugfix:** `fix/<brief-description>`  
  Examples: `fix/login-401-cookie`, `fix/chart-tooltip-null`
- **Chore / refactor / docs:** `chore/<brief-description>`  
  Examples: `chore/update-deps`, `chore/add-git-rules-doc`

Use lowercase, hyphens for spaces. Keep names short but clear.

---

## 2. Commit messages

### Format

```
<type>(<scope>): <short summary>

[optional body or task ref]
```

- **Type:** `feat` | `fix` | `docs` | `chore` | `refactor` | `test`
- **Scope:** optional, e.g. `auth`, `backtest`, `todos`, `frontend`
- **Summary:** one short line, imperative (“add …” not “added …”). No period at the end.
- **Body:** optional; use for “why” or task ID (e.g. `Ref: L0-BE-2`).

### Examples

```
feat(auth): add bcrypt password hashing on register
Ref: L0-BE-2
```

```
fix(api): return 401 when refresh token missing
```

```
docs: add git rules and branch naming
```

```
feat(backtest): add POST /backtest/run with DTO validation
Ref: L1-BE-3
```

### Rules

- One logical change per commit (easier to review and revert).
- Don’t commit commented-out code, debug logs, or unrelated edits in the same commit.
- Prefer many small commits on a branch over one huge commit.

---

## 3. Workflow

1. **Start work:** From an up-to-date `develop`, create a branch:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/L0-BE-1-user-entity
   ```
2. **While working:** Stage and commit often with clear messages (see above). Push your branch:
   ```bash
   git add .
   git commit -m "feat(auth): add user entity and MongoDB schema"
   git push -u origin feature/L0-BE-1-user-entity
   ```
3. **Integrate:** Open a **pull request (PR)** from your branch into `develop`. Describe what changed and reference the task ID (e.g. L0-BE-1). After review (if required), merge.
4. **After merge:** Delete the feature branch (locally and on remote). Update your local `develop`:
   ```bash
   git checkout develop
   git pull
   ```

### Rebasing

- Prefer **rebase** onto `develop` before opening or updating a PR so the history is linear:
  ```bash
  git fetch origin
  git rebase origin/develop
  ```
- Resolve conflicts during rebase; don’t merge `develop` into your branch just to “update” it unless the team prefers merge commits.

---

## 4. What not to commit

- **Secrets:** No `.env` files, API keys, or passwords. Use `.env.example` with placeholders and keep real values local only. (`.gitignore` should include `.env` and similar.)
- **Build artifacts:** No `node_modules/`, `dist/`, `build/`, etc. (covered by `.gitignore`.)
- **IDE/editor only:** Avoid committing personal IDE settings unless the team agrees (e.g. shared `.vscode` for extensions/launch only).
- **Large or generated files:** No binaries, logs, or large generated assets unless the team has a clear policy (e.g. LFS).

If you accidentally commit secrets, **rotate them immediately** and remove the data from history (e.g. `git filter-branch` or BFG); don’t only remove the file in a later commit.

---

## 5. Merging and conflicts

- **Who merges:** The person who opens the PR (or a maintainer). Prefer **squash** or **rebase** merge for feature branches so `develop` stays clean; use normal merge only if the team wants to preserve every commit.
- **Conflicts:** Resolve in your branch (rebase or merge `develop` into your branch, fix conflicts, then push). Don’t leave conflict markers in the code.
- **CI / checks:** If the project has lint or tests on PR, fix any failures before merge.

---

## 6. Quick reference

| Action              | Command / rule |
|---------------------|----------------|
| New feature branch  | `git checkout -b feature/L0-BE-1-user-entity` from `develop` |
| Commit              | `feat(scope): short summary` + optional `Ref: L0-BE-1` |
| Update branch       | `git fetch && git rebase origin/develop` |
| After merge         | Delete branch, `git checkout develop && git pull` |
| Never commit        | `.env`, secrets, `node_modules/`, `dist/` |

---

These rules are the default for the Trading Lab repo. Adjust branch strategy or commit format in this doc if the team agrees on changes.
