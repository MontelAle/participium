# TEMPLATE FOR RETROSPECTIVE (Team ##)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 2 vs 2
- Total points committed vs done : 11 vs 11
- Nr of hours planned vs spent (as a team) : 93h vs 93h

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
| ----- | ------- | ------ | ---------- | ------------ |
| _#0_  |         | -      |            |              |
| n     |         |        |            |              |

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)
- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated
  - Total hours spent
  - Nr of automated unit test cases
  - Coverage (if available)
- Integration testing:
  - Total hours estimated
  - Total hours spent
- E2E testing:
  - Total hours estimated
  - Total hours spent
- Code review:
  - Total hours estimated
  - Total hours spent
- Technical Debt management:
  - Strategy adopted
    - Tasks split by high, medium, low issues
    - For each pull request we fixed what sonarcloud signaled
  - Total hours estimated estimated at sprint planning
  - Total hours spent

## ASSESSMENT

- What caused your errors in estimation (if any)?
  - Not particular mistakes
  - Sometimes takes more times to fix other things that you break during dev
  - Changing requirement interpretation

- What lessons did you learn (both positive and negative) in this sprint?
  - Refactor takes a long time and is not always apparent
    - we shold reflect on how much effort we put on technical debt
  - Complex structure of the repo is starting wheigh down

- Which improvement goals set in the previous retrospective were you able to achieve?
  - We followed more requirements and avoided implementing extra stuff

- Which ones you were not able to achieve? Why?
  - We couldn't plan the technical aspects during sprint planning as well as we hoped
    - We dind't start with a clear picture of what we wanted to achieve
    - We thought what we discussed would be enough but it was still to big picture

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - Decide technologies and libraries beforehand
  - Run tests with database instead of mocks

- One thing you are proud of as a Team!!
  - We achieved good sonarcloud score by removing technical debt
    [- Frontend components were neatly reorganized]
