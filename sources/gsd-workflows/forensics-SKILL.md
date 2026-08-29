---
name: gsd-forensics
description: Post-mortem investigation for failed or stuck GSD workflows. Generates structured diagnostic reports from git history, planning artifacts, and filesystem state
---

# Forensics Workflow

Post-mortem investigation for failed or stuck GSD workflows. Analyzes git history, `.planning/` artifacts, and file system state to detect anomalies and generate a structured diagnostic report.

**Principle:** This is a read-only investigation. Do not modify project files. Only write the forensic report.

## When to Use

- Autonomous mode got stuck on a phase
- Execute-phase failed silently
- Costs seem unusually high
- Any workflow anomaly that needs diagnosis

## The Process

### Step 1: Get Problem Description

Parse `$ARGUMENTS` for problem description. If empty, ask user: "What went wrong? Describe the issue."

### Step 2: Gather Evidence

Collect data from all available sources:

**Git History:**
- Recent commits (last 30, with timestamps)
- Files changed in recent commits (detect repeated edits)
- Uncommitted work status

**Planning State:**
- `.planning/STATE.md` — current milestone, phase, progress, blockers
- `.planning/ROADMAP.md` — phase list with status
- `.planning/config.json` — workflow configuration

**Phase Artifacts:** Check each phase directory for PLAN.md, SUMMARY.md, VERIFICATION.md, CONTEXT.md, RESEARCH.md existence. Track completeness gaps.

**Session Reports:** Read `.planning/reports/SESSION_REPORT.md` if exists.

**Git Worktree State:** List worktrees to check for orphaned worktrees from crashed agents.

### Step 3: Detect Anomalies

Evaluate evidence against these patterns:

- **Stuck Loop Detection:** Same file in 3+ consecutive commits (HIGH confidence if commit messages similar)
- **Missing Artifact Detection:** Phase appears complete but lacks expected artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md)
- **Partial-plan Drift Detection:** Commits exist but SUMMARY.md missing for active plan
- **Abandoned Work Detection:** Large gap between last commit and current time with mid-execution STATE.md
- **Crash/Interruption Detection:** Uncommitted changes + mid-execution STATE.md + orphaned worktrees
- **Scope Drift Detection:** Commits touch files outside phase's expected scope
- **Test Regression Detection:** Commit messages containing "fix test", "revert", or re-commits of test files

### Step 4: Generate Report

Write to `.planning/forensics/report-{timestamp}.md` with sections:
- Evidence Summary (Git Activity, Planning State, Artifact Completeness table)
- Anomalies Detected (type, confidence, evidence, interpretation)
- Root Cause Hypothesis (1-3 sentences grounded in anomalies)
- Recommended Actions (specific, actionable steps)

Redaction rules: Replace absolute paths with relative, remove API keys/tokens, truncate large diffs to first 50 lines.

### Step 5-8: Present and Follow Up

Display full report inline. Offer interactive investigation of specific findings. If actionable anomalies found (HIGH or MEDIUM confidence), offer GitHub issue creation. Update STATE.md session record.

## Anomaly Confidence Levels

- **HIGH:** Strong evidence, clear pattern
- **MEDIUM:** Multiple indicators but not definitive
- **LOW:** Single signal, needs further investigation

## Success Criteria

- [ ] Problem description captured
- [ ] Evidence gathered from all available sources (adapting to what exists)
- [ ] Anomalies evaluated against all detection patterns
- [ ] Report written with proper sections and redaction
- [ ] Results presented inline to user
- [ ] Interactive investigation offered
- [ ] GitHub issue creation offered for actionable anomalies
- [ ] STATE.md updated with session record
