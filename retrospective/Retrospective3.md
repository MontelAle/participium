# TEMPLATE FOR RETROSPECTIVE (Team ##)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 2/2
- Total points committed vs done : 11/11
- Nr of hours planned vs spent (as a team) : 93h/93h 05m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD

### Detailed statistics

| Story                                   | # Tasks | Points | Hours est. | Hours actual |
| --------------------------------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized_                         | 17      | /      | 67h        | 67h 30m      |
| PRT-24/assign-report-to-external        | 9       | 3      | 8h 30m     | 10h 5m       |
| PRT-25/update-report-status-as-external | 12      | 8      | 18h 20m    | 16h 50m      |

> place technical tasks corresponding to story `Uncategorized` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)

|            | Mean   | StDev  |
| ---------- | ------ | ------ |
| Estimation | 2h 26m | 2h 48m |
| Actual     | 2h 26m | 2h 48m |

Normalized values:

|            | Mean   | StDev |
| ---------- | ------ | ----- |
| Estimation | 1h 17m | 48m   |
| Actual     | 1h 17m | 46m   |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1
  $$
  \frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1
  = \frac{93h}{93h05m} - 1
  = -0.000895
  \approx -0.1\%
  $$

Much better than last time. We didnt make the same mistake during the sprint planning phase.

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

  $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.046 \approx 5\%$$

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated: 1h 30m
  - Total hours spent: 1h 45m
  - Nr of automated unit test cases: 239 (up from 180)
  - Coverage:
    - %Stmts->100
    - %Branch->84.02
    - %Funcs->100
    - %Lines->100
- Integration testing:
  - Total hours estimated: 1h 30m
  - Total hours spent: 2h
  - Nr of automated integration test cases: 90 (up from 0)
- E2E testing:
  - Total hours estimated: 1h
  - Total hours spent: 1h
  - Nr of test cases:
    - Backend: 102
    - Frontend: 36
- Code review:
  - Total hours estimated: 8h
  - Total hours spent: 7h
- Technical Debt management:
  - Strategy adopted
    - Tasks split by high, medium, low issues
    - For each pull request we fixed what sonarcloud signaled
  - Total hours estimated estimated at sprint planning: 29h 30m
    - 22h (sonarcloud + refactor)
    - 7h 30m (issues)
  - Total hours spent: 30h 20m
    - 23h (sonarcloud + refactor)
    - 7h 20m (issues)

## ASSESSMENT

- What caused your errors in estimation (if any)?
  - Not particular mistakes
  - Sometimes it takes more times to fix other things that you break during dev
  - Changing requirement interpretation

- What lessons did you learn (both positive and negative) in this sprint?
  - Refactor takes a long time and is not always apparent
    - We should reflect on how much effort we put on technical debt
  - Complex structure of the repo is starting to wheigh us down

- Which improvement goals set in the previous retrospective were you able to achieve?
  - We followed more requirements and avoided implementing unnecessary features

- Which ones you were not able to achieve? Why?
  - We couldn't plan the technical aspects during sprint planning as well as we hoped
    - We dind't start with a clear picture of what we wanted to achieve
    - We thought what we discussed would be enough but it was still to big picture

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - Decide technologies and libraries beforehand
  - Run tests with database instead of mocks

- One thing you are proud of as a Team!!
  - We achieved good sonarcloud score by removing technical debt
  - Frontend components were neatly reorganized
