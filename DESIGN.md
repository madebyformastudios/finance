# Design System & UI/UX Guidelines (Anti-Slop Edition)
**Project:** Couple Finance Tracker Web Application

## 1. Language Requirement: Strict Dutch
*   **Rule:** Every single piece of user-facing text, microcopy, label, and empty state must be in **Dutch**. 
*   **Avoid AI Translation Slop:** Do not use literal, robotic English-to-Dutch translations (e.g., avoid "Succesvol opgeslagen" if a simple "Opgeslagen" suffices). Use natural, conversational Dutch suited for a personal finance app.

## 2. Core Visual Philosophy: Intentionality over Defaults
To prevent the application from looking like generic "AI slop" (average, template-driven output), we must explicitly ban default visual crutches. The goal is a distinctive, human-crafted feel that prioritizes data legibility, visual tension, and intentional layout over generic aesthetic averages.

## 3. Key UI Components (Sourced from References)
The layout must utilize a "bento-box" style architecture, directly integrating the following components:

*   **The "Hero" Dashboard Card (Status Overview):** 
    *   *Reference:* Inspired by the dark green/blue and purple top cards in the provided designs.
    *   *Execution:* A prominent, high-contrast top section (e.g., deep slate or rich green) displaying the overarching monthly status (Surplus/Shortfall). Include a subtle background element (like a soft wave or abstract shape) to break up the flat color.
*   **Allocation Donut Charts:**
    *   *Reference:* Seen in the purple and COINEST mobile dashboards.
    *   *Execution:* Use a clean, animated donut chart to beautifully visualize the distribution phase (50% Spaarpot, 25% Jairo, 25% Naroa).
*   **Spend vs. Budget Progress Bars:**
    *   *Reference:* Sourced from the blue/orange mobile UI and the COINEST dashboard.
    *   *Execution:* Use horizontal progress bars inside expense cards (like "Boodschappen" - €600, or "Gezamenlijk" - €1480) to visually indicate how much of the expected monthly budget has been consumed or funded.
*   **Avatar-Based Split Views:**
    *   *Reference:* Inspired by the green mobile UI ("Your Friends / Stats").
    *   *Execution:* Integrate small, circular user avatars (Jairo and Naroa) next to specific responsibilities or payouts. This creates immediate visual recognition of who owes what and who receives which payout.
*   **Clean Transaction / Input Lists:**
    *   *Reference:* Seen in the Finexy and COINEST activity tables.
    *   *Execution:* A crisp, uncluttered list for entering and viewing the month's specific inputs (Extra expenses, Credit Card) using clean status indicators (colored dots for pending vs. calculated).

## 4. Typography & Color Palette
*   **Typography:** Break the "Inter Default". Pair a distinctive, slightly opinionated font for display/headings (e.g., Space Grotesk) with a highly legible sans-serif exclusively for financial data and tables. Balances should be massive; labels should be tiny.
*   **Colors:** Ban generic purple-to-blue gradients. Commit to one dominant color with sharp accents. Use muted, sophisticated semantic tones (e.g., soft sage for surplus, muted terracotta for shortfall) instead of default high-saturation neon red/green.

## 5. Motion and Micro-interactions
*   **Execution:** 
    *   Financial totals in the hero section must count up dynamically when the calculation engine runs.
    *   Interactive elements must have a physical press state (moving 1-2px) and proper easing curves.
    *   The 50/25/25 distribution donut chart should draw its segments sequentially upon loading.