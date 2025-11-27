# Technical Debt Management Strategy

## 1. Code Quality Checks within Sprint Activities

To ensure high code quality and prevent the accumulation of "repetitive" technical debt, we utilize a CI-based analysis approach integrated into our development workflow so to not repeat the same inaccuraces along the sprint.

### Workflow Integration

- Continuous Integration Pipeline: Every push to main or dev branch and every Pull Request (PR) triggers an automatic SonarCloud analysis;
- Pull Request Policy: No PR can be merged into the main branch if the SonarCloud Quality Gate fails;
- Code Reviews: Manual code reviews are performed alongside automatic analysis to manually decide what should or shouldn't be addressed

---

## 2. Strategy to Pay Back Technical Debt

### Prioritization

We prioritize fixing TD based on the Cost/Benefit ratio, aiming to fix items that offer the highest return on investment (High Impact / Low Effort).
We use the SonarCloud Prioritization Matrix approach:

1.  Priority 1 (Immediate Fix):
    - High Severity / Low Remediation Time: These are "quick wins" that prevent major issues along the line
    - Action: Must be fixed before the PR is merged
2.  Priority 2 (Planned Refactoring):
    - High Severity / High Remediation Time: These are structural issues
    - Action: Converted into specific "Technical Debt" cards in the backlog and prioritized in Sprint Planning
3.  Priority 3:
    - Low Severity: Minor code smells
    - Action: Fixed opportunistically when touching the file for other reasons

### Internal Organization & Workflow

To manage the trade-off between delivering features and maintaining code quality we allocate resources as follows:

- "Debt Repayment" Task: In every sprint, we dedicate a percentage of effort specifically to refactoring and paying back debt, treating it as a de-facto Task alongside Committed Stories, Testing, and Review.
- Tracking: We use SonarCloud tags and issues to track the "Principal" and assess the "Interest"
- Sprint Retrospective: During retrospectives, we review the trend of our Technical Debt and adjust our strictness on the Quality Gate if necessary