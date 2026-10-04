# Security Policy

## Supported Versions
| Version | Supported |
|---|---|
| latest (`main`, deployed at roomspeak.edycu.dev) | ✅ |

## Reporting a Vulnerability
Please **do not** open a public issue for a security problem. Report it privately:

- email **edy.cu@live.com**, or
- use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) (Security → Report a vulnerability).

You'll get an acknowledgment within 48 hours and a fix timeline after triage. Please allow a reasonable window before public disclosure.

## What the code promises, and what checks it
| Promise | Checked by |
|---|---|
| The AI provider keys (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`) exist only in the serverless function's environment. Nothing the browser downloads contains them, anything shaped like a key, or a provider's URL. | [`tests/no-key-in-browser.test.ts`](../tests/no-key-in-browser.test.ts) builds the client with canary keys set and searches every built file, on every CI run. |
| No secret is committed. | [`gitleaks.yml`](workflows/gitleaks.yml) scans each push and pull request, and the whole git history weekly and on demand. |
| Whatever a model answers, only well-formed spots reach the screen: boxes inside the photo, non-empty phrases, at most 8. | [`tests/validate.property.test.ts`](../tests/validate.property.test.ts), 100,000 generated answers per run. |
| Known-vulnerable dependencies get flagged and patched. | Dependabot alerts and security updates are on; version updates are grouped monthly ([`dependabot.yml`](dependabot.yml)). |

## Data handling
- The room photo is sent once, through [`api/detect.ts`](../api/detect.ts), to the AI provider that finds the objects. The function keeps no copy.
- The scene (photo, spots, phrases) lives only in the browser's `localStorage` on that device. There are no accounts and no server database.
- Detection currently runs on the Gemini API free tier, whose [terms](https://ai.google.dev/gemini-api/terms) let Google use submitted images to improve its products and ask that no personal information be sent. Until it moves to the paid tier, try it with the example rooms rather than a photo of a real home.
