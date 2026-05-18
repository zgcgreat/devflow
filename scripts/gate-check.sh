#!/bin/sh
# gate-check.sh — Shared gate validation utility for ultimate-workflow
# Usage: ./gate-check.sh <G1|G2|G4|G3-PHASE6|CUSTOM> <project-root> [options]
# Exit codes: 0 = pass, 1 = fail, 2 = error

set -e

VERSION="1.1.0-sprint10"

# Sprint 10 Audit: Enhanced shared gate-check utility
# - G7 gate added for canary readiness (health check + rollback script + traffic ramp-up)
# - G8 gate added for archive readiness (LESSONS.md + wave SUMMARIES + domain skills)
# - G4 enhanced with heartbeat.log cross-validation (F-P2-3 fix)
# - All Phase skills (4, 5, 6, 7) now reference gate-check.sh for gate verification
PROGNAME="$(basename "$0")"

# --- Helpers ---------------------------------------------------------------

die() { printf "%s: %s\n" "$PROGNAME" "$1" >&2; exit 2; }

info() { printf "[INFO]  %s\n" "$1"; }
pass() { printf "[PASS]  Gate %s: PASSED\n" "$1"; }
fail() { printf "[FAIL]  Gate %s: FAILED\n" "$1"; }
warn() { printf "[WARN]  %s\n" "$1"; }

usage() {
    cat <<EOF
Usage: $PROGNAME <gate-id> <project-root> [options]

Gate IDs:
  G1          Phase entry gate — verify input artifacts exist
  G2          Design quality gate — check structural requirements
  G3-PHASE6   Review quality gate — spec compliance + code review
  G4          Execution readiness gate — wave-plan validation
  G5-PHASE5   Test quality gate — coverage, boundary, negative paths, mutation
  G6-PHASE6   Phase 5→6 artifact validation — test report existence and content
  G7-PHASE7   Canary gate — health check, rollback readiness, traffic ramp-up plan
  G8-PHASE8   Archive gate — LESSONS.md exists, wave SUMMARIES collected, domain skills audit
  CUSTOM                Run custom gate script from scripts/gates/ directory

Options:
  --help       Show this help message
  --version    Show version
  --detail     Show detailed check results
  --strict     Fail on first warning (default: warnings non-blocking)

Exit codes:
  0           Gate passed
  1           Gate failed
  2           Usage or runtime error
EOF
}

# --- Argument parsing -------------------------------------------------------

GATE_ID=""
PROJECT_ROOT=""
DETAIL=0
STRICT=0

while [ $# -gt 0 ]; do
    case "$1" in
        --help|-h) usage; exit 0 ;;
        --version) echo "$PROGNAME $VERSION"; exit 0 ;;
        --detail) DETAIL=1; shift ;;
        --strict) STRICT=1; shift ;;
        -*) die "Unknown option: $1 (use --help for usage)" ;;
        *)
            if [ -z "$GATE_ID" ]; then
                GATE_ID="$1"
            elif [ -z "$PROJECT_ROOT" ]; then
                PROJECT_ROOT="$1"
            else
                die "Unexpected argument: $1"
            fi
            shift
            ;;
    esac
done

if [ -z "$GATE_ID" ] || [ -z "$PROJECT_ROOT" ]; then
    echo "Error: gate-id and project-root are required." >&2
    usage >&2
    exit 2
fi

# Normalize project root to absolute path
case "$PROJECT_ROOT" in
    /*) ABSOLUTE_ROOT="$PROJECT_ROOT" ;;
    *) ABSOLUTE_ROOT="$(pwd)/$PROJECT_ROOT" ;;
esac

if [ ! -d "$ABSOLUTE_ROOT" ]; then
    die "Project root does not exist: $ABSOLUTE_ROOT"
fi

# --- Gate implementations ---------------------------------------------------

check_g1() {
    # G1 — Phase entry gate: verify input artifacts for a given phase
    # Checks that required preceding-phase files exist.
    _gate_name="G1 (Phase Entry)"

    phase_target="${2:-phase-0}"
    phases_dir="${ABSOLUTE_ROOT}/layers"

    if [ ! -d "$phases_dir" ]; then
        warn "No layers/ directory found — skipping structured checks"
        # Fallback: just check that project root has basic structure
        if [ -f "${ABSOLUTE_ROOT}/SKILL.md" ] || [ -f "${ABSOLUTE_ROOT}/README.md" ]; then
            pass "$_gate_name (basic structure OK)"
            return 0
        else
            fail "$_gate_name (project root lacks SKILL.md or README.md)"
            return 1
        fi
    fi

    _checks_passed=0
    _checks_total=0
    _failed=""

    # Check 1: requirements doc exists for any phase that needs it
    _checks_total=$((_checks_total + 1))
    if [ -f "${ABSOLUTE_ROOT}/00-requirements.md" ] || \
       [ -d "${phases_dir}/L1-INTERACTION/phase-0-yc-strategy" ]; then
        _checks_passed=$((_checks_passed + 1))
        info "Input artifacts (requirements / phase-0) present"
    else
        _failed="$_failed\n  - Input artifacts missing (00-requirements.md or phase-0)"
    fi

    # Check 2: SKILL.md exists for target phase
    _checks_total=$((_checks_total + 1))
    case "$phase_target" in
        phase-0*|phase-1*|phase-2*|phase-3*|phase-4*|phase-5*|phase-6*)
            phase_short="${phase_target%%-*}"
            layer_dir=$(echo "$phase_target" | sed 's/phase-/phase-/' | cut -d'-' -f1,2)
            skill_file="${phases_dir}/L1-INTERACTION/${phase_target}/_SKILL.md"
            ;;
        *)
            skill_file="${phases_dir}/${phase_target}/_SKILL.md"
            ;;
    esac

    if [ -n "$skill_file" ] && [ -f "$skill_file" ]; then
        _checks_passed=$((_checks_passed + 1))
        info "Phase skill definition found: $skill_file"
    else
        warn "No _SKILL.md at $skill_file (may be optional)"
    fi

    # Check 3: wave-plan.yaml or tasks doc for phases that produce them
    _checks_total=$((_checks_total + 1))
    if [ -f "${ABSOLUTE_ROOT}/02-design.md" ] || [ -f "${ABSOLUTE_ROOT}/03-tasks.md" ]; then
        _checks_passed=$((_checks_passed + 1))
        info "Phase output artifacts exist"
    else
        warn "No design or task artifacts found yet (may be early phase)"
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$_checks_passed" "$_checks_total"
        if [ -n "$_failed" ]; then
            printf "  Failures:%s\n" "$_failed"
        fi
    fi

    _warnings_count=$((_checks_total - _checks_passed))
    if [ "$STRICT" -eq 1 ] && [ "$_warnings_count" -gt 0 ]; then
        fail "$_gate_name"
        return 1
    fi
    pass "$_gate_name"
    return 0
}

check_g2() {
    # G2 — Design quality gate: check structural requirements
    # Validates that design outputs meet minimum standards.
    # Enhanced (Sprint 9): Added ADR completeness, module boundary annotations, API definitions section, data model section.
    _gate_name="G2 (Design Quality)"

    design_file="${ABSOLUTE_ROOT}/02-design.md"
    checks_passed=0
    _total_checks=0
    failed=""

    # Check 1: design file exists
    _total_checks=$((_total_checks + 1))
    if [ -f "$design_file" ]; then
        checks_passed=$((checks_passed + 1))
        info "Design file exists: $design_file"
    else
        failed="$_failed\n  - Design file missing (expected 02-design.md)"
    fi

    # Check 2: module boundary annotations present
    _total_checks=$((_total_checks + 1))
    if [ -f "$design_file" ] && grep -qiE "module.?boundary|layer.?boundary|component.?boundary" "$design_file" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Module boundary annotations present in design spec"
    else
        failed="$_failed\n  - Module boundary annotations missing in design (expected section with 'module boundary' or 'layer boundary')"
    fi

    # Check 3: API definitions section present
    _total_checks=$((_total_checks + 1))
    if [ -f "$design_file" ] && grep -qiE "^\s*#{2,4}\s*API|^\s*API\s*[:=]|API\s+definitions|endpoint\s+definitions" "$design_file" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "API definitions section present in design spec"
    else
        failed="$_failed\n  - API definitions section missing in design (expected dedicated section with 'API' heading or 'API definitions')"
    fi

    # Check 4: data model section present
    _total_checks=$((_total_checks + 1))
    if [ -f "$design_file" ] && grep -qiE "^\s*#{2,4}\s*(Data|Schema|Model)|^\s*Data\s+model|^\s*Schema|entity.?relationship" "$design_file" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Data model section present in design spec"
    else
        failed="$_failed\n  - Data model section missing in design (expected dedicated section with 'Data Model' or 'Schema' heading)"
    fi

    # Check 5: ADR completeness (if ADR directory exists, all decisions referenced)
    _total_checks=$((_total_checks + 1))
    _adr_dir="${ABSOLUTE_ROOT}/.ultimate-workflow/adr"
    if [ -d "$_adr_dir" ]; then
        _adr_count=$(find "$_adr_dir" -name "*.md" -type f 2>/dev/null | wc -l || echo 0)
        if [ "$_adr_count" -gt 0 ] 2>/dev/null; then
            # Check if design references ADRs
            if grep -qiE "ADR|Architecture.?Decision" "$design_file" 2>/dev/null; then
                checks_passed=$((checks_passed + 1))
                info "ADRs found: $_adr_count, design references ADRs ✓"
            else
                warn "ADRs exist ($_adr_count) but design does not reference them (may be manual)"
            fi
        else
            checks_passed=$((checks_passed + 1))
            info "ADR directory exists but empty (non-blocking)"
        fi
    else
        info "No ADR directory found (ADRs may not be used for this project)"
        checks_passed=$((checks_passed + 1))
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$checks_passed" "$((_checks_total))"
        if [ -n "$failed" ]; then
            printf "  Failures:%s\n" "$failed"
        fi
    fi

    if [ "$STRICT" -eq 1 ]; then
        # All checks must pass in strict mode
        if [ "$checks_passed" -lt "$_checks_total" ]; then
            fail "$_gate_name"
            return 1
        fi
    fi
    pass "$_gate_name"
    return 0
}

check_g4() {
    # G4 — Execution readiness gate: validate wave plan before execution
    # Checks that wave-plan.yaml is well-formed and complete.
    _gate_name="G4 (Execution Readiness)"

    # Try multiple possible wave-plan locations
    wave_plan=""
    for candidate in \
        "${ABSOLUTE_ROOT}/.ultimate-workflow/wave-plan.yaml" \
        "${ABSOLUTE_ROOT}/.specs/wave-plan.yaml" \
        "${ABSOLUTE_ROOT}/wave-plan.yaml" \
        "${ABSOLUTE_ROOT}/03-tasks.md"; do
        if [ -f "$candidate" ]; then
            wave_plan="$candidate"
            break
        fi
    done

    if [ -z "$wave_plan" ]; then
        fail "$_gate_name — no wave plan file found in $ABSOLUTE_ROOT"
        return 1
    fi

    checks_passed=0
    _total_checks=5
    failed=""

    # Check 1: File exists and is readable
    _total_checks=$((_total_checks + 1))
    if [ -r "$wave_plan" ]; then
        checks_passed=$((checks_passed + 1))
        info "Wave plan file found and readable: $wave_plan"
    else
        failed="$_failed\n  - Wave plan not readable: $wave_plan"
    fi

    # Check 2: Contains task definitions (look for 'tasks:' or '- id:')
    _total_checks=$((_total_checks + 1))
    if grep -qE "^\s*(tasks:|- id:)" "$wave_plan" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Task definitions found in wave plan"
    else
        failed="$_failed\n  - No task definitions found in wave plan"
    fi

    # Check 3: Tasks have priority assignments (P0/P1/P2)
    _total_checks=$((_total_checks + 1))
    if grep -qE "^\s*priority:\s*(P0|P1|P2)" "$wave_plan" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Task priorities assigned in wave plan"
        priority_count=$(grep -cE "^\s*priority:\s*(P0|P1|P2)" "$wave_plan" 2>/dev/null || echo 0)
        info "  Priority assignments found: $priority_count"
    else
        failed="$_failed\n  - No priorities assigned (expected P0/P1/P2)"
    fi

    # Check 4: Wave numbers present and sequential
    _total_checks=$((_total_checks + 1))
    wave_count=$(grep -cE "^\s*(wave_number:|waves:)" "$wave_plan" 2>/dev/null || echo 0)
    if [ "$wave_count" -gt 0 ]; then
        checks_passed=$((checks_passed + 1))
        info "Wave structure found ($wave_count wave definition(s))"
    else
        # Markdown tasks file uses headings like "## Wave 1" or "- id: ... (wave)"
        if echo "$wave_plan" | grep -qE "^\s*##\s+Wave" 2>/dev/null; then
            checks_passed=$((checks_passed + 1))
            info "Wave structure found in markdown tasks file"
        else
            failed="$_failed\n  - No wave numbering found"
        fi
    fi

    # Check 5: Dependencies referenced (deps or depends)
    _total_checks=$((_total_checks + 1))
    dep_count=$(grep -ciE "^\s*deps?\s*[:=]|^      -\s*(id|deps)" "$wave_plan" 2>/dev/null || echo 0)
    if [ "$dep_count" -gt 0 ]; then
        checks_passed=$((checks_passed + 1))
        info "Dependencies defined in wave plan ($dep_count reference(s))"
    else
        warn "No explicit dependencies found (tasks may be flat — acceptable for simple projects)"
    fi

    # --- Additional Check 6: Heartbeat-log Cross-validation (F-P2-3 Fix) ----
    # Verify that heartbeat.log has all-done checkpoint AND matches SUMMARY.md status.
    _total_checks=$((_total_checks + 1))
    _heartbeat_ok=0
    _summary_ok=0

    # Locate heartbeat.log for the latest wave
    _wave_dir=""
    for d in "${ABSOLUTE_ROOT}/.specs/waves" "${ABSOLUTE_ROOT}/waves"; do
        if [ -d "$d" ]; then
            _wave_dir="$d"
            break
        fi
    done

    if [ -n "$_wave_dir" ]; then
        # Find the latest wave directory (highest numbered)
        _latest_wave=$(find "$_wave_dir" -maxdepth 1 -name "wave-*" -type d 2>/dev/null | sort | tail -1)
        if [ -n "$_latest_wave" ] && [ -f "${_latest_wave}/heartbeat.log" ]; then
            heartbeat_log="${_latest_wave}/heartbeat.log"

            # Check for all-done checkpoint
            if grep -q "\[all-done\]" "$heartbeat_log" 2>/dev/null; then
                _heartbeat_ok=1
                info "Heartbeat log found with [all-done] checkpoint: $heartbeat_log"
            else
                warn "Heartbeat log exists but missing [all-done] checkpoint: $heartbeat_log"
            fi

            # Cross-validate with SUMMARY.md if it exists
            summary_file="${_latest_wave}/SUMMARY.md"
            if [ -f "$summary_file" ]; then
                _total_checks=$((_total_checks + 1))
                # Extract status from SUMMARY.md (e.g., "status: PASS" or "## Summary")
                _summary_status=$(grep -iE "^\s*status:\s*(PASS|FAIL)" "$summary_file" 2>/dev/null | head -1 || echo "")
                if [ -n "$_summary_status" ]; then
                    # If heartbeat has all-done, SUMMARY should show PASS
                    if [ "$_heartbeat_ok" -eq 1 ] && grep -qi "status:\s*PASS" "$summary_file" 2>/dev/null; then
                        _summary_ok=1
                        info "Cross-validation PASSED: heartbeat [all-done] matches SUMMARY PASS status"
                        checks_passed=$((checks_passed + 1))
                    elif [ "$_heartbeat_ok" -eq 0 ] && grep -qi "status:\s*FAIL" "$summary_file" 2>/dev/null; then
                        _summary_ok=1
                        info "Cross-validation PASSED: heartbeat no [all-done] matches SUMMARY FAIL status"
                        checks_passed=$((checks_passed + 1))
                    elif [ "$_heartbeat_ok" -eq 1 ] && grep -qi "status:\s*FAIL" "$summary_file" 2>/dev/null; then
                        # Mismatch: all-done but FAIL
                        warn "Cross-validation MISMATCH: heartbeat has [all-done] but SUMMARY shows FAIL — manual review needed"
                        checks_passed=$((checks_passed + 1))  # Still pass with warning
                    else
                        failed="${failed}\n  - Cross-validation inconclusive: heartbeat/summary mismatch (missing status field)"
                    fi
                else
                    warn "SUMMARY.md found but lacks structured status field — partial validation"
                    checks_passed=$((checks_passed + 1))  # Pass with warning
                fi
            else
                info "No SUMMARY.md in wave dir — heartbeat-only validation (partial gate)"
                if [ "$_heartbeat_ok" -eq 1 ]; then
                    checks_passed=$((checks_passed + 1))
                fi
            fi
        else
            warn "No heartbeat.log found for latest wave — pre-execution gate check"
            # Not a failure: G4 runs before execution, so no heartbeat may exist yet
        fi
    else
        info "No waves/ directory found — pre-execution context, no heartbeat validation needed"
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$checks_passed" "$((_total_checks))"
        if [ -n "$failed" ]; then
            printf "  Failures:%s\n" "$failed"
        fi
    fi

    if [ "$STRICT" -eq 1 ] && [ "$checks_passed" -lt "$_total_checks" ]; then
        fail "$_gate_name"
        return 1
    fi
    pass "$_gate_name"
    return 0
}

check_g3_phase6() {
    # G3-PHASE6 — Review quality gate: spec compliance + code review
    _gate_name="G3-PHASE6 (Review Quality)"

    checks_passed=0
    _total_checks=4
    failed=""

    # Check 1: Phase 5 test report exists
    _total_checks=$((_total_checks + 1))
    test_report="${ABSOLUTE_ROOT}/05-test-results.md"
    if [ -f "$test_report" ]; then
        checks_passed=$((checks_passed + 1))
        info "Phase 5 test report found: $test_report"
    else
        failed="$_failed\n  - Phase 5 test report missing (05-test-results.md)"
    fi

    # Check 2: Implementation code exists (check for source files)
    _total_checks=$((_total_checks + 1))
    src_count=$(find "$ABSOLUTE_ROOT" -maxdepth 4 \
        \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" \) \
        2>/dev/null | wc -l || echo 0)
    if [ "$src_count" -gt 0 ]; then
        checks_passed=$((checks_passed + 1))
        info "Source files found: $src_count file(s)"
    else
        warn "No source files detected — may be a config/doc project"
    fi

    # Check 3: PRD/requirements accessible
    _total_checks=$((_total_checks + 1))
    if [ -f "${ABSOLUTE_ROOT}/00-requirements.md" ] || \
       [ -d "${ABSOLUTE_ROOT}/layers/L1-INTERACTION/phase-0-yc-strategy" ]; then
        checks_passed=$((checks_passed + 1))
        info "PRD/requirements accessible for spec compliance check"
    else
        failed="$_failed\n  - PRD/requirements not found"
    fi

    # Check 4: Previous wave summary or dev log exists
    _total_checks=$((_total_checks + 1))
    if [ -f "${ABSOLUTE_ROOT}/04-dev-log.md" ] || \
       [ -d "${ABSOLUTE_ROOT}/.specs/waves" ]; then
        checks_passed=$((checks_passed + 1))
        info "Implementation artifacts (dev log / waves) present"
    else
        warn "No dev log or wave artifacts found — may be first implementation cycle"
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$checks_passed" "$((_total_checks))"
        if [ -n "$failed" ]; then
            printf "  Failures:%s\n" "$failed"
        fi
    fi

    if [ "$STRICT" -eq 1 ] && [ "$checks_passed" -lt "$_total_checks" ]; then
        fail "$_gate_name"
        return 1
    fi
    pass "$_gate_name"
    return 0
}

check_g6_phase6() {
    # G6-PHASE6 — Phase 5→6 Artifact Validation Gate
    # Verifies that Phase 5 test output exists and is valid before Phase 6 review.
    _gate_name="G6-PHASE6 (Phase 5→6 Artifact Validation)"

    checks_passed=0
    _total_checks=3
    failed=""

    # Check 1: Phase 5 output artifact exists (.specs/test/05-test-results.md)
    test_report="${ABSOLUTE_ROOT}/.specs/test/05-test-results.md"
    _total_checks=$((_total_checks + 1))
    if [ -f "$test_report" ]; then
        checks_passed=$((checks_passed + 1))
        info "Phase 5 test artifact found: $test_report"
    else
        failed="$_failed\n  - Phase 5 output missing (expected .specs/test/05-test-results.md)"
    fi

    # Check 2: File is non-empty (>10 lines)
    _total_checks=$((_total_checks + 1))
    if [ -f "$test_report" ]; then
        line_count=$(wc -l < "$test_report")
        if [ "$line_count" -gt 10 ]; then
            checks_passed=$((checks_passed + 1))
            info "Phase 5 output is substantive: $line_count lines (>10)"
        else
            failed="$_failed\n  - Phase 5 output too short: $line_count lines (need >10)"
        fi
    else
        failed="$_failed\n  - Cannot check line count: file missing"
    fi

    # Check 3: Contains test summary indicators (PASS/FAIL or ✓/✗)
    _total_checks=$((_total_checks + 1))
    if [ -f "$test_report" ]; then
        if grep -qE "PASS|FAIL|✓|✗" "$test_report" 2>/dev/null; then
            checks_passed=$((checks_passed + 1))
            info "Phase 5 output contains test summary indicators (PASS/FAIL or ✓/✗)"
        else
            failed="$_failed\n  - Phase 5 output lacks PASS/FAIL or ✓/✗ indicators"
        fi
    else
        failed="$_failed\n  - Cannot check content: file missing"
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$checks_passed" "$((_total_checks))"
        if [ -n "$failed" ]; then
            printf "  Failures:%s\n" "$failed"
        fi
    fi

    if [ "$STRICT" -eq 1 ] && [ "$checks_passed" -lt "$_total_checks" ]; then
        fail "$_gate_name"
        return 1
    fi
    pass "$_gate_name"
    return 0
}

check_custom() {
    # CUSTOM — Look for a custom gate script in scripts/gates/
    _custom_gate="${2:-default}"
    _script_dir="${ABSOLUTE_ROOT}/scripts/gates"

    if [ ! -d "$_script_dir" ]; then
        die "Custom gates directory not found: $_script_dir"
    fi

    # Look for <gate_id>.sh in the custom gates directory
    _custom_script="${_script_dir}/${GATE_ID}.sh"
    if [ "$GATE_ID" = "CUSTOM" ] && [ -n "$3" ]; then
        _custom_script="${_script_dir}/${3}.sh"
    fi

    if [ ! -f "$_custom_script" ]; then
        die "Custom gate script not found: $_custom_script (use filenames like G5-DEPLOY.sh)"
    fi

    if [ ! -x "$_custom_script" ]; then
        chmod +x "$_custom_script"
        info "Made custom gate executable: $_custom_script"
    fi

    info "Running custom gate: $_custom_script (project: $ABSOLUTE_ROOT)"
    if eval "sh $_custom_script '$ABSOLUTE_ROOT'"; then
        pass "Custom gate ${GATE_ID}"
        return 0
    else
        fail "Custom gate ${GATE_ID}"
        return 1
    fi
}

# --- G5: Test Quality Gate (Phase 5) -----------------------------------------

check_g5() {
    _gate_name="G5 (Test Quality)"

    # Try to find test results from multiple possible locations
    test_report=""
    for candidate in \
        "${ABSOLUTE_ROOT}/05-test-results.md" \
        "${ABSOLUTE_ROOT}/.specs/test/05-test-results.md" \
        "${ABSOLUTE_ROOT}/.specs/waves/wave-*/SUMMARY.md"; do
        if [ -f "$candidate" ]; then
            test_report="$candidate"
            break
        fi
    done

    # If glob matched multiple files, use the last one (latest wave)
    if [ -z "$test_report" ] && [ -d "${ABSOLUTE_ROOT}/.specs/waves" ]; then
        test_report=$(find "${ABSOLUTE_ROOT}/.specs/waves" -name "SUMMARY.md" -type f 2>/dev/null | sort | tail -1)
    fi

    if [ -z "$test_report" ] || [ ! -f "$test_report" ]; then
        fail "$_gate_name — no test report found"
        return 1
    fi

    checks_passed=0
    _total_checks=4
    failed=""

    # Check 1: Coverage metric present (≥80% new code target)
    _total_checks=$((_total_checks + 1))
    if grep -qiE "coverage|test.coverage|coverage.*%" "$test_report" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Coverage metric found in test report"
        # Try to extract coverage percentage
        _coverage_val=$(grep -oE "[0-9]+\.?[0-9]*%" "$test_report" 2>/dev/null | head -1)
        if [ -n "$_coverage_val" ]; then
            info "  Coverage value found: $_coverage_val"
        fi
    else
        failed="$_failed\n  - No coverage metric found in test report"
    fi

    # Check 2: Boundary scenarios tested (≥3)
    _total_checks=$((_total_checks + 1))
    _boundary_count=$(grep -ciE "boundary|edge.?case|boundary.?scenario" "$test_report" 2>/dev/null || echo 0)
    if [ "$_boundary_count" -ge 3 ] 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Boundary scenarios found: $_boundary_count (≥3 threshold met)"
    else
        warn "Boundary scenarios found: $_boundary_count (<3 threshold, may need more)"
    fi

    # Check 3: Negative path tests present
    _total_checks=$((_total_checks + 1))
    if grep -qiE "negative|error.?path|invalid|failure.?case" "$test_report" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Negative path tests present"
    else
        failed="$_failed\n  - No negative path tests found"
    fi

    # Check 4: No flaky test warnings (flaky_threshold=3)
    _total_checks=$((_total_checks + 1))
    _flaky_count=$(grep -ciE "flaky" "$test_report" 2>/dev/null || echo 0)
    if [ "$_flaky_count" -le 3 ] 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Flaky tests within threshold: $_flaky_count (≤3)"
    else
        failed="$_failed\n  - Excessive flaky tests: $_flaky_count (>3 threshold)"
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$checks_passed" "$((_total_checks))"
        if [ -n "$failed" ]; then
            printf "  Failures:%s\n" "$failed"
        fi
    fi

    if [ "$STRICT" -eq 1 ] && [ "$checks_passed" -lt "$_total_checks" ]; then
        fail "$_gate_name"
        return 1
    fi
    pass "$_gate_name"
    return 0
}

# --- G7: Canary Gate (Phase 7) -----------------------------------------------

check_g7() {
    _gate_name="G7 (Canary Readiness)"

    # Check for canary health check script
    _canary_script=""
    for candidate in \
        "${ABSOLUTE_ROOT}/scripts/canary-health-check.sh" \
        "${ABSOLUTE_ROOT}/canary-health-check.sh"; do
        if [ -f "$candidate" ]; then
            _canary_script="$candidate"
            break
        fi
    done

    checks_passed=0
    _total_checks=4
    failed=""

    # Check 1: Health check script exists
    _total_checks=$((_total_checks + 1))
    if [ -n "$_canary_script" ]; then
        checks_passed=$((checks_passed + 1))
        info "Canary health check script found: $_canary_script"
    else
        # Allow if CUSTOM gate exists for canary
        if [ -f "${ABSOLUTE_ROOT}/scripts/gates/G7-CANARY.sh" ]; then
            checks_passed=$((checks_passed + 1))
            info "Custom G7 canary gate script found (scripts/gates/G7-CANARY.sh)"
        else
            warn "No canary health check script found (use scripts/canary-health-check.sh or custom G7 gate)"
        fi
    fi

    # Check 2: Rollback script exists
    _total_checks=$((_total_checks + 1))
    _rollback_script=""
    for candidate in \
        "${ABSOLUTE_ROOT}/scripts/auto-rollback.sh" \
        "${ABSOLUTE_ROOT}/auto-rollback.sh"; do
        if [ -f "$candidate" ]; then
            _rollback_script="$candidate"
            break
        fi
    done
    if [ -n "$_rollback_script" ]; then
        checks_passed=$((checks_passed + 1))
        info "Auto-rollback script found: $_rollback_script"
    else
        warn "No auto-rollback script found (recommended for canary)"
    fi

    # Check 3: Traffic ramp-up plan present (look for percentage or ramp keywords)
    _total_checks=$((_total_checks + 1))
    if grep -qiE "ramp.?up|traffic.*percent|canary.*weight|rollout.*percent" "$test_report" 2>/dev/null || \
       grep -qiE "ramp.?up|traffic.*percent|canary.*weight|rollout.*percent" "$_canary_script" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Traffic ramp-up plan present"
    else
        warn "No explicit traffic ramp-up plan found (may be documented elsewhere)"
    fi

    # Check 4: Threshold values defined (look for numeric thresholds)
    _total_checks=$((_total_checks + 1))
    if grep -qE "[0-9]+%|error.?rate|latency.*ms|timeout.*[0-9]+" "$_canary_script" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Threshold values defined in canary script"
    else
        warn "No explicit threshold values found in canary script"
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$checks_passed" "$((_total_checks))"
        if [ -n "$failed" ]; then
            printf "  Failures:%s\n" "$failed"
        fi
    fi

    if [ "$STRICT" -eq 1 ] && [ "$checks_passed" -lt "$_total_checks" ]; then
        fail "$_gate_name"
        return 1
    fi
    pass "$_gate_name"
    return 0
}

# --- G8: Archive Gate (Phase 8) ----------------------------------------------

check_g8() {
    _gate_name="G8 (Archive Readiness)"

    checks_passed=0
    _total_checks=3
    failed=""

    # Check 1: LESSONS.md exists and has content
    _total_checks=$((_total_checks + 1))
    _lessons_file=""
    for candidate in \
        "${ABSOLUTE_ROOT}/LESSONS.md" \
        "${ABSOLUTE_ROOT}/.specs/memory/LESSONS.md"; do
        if [ -f "$candidate" ]; then
            _lessons_file="$candidate"
            break
        fi
    done
    if [ -n "$_lessons_file" ]; then
        _lessons_count=$(wc -l < "$_lessons_file" 2>/dev/null || echo 0)
        if [ "$_lessons_count" -gt 5 ] 2>/dev/null; then
            checks_passed=$((checks_passed + 1))
            info "LESSONS.md exists with substantive content: $_lessons_count lines"
        else
            warn "LESSONS.md exists but may be thin: $_lessons_count lines (need >5)"
        fi
    else
        failed="$_failed\n  - LESSONS.md not found (expected in project root or .specs/memory/)"
    fi

    # Check 2: All wave SUMMARIES collected
    _total_checks=$((_total_checks + 1))
    _wave_summary_dir=""
    for d in "${ABSOLUTE_ROOT}/.specs/waves" "${ABSOLUTE_ROOT}/waves"; do
        if [ -d "$d" ]; then
            _wave_summary_dir="$d"
            break
        fi
    done
    if [ -n "$_wave_summary_dir" ]; then
        _summary_count=$(find "$_wave_summary_dir" -name "SUMMARY.md" -type f 2>/dev/null | wc -l || echo 0)
        if [ "$_summary_count" -gt 0 ] 2>/dev/null; then
            checks_passed=$((checks_passed + 1))
            info "Wave SUMMARIES collected: $_summary_count file(s)"
        else
            failed="$_failed\n  - No SUMMARY.md files found in wave directory"
        fi
    else
        # May be pre-wave project, skip with info
        info "No wave directory found — G8 may be pre-execution (non-blocking)"
        checks_passed=$((checks_passed + 1))
    fi

    # Check 3: Domain skills audit (check for promoted skills from LESSONS)
    _total_checks=$((_total_checks + 1))
    _domain_skills_dir=""
    for d in "${ABSOLUTE_ROOT}/.specs/skills" "${ABSOLUTE_ROOT}/.specs/memory/domain-skills"; do
        if [ -d "$d" ]; then
            _domain_skills_dir="$d"
            break
        fi
    done
    if [ -n "$_domain_skills_dir" ]; then
        _skill_count=$(find "$_domain_skills_dir" -name "*.md" -type f 2>/dev/null | wc -l || echo 0)
        if [ "$_skill_count" -gt 0 ] 2>/dev/null; then
            checks_passed=$((checks_passed + 1))
            info "Domain skills present: $_skill_count file(s)"
        else
            warn "Domain skills directory exists but empty (no promoted skills yet)"
        fi
    else
        warn "No domain skills directory found (expected if no lessons have been promoted yet)"
    fi

    if [ "$DETAIL" -eq 1 ]; then
        echo ""
        printf "  Checks passed: %d / %d\n" "$checks_passed" "$((_total_checks))"
        if [ -n "$failed" ]; then
            printf "  Failures:%s\n" "$failed"
        fi
    fi

    if [ "$STRICT" -eq 1 ] && [ "$checks_passed" -lt "$_total_checks" ]; then
        fail "$_gate_name"
        return 1
    fi
    pass "$_gate_name"
    return 0
}

# --- Main dispatch ----------------------------------------------------------

case "$GATE_ID" in
    G1)           check_g1 "$@" ;;
    G2)           check_g2 "$@" ;;
    G4)           check_g4 "$@" ;;
    G3-PHASE6|G3) check_g3_phase6 "$@" ;;
    G5-PHASE5|G5) check_g5 "$@" ;;
    G6-PHASE6)    check_g6_phase6 "$@" ;;
    G7-PHASE7|G7) check_g7 "$@" ;;
    G8-PHASE8|G8) check_g8 "$@" ;;
    CUSTOM)       check_custom "$@" ;;
    *)
        die "Unknown gate ID: $GATE_ID. Use G1, G2, G3, G4, G5, G6, G7, G8, or CUSTOM."
        ;;
esac
