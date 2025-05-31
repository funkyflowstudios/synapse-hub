# 🔒 Security Policy

## Supported Versions

We actively maintain security for the following versions of Synapse Hub:

| Version | Supported | Status             | End of Life |
| ------- | --------- | ------------------ | ----------- |
| 0.1.x   | ✅        | Active Development | TBD         |
| 0.0.x   | ⚠️        | Limited Support    | 2025-12-31  |

### Version Support Policy

- **Active Development**: Full security support, regular updates, and feature development
- **Limited Support**: Critical security fixes only, no new features
- **End of Life**: No security updates, users should upgrade immediately

### Component-Specific Security

**Backend (FastAPI)**: Production-ready with comprehensive health monitoring and error handling
**Cursor Connector**: Cross-platform automation with sandboxed execution
**Frontend (SvelteKit)**: Modern security practices with CSP and secure defaults

## Reporting a Vulnerability

The Synapse Hub team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

To report a security issue, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/funkyflowstudios/synapse-hub/security/advisories/new) tab.

The team will send a response indicating the next steps in handling your report. After the initial reply to your report, the security team will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

## What to Include

Please include the following information along with your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

## Preferred Languages

We prefer all communications to be in English.

## Policy

- We will respond to your report within 72 hours with our evaluation of the report
- If the issue is confirmed, we will release a patch as soon as possible depending on complexity
- We will maintain an open dialogue to discuss the issue until it's resolved
