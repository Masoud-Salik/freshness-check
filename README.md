# Freshness Check

FreshCheck AI — Product Vision, Technical Planning & Development Blueprint



You are joining our team as a senior product strategist, software architect, AI engineer, and critical technical advisor.



Your first responsibility is NOT to start coding. Your responsibility is to deeply understand our project, evaluate its feasibility, challenge weak assumptions, and produce a practical, technically sound development blueprint.



Think strategically first, creatively second, and critically throughout.



We want to build something that genuinely works, not just an attractive hackathon prototype.



---



1. Project Overview



Project name: FreshCheck AI



Project concept: A freshness and factual-verification layer for AI-generated answers.



AI applications frequently produce answers containing factual claims that were once correct but may no longer be accurate.



Examples include:



- An AI model gives an outdated API endpoint or library version.

- It reports an old product price.

- It describes a company executive who has since changed.

- It explains a law or regulation using outdated information.

- It gives an old statistic as though it were current.

- It references a feature that has been discontinued.



The problem is not necessarily that the AI generated a false answer. The problem is that the answer may contain information that was correct at one point but is no longer reliable.



Our goal: Build a tool that accepts an existing AI-generated answer, identifies its factual claims, determines which claims are vulnerable to becoming outdated, retrieves current evidence, and produces an understandable verification report.



FreshCheck AI should help users answer:



"Can I still trust the factual information in this AI-generated answer today?"



This is a verification and freshness-assessment tool, not another general-purpose chatbot.



2. Original Challenge Context



This project originates from the Geek Room Global AI Hackathon 2026.



The challenge is titled:



"Build a Stale-Answer Detector for AI Applications."



The original challenge requirements include:



1. Identify individual factual claims within an LLM-generated answer.

2. Detect potentially stale or outdated information.

3. Verify claims using live sources.

4. Assign freshness scores to individual claims.

5. Produce an overall freshness assessment.



Two integrations are mandatory and must be meaningful:



- Tavily: For web research, search, and retrieving current evidence.

- Bifrost by Maxim AI: For routing and managing model requests.



These must be genuine integrations, not decorative mentions or simulated functionality.



The original hackathon build window was November 1–15, 2026. The current date is November 16, 2026, so do not assume the submission window remains open. Treat the hackathon brief as the project's original technical and product context.



3. The Core Product Experience



The main experience should be extremely simple.



A user:



1. Opens FreshCheck AI.

2. Pastes an AI-generated answer into a text area.

3. Clicks "Check Freshness."

4. The system extracts factual claims.

5. It determines which claims may become outdated.

6. It searches for relevant current evidence using Tavily.

7. It evaluates the evidence using an LLM through Bifrost.

8. It presents an organized report with claim-level assessments and source links.



The user should not need to understand AI infrastructure, freshness algorithms, or web research.



The product should make complicated verification feel simple.



4. Essential Technical Logic



This is the most important part of the project.



Do not confuse freshness with factual correctness.



A claim can be:



- Correct and current.

- Correct historically but outdated now.

- Incorrect despite being recently published.

- Partially supported by current evidence.

- Impossible to verify using available evidence.

- Stable and unlikely to become outdated.



For example:



- "Water freezes at approximately 0°C under standard atmospheric pressure." This is a stable scientific fact.

- "The latest version of a software library is version 4.2." This is time-sensitive.

- "Company X's CEO is Person Y." This may change.

- "The product costs $20 per month." This may change frequently.



A simple age-based algorithm is not sufficient.



A claim published yesterday may already be wrong, while a scientific principle from decades ago may remain valid.



The system must distinguish:



A. Freshness risk

How likely is this type of claim to become outdated?



B. Evidence support

Does the retrieved evidence actually support, contradict, or only partially support the claim?



C. Verification confidence

How reliable and sufficient is the available evidence?



These should be separate dimensions.



Do not combine them into one misleading score without explaining what the score means .



Propose a transparent scoring methodology with clear definitions, thresholds, and limitations.



Do not present LLM-generated confidence scores as statistically calibrated probabilities unless we have actually calibrated them against a suitable evaluation dataset.



5. Claim Extraction and Classification



The system should break an answer into small, independently verifiable factual claims.



For each claim, determine:



- Claim text.

- Claim category.

- Whether it is factual or opinion-based.

- Whether it is time-sensitive.

- Its potential freshness risk.

- Whether verification is necessary.

- What type of source would be appropriate.



Suggested categories:



- Technology and software.

- API documentation and versions.

- AI models and capabilities.

- Product prices and availability.

- Companies and leadership.

- News and current events.

- Laws and regulations.

- Statistics and research.

- Science and general knowledge.

- Historical information.



Avoid searching the web unnecessarily for every sentence. Stable facts and subjective opinions should not create unnecessary searches.



6. Tavily Integration



Tavily must be a central component of the verification process.



Use it to:



- Search for current evidence.

- Find official documentation.

- Retrieve relevant source content.

- Identify publication or update dates where available.

- Find sources that support or contradict claims.



Prioritize source quality.



Suggested source hierarchy:



1. Official documentation and primary sources.

2. Government and institutional sources.

3. Original research and academic publications.

4. Reputable news organizations.

5. Other relevant sources, with appropriate caution.



Do not assume that the newest search result is automatically the most trustworthy.



The system should preserve source URLs and provide users with direct links.



Consider whether different claims need different search strategies. For example, verifying an API version should prioritize official documentation, while verifying a recent event may require reputable news sources.



7. Bifrost Integration



Bifrost by Maxim AI is a mandatory integration.



Use it as the model gateway for AI-related operations.



Potential responsibilities:



- Claim extraction.

- Claim classification.

- Freshness-risk assessment.

- Evidence comparison.

- Structured verification judgments.

- Generating concise explanations for users.



Design the system so models can be changed without rewriting the entire application.



Do not hardcode a model provider throughout the codebase.



Use documented Bifrost APIs and supported configuration. Do not invent endpoints, SDK methods, or integration capabilities.



Keep all API keys and secrets on the server side. Never expose them in frontend code.



8. Proposed User Interface



We want a modern, professional, minimal interface.



The visual direction should communicate trust, intelligence, clarity, and transparency.



Avoid:



- A childish interface.

- Excessive gradients.

- Unnecessary animations.

- Too many dashboard cards.

- Fake AI chat interfaces.

- Decorative charts that do not communicate useful information.



Suggested application structure:



A. Landing / Main Checker



- Product name and short explanation.

- Large text area for pasting AI answers.

- Check Freshness button.

- A small explanation of how verification works.

- Sample demonstration option.



B. Verification Results



Show:



- Overall assessment.

- Number of claims analyzed.

- Number of claims supported.

- Number of potentially outdated claims.

- Number of contradicted claims.

- Number of unverified claims.



Then show individual claim cards.



Each claim card should contain:



1. Original claim.

2. Claim category.

3. Freshness risk.

4. Verification status.

5. Evidence summary.

6. Source links.

7. Last-checked timestamp.

8. Explanation of the assessment.



Use clear labels, not ambiguous colors alone.



Possible statuses:



- Current and supported.

- Potentially outdated.

- Contradicted by current evidence.

- Partially supported.

- Unverified.

- Stable information.



Do not mark a claim "outdated" merely because it is old. There must be evidence that it has changed or become inaccurate.



C. Detailed Report



Allow users to understand why a claim received its assessment.



The report should make it easy to distinguish:



- What the original answer said.

- What current sources say.

- What changed.

- What remains uncertain.



D. About / Methodology



Explain what FreshCheck AI does, how it works, and its limitations.



9. MVP Scope and Priorities



We have limited time and a team of three.



Do not try to build every possible feature immediately.



Propose a realistic MVP with these essential capabilities:



1. Paste an AI-generated answer.

2. Extract factual claims.

3. Classify claims by freshness risk.

4. Skip unnecessary verification for stable information.

5. Search current sources using Tavily.

6. Evaluate evidence through Bifrost.

7. Generate individual claim assessments.

8. Calculate a transparent overall report.

9. Display source links and timestamps.

10. Handle errors and insufficient evidence honestly.



Possible future features, NOT immediate MVP requirements:



- Browser extension.

- Public API for developers.

- Automatic integration with other AI applications.

- Batch answer verification.

- User accounts and saved history.

- Team workspaces.

- Monitoring recurring claims.

- Integration with multiple AI providers.



Do not let optional features delay the working core product.



10. Technical Architecture to Evaluate



Our initial technical direction is:



Frontend



- React

- TypeScript

- Vite

- Tailwind CSS



Backend



- Python

- FastAPI



AI Gateway



- Bifrost



Web Research



- Tavily



Version Control



- GitHub



Frontend Hosting



- Vercel



Backend Hosting



- A suitable free or low-cost service, subject to current limitations.



These are proposed technologies, not unchangeable decisions.



Evaluate whether this architecture is appropriate for a small hackathon team.



In particular:



- Determine whether Lovable can handle the frontend efficiently.

- Decide how the frontend communicates with the backend.

- Design clear API contracts.

- Explain how Bifrost and Tavily fit into the backend.

- Avoid exposing API credentials.

- Avoid unnecessary infrastructure.

- Consider deployment costs and free-tier restrictions.

- Design for graceful failure if an external API is unavailable.



We prefer a simple modular architecture over unnecessary microservices.



11. Our Team



We are a team of three people.



Our technical experience:



- One member is comfortable with JavaScript and Tailwind CSS.

- At least one member has basic development knowledge.

- At least two members are comfortable working with AI coding agents.



We intend to use AI agents extensively, but we do not want to blindly accept generated code.



Design a collaboration workflow that includes:



- Clear ownership of modules.

- GitHub repository structure.

- Branches and pull requests.

- Code review.

- Testing.

- Integration responsibilities.



Suggest a practical division of work among three members.



The project should be understandable and maintainable by our team.



12. Quality, Reliability and Evaluation



We do not want a tool that confidently labels everything as outdated.



Identify likely failure cases, including:



- Search results that are irrelevant.

- Old pages that rank highly.

- Conflicting sources.

- Missing publication dates.

- Claims that cannot be independently verified.

- Ambiguous claims.

- Incorrect claim extraction.

- Unsupported conclusions from an LLM.

- API failures and rate limits.



Design a small evaluation dataset with examples of:



1. Stable facts.

2. Correct but outdated claims.

3. Incorrect recent claims.

4. Conflicting evidence.

5. Unverifiable claims.

6. Claims requiring multiple sources.



Propose measurable evaluation criteria.



At minimum, evaluate:



- Claim extraction quality.

- Verification accuracy.

- False outdated classifications.

- Source relevance.

- Latency.

- Cost per answer.



Explain how we can demonstrate the product's reliability honestly during a hackathon presentation.



13. Your First Task: Plan Before Building



For now, DO NOT generate the complete application or start implementing random components.



First, study the project and produce a comprehensive development blueprint.



Your response must include:



1. Product analysis

Explain the actual problem, target users, value proposition, and what makes this different from an ordinary fact-checking chatbot.



2. Product decisions

Recommend the simplest and strongest MVP. Identify features we should exclude.



3. System architecture

Provide a clear architecture diagram and explain the data flow from user input to final report.



4. Technical design

Recommend the frontend/backend structure, APIs, data models, and responsibilities of Tavily and Bifrost.



5. Scoring methodology

Propose a transparent method for freshness risk, evidence support, verification confidence, and overall reporting.



6. UI/UX plan

Describe the main screens, components, user journey, and visual design direction.



7. Team execution

Divide the work among three people, with clear module ownership and integration responsibilities.



8. Development roadmap

Break implementation into small, ordered milestones. For every milestone, specify the expected result and how we can test it.



9. Deployment strategy

Explain how to host the frontend and backend, manage secrets, configure environment variables, and publish a working public demo with minimal cost.



10. Risk assessment

Identify technical, product, time, and integration risks. Recommend practical solutions.



11. Open questions

List only the decisions that genuinely require our input. Make sensible assumptions for everything else and label them clearly.



14. How I Expect You to Work



Be an active technical partner, not an obedient code generator.



- Challenge weak assumptions.

- Explain trade-offs.

- Prefer reliable, testable solutions over impressive-sounding architecture.

- Do not invent API capabilities.

- Do not pretend integrations work before testing them.

- Distinguish implemented features from planned features.

- Keep the MVP achievable for three people.

- Make every important technical decision understandable to our team.

- Do not overwhelm us with unnecessary complexity.



After delivering the blueprint, wait for our review and approval before beginning implementation.



When we approve the plan, help us build the application step by step, starting with the architecture and project foundation.



Our ultimate goal: Build a genuinely useful, credible, working AI freshness-verification product that can be demonstrated publicly, explained technically, and potentially developed further after the hackathon.



Let's build something that actually deserves to exist.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2b783a24-d699-4bb1-8e1d-e3e88bc671d6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
