# RETROSPECTIVE 4(Team 12)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 8/8
- Total points committed vs done : 28/28
- Nr of hours planned vs spent (as a team) : 97h/96h15m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD

### Detailed statistics

| Story                                    | # Tasks | Points | Hours est. | Hours actual |
| ---------------------------------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized Cards_                    | 8       | -      | 38h 30m    | 38h20m       |
| _Unregistered user map view PRT-174_     | 6       | 1      | 3h 30m     | 3h 30m       |
| _Internal comments PRT-122_              | 7       | 3      | 6h 30m     | 6h30m        |
| _OTP registration PRT-123_               | 7       | 3      | 7h 30m     | 8h           |
| _Anonimus reports PRT-51_                | 5       | 1      | 3h 30m     | 3h 30m       |
| _Address search bar for reports PRT-175_ | 2       | 2      | 3h         | 3h           |
| _Status notif and chat PRT-47_           | 7       | 8      | 11h        | 11h 30m      |
| _Municipality role update PRT-124_       | 8       | 5      | 13h 30m    | 14h 20m      |
| _Create report on Telegram PRT-48_       | 5       | 5      | 10h        | 8h 35m       |

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)

|            | Mean   | StDev  |
| ---------- | ------ | ------ |
| Estimation | 1h 46m | 2h 16m |
| Actual     | 1h 45m | 2h 15m |

Normalized values:

|            | Mean  | StDev |
| ---------- | ----- | ----- |
| Estimation | 1h 2m | 42m   |
| Actual     | 1h 2m | 43m   |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1

  $$
  \frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1
  = \frac{96h15m}{97h} - 1
  = -0.00773
  \approx -0.1\%
  $$

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n
  $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.0749 \approx 7.5\%$$

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated: 2h 30m
  - Total hours spent: 2h 30m
  - Nr of automated unit test cases: 497 (up from 239)
  - Coverage:
    - %Stmts->100%
    - %Branch->99.49%
    - %Funcs->100%
    - %Lines->100%
- Integration testing:
  - Total hours estimated: 2h 30m
  - Total hours spent: 3h
  - Nr of automated integration test cases: 105 (up from 90)
- E2E testing:
  - Total hours estimated 6h
  - Total hours spent 6h
  - Nr of test cases:
    - Backend: 149 (up from 102)
    - Frontend: 36
- Code review:
  - Total hours estimated: 14h
  - Total hours spent: 14h
- Technical Debt management:
  - Strategy adopted
    - Address code issues at the beginning of the sprint and during final review
    - Keep issue on SonarCloud at a minimum over the pull-requests
  - Total hours estimated sprint planning: 12h 30m
    - 11 h(sonarcloud + refactor)
    - 1h 30m (issues)
  - Total hours spent: 11h 45m
    - 9h 45m (sonarcloud + refactor)
    - 2h (issues)

## ASSESSMENT

- What caused your errors in estimation (if any)?
  - We are, generally, precise in the estimation effort, leading to very few mistakes in the process. The only glaring errors are in the final project review task, where we were able to do the revision quicker than expected and the deployment of the telegram bot, where due to lack of experience we estimated according to a different strategy than what we used in the final developement.

- What lessons did you learn (both positive and negative) in this sprint?
  - Splitting a story between fewer people to work on makes the work more efficient
  - A deeper understanding of the requirements is needed for a smooth developement process

- Which improvement goals set in the previous retrospective were you able to achieve?
  - We decided on technologies and libraries beforehand
- Which ones you were not able to achieve? Why?
  - We couldn't run tests with database insted of mocks, that's because we noticed that test-container is extremely heavy on our machines and we wanted to devote more effort in finishing all the stories and the new tests

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - Have a better split between technical debt and story developement and not devote the majority of the sprint to either

- One thing you are proud of as a Team!!
  - This sprint we managed to plan our time as a team more efficiently, distributing better the developement time across the sprint.
