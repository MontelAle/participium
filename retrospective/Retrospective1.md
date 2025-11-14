TEMPLATE FOR RETROSPECTIVE 1(Team 12)
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
- Nr of hours planned vs. spent (as a team) 94h/96h05m

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing 123/123
- Code review completed 8/8
- Code present on VCS Yes
- End-to-End tests performed 17/17

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story                             | # Tasks | Points | Hours est. | Hours actual |
|-----------------------------------|---------|--------|------------|--------------|
| _Uncategorized_                   |   7     |   -    |    39h30m  |     42h20m   |
| PRT1-Registration/Login           |   7     |   5    |    19h30m  |     21h10m   |  
| PRT2-Set up municipality users    |   8     |   5    |    18h30m  |     13h30m   |  
| PRT3-Role assignment              |   5     |   2    |     5h30m  |      7h05m   |
| PRT4-Georeport location           |   7     |   2    |     11h    |     12h      |
| Total                             |   34    |   14   |     94h    |     96h05m   |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean  | StDev |
|------------|-------|-------|
| Estimation | 2h46m | 3h08m | 
| Actual     | 2h50m | 3h16m |

- Mean 

  $$
  Mean_{estimation} = 
  \frac{\sum_i estimation_{task_i}}{n}
  = \frac{94h}{34}
  = 2h46m 
  $$

  $$
  Mean_{actual} = 
  \frac{\sum_i spent_{task_i}}{n}
  = \frac{96h05m}{34}
  = 2h50m 
  $$

  The average duration of a task is slightly longer in actual time

- StDev

  $$
  \sigma_{estimation} = \sqrt{\frac{1}{34} \sum_{i=1}^{34} (x_i - \ 2h46m) ^2} = 3h08m
  $$

  $$
  \sigma_{actual} = \sqrt{\frac{1}{34} \sum_{i=1}^{34} (x_i - \ 2h50m) ^2} = 3h16m
  $$

  The standard deviation measures how much the times of individual tasks deviate from the mean.
  For the estimated time σ_estimation = 3h08m, which means that the estimated durations for many tasks deviate from the mean of 2h46m by roughly 3 hours.
  For the actual time , the actual durations vary around the mean of 2h50m, with a standard deviation of 3h16m.
  The fact that σ_actual > σ_estimation suggests that the actual work showed slightly higher variability than initially estimated.


- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

  $$
  \frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1
  = \frac{96.0833}{94.0000} - 1
  = -0.0221 
  \approx 2.21\%
  $$

  In total , the actual time was approximately 2.21% higher than the estimated time.
  This is a good result that indicates a close overall estimate.

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.296 = 29.6\% $$

  On average , each task deviated about 29.6% from the estimate, either positively or negatively
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated 4h30m
  - Total hours spent 5h40m
  - Nr of automated unit test cases 123
  - Coverage %Stmts->100 , %Branch->87.24 , %Funcs->100 , %Lines->100
- E2E testing:
  - Total hours estimated 2h
  - Total hours spent 2h30m
  - Nr of test cases 17
- Code review 
  - Total hours estimated 16h40m
  - Total hours spent 19h40m

## ASSESSMENT

- What did go wrong in the sprint?
  - Task assignment -
    Tasks were assigned to team members, but not always matched to who was immediately available. This sometimes slowed down the start of tasks and overall progress.
  - Team organization / coordination -
    The team was not always aligned on each other’s progress, and infrequent meetings sometimes led to misunderstandings.
  - Task organization -
    Tasks were not always broken down or structured in a clear way, making it harder to track and estimate progress.
    Some tasks required rework because initial assumptions or requirements were unclear.

- What caused your errors in estimation (if any)?
  - Uncategorized tasks: time for Scrum meetings was underestimated.
  - PRT-1/Registration-Login : test and code review were underestimated because the size of the task was not fully understood.
  - PRT-2/Set up municipality user : backend work was overestimated.
  - PRT-3/Role assignment : frontend work was underestimated.
  - PRT-4/Georeport location : code review and testing were underestimated.
  
  Overall cause: Our limited experience, combined with it being our first time planning a two-week sprint, made it more challenging to estimate and organize tasks accurately.
  
- What lessons did you learn (both positive and negative) in this sprint?
  - Rely on your teammates: trusting and depending on each other helps the team move forward efficiently.
  - A positive work environment matters: a supportive and collaborative atmosphere improves productivity and motivation.
  - Asking for help is okay: seeking assistance from others is not a problem and can prevent delays or mistakes.

- Which improvement goals set in the previous retrospective were you able to achieve?
  - Task assignment: most tasks were assigned at the beginning of the sprint.
  - Write more tests and increase coverage

- Which ones you were not able to achieve? Why?
  - start with a more clear plan/path and documentation : we spent time on other aspects/priorities instead of starting with a clear and planned documentation .
  - think deeper about time estimation before assign tasks : We are still learning how to accurately estimate tasks and organize ourselves as efficiently as possible, so this will improve with experience.


- Improvement goals for the next sprint and how to achieve them:
  - Set smaller deadlines during meetings: breaking tasks into smaller, time-boxed goals can help keep progress visible and manageable.
  - Increase Scrum meetings: more frequent check-ins can improve team coordination and alignment.
  - Improve documentation: dedicating more time to clear and updated documentation will help the team work more efficiently and reduce misunderstandings.


- One thing you are proud of as a Team!!
  - We are proud of our strong teamwork, supporting each other, and staying flexible, which allowed us to overcome challenges and deliver a higher-quality product. Our collaboration and adaptability continue to be our greatest strengths, and we aim to improve them even further in future sprints.