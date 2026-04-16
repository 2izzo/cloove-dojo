Feature: Cloove Dojo Dashboard — Fullstack Results

  Fullstack katas produce a phase-by-phase result (scaffold, dev Cloove,
  compliance, SDET Cloove, E2E tests, unit tests). The dashboard should show
  those phases clearly, not collapse them into a single pass/fail.

  These scenarios describe what the dashboard SHOULD do. Until the frontend
  is updated, they are expected to fail — each red scenario is a TODO for
  the UI.

  Background:
    Given the Dojo dashboard is running
    And a fullstack result exists for kata "todo-app"
    And I have opened the dashboard in a browser
    And the dashboard finishes loading

  Scenario: Fullstack kata is marked as such in the kata list
    Then the kata dropdown marks "todo-app" as a fullstack kata

  Scenario: Fullstack row has per-phase indicators
    Then the results row for "todo-app" shows an indicator for "scaffold"
    And the results row for "todo-app" shows an indicator for "dev"
    And the results row for "todo-app" shows an indicator for "compliance"
    And the results row for "todo-app" shows an indicator for "sdet"
    And the results row for "todo-app" shows an indicator for "tests_e2e"
    And the results row for "todo-app" shows an indicator for "tests_unit"

  Scenario: Compliance score is rendered as a percentage
    Then the results row for "todo-app" shows a compliance score
    And the compliance score is formatted as a percentage

  Scenario: Phase that failed is visually distinct
    Given the fullstack result for "todo-app" has a failed "sdet" phase
    Then the "sdet" indicator is styled to indicate failure
    And a tooltip or detail explains why the phase failed

  Scenario: Fullstack firing shows live phase progress
    When I select kata "todo-app"
    And I select prompt "fullstack-dev-v1"
    And I click "FIRE"
    Then the run panel shows a phase progress section
    And each phase appears with a pending state before running
    And each phase transitions to pass or fail when complete
