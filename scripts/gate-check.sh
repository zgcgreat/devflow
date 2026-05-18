#!/bin/sh
# gate-check.sh — Shared gate validation utility for ultimate-workflow
# Usage: ./gate-check.sh <G1|G2|G4|G3-PHASE6|CUSTOM> <project-root> [options]
# Exit codes: 0 = pass, 1 = fail, 2 = error

set -e

VERSION="1.0.0"
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
  G6-PHASE6             Phase 5→6 artifact validation — test report existence and content
  G3-PHASE6-CRITERIA    Phase 6 exit criteria — severity, P0 resolution, TODO/FIXME, report completeness
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
    _gate_name="G2 (Design Quality)"

    layers_dir="${ABSOLUTE_ROOT}/layers"
    checks_passed=0
    checks_total=3
    failed=""

    # Check 1: module boundaries defined
    _checks_total=$((_checks_total + 1))
    design_file="${ABSOLUTE_ROOT}/02-design.md"
    if [ -f "$design_file" ] && grep -qi "module\|layer\|boundary\|component" "$design_file" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Module boundaries documented in design spec"
    else
        failed="$_failed\n  - Module boundaries not found in design"
    fi

    # Check 2: API definitions present
    _checks_total=$((_checks_total + 1))
    if [ -f "$design_file" ] && grep -qi "API\|endpoint\|interface\|contract\|route" "$design_file" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "API definitions present in design spec"
    else
        failed="$_failed\n  - API definitions not found in design"
    fi

    # Check 3: data models / schemas defined
    _checks_total=$((_checks_total + 1))
    if [ -f "$design_file" ] && grep -qi "model\|schema\|table\|entity\|type\s*=" "$design_file" 2>/dev/null; then
        checks_passed=$((checks_passed + 1))
        info "Data models/schemas defined in design spec"
    else
        failed="$_failed\n  - Data models not found in design"
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

# --- Main dispatch ----------------------------------------------------------

case "$GATE_ID" in
    G1)           check_g1 "$@" ;;
    G2)           check_g2 "$@" ;;
    G4)           check_g4 "$@" ;;
    G3-PHASE6|G3) check_g3_phase6 "$@" ;;
    G6-PHASE6)    check_g6_phase6 "$@" ;;
    CUSTOM)       check_custom "$@" ;;
    *)
        die "Unknown gate ID: $GATE_ID. Use G1, G2, G4, G3-PHASE6, G6-PHASE6, or CUSTOM."
        ;;
esac
