# Project agent instructions

Before installing or updating any agent skill for this repository:

1. Acquire the exact candidate source without activating or installing it.
2. Scan the complete candidate skill directory with NVIDIA SkillSpector.
3. Review every finding and the analysis-completeness status. Do not install a
   skill with unresolved malicious behavior, credential exposure, prompt
   injection, or incomplete analysis of executable content.
4. Install only the exact source revision that was scanned, then verify the
   installed copy has the same content or scan it again.

SkillSpector is installed for this cloud environment at
`/workspace/.tools/bin/skillspector`. For a static scan without configured LLM
credentials, use:

```bash
/workspace/.tools/bin/skillspector scan /path/to/candidate-skill --no-llm
```

The current project skills were installed from reviewed local snapshots. Their
source revisions and content hashes are recorded in `skills-lock.json`.

Do not create a Git worktree for routine tasks. Use the existing checkout.
