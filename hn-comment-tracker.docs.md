# HN Comment Tracker

Track a Hacker News post by ID, store the last seen comment IDs in LocalStorage, and highlight new comments on later checks.

## How it works

- Enter a numeric HN post ID and click "Check comments".
- The tool stores a snapshot of all current comment IDs in LocalStorage.
- When you check the same ID again, any newly found comment IDs are highlighted.

## Notes

- Data is stored locally in your browser under `hnCommentTracker.snapshots.v1`.
- The tool uses the public Hacker News Firebase API and does not upload data elsewhere.
- Clear a snapshot with the "Clear saved snapshot" button.
