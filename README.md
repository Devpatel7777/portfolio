# Dev Patel — Data & AI Portfolio

A responsive, dark-only static portfolio built with HTML, CSS and vanilla JavaScript. It includes the three resume PDFs provided for this project and can be deployed on Netlify without a build step.

## Run locally

1. Extract the ZIP.
2. Open `index.html` in a browser, or run a local HTTP server from this folder:

   ```bash
   python -m http.server 8000
   ```

3. Visit `http://localhost:8000`.

## Deploy on Netlify

1. Import this folder from a GitHub repository, or upload it using Netlify's manual deploy flow.
2. No build command is required. Set the publish directory to `.` if prompted.
3. Keep `netlify.toml` at the site root. It configures the response security headers.
4. After deployment, verify that HTTPS works and review the response headers on the live site.

## Deploy on GitHub Pages

GitHub Pages serves static assets, but it does not apply the security headers from `netlify.toml` or `_headers`. Use a host or supported edge/CDN configuration that applies response headers if you need the configured CSP, HSTS, and related headers.

## Security choices

- No backend, login system, database, analytics tracker, external fonts, third-party JavaScript, or contact form storage.
- No API keys or `.env` files are needed by this static portfolio. Do not place private keys in browser JavaScript or commit secrets to Git.
- External links opened in new tabs use `rel="noopener noreferrer"`.
- Contact controls use `mailto:` and `tel:` links. The call link targets `+91 93289 77322`; on a phone it should open the device's call flow, while desktop behavior depends on installed calling applications.
- Netlify headers include Content Security Policy and additional security headers. They only take effect if the hosting provider sends them.
- Project buttons link to individual public repositories, rather than the GitHub profile landing page.

## Project repositories linked

- Sales Analytics Dashboard: https://github.com/Devpatel7777/power-bi-final
- E-Commerce Sales & Customer Analysis: https://github.com/Devpatel7777/ecommerce-sql-analysis
- Crop Recommendation System: https://github.com/Devpatel7777/ML-Crop-Recommendation
- GenAI Application Suite: https://github.com/Devpatel7777/Gen_AI
- AI Travel Planner: https://github.com/Devpatel7777/AI-Travel-Planner

## Before publishing

- Test every repository link and resume link from the deployed HTTPS domain.
- Add certificate verification links only when the actual public URLs or certificate files are available.
- The phone number and email are public because they appear in the resume. Consider whether you are comfortable publishing them, since public contact details can attract spam.
- Configure a custom domain only after checking DNS and HTTPS settings.
- Security headers have not been independently penetration-tested. This is a static portfolio starter, not a security-audited production application.

## Included resume PDFs

- `assets/resumes/Dev_Patel_Data_Analyst_Resume.pdf`
- `assets/resumes/Dev_Patel_Data_Scientist_Resume.pdf`
- `assets/resumes/Dev_Patel_AI_ML_Resume.pdf`

Resume facts and project metrics are reproduced from the supplied documents and have not been independently audited.
