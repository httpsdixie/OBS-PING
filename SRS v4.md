**SOFTWARE REQUIREMENTS SPECIFICATION**

**The Observer Task Assigning and Reminding System**

Prepared by:

Labiste, Jonathan Jr. A.

Lacbayo, Mildred C.

Perida, Dixie Shanne L.

Software Engineering

Engr. Joseph Jaymel S. Morpos

Eastern Visayas State University \- Ormoc Campus

May 19, 2026

# **TABLE OF CONTENTS** {#table-of-contents}

[TABLE OF CONTENTS	1](#table-of-contents)

[1 INTRODUCTION	4](#1-introduction)

[1.1 Purpose	4](#purpose)

[1.2 Scope	4](#scope)

[1.3 Definitions, Acronyms, and Abbreviations	4](#definitions,-acronyms,-and-abbreviations)

[1.4 References	4](#references)

[1.5 Document Overview	5](#document-overview)

[2 OVERALL DESCRIPTION	6](#overall-description)

[2.1 Product Perspective	6](#product-perspective)

[2.2 Product Features	6](#product-features)

[2.3 User Classes and Characteristics	6](#heading=)

[2.4 Operating Environment	7](#operating-environment)

[2.5 Design Constraints	7](#heading=)

[2.6 Assumptions and Dependencies	7](#heading=)

[3 USE CASE SCENARIOS	8](#use-case-scenarios)

[3.1 UC-01: Assign Task from Directory	8](#uc-01:-assign-task-from-directory)

[*3.1.1 Main Success Scenario	8*](#main-success-scenario)

[*3.1.2 Alternative Flows	8*](#alternative-flows)

[*3.1.3 Postconditions	8*](#postconditions)

[3.2 UC-02: Update Task Status	9](#uc-02:-update-task-status)

[*3.2.1 Main Success Scenario	9*](#main-success-scenario-1)

[*3.2.2 Alternative Flows	9*](#alternative-flows-1)

[*3.2.3 Postconditions	9*](#postconditions-1)

[3.3 UC-03: User Directory Management (Promote/Deactivate)	9](#uc-03:-user-directory-management-\(promote/deactivate\))

[*3.3.1 Main Success Scenario	10*](#main-success-scenario-2)

[*3.3.2 Alternative Flows	10*](#alternative-flows-2)

[3.3.3 Postconditions	10](#heading=)

[3.4 UC-04: Archive or Delete Task	10](#uc-04:-archive-or-delete-task)

[*3.4.1 Main Success Scenario	10*](#main-success-scenario-3)

[*3.4.2 Alternative Flows	10*](#alternative-flows-3)

[*3.4.3 Postconditions	11*](#postconditions-2)

[3.5 UC-05: Publish and Archive Task	11](#uc-05:-publish-and-archive-task)

[*3.5.1 Main Success Scenario	11*](#main-success-scenario-4)

[*3.5.2 Alternative Flows	11*](#alternative-flows-4)

[*3.5.3 Postconditions	11*](#postconditions-3)

[3.6 UC-06: User Login with OTP Verification	11](#uc-06:-user-login-with-otp-verification)

[3.6.1 Main Success Scenario	12](#main-success-scenario-5)

[3.6.2 Alternative Flows	12](#alternative-flows-5)

[3.6.3 Postconditions	12](#postconditions-4)

[4 USER STORIES	13](#user-stories)

[4.1 US-01	13](#us-01)

[4.2 US-02	13](#us-02)

[4.3 US-03	13](#us-03)

[4.4 US-04	14](#us-04)

[4.5 US-05	14](#us-05)

[4.6 US-06	14](#us-06)

[4.7 US-07	15](#us-07)

[4.8 US-08	15](#us-08)

[4.9 US-09	15](#us-09)

[4.10 US-10	15](#us-10)

[4.11 US-11	16](#us-11)

[5 FUNCTIONAL REQUIREMENTS	17](#functional-requirements)

[5.1 FR-01: User Authentication & Role Assignment	17](#fr-01:-user-authentication-&-role-assignment)

[5.2 FR-02: Directory Management & Deactivation	17](#fr-02:-directory-management-&-deactivation)

[5.3 FR-03: Directory-Driven Assignment	18](#fr-03:-directory-driven-assignment)

[5.4 FR-04: Internal Buffer Logic Validation	18](#fr-04:-internal-buffer-logic-validation)

[5.5 FR-05: Task Status Tracking	18](#fr-05:-task-status-tracking)

[5.6 FR-06: Master List Dashboard	19](#fr-06:-master-list-dashboard)

[5.7 FR-07: Master List Filtering	19](#fr-07:-master-list-filtering)

[5.8 FR-08: Master List Visibility	20](#fr-08:-master-list-visibility)

[5.9 FR-09: Automated Reminder Generation	20](#fr-09:-automated-reminder-generation)

[5.10 FR-10: Manual Notification Trigger	21](#fr-10:-manual-notification-trigger)

[5.11 FR-11: Task Editing	21](#fr-11:-task-editing)

[5.12 FR-12: Archive, Delete & Notification	21](#fr-12:-archive,-delete-&-notification)

[5.13 FR-13: Multi-Tiered Approval	22](#fr-13:-multi-tiered-approval)

[5.14 FR-14: Manual Task Status Changing	22](#fr-14:-manual-task-status-changing)

[5.15 FR-15: Auto-Archiving on Approval	23](#fr-15:-auto-archiving-on-approval)

[5.16 FR-16: Password Reset via OTP	23](#fr-16:-password-reset-via-otp)

[5.17 FR-17: Audit Logging	24](#fr-17:-audit-logging)

[5.18 FR-18: EIC Succession / Role Transfer	24](#fr-18:-eic-succession-/-role-transfer)

[6 NON-FUNCTIONAL REQUIREMENTS	25](#non-functional-requirements)

[6.1 Performance	25](#performance)

[6.2 Security	25](#security)

[6.3 Usability	26](#usability)

[6.4 Reliability	26](#reliability)

[6.5 Scalability	26](#scalability)

[6.6 Availability	26](#availability)

[6.7 Data Integrity	26](#data-integrity)

[6.8 Maintainability	27](#maintainability)

[6.9 Backup and Recovery	27](#backup-and-recovery)

[7 SYSTEM ARCHITECTURE	28](#system-architecture)

[8 INTERFACE REQUIREMENTS	29](#interface-requirements)

[8.1 User Interface	29](#user-interface)

[8.2 Software Interface	29](#software-interface)

[8.3 Hardware Interface	29](#hardware-interface)

[9 DATA REQUIREMENTS	30](#data-requirements)

[9.1 Database Overview	30](#database-overview)

[9.2 Data Integrity Rules	30](#data-integrity-rules)

[**10 ACCEPTANCE CRITERIA	33**](#acceptance-criteria)

[11 APPENDICES	36](#appendices)

# **1 INTRODUCTION**  {#1-introduction}

1. ## **Purpose** {#purpose}

The purpose of this Software Requirements Specification (SRS) is to articulate the functional and non-functional requirements for the Observer Task Assigning and Reminding System. This document serves as the formal agreement and blueprint for developers and stakeholders, ensuring a clear, unambiguous guide for system development and expected outcomes.

2. ## **Scope**  {#scope}

The current task assignment process for The Observer is inefficient, relying on disparate tools like Google Sheets for allocation and Messenger for reminders and status updates. The Observer Task Assigning and Reminding System is a mobile-first, web-responsive application designed to centralize and streamline task management. Its primary purpose is to provide a comprehensive reminder system for staff deadlines and a centralized directory of all personnel to accelerate task assignment and enhance task tracking efficiency and reliability.

3. ## **Definitions, Acronyms, and Abbreviations** {#definitions,-acronyms,-and-abbreviations}

| Term | Definition |
| ----- | ----- |
| Ed Board | Editorial Board members, including Department Heads, who are responsible for assigning and checking tasks. |
| EIC | Editor-in-Chief, the highest-level executive user of the system. |
| Internal Deadline | The required submission date, which the system calculates as 2 days before the final posting date. |
| Master List | The main consolidated dashboard view showing all active tasks for the publication. |
| RBAC | Role-Based Access Control, the security method used to restrict what different users can see and do in the app. |

   4. ## **References**  {#references}

* [Requirements Gathering Summary: Stakeholder Interviews](https://drive.google.com/drive/folders/1t3xoGQa06HNtnAs5bBVFWg-wHA_a2KOw?usp=sharing) 

* [Requirements Gathering Summary: Survey Elicitation](https://drive.google.com/drive/folders/1QoqTD9Kw-pr1uHTLs9yZ72MGisfmyayP?usp=drive_link)

* [Observation of current processes / Review of existing systems](https://drive.google.com/drive/folders/1g-rCvTtgsYY80zQaWCkQekG9OdHWS_IZ?usp=drive_link) 

* [IEEE Standard 830-9.19998: Recommended Practice for Software Requirements Specifications](https://ieeexplore.ieee.org/document/720574)

* [Republic Act No. 10173: Data Privacy Act of 2012](https://www.privacy.gov.ph/data-privacy-act/)

  5. ## **Document Overview**  {#document-overview}

The remaining sections of this Software Requirements Specification will provide the complete breakdown and description of the Observer Task Assigning and Reminding System. Section 2 is about the overall description, it explains the different user roles, features, and the system's operating environment. Sections 3 and 4 explain how the publication members will interact with the system and detailing use cases and user stories. Sections 5 and 6 list the functional and non-functional requirements that the system is expected to have. Finally, the last parts of the document wraps up with the technical architecture diagrams and the interface rules to guide the developers on the upcoming coding phase.

.

2. # **OVERALL DESCRIPTION**  {#overall-description}

   1. ## **Product Perspective**  {#product-perspective}

The Observer Task Assigning and Reminding System is a new, standalone web-based application. This system is not intended to be an add-on to any existing system. The Observer's Editorial Board currently relies on Google Sheets and Messenger for task allocation and reminders, a decentralized process prone to inefficiency, lost information, and confusion. The goal of this web application is to resolve the critical issues of missed deadlines and unreceived task assignments.

2. ## **Product Features**  {#product-features}

* A directory-driven dropdown for task assignment, eliminating manual name entry and reducing the risk of typographical errors.  
* An automatic reminder system that tracks deadlines based on the internal publication buffer rules.  
* A Master List dashboard with List, Grid, and Calendar views; status badges (Assigned, Submitted, Checked, Published), overdue tasks highlighted in red.  
* Super Admin Center for the EIC: create accounts, deactivate users, assign roles, EIC succession, and audit logging for directory changes.

  3. ## **User Classes and Characteristics**

| User Type | Description | Skill Level |
| ----- | ----- | ----- |
| EIC | The person who manages the overall publication workflow, enforces policies, and gives final approval on all submitted articles. | Advanced |
| Ed Board | These are department heads who are responsible for task assignments, editing instructions, and sending manual reminders. | Intermediate |
| Editorial Consultant | Read-only access to Master List and directory for guidance; cannot create or modify tasks. | Intermediate |
| Staff | These are regular staff such as writers, illustrators, and photojournalists who use the app to check their task assignments. | Basic |

## 

  4. ## **Operating Environment**  {#operating-environment}

* The system works primarily on mobile web browsers such as Chrome and Edge.  
* Internet connection is required.  
* The system must operate efficiently on standard personal smartphones, as these are the primary devices used by most staff members.

  5. ## **Design Constraints** 

* The system should block users from setting tasks deadlines that violate the publication's mandatory 2 day submission buffer.

* The system must strictly use a Role-Based Access Control (RBAC) in order to ensure that regular staff cannot view or edit the Ed Board's master list.

* The system must comply with the Republic Act No. 10173, also known as the Data Privacy Act of 2012\. Since the system stores personal information of students (names, email addresses, and roles), the collection and use of this data must be limited to what is necessary for the publication's task management operations. User data must not be shared with third parties, and deactivated accounts must be retained in a non-accessible state rather than deleted, to preserve records while preventing unauthorized use.

  6. ## **Assumptions and Dependencies** 

* We assume every student on the publication staff has a working personal smartphone and an active institutional email account.

* For the system to be operational immediately, we depend on the administration to give us an accurate and complete list of staff contacts during the initial setup.

3. # **USE CASE SCENARIOS** {#use-case-scenarios}

   1. ## **UC-01: Assign Task from Directory** {#uc-01:-assign-task-from-directory}

Actor: Ed Board / EIC

Editorial Board members typically communicate task assignments via Messenger, a method resulting in scattered information and disorganization. This use case enables them to formally assign a task by selecting a staff member from a centralized directory dropdown list, ensuring official record-keeping.

Preconditions:  The Ed Board member is logged in. The admin already set up the student accounts.

Trigger: The editor clicks 'New Task'.

1. ### *Main Success Scenario*  {#main-success-scenario}

1. To start, the editor fills out the required text boxes that include the task title and task details.

2. Then, they open the directory dropdown and select the name of the staff that is taking the job.

3. The editor clicks “Assign”, the task appears on the Master List.

4. The system automatically calculates the internal deadline exactly two days before the final posting date and notifies the assignee.

   2. ### *Alternative Flows*  {#alternative-flows}

A1 \- Staff not yet registered in the system

In the event that a staff member is not yet registered in the system, their name will not appear in the drop down box. The EIC must create or reactivate the account in the Super Admin Center first.

3. ### *Postconditions* {#postconditions}

The task record is accurately created and assigned to the intended staff member.

2. ## **UC-02: Update Task Status** {#uc-02:-update-task-status}

Actor: Staff, Ed Board, EIC

Each task must progress through a defined publication workflow before receiving final approval.

Preconditions: A task stage is active for the actor.

Trigger: The user opens the task and clicks the action for their respective roles.

1. ### *Main Success Scenario* {#main-success-scenario-1}

1. Staff: they select “Acknowledge”, and when the work is ready, “Submit to Head”.

2. Ed Board: they review a submitted task and click “Check” or “Send Back” with a comment.

3. EIC: approves a checked task, the task becomes “Published”.

   2. ### *Alternative Flows* {#alternative-flows-1}

A1 \- Needs Revision

If the Ed Board or EIC sends a task back, the staff needs to fix the work and re-acknowledges/submit again. 

3. ### *Postconditions* {#postconditions-1}

Stage and task statuses update on the Master List and in-app notifications.

3. ## **UC-03: User Directory Management (Promote/Deactivate)** {#uc-03:-user-directory-management-(promote/deactivate)}

Actor: EIC

Description: The EIC can change the role of a user, for example, if the user is promoted to a higher position, reassigned to a different department, or has graduated.

Preconditions: The EIC must be logged into the administrative dashboard.

Trigger: The EIC chooses a user profile to modify.

1. ### *Main Success Scenario* {#main-success-scenario-2}

1. The EIC opens the Staff Directory.

2. The EIC chooses a user profile and modifies the user’s role (e.g., Staff to Ed Board).

3. The system then changes the user's RBAC permissions.

   2. ### *Alternative Flows* {#alternative-flows-2}

A1-Deactivate User

If a staff graduates, the EIC can update the staff’s status into “Deactivated” to still retain the staff’s data without it appearing in the current staff directory and without deleting it in the system.

3. ### *Postconditions*

The staff’s new role or status is now reflected in the system.

4. ## **UC-04: Archive or Delete Task** {#uc-04:-archive-or-delete-task}

Actor: Ed Board, EIC

Description: Completed tasks are archived and removed in the master list. The EIC can delete an assigned task as long as no stage has been started.

Preconditions: A task currently exists in the system.

Trigger: The Ed Board member clicks "Archive*,* or EIC clicks “Delete”.

1. ### Main Success Scenario {#main-success-scenario-3}

1. Archived: Ed Boards selects published or past deadline tasks and clicks “Archive”. It will no longer be in the master list but instead in the archive view.

2. Delete: ECI selects an assigned task and confirms deletion.

   2. ### *Alternative Flows* {#alternative-flows-3}

A1-Cannot delete after work started

The EIC cannot delete a  task once it has already left the “Assigned” status. 

3. ### *Postconditions* {#postconditions-2}

Archived tasks are hidden from the active list; deleted tasks are permanently removed.

5. ## **UC-05: Publish and Archive Task** {#uc-05:-publish-and-archive-task}

Actor: EIC

Description: After reviewing the tasks at hand, the EIC then grants final publication approval and publishes the submitted work.

Preconditions: The task status is marked as "Pending EIC" by Ed Board.

Trigger: The EIC clicks "Publish".

1. ### *Main Success Scenario* {#main-success-scenario-4}

1. The EIC reviews the submitted task output.

2. The EIC clicks the "Publish" button.

3. The system removes the task from the active Master List.

4. The system archives the task automatically.

   2. ### *Alternative Flows* {#alternative-flows-4}

A1-Reject Output

If the submitted task does not satisfy the EIC’s requirements, the EIC can reject it. 

3. ### *Postconditions* {#postconditions-3}

The active Master List remains uncluttered by completed work.

6. ## **UC-06: User Login with OTP Verification** {#uc-06:-user-login-with-otp-verification}

Actor: All Users

Description: All of the users  must go through a two-step authentication process. After entering their credential, they will receive an OTP that they must verify before a session is granted.

Precondition: The user has an active account.

Trigger: The user logs in using its credentials.

1. ### *Main Success Scenario* {#main-success-scenario-5}

1. The user enters their registered email address and password.

2. The system validates the credentials. If correct, it generates a 6-digit OTP and sends it to the user's registered email address.

3. The user enters the OTP on the verification screen.

4. The system validates the OTP. If correct and not expired, it creates a session and redirects the user to their dashboard.

   2. ### *Alternative Flows* {#alternative-flows-5}

A1 \- Incorrect Credentials

If the email or password is wrong, the system shows an error and does not send an OTP. The user must re-enter their credentials.

A2 \- Expired or Incorrect OTP

If the OTP entered is wrong or has expired (after 10 minutes), the system shows an error. The user must request a new OTP and try again.

3. ### *Postconditions* {#postconditions-4}

The user has a session and the dashboard appears.

4. # **USER STORIES**  {#user-stories}

   1. ## **US-01**  {#us-01}

User Story: As an Ed Board editor, I want to be able to pick a staff from a dropdown list for easy assigning so that I do not misspell their names and accidentally assign the task to the wrong staff.

Acceptance Criteria:

* The dropdown list will only pull names of staff who are currently active.  
* When I click a name, the app locks that specific student to the new task assignment.


  2. ## **US-02** {#us-02}

User Story: As an Ed Board editor, I want the system to implement the 2-days deadline buffer so that I will not accidentally schedule a deadline of a task that is less than 2 days to give the staff ample time to make the tasks.

Acceptance Criteria:

* The date-picker blocks me from choosing a deadline less than two days away.


  3. ## **US-03** {#us-03}

User Story: As a staff, I want the system to send me automatic notifications when new tasks have been posted or when the task deadline is near so that I will not miss the deadline.

Acceptance Criteria:

* The system sends a notification to the staff's email.  
* The notification clearly states the details about the task and the deadline date.


  4. ## **US-04** {#us-04}

User Story: As a staff, I want an easy way to let the Ed Boards know that I have acknowledged and submitted the task so that I will not have to message them directly in Messenger.

Acceptance Criteria:

* I can click "Acknowledge" when I receive the task.  
* I can click "Submit" when my work is ready for review.

  5. ## **US-05** {#us-05}

User Story: As an Ed Board, I want to have an option to alert them directly without having to wait for the automatic notification so that I can notify them during urgent task assignments.

Acceptance Criteria:

* Clicking the manual "Poke" button will send a notification to the staff's phone alerting them that the task is for urgent passing. The button is disabled for 60 seconds after each use to prevent notification spam.


  6. ## **US-06** {#us-06}

User Story: As the EIC, I want the staff to only see their assigned work while the Ed Boards and consultants can see the full list.

Acceptance Criteria:

* Staff cannot see the task master list.  
* Ed Boards and consultants can see all tasks in the master list.


  7. ## **US-07** {#us-07}

User Story: As an Ed Board, I want to clear finished work from the active list, and as EIC I want to delete mistaken assignments so that the active task master list is not cluttered.

Acceptance Criteria:

* The EIC's "Publish" action on a task triggers auto-archiving (FR-15); I can also manually archive tasks that are past the deadline.  
* The EIC deletes a task that has not been started yet.


  8. ## **US-08** {#us-08}

User Story: As the EIC, I want the system to automatically remove published tasks to the active master list screen so that the dashboard will not be cluttered with finished tasks.

Acceptance Criteria:

* When I click the "Publish" button on a task, the system will remove that specific task from the active master list.  
* It puts the published task to a read-only archive.


  9. ## **US-09** {#us-09}

User Story: As a staff, I want to be able to see all of my assigned tasks in an organized way so that I can easily track what I need to prioritize.

Acceptance Criteria:

* The dashboard displays all of the assigned tasks  
* The tasks are sorted by deadline, from nearest to farthest


  10. ## **US-10** {#us-10}

User Story: As an Ed Board, I want to be able to view the progress of all assigned tasks so that I can monitor which tasks will be completed in time or be delayed.

Acceptance Criteria:

* The dashboard shall display a status overview of all tasks  
* I can filter tasks by status, staff assigned, or deadlines

  11. ## **US-11** {#us-11}

User Story: As a user, I want to be able to reset my password through my registered email so that I can regain access to the system if I forget my credentials without having to ask the EIC to fix it manually.

Acceptance Criteria:

* A "Forgot Password" link is visible on the login screen.  
* After entering my registered email, I receive a 6-digit OTP that expires in 10 minutes.  
* I can enter the OTP and set a new password, after which my old password is immediately invalidated.


5. # **FUNCTIONAL REQUIREMENTS**  {#functional-requirements}

   1. ## **FR-01: User Authentication & Role Assignment** {#fr-01:-user-authentication-&-role-assignment}

Description: The system shall require users to authenticate using a two-step login process: first by entering their registered email and password, then by verifying a 6-digit One-Time Password (OTP) sent to their registered email address. Upon successful verification, the system will display the appropriate interface based on the user's role (Staff, Ed Board, or EIC).

Rationale: The system must ensure that staff cannot view or access the Ed Board's or EIC's dashboards, preventing unauthorized interference with task assignments. The OTP challenge adds a second layer of security so that a stolen password alone is not enough to access the system.

Acceptance Criteria:

* The login screen requires both a valid email/password combination and a correct 6-digit OTP sent to the user's registered email before granting access.  
* The OTP expires after 10 minutes; an expired or incorrect code is rejected and the user must request a new one.  
* Staff see only their own assigned tasks on their personal dashboard.  
* Ed Board members and Editorial Consultants see the full Master List of all active tasks.  
* The EIC sees everything, including the Master List and the Super Admin Center for user and directory management.

  2. ## **FR-02: Directory Management & Deactivation** {#fr-02:-directory-management-&-deactivation}

Description: The system shall allow the EIC to add new users, update the current roles of an already existing staff, or deactivate the users who have graduated instead of deleting them.

Having the ability to update user roles is essential because staff positions change and personnel graduate each academic year, requiring the system to be accurately updated.

Acceptance Criteria: 

* If the EIC changes the role of a staff, it should be reflected also to the staff's dashboard.

* If the EIC deactivates an account of a graduated staff, their name should disappear from the dropdown list of staff, but their information will stay intact in the archives.

  3. ## **FR-03: Directory-Driven Assignment** {#fr-03:-directory-driven-assignment}

Description: The system shall automatically get the names of the staff from a database to a dropdown list to avoid typing the name of the staff manually when assigning a task.

Rationale: By having a dropdown list, it will reduce the risk of the task assigner misspelling staff’s name or misassigning the task.

Acceptance Criteria: 

* The dropdown list must display only active user accounts (where status \= active) from the database, and populate in under 1 second when the assigner clicks the field.

  4. ## **FR-04: Internal Buffer Logic Validation** {#fr-04:-internal-buffer-logic-validation}

Description: The system shall not allow the task assigner to assign a task that violates the 2-days buffer rule for assigning a task.

Rationale: The Observer usually needs 2 days to check the finished task for changes, that is why submissions are required 2 days prior to the final posting date.

Acceptance Criteria: 

* If the task assigner tries to set a deadline that is less than 2 days from the current date and time, the system should not allow the task to be saved.


  5. ## **FR-05: Task Status Tracking** {#fr-05:-task-status-tracking}

Description: The system shall track the stages of the tasks, from Assigned → Acknowledged → Submitted → Checked → Needs Revision → Pending EIC → Published.

Rationale: This facilitates the Ed Board’s supervision by providing real-time task progression visibility and limits the use of external messaging apps like Messenger. The "Needs Revision" status allows the Ed Board or EIC to send a task back to the staff for corrections, while "Pending EIC" marks tasks that have passed the Ed Board review and are awaiting the EIC's final decision.

Acceptance Criteria: 

* Any change in a task\&apos;s stage status must be reflected on the Master List dashboard within 2 seconds of the action being committed. The system must prevent unauthorized progression (e.g., must enforce the sequence: Assigned → Acknowledged → Submitted).


  6. ## **FR-06: Master List Dashboard** {#fr-06:-master-list-dashboard}

Description: The system shall generate a central dashboard that groups every active task together based on their day of posting, just like a calendar.

Rationale: The Ed Board requires a consolidated, centralized dashboard to monitor the publication's entire active workload.

Acceptance Criteria: 

* The Master List dashboard must accurately display 100% of tasks where the status is not Published and the archived flag is false. Tasks must be grouped chronologically by their final posting date.

  7. ## **FR-07: Master List Filtering** {#fr-07:-master-list-filtering}

Description: The system should have a sorting option for the Master List view to sort tasks on tags for easy navigation when trying to find a specific task or make a consolidated report.

Navigating an extensive active task list (e.g., thirty concurrent tasks) to locate a specific assignment is inefficient. Filtering capabilities are essential to isolate and review the workload of specific departments or sections.

Acceptance Criteria: 

* If an Ed Board filters the task by status, the dashboard instantly hides the other tasks and feature tasks to only show the chosen status.


  8. ## **FR-08: Master List Visibility** {#fr-08:-master-list-visibility}

Description: The system shall enforce the visibility of the master list through RBAC. Only the EIC, ED Boards, and Editorial Consultants can see the master list.

Rationale: Different roles need different views that is why permissions are assigned per user and role.

Acceptance Criteria:

* Staff cannot see the full task master list while the EIC, ED Boards, and Editorial Consultants can.


  9. ## **FR-09: Automated Reminder Generation** {#fr-09:-automated-reminder-generation}

Description: The system shall track the exact due date for every assigned task and the system should trigger an automatic notification to the student's phone when the deadline is fast approaching.

Rationale: Automated reminders ensure consistent adherence to publication deadlines without requiring manual intervention from the Editorial Board, mitigating the risk of human error or oversight during high-workload periods.

Acceptance Criteria: 

* When a task is first assigned, the system immediately sends an email notification to the assignee containing the task details and deadline date.

* When the countdown hits exactly two days (48 hours) before the required submission time, the system shall send a phone notification to the assignee within 5 seconds of the scheduled time.


  10. ## **FR-10: Manual Notification Trigger** {#fr-10:-manual-notification-trigger}

Description: The system shall allow the Ed Boards to also manually send a notification to a staff about their tasks.

Rationale: Reliance solely on the automated system is insufficient. When an assignment is required ahead of the planned deadline, the Ed Board must have the manual option to alert the staff to the urgent priority.

Acceptance Criteria: 

* An Ed Board clicks the manual notification and it should send an email to the staff’s phone notifying them.

* To prevent notification spam, the system enforces a 1-minute cooldown per task.


  11. ## **FR-11: Task Editing** {#fr-11:-task-editing}

Description: The system shall let editors go back into an active assignment to fix the instructions or change the dates as long as the reporter hasn't submitted it yet.

Rationale: Since event details frequently change, editors require a method to update coverage instructions without having to delete and re-create the assignment.

Acceptance Criteria: 

* An editor opens an existing task, changes the location text, hits save, and the reporter sees the new location on their end.


  12. ## **FR-12: Archive, Delete & Notification** {#fr-12:-archive,-delete-&-notification}

Description: The system shall allow Ed Boards to archive tasks that are past deadline and also allow EIC to delete untouched mistaken tasks..

Rationale: Completed or overdue tasks must be removed from the active list without permanent deletion of historical records. Mistaken assignments that nobody started may be permanently removed by the EIC.

Acceptance Criteria: 

* Ed Board archives overdue tasks and it should disappear in the active task master list and be put in the view-only archives.

* EIC deletes a task that is still not acknowledged by the assignee.


  13. ## **FR-13: Multi-Tiered Approval** {#fr-13:-multi-tiered-approval}

Description: The system shall lock the workflow so that an article submitted by a staff has to be reviewed by an Ed Board before the EIC can give it the final okay.

Rationale: This multi-tiered process accurately reflects The Observer’s editorial workflow, ensuring that all submissions undergo the requisite stages of review before final publication.

Acceptance Criteria: 

* The staff submits the task to the Ed Board, the Ed Board is satisfied with the work, they have to change the tasks status to “Checked”. The EIC then reviews the checked tasks and gives the final approval.


  14. ## **FR-14: Manual Task Status Changing** {#fr-14:-manual-task-status-changing}

Description: The users should be able to change their task status based on where they are in making the task.

Rationale: This ensures clarity in the workflow and reduces confusion regarding the task's current status.

Acceptance Criteria: 

* Staff: staff clicks "Acknowledged" when task is assigned, and clicks “Submit” when task is submitted.

* Ed Board: reviews the submitted tasks and clicks “Checked” if they are satisfied or “Send back” with notes otherwise.

* EIC: reviews tasks in "Pending EIC" status and clicks "Publish" to set the final status to Published.

  15. ## **FR-15: Auto-Archiving on Approval** {#fr-15:-auto-archiving-on-approval}

Description: The system shall automatically archive tasks that are approved and published by the EIC.

Rationale: The active task master list should only show tasks that are in progress to maintain a focused view of in-progress work.

Acceptance Criteria: 

* When the EIC approves and publishes the task, it should automatically be archived and removed to the active task master list.

  16. ## **FR-16: Password Reset via OTP** {#fr-16:-password-reset-via-otp}

Description: The system shall provide a password reset flow where users request a reset, receive a One-Time Password (OTP) via email, verify it, and securely set a new password. The system must appropriately handle OTP expiry and validation.

Rationale: Users frequently forget passwords. A secure, automated recovery method is necessary for them to regain access without requiring manual EIC intervention.

Acceptance Criteria: 

* The system sends an OTP to the user's registered email address upon request.  
* OTPs expire after a configured time limit, and expired or incorrect OTPs are rejected by the system.  
* Upon successful password reset, the old password becomes instantly invalid and cannot be used for login.


  17. ## **FR-17: Audit Logging** {#fr-17:-audit-logging}

Description: The system shall automatically record critical administrative actions, including account creation, role changes, user deactivations, and task deletions, into a dedicated audit log.

Rationale: To maintain accountability, transparency, and a clear history of system changes, leadership needs to be able to track who performed specific actions and when.

Acceptance Criteria: 

* Only the EIC can access and view the audit logs.  
* The logs are strictly read-only and cannot be modified or deleted by any user.  
* The interface allows the EIC to filter logs by action type, affected user, or timestamp.


  18. ## **FR-18: EIC Succession / Role Transfer** {#fr-18:-eic-succession-/-role-transfer}

Description: **:** The system shall allow the current EIC to select a successor and transfer their role, atomically swapping permissions while strictly enforcing the constraint that only one active EIC exists at a time. 

Rationale: When publication leadership changes, the system needs a secure, direct mechanism to hand over absolute control without compromising system management continuity or violating security constraints.

Acceptance Criteria: 

* The current EIC can pick a successor from the existing Staff/Ed Board directory.  
* Upon confirmation, the system swaps the roles instantly (the successor becomes the EIC, and the former EIC assumes a new designated role).  
* The system ensures there is never more than one active EIC.  
* The succession event is recorded in the Audit Logs.

6. # **NON-FUNCTIONAL REQUIREMENTS** {#non-functional-requirements}

   1. ## **Performance** {#performance}

The system shall fully load the Master List dashboard in under three (3) seconds on a standard 4G connection to prevent delays during high-usage periods.

2. ## **Security** {#security}

The system shall enforce the following security controls to protect user data and prevent unauthorized access:

* **Password Hashing:** All user passwords shall be hashed using the bcrypt algorithm before being stored in the database. Plain-text passwords are never persisted or logged at any point.

* **Session Management:** User sessions are managed via signed JSON Web Tokens (JWT) using the HS256 algorithm. Access tokens expire after 60 minutes of inactivity, after which the user must re-authenticate. OTP challenge tokens used during login and password reset expire after 15 minutes.

* **Role-Based Access Control (RBAC):** The system shall strictly enforce RBAC so that staff cannot view, create, edit, or delete tasks and user records outside of their assigned permissions. Every protected API endpoint validates the user's role and permission set before processing the request.

* **SQL Injection Prevention:** The system uses SQLAlchemy's ORM with parameterized queries exclusively. Raw SQL strings are not used anywhere in the application, which prevents SQL injection attacks by design.

* **XSS Prevention:** The React frontend does not use *dangerouslySetInnerHTML* or render unsanitized user input as raw HTML. All dynamic content is rendered through React's built-in escaping mechanisms.

* **CSRF Protection:** The system uses JWT Bearer token authentication transmitted via the Authorization header, not cookies, which makes it inherently not vulnerable to Cross-Site Request Forgery (CSRF) attacks.

* **OTP Brute-Force Protection:** OTP verification is limited to a maximum of 5 attempts per code. Exceeding this limit invalidates the current OTP and requires the user to request a new one.

* **Data Privacy Act (RA 10173\) Compliance:** Given the storage of personal student information (names, emails), the system shall ensure all data processing complies with the Philippine Data Privacy Act of 2012\. This includes non-sharing of user data with third parties and the soft deletion retention of deactivated account records.

  3. ## **Usability** {#usability}

The system shall fit all the main buttons and text in a regular phone screen to eliminate the need for manual scaling to view task instructions.

4. ## **Reliability** {#reliability}

The system shall target a minimum uptime of 99% and be designed to handle unexpected failures gracefully. If a server error or fault occurs, the system shall log the incident and recover without data loss, ensuring that no task records or user data are corrupted during an outage.

5. ## **Scalability** {#scalability}

The system shall be built with the use of an organized and modular codebase so that future developers looking to improve the system can easily add new publication features without breaking the existing task dashboard.

6. ## **Availability** {#availability}

The system shall be reachable at all times. In the case of scheduled maintenance or an unplanned outage, a clear message shall be displayed to the user explaining that the system is temporarily unavailable and, where possible, providing an estimated time of restoration.

7. ## **Data Integrity** {#data-integrity}

The system shall be built with a clean, well-documented, and modular codebase. This architectural approach is fundamental to guaranteeing data consistency and integrity, minimizing the risk of database corruption during read and write operations.

8. ## **Maintainability** {#maintainability}

The system shall keep the mobile frontend code completely separated from the backend database files. This architectural separation allows for the integration of new features without requiring modification of the core server logic.

9. ## **Backup and Recovery** {#backup-and-recovery}

The system shall implement a backup and recovery strategy to ensure that no publication data is permanently lost in the event of hardware failure, accidental deletion, or system corruption.

* **Backup Schedule:** The database shall be backed up on a daily basis. Backups shall be performed during off-peak hours (e.g., 2:00 AM) to minimize disruption to active users.

* **Retention Policy:** Daily backups shall be retained for a minimum of 30 days. At least one backup per week shall be retained for 3 months to allow recovery from issues that are not immediately discovered.

* **Backup Storage:** Backup files shall be stored in a separate location from the primary server — either an external drive or a cloud storage service — so that a single point of failure cannot destroy both the live data and its backup simultaneously.

* **Disaster Recovery:** In the event of a total system failure, the system shall be restorable from the most recent backup within 24 hours. The recovery procedure shall be documented and accessible to the system administrator.

* **Integrity Verification:** Backup files shall be periodically verified to confirm they are not corrupted and can be successfully restored before they are needed in an emergency.

7. # **SYSTEM ARCHITECTURE** {#system-architecture}

The system uses a multi-layered client-server architecture composed of three main logical components: 1\) The Mobile-First Client, which is a role-responsive web interface that dynamically adjusts the display based on the user's RBAC role. 2\) The API/Backend Layer, which handles all core business logic, including RBAC validation, workflow state management, and calculating the two-day buffer deadlines. 3\) Dedicated Services, which include the OTP Service (for user authentication and password resets) and the Notification Service (for pushing out automated and manual email reminders).

![][image1]

*Figure 1\. System Architecture Diagram.*

# 

8. # **INTERFACE REQUIREMENTS**  {#interface-requirements}

   1. ## **User Interface** {#user-interface}

Since the staff and Ed Boards are constantly moving around the campus area, the user interface is strictly optimized for a portrait orientation on the standard mobile phone screens. The main master dashboard relies on clear and color-coded visuals so that the Ed Boards can instantly see if a specific task is "Assigned," "Submitted," "Checked," and "Published" without having to tap into the specific task details. In order to keep the workflow fast and efficient, the task creation forms prioritize dropdown menus, like the integrated staff directory, over manual text entry, which prevents typos and formatting errors.

2. ## **Software Interface** {#software-interface}

On the software side, the application functions by connecting the mobile frontend views directly to our centralized relational database. The backend is also responsible for executing the automated two-day buffer logic before communicating with the notification services.

3. ## **Hardware Interface** {#hardware-interface}

We are not deploying any specialized hardware for this project, the entire system is designed to run entirely on the personal smartphones that are already owned by the publication's staff. Because of this, the primary hardware interactions are limited to the application interfacing with the device's notification system to trigger screen alerts or vibrations when notifications are received, and relying on the browser's built-in storage (such as cookies and local storage) for session management.

9. # **DATA REQUIREMENTS** {#data-requirements}

   1. ## **Database Overview**  {#database-overview}

The database schema employs a normalized relational model, summarized in the table below. The design emphasizes clear Primary Key (PK) and Foreign Key (FK) relationships to enforce referential integrity and define the one-to-many relationship between Users/Tasks and Tasks/Task Stages. All required data types are specified to ensure efficient storage and validation.

| Entity | Keys | Datatypes | Description |
| ----- | ----- | ----- | ----- |
| Users | PK: UserID | INT, VARCHAR(255) | Holds student contact details, login credentials, and active/deactivated status. |
| Roles | PK: RoleID | INT, VARCHAR(50) | Stores security rules separating Staff, Ed Board, and EIC. |
| Tasks | PK: TaskID, FK: UserID (Assignee), FK: UserID (Assigner) | INT, DATETIME, VARCHAR | Tracks assignment details, deadlines, current status, and archive flag. |
| Task Stages | PK: StageID, FK: TaskID | INT, VARCHAR(50) | Defines per-stage assignee, label, and status within the workflow. |
| Audit Logs | PK: LogID, FK: UserID (Actor) | INT, DATETIME, TEXT | Tracks critical administrative actions, including account changes and task deletions. |
| Notifications | PK: NotificationID, FK: UserID | INT, VARCHAR, BOOLEAN | Stores in-app reminders, email deadline notifications, and status messages. |

## 

2. ## **Data Integrity Rules** {#data-integrity-rules}

* Every staff account must be connected to a unique EVSU email address in order to avoid duplicate profiles.  
* The system is going to block the Ed Boards if they try to assign a task to a non-existing or former staff to avoid having a "ghost task".  
* A task cannot be deleted once any stage has progressed past the "Assigned" status. The system shall enforce this constraint to preserve the integrity of in-progress work records (see UC-04/FR-12).  
* **Database Transaction Integrity:** All multi-step workflow operations (such as advancing a stage, sending a task back for revision, and publishing a task) are executed within a single database transaction per request. The system uses SQLAlchemy's session management with *autocommit=False*, meaning all changes within a request are staged in memory and only written to the database when an explicit commit is issued. If any step in the operation raises an error before the commit, the entire transaction is automatically rolled back, leaving the database in its previous consistent state. This ensures that partial updates (such as a stage status changing without the corresponding task status updating) cannot occur.  
* **Soft Delete Strategy:** The system implements soft deletion for both tasks and user accounts rather than permanently removing records from the database. This preserves historical data for audit and reference purposes.  
* **Tasks:** Archiving a task sets its *archived* flag to *true* in the database. Archived tasks are excluded from all active Master List queries by default but remain fully intact in the database and are accessible through the dedicated archive view. This means no task data is ever permanently lost through the archive action. Only the EIC can permanently delete a task, and only when it is still in "Assigned" status (no stage has been acknowledged), ensuring that no in-progress work records are ever hard-deleted.  
* **User Accounts:** Deactivating a user sets their status to *deactivated* in the database. Deactivated accounts are excluded from login, from the active staff dropdown during task assignment, and from the current staff directory view. However, their account record, task history, and associated audit log entries remain fully intact in the database. This ensures that the publication retains a complete historical record of all work done by former staff members even after they graduate or leave.  
* **Concurrency and Race Condition Handling:** The system addresses concurrency risks through strict workflow state validation on every operation. Before any stage transition is committed, the backend re-reads and validates the current stage status from the database. If the status does not match the expected precondition (for example, an admin trying to check a stage that is not in "submitted" status), the operation is rejected with an error. This means that if two users attempt to act on the same stage simultaneously, only the first request to commit will succeed; the second will be rejected because the stage status will have already changed. Task editing is additionally protected by blocking all edits once any stage has been acknowledged, preventing simultaneous edit conflicts on active tasks. These controls are sufficient for the expected low-concurrency usage of a student publication with a small team.

# 

10. # **ACCEPTANCE CRITERIA**  {#acceptance-criteria}

General

* The Ed Boards must be able to successfully archive a task. The archived task should automatically be put in the view-only archives.  
* The main Master List dashboard must fully load in under three (3) seconds when a student is using regular 4G campus data.  
* The system must strictly implement the 2-day buffer rule when assigning a task. The system should not allow a task to have a deadline date that is less than 48 hours from the current date and time.  
* The role-based access restrictions must effectively keep the master list hidden from basic staff accounts, ensuring only the Ed Board, Editorial Consultants, and EIC can view the restricted workflow.

OTP Validation

* A user who enters a correct email and password must receive a 6-digit OTP at their registered email address before a session is granted.  
* An OTP that has expired (after 10 minutes) must be rejected by the system, and the user must be required to request a new one.  
* An incorrect OTP must be rejected. After 5 consecutive failed attempts, the current OTP must be invalidated and the user must request a new code.  
* A user who completes the forgot-password flow must be able to set a new password using a valid OTP, after which the old password must no longer work.

Notification Testing

* When a task is first assigned, the system must send an email notification to the assignee containing the task title and deadline date.  
* When a task deadline is exactly 2 days away, the system must automatically send a follow-up reminder email to the assignee.  
* When an Ed Board clicks the manual notification trigger on a stage, the assignee must receive a notification. The manual notification trigger must be disabled for 60 seconds after each use and must not allow another notification to be sent during that cooldown period.  
* When a task is sent back for revision, the assignee must receive a notification containing the reviewer's comment.

Audit Logging Validation

* Every user account creation, role change, and deactivation performed in the Admin Center must generate a corresponding audit log entry containing the actor's name, the action performed, the affected user, and a timestamp.  
* The audit log must be accessible only to the EIC. Attempting to access the audit log as an Ed Board, Editorial Consultant, or Staff must be denied.  
* Audit log entries must be read-only. No user, including the EIC, must be able to edit or delete a log entry.  
* The EIC must be able to filter the audit log by date range, action type, and affected staff member.

RBAC Validation

* A staff account must not be able to see the Master List, access the directory, or open the Admin Center. Attempting to navigate to these pages must redirect the user or show an access denied response.  
* An Ed Board account must be able to see the Master List and directory but must not be able to access the Admin Center or perform EIC succession.  
* An Editorial Consultant account must have read-only access to the Master List and directory and must not be able to create, edit, or delete tasks.  
* The EIC must have full access to all pages including the Admin Center, audit log, and EIC succession.

Workflow Approval Validation

* A staff member must not be able to submit a task stage that has not yet been acknowledged. The system must require acknowledgment before submission is allowed.  
* An Ed Board must not be able to mark a stage as "Checked" unless the stage is currently in "Submitted" status. Attempting to check a stage in any other status must be rejected.  
* The EIC must not be able to publish a task unless all stages have been checked and forwarded. Attempting to approve a stage that is not in "Checked" status must be rejected.  
* When the EIC publishes the final stage of a task, the task status must automatically update to "Published" and the task must be removed from the active Master List and moved to the archive.  
* A task that has been acknowledged by any stage assignee must not be editable. Any attempt to edit such a task must be blocked by the system.


11. # **APPENDICES**  {#appendices}

***Appendix A \- Use Case Diagram***

![][image2]

***Appendix B \- ER Diagram***

![][image3]

***Appendix C \- Architecture Diagram***

![][image1]

***Appendix D \- Traceability Matrix***

| FR | Requirement Description | User Story | Use Case |
| :---: | :---: | :---: | :---: |
| FR-01 | User Authentication & RBAC | N/A | UC-01, UC-03, UC-06 |
| FR-02 | Directory Management | N/A | UC-03 |
| FR-03 | Directory-Driven Assignment | US-01 | UC-01 |
| FR-04 | Internal 2-Day Buffer Logic | US-02 | UC-01 |
| FR-05 | Task Status Tracking | US-04 | UC-02 |
| FR-06 | Master List Dashboard | US-10 | UC-04, UC-05 |
| FR-07 | Master List Filtering | US-10 | N/A |
| FR-08 | Master List Visibility Toggle | US-06 | N/A |
| FR-09 | Automated Reminder Generation | US-03 | N/A |
| FR-10 | Manual Notification Trigger | US-05 | N/A |
| FR-11 | Task Editing | N/A | UC-01 (Alt Flow) |
| FR-12 | Archive, Delete & Notification | US-07 | UC-04 |
| FR-13 | Multi-Tiered Approval Workflow | US-04 | UC-05 |
| FR-14 | Manual Task Status Changing | N/A | UC-02 |
| FR-15 | Auto-Archiving on Approval | US-08 | UC-05 |
| FR-16 | Password Reset via OTP | US-11 | UC-06 |
| FR-17 | Audit Logging | N/A | UC-03 |
| FR-18 | EIC Succession / Role Transfer | N/A | UC-03 |

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>