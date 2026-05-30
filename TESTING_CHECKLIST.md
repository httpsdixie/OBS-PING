# Master Testing Checklist

This consolidated checklist is designed to verify all features, workflow stages, access levels, security features, and time-based responses in the **Observer Task Assigning and Reminding System (OBS PING)**.

---

## Phase 1: Authentication, OTP, and Password Recovery

- [ ] **OTP Login Flow**
  - Log in with a valid email and password. Verify that a 6-digit OTP is generated and sent to the registered email address.
  - *Boundary Check*: Try entering an incorrect OTP 5 times. Verify that the current OTP is invalidated and you are forced to request a new code.
  - *Expiry Check*: Attempt to verify an OTP after 10 minutes. Verify that the system rejects it as expired.
- [ ] **Forgot Password Flow**
  - Click the "Forgot Password" link on the login page, enter your registered email, and verify that you receive an OTP.
  - Enter a new password with the OTP. Log out and confirm that your old password no longer works, while the new password logs you in.
- [ ] **Cross-Browser Password Visibility Eye Toggles**
  - Using a mobile device or Brave browser, verify that the custom "eye" visibility toggle appears in the password inputs (Login page, New/Confirm password reset inputs) and successfully toggles characters between dots and plain text.

---

## Phase 2: User Directory & Administrative Controls

- [ ] **Directory Visibility (RBAC)**
  - Log in as a **Staff** member. Verify that the Master List, Directory, and Admin Center are inaccessible.
  - Log in as a **Consultant**. Verify that you have read-only access to the Master List and Directory, but cannot edit tasks or access the Admin Center.
  - Log in as **EIC**. Verify that you have absolute access to the Admin Center, Succession tab, and Audit Logs.
- [ ] **Staff Deactivation & Directory Pull**
  - Log in as **EIC**, navigate to the Admin Center, and change a student's status to **Deactivated**.
  - Navigate to the Task Creation screen. Verify that the deactivated user's name is automatically removed from the active assignee dropdown list.
  - Confirm that the deactivated user can no longer log into the app, but their historical records in the archive remain intact.
- [ ] **EIC Succession (Atomic Role Swap)**
  - As the current **EIC**, initiate a role transfer to an Editorial Board member.
  - Verify that the swap occurs instantly: your account is demoted to a regular Editor role (losing Admin access), and the successor is promoted to the EIC role with absolute system privileges.
  - Check the **Audit Logs** to confirm that the EIC succession event was recorded.

---

## Phase 3: Task Management & 48-Hour Deadline Buffer

- [ ] **Task Creation Dropdown**
  - Open the task creation form. Confirm that the assignee dropdown populates with active staff members instantly and eliminates typing errors.
- [ ] **48-Hour Deadline Buffer Validation (Time-Response)**
  - *Failure Case*: Attempt to create a task with a deadline set to **less than 48 hours** from the current local time. Confirm that the application rejects the submission and prevents the task from being saved.
  - *Success Case*: Set a deadline set to **exactly 48 hours or more** from the current local time. Verify that the task is successfully created.
- [ ] **Task Editing & Assignee Updates**
  - Select an active task where **no stages have been acknowledged yet**. Click Edit.
  - Modify the description and swap the assignee of the first stage to a different user. Save the changes.
  - Verify that the new assignee is updated in the database and immediately receives the initial assignment email.
- [ ] **Task Editing Lock (Workflow Validation)**
  - Have the assignee **Acknowledge** the first stage of the task.
  - Attempt to edit the task again. Verify that the system blocks any modifications now that work has officially begun.

---

## Phase 4: Stage Workflow, Self-Acknowledgment, and Time Responses

- [ ] **Multi-Tiered Stage Progression**
  - Progress a task stage by stage: **Assigned $\rightarrow$ Acknowledged $\rightarrow$ Submitted $\rightarrow$ Checked $\rightarrow$ Needs Revision $\rightarrow$ Published**.
  - Confirm that an Editor cannot mark a stage as "Checked" unless it is first "Submitted".
  - Confirm that EIC cannot "Publish" a task unless it is marked as "Checked".
- [ ] **Ed Board Self-Stage Progression**
  - Assign a stage of a task to yourself (while logged in as an Editor or EIC).
  - Go to your dashboard action queue. Verify that you can successfully click **Acknowledge** and **Turn In / Submit** your own stage in a staff capacity.
- [ ] **Poke (Manual Notification) and Cooldown (Time-Response)**
  - As an Editor, open a task and click the manual **Poke** button. Verify that the assignee receives a direct notification email.
  - *Spam Check*: Verify that the Poke button is immediately disabled and starts a **60-second visual countdown**. Confirm that the button cannot be pressed again until the cooldown expires.
- [ ] **48-Hour Automated Reminders (Time-Response)**
  - When a task deadline hits exactly **48 hours (2 days) remaining**, verify that the background service automatically dispatches a follow-up reminder email to the assignee.

---

## Phase 5: Overdue Archiving, Deletion, and Mobile UI

- [ ] **Overdue Archiving & Timezone Alignment (Time-Response)**
  - Select a task whose deadline is past-due (using Philippine Time UTC+8).
  - As an Editorial Board member, click the **Archive** button. Verify that the task is immediately removed from the active Master List and moved to the read-only Archives.
- [ ] **Task Deletion (EIC Only)**
  - As EIC, delete an untouched task (where the first stage has not been acknowledged yet). Verify that the task is permanently deleted from the database.
  - Attempt to delete an in-progress task (acknowledged or higher). Verify that deletion is strictly blocked to protect the historical audit log.
- [ ] **Mobile Sidebar Drawer Modals**
  - Using a mobile device, open the side navigation drawer and click **Activity Log (Audit)** or **Who Can Do What (Permissions)**.
  - Verify that the navigation drawer slides shut, but the modal stays fully open, persistent, and interactable on the screen without disappearing.
