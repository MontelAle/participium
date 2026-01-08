TEMPLATE FOR RETROSPECTIVE (Team ##)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done : 8/8
- Total points committed vs done : 
- Nr of hours planned vs spent (as a team) : 97h/96h15m

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing 
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _#0_   |         |    -   |            |              |
| n      |         |        |            |              |
   

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
    - Address code issues at the beginning of the sprint and during final review
    - Keep issue on SonarCloud at a minimum over the pull-requests
  - Total hours estimated estimated at sprint planning
  - Total hours spent
  


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