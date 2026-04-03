# 📚 Record Note Submission System

This repository automates the process of collecting student assignments (Record Notes) via GitHub, verifying submissions using specific keywords, and generating QR codes for easy access to each student's work.

## 🌟 Overview

The system bridges the gap between students submitting their assignments via GitHub forks and teachers trying to organize them efficiently. Here is how it works:
1. **Teacher** creates a base repository.
2. **Students** fork the repository, complete their work, and append a specific **Keyword** to their repository description or name.
3. **Teacher** runs this system to automatically fetch all forks, filter valid submissions based on the keyword, and output an organized list with generated **QR Codes** for quick scanning.

---

## 👨‍🎓 For Students: How to Submit

1. **Fork the Repository:** Navgiate to the teacher's assignment repository and click the **Fork** button in the top right corner.
2. **Do Your Work:** Add your assignment files, record notes, and commit your changes to your newly forked repository.
3. **Add the Keyword:** 
   - Go to your repository settings (or the 'About' section on the right side).
   - Add the specific keyword provided by your teacher (e.g., `RECORD_SUBMIT_2026`) to the **description** or **repository name**.
4. You're done! The automated system will take care of the rest.

---

## 👩‍🏫 For Teachers: How to Collect & Organize

### 1. Prerequisites
To query the GitHub API efficiently, you will need a GitHub Personal Access Token (PAT):
- Go to GitHub -> Settings -> Developer Settings -> Personal Access Tokens.
- Generate a new token with at least `repo` or `public_repo` read permissions.

### 2. Required Inputs
When initializing the extraction tool, you need to provide:
- **Base Repository URL**: The original repository the students forked (e.g., `github.com/teacher-name/assignment-repo`).
- **Target Keyword**: The secret word students were told to include (e.g., `RECORD_SUBMIT_2026`).

### 3. The Extraction Process (Under the Hood)
1. **Fetch:** The script pings the `GET /repos/{owner}/{repo}/forks` API endpoint to get a complete list of forks.
2. **Filter:** It checks each fork's `name` and `description` to ensure the `Target Keyword` is present.
3. **Generate:** For every match, a QR code pointing to the student's repository URL is generated using a QR library.

### 4. Final Output Template
*(Note: Replace this section with your specific template once confirmed)*

The final output will be formatted into your custom template, typically containing:
*   **Student Info** (Owner Name / Repo Name)
*   **Direct Link** to the Repo
*   **Access QR Code**

---

## 🚀 Setup / Installation (Coming Soon)

Once we finalize the core logic and template, the installation steps for running the node/python script will be listed here.
