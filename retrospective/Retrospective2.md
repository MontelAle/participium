TEMPLATE FOR RETROSPECTIVE (Team 12)
=====================================


The retrospective should include _at least_ the following
sections:


- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)


## PROCESS MEASURES 


### Macro statistics


- Number of stories committed vs. done 5/5
- Total points committed vs. done 14/14
- Nr of hours planned vs. spent (as a team) 106,5/96


**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing: 180/180
- Code review completed: 16
- Code present on VCS: Yes
- End-to-End tests performed: 114


> Please refine your DoD if required (you cannot remove items!) 


### Detailed statistics


| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _Uncategorized_   |   13      |   /    |      60      |       55      |
|  PRT-5/Report-details     |     8     |   2     |     8,5       |        9,2      |  
|   PRT-6/Issue-approval    |      8         |   2    |    7,5       |       7,2        |
|   PRT-7/View-reports-on-map |     10      |   8     |     15     |     12          |
|   PRT-8/Technical-officer-view |    8  |     1      |    5,5   |        4       |
|   PRT-9/Citizen-account-config |    8  |   1    |     10      |     8,6          |


> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)


- Hours per task average, standard deviation (estimate and actual)


|            | Mean | StDev |
|------------|------|-------|
| Estimation |  2h 1m    |  2h 38m     | 
| Actual     |  1h 45m    |  2h 22m     |
-------------------


Normalized values:

|            | Mean | StDev |
|------------|------|-------|
| Estimation |  1h 7m    |   34m    | 
| Actual     |  1h    |  35m     |

> Since for some of the bigger task we work in groups the normalized values represent estimation/actual time spent per task per person; therefore a better indicator than the raw values


- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1


    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1
    = \frac{96}{106.5} - 1
  = -0.0986 
  \approx -9.86\%$$

This figure is higher than the previous sprint, as stated above we severly overestimated time needed for fixes and review.
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n


    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.1903 \approx 19.03\%$$

This result improves on the previous's sprint 29.6%, meaning that our estimation skills are getting better!
  
## QUALITY MEASURES 


- Unit Testing:
  - Total hours estimated: 5h
  - Total hours spent: 4h25m
  - Nr of automated unit test cases: 180
  - Coverage: %Stmts->100 , %Branch->82.24 , %Funcs->100 , %Lines->100
- E2E testing:
  - Total hours estimated: 4h
  - Total hours spent: 1h45m
  - Nr of test cases: 114
- Code review 
  - Total hours estimated: 17h
  - Total hours spent: 13h10
  




## ASSESSMENT


- What did go wrong in the sprint?
    - Pull request's descriptions and titles were often vague and of little help to the reviewer
    - React's best practice for component usage wasn't always followed, leading to many components being used only once and duplicated rather than re-used properly
    - Implementation details weren't always clear from the start which lead to many refactors and change of direction with the code


- What caused your errors in estimation (if any)?
    - Uncategorized tasks: we overestimated the time for reviewing, but underestimated the time to solve the profile icon issue
    - PRT-5/Report details: we underestimated tasks on backend while overestimating the frontend review and testing
    - PRT-6/Issue approval: slightly underestimated the frontend part
    - PRT-7/View reports on map: sligtly overestimated review and testing
    - PRT-8/Technical officer view: sligtly overestimated review and testing
    - PRT-9/Citizen account config: overestimated the review

    -  Overall assessment: e2e tests were overestimated for all the stories and the application didn't need any big last-minute fixes (PRT-54 and PRT-110). Since we haven't any other major errors we consider this sprint's estimation effort a success 

- What lessons did you learn (both positive and negative) in this sprint?
    - Increasing scrum meeting's frequency and communicating effectively during the sprint was very useful to keep everyone aligned and boost the team's efficiency
    - The time spent on configuration and setup for the repository helped to save time on developement and testing
    - The lack of shared standards for the frontend developement caused consistency issues and integration problems


- Which improvement goals set in the previous retrospective were you able to achieve? 
    - Increase scrum meetings to keep the team aligned
    - Break tasks down into smaller, time-boxed goals, to help manage progress
  
- Which ones you were not able to achieve? Why?
    - Improve documentation: we prioritized other goals over this one as we didn't change the way we document the application, however we still plan to address the organizational issue, for next sprint, from a different angle 


- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
    - Focus on more technical aspects during sprint planning, as we are often left wandering on how to properly implement features in an effective and cohesive way
    - Stick closer to project requirement to avoid wasting time and to focus on the top priority features


- One thing you are proud of as a Team!!
    - Team members that are already experienced and proficient in the adopted tools are mentoring effectively the less experienced members, which in turn are able to keep up and improve quickly to contribute on the same level to the success of the product 
