# Bookmark tracking

`seen-bookmarks.json` records X bookmarks through the scout → approve → build pipeline.

## Top-level keys

| Key        | Meaning                                      |
| ---------- | -------------------------------------------- |
| `proposed` | Candidates surfaced for human approval       |
| `skipped`  | Rejected or deferred picks                   |
| `built`    | Demos merged under `apps/<slug>/`            |

Each key holds an **array of objects** with:

| Field    | Required | Description                          |
| -------- | -------- | ------------------------------------ |
| `id`     | yes      | Stable bookmark or post identifier   |
| `title`  | yes      | Short display title                  |
| `url`    | yes      | Link to the bookmark or source post  |
| `date`   | yes      | ISO 8601 date (e.g. when seen/built)   |
| `notes`  | no       | Scout context, slug, or skip reason    |

Example entry:

```json
{
  "id": "1234567890",
  "title": "Cool WASM demo",
  "url": "https://x.com/...",
  "date": "2026-09-15",
  "notes": "approved; slug wasm-toy"
}
```
