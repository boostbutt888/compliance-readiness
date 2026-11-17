# Compliance Readiness Check

A self-assessment web app for a risk and compliance consultancy. A business profiles itself once, sees which of 21 cybersecurity, privacy, resilience, AI, sector and sustainability frameworks apply, rates its current practices, and gets a readiness report with gaps, cost, timeline and a roadmap. Leads flow to a consultant desk that generates a call brief for each prospect.

## Run it

Open `index.html` in a browser. No server or install needed.

- Opened from your own disk (`file://`), the Consultant desk is visible so you can test the full flow. Assessments and leads are saved in that browser's local storage.
- Hosted on a normal website, visitors see only the prospect side. Leads that can't be sent directly come to you as a reference code (starting `ISO27-`), which you paste into the Consultant desk.
- Published as a claude.ai artifact (`artifact.html`), it uses the artifact's shared database for saved assessments, leads and firm settings, and the owner sees the Consultant desk.

## Client routes

1. **Guided**: "I'm not sure where to start". Goals, budget, deadline and internal lead → business profile → a plan sorted into Start here, Next and Later → quick check → report.
2. **Deadline**: "A customer, tender or regulator is asking". What was asked for and by when → profile → deadline check with interim options → practices → report.
3. **Direct**: "I know which framework I need". Choose frameworks → scoping questions → self-check, or skip to a quote request → report.
4. **Full check**: screens all 21 frameworks.

Every report includes the client's situation (budget and deadline fit), what each framework involves, how an engagement runs, what's not included, and common surprises.

## Frameworks

| Family | Frameworks |
|---|---|
| Cybersecurity | ISO 27001, CSA Cyber Essentials, CSA Cyber Trust, SOC 2 Type II, PCI DSS v4.0.1, NIST CSF 2.0 / CIS v8 |
| Privacy | PDPA + DPTM, EU GDPR, ISO 27701:2025 |
| Resilience and availability | ISO 22301, MAS TRM + BCM, ISO 20000-1 |
| AI and cloud | ISO 42001 + AI Verify, MTCS SS 584 / ISO 27017/27018 |
| Sector | Healthcare (HCSA / MOH), Government vendor (IM8 / ICT&SS) |
| Sustainability | GHG Protocol / ISO 14064-1, ISO 14001, ISO 50001, SGX/ACRA climate reporting, EcoVadis |

## Project layout

```
src/
  head.html      page title and font links
  styles.css     design tokens (light and dark) and all styles
  body.html      app bar and main container
  controls.js    ISO 27001:2022 Annex A control list
  catalogue.js   business profile questions, 69 shared practices, 21 frameworks
  engine.js      scoring, gap ranking, cost and timeline model
  flows.js       entry routes, plan builder, deadline check, expectation content
  app.js         views, storage, reports, contact form, consultant desk and brief
build.py         builds index.html and artifact.html from src/
docs/            framework scope, client flows and cost model notes
```

After editing anything in `src/`, run:

```
python3 build.py
```

## Where to change things

- **Frameworks**: `FRAMEWORKS` in `src/catalogue.js`. Each has screening rules, requirement areas mapped to practices, consultant days by company size, and external fee ranges.
- **Practices**: `PRACTICES` in `src/catalogue.js`. Each practice is answered once and counts towards every framework whose areas list it.
- **Cost model**: `GAP_DAYS`, `SIZE_F`, `DEPTH` and `TOOLS` in `src/engine.js`; the default day rate is in `CFG_DEFAULT` in `src/app.js` and can be changed in the app under Consultant desk → Firm settings.
- **Route content**: goals, budget bands, interim options, journey stages and expectation text are in `src/flows.js`.

## Caveats

Costs, fees and timelines are indicative estimates and need calibrating against real consultant, auditor and certification body quotes. Regulatory facts were checked in November 2026 and change often; see `docs/framework-scope-and-cost-model.md`. The app is a self-assessment tool and doesn't replace an audit or legal advice.
