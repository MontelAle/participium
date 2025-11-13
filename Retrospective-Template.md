TEMPLATE FOR RETROSPECTIVE (Team ##)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done 4/4
- Total points committed vs. done 14/14
- Nr of hours planned vs. spent (as a team) 94h/93h50m

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing 106/106
- Code review completed 8/8
- Code present on VCS Yes
- End-to-End tests performed 17/17

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story                             | # Tasks | Points | Hours est. | Hours actual |
|-----------------------------------|---------|--------|------------|--------------|
| _Uncategorized_                   |   7     |   -    |    39h30m  |     42h20m   |
| PRT1-Registration/Login           |   7     |   5    |    19h30m  |     21h10m   |  
| PRT2-Set up municipality users    |   8     |   5    |    18h30m  |     13h10m   |  
| PRT3-Role assignment              |   5     |   2    |     5h30m  |      7h05m   |
| PRT4-Georeport location           |   7     |   2    |     11h    |     12h05m   |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean  | StDev |
|------------|-------|-------|
| Estimation | 2h29m | 3h09m | 
| Actual     | 2h29m | 2h59m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

  $$
  \frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1
  = \frac{93.84}{94.00} - 1
  = -0.0017
  \approx -0.17\%
  $$

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.482 = 48.2\% $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated 4h30m
  - Total hours spent 5h40m
  - Nr of automated unit test cases 106
  - Coverage Stmts->100 , Branch->87.24 , %Funcs->100 , %Lines->100
- E2E testing:
  - Total hours estimated 2h
  - Total hours spent 2h30m
  - Nr of test cases 17
- Code review 
  - Total hours estimated 13h30m
  - Total hours spent 15h30m
  


## ASSESSMENT

- What did go wrong in the sprint?

- What caused your errors in estimation (if any)?

- What lessons did you learn (both positive and negative) in this sprint?

- Which improvement goals set in the previous retrospective were you able to achieve? 
  
- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two

- One thing you are proud of as a Team!!



## Checklist for project self-evaluation 


### COORDINATION AND PLANNING

- Are Scrum Meetings performed regularly?
- Is workload among team members balanced?
- Is workload of members close to the expected one?
- Are user stories moved to sprint boards according to planning and actual development?
- Is task size consistent with guidelines?
- Are tasks estimated?
- Is time spent on tasks tracked?
- Are all sprint boards complete with planned tasks?
- Are there estimated and tracked technical tasks?
- Are retrospectives conducted collectively?
- Are retrospectives filled with meaningful and precise data?
- Do retrospectives generate concrete and verifiable improvements in next sprint?


### DEVELOPMENT AND QUALITY ASSURANCE

- Is the definition of done fully respected?
- Are all functionalities of a story working properly?
- Is priority of backlog respected?
- Is there evidence of manual testing?
- Are test data for demo prepared in advance?
- Is technical debt management estimated?
- Is technical debt management performed and tracked?
- Is deployment of container tested on more than a pc?
- Are the instructions to run your docker image present on DockerHub or GitHub?"
- Is documentation of the release complete (e.g., credentials, readme, etc.)?
- Are GitHub issues promptly opened after giving feedback?
- Is follow-up activity on a feedback GitHub issue properly tracked?