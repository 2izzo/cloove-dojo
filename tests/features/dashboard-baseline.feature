Feature: Cloove Dojo Dashboard — Baseline

  As a Cloove Dojo operator
  I want the dashboard to show me kata metadata and results
  So that I can fire katas and see how Clooves performed

  Background:
    Given the Dojo dashboard is running
    And I have opened the dashboard in a browser

  Scenario: Dashboard loads with a health status
    Then I see the title "CLOOVE DOJO"
    And the health indicator shows a version number
    And the kata count is shown

  Scenario: The "Fire a Kata" form is present
    Then I see a section titled "Fire a Kata"
    And I see a "Kata" dropdown
    And I see a "Ring" dropdown
    And I see a "Prompt" dropdown
    And I see a "Model" dropdown
    And I see a button labeled "FIRE"

  Scenario: The kata dropdown is populated
    When the dashboard finishes loading
    Then the kata dropdown has at least 10 options

  Scenario: The prompt dropdown includes known prompts
    When the dashboard finishes loading
    Then the prompt dropdown includes "baseline"
    And the prompt dropdown includes "cloove-v1"
    And the prompt dropdown includes "fullstack-dev-v1"

  Scenario: Ring options 1 through 4 are available
    Then the ring dropdown has exactly 4 options
    And the ring dropdown includes "1 — Full Training Wheels"
    And the ring dropdown includes "4 — From Intent Only"

  Scenario: Historical results are shown when they exist
    Given at least one result exists in the results directory
    When the dashboard finishes loading
    Then I see a section titled "Results History"
    And I see at least one results table
