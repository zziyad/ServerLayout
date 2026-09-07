# ADR-002 — File catalog and search

Status: accepted  
Date: 2026-09-07

Need fast which-file-for-situation search. Keep `files/upload|download|list|hash`. New later: `files/search|get|index`. PG owns ACL. FTS first, sidecar later, no SQLite FTS5. Four layers under `files/`. Migration `028+`. Not the old index-search product. See `todo/PHASES.md` phase 5.
