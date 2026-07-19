# Onboarding & Login Guide (for the Placement Cell / Admin)

This is a plain-language guide for whoever runs the Placement Cell — not a developer
document. It explains how students, Team Leaders, and Mentors actually get into the
system today, what you need to tell them, and what's still missing.

## The three account types

### Students
Students are added in bulk by an admin from a spreadsheet (name + email required per
row). There is no self-signup — a student can only log in once the Placement Cell has
added them.

Every student gets the **same starting password** when added (configured on the server
via the `SEED_PASSWORD` setting — make sure this is set to something real before adding
any real students, not left on a default dev value). The system does **not** email this
password automatically. You need to tell students the starting password yourself
(class WhatsApp group, printed handout, announcement — whatever's easiest for you).

The moment a student logs in for the first time, the app forces them to set their own
new password before they can do anything else. From that point on, nobody but the
student knows it.

### Team Leaders
A Team Leader is **not** a separate account. It's a student account that's been given
extra permission to review submissions for their group. So:

- Tell Team Leaders to log in with the **same email and password they already have as
  a student**.
- Once logged in, they'll simply see the Team Leader dashboard as well as their normal
  student view.
- There's nothing extra to hand out for this role.

### Mentors
Mentors are added the same way as students (bulk, admin-only), with the same shared
starting password, and the same forced password-change on first login.

## What to actually tell people

| Role | What you say |
|---|---|
| Student | "Log in with the email we have on file for you and the starting password [X]. You'll be asked to set your own password right away." |
| Mentor | Same as student. |
| Team Leader | "Use your existing student login — no new password needed." |

## Known limitations (as of this writing)

- **No self-service "add students" screen yet.** Bulk-adding people currently requires
  a developer to run it — there's no upload button in the app itself for the Placement
  Cell to use directly. This should be built before real rollout so you're not
  dependent on a developer every time your roster changes.
- **"Forgot Password?" only works if real email sending is configured on the server.**
  The feature exists and generates a real reset link, but if the server doesn't have a
  working email provider configured, the reset email silently never arrives. Until
  that's set up, treat "I forgot my password" the same as any other login issue — the
  Placement Cell has to step in directly.
- **No email is ever sent automatically** when someone is added to the system. The
  starting password always has to reach people through a manual channel you control.

## Demo accounts (for showing the TPO / stakeholders how each role works)

A small, clearly-labeled demo dataset exists purely for walkthroughs — not real data.

| Role | Email | Starting password |
|---|---|---|
| Mentor | `mentor@demo.local` | `DemoPass@123` |
| Team Leader | `teamleader@demo.local` | `DemoPass@123` |
| Student | `student1@demo.local` | `DemoPass@123` |
| Student | `student2@demo.local` | `DemoPass@123` |

What each one shows when you log in:
- **Team Leader** has one submission sitting in their verification queue, ready to
  approve or reject live during a demo.
- **Student One** is the one whose submission is pending — showing the "waiting on
  review" state.
- **Student Two** already has a submission that was rejected with a reason, showing
  that half of the flow without needing to do it live.
- **Mentor** can see both groups' progress across the section.

All four are forced to set their own password on first login, same as any real
account — so each one only works for this "first login" demo once per account.
