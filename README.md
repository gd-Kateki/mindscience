# MindScience Clinic

A clean, fast, and modular static website for MindScience Clinic.

## Architecture

This project is built using a "JSON-as-database" pattern. It requires no backend server.
All dynamic content is stored in `data/*.json` files, and loaded dynamically at runtime via JavaScript `fetch()`.

*   **`index.html`**: The main shell, containing static sections like the hero, values, header, and footer, along with empty container `div`s for dynamic content.
*   **`data/*.json`**: The content data (team members, services, events, testimonials, FAQs, blog posts).
*   **`js/*.js`**:
    *   `content-loader.js`: Fetches data from the JSON files and populates the container `div`s.
    *   `ui.js`: Handles interactions (mobile menu, tabs, scroll progress, scroll reveal, FAQ accordion, etc).
    *   `form.js`: Manages the contact/booking form submission using Web3Forms.
*   **`css/*.css`**: Modular stylesheets for variables, base styles, components, layout, and sections.

## Local Development

The site now works by opening `index.html` **directly in your browser** — no local server needed.

Content data is stored as plain JavaScript files in `data/*.js` which are loaded as regular `<script>` tags, bypassing any CORS restrictions.

> [!TIP]
> Simply double-click `index.html` or drag it into your browser to preview the site.

## Updating Content

To update content, you only need to modify the corresponding files in the `data/` directory.

*   `site.js`: Global site info (contact details, topbar announcement).
*   `team.js`: Team member profiles.
*   `services.js`: Clinic services.
*   `events.js`: Seminars, webinars, and workshops.
*   `testimonials.js`: Patient reviews.
*   `faq.js`: Frequently asked questions.
*   `blog.js`: Blog post cards.

Each file exports its data as a global variable (e.g. `window.DATA_team = [...]`). Edit the values inside, keeping the structure intact.

## Deployment

The site is purely static and can be deployed to any static hosting provider (e.g., GitHub Pages, Netlify, Vercel, AWS S3) simply by uploading the entire folder structure.
