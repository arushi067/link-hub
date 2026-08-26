# Arushi LinkHub — Setup Guide

## FILES IN THIS PROJECT
- index.html      -> Public profile page (what visitors/Instagram see)
- style.css        -> Styling + animations for public page
- script.js        -> Loads your profile data from Firebase (public page)
- admin.html       -> Private admin panel (you manage everything here)
- admin-style.css  -> Styling for admin panel
- admin.js         -> Admin logic (login, save profile/quote/theme/links, approve WhatsApp)
- firebase-config.js -> Firebase connection (already filled with your project keys)

## HOW IT WORKS
- Hosting: GitHub Pages (index.html, admin.html, css/js files)
- Database + Auth: Google Firebase (free) — stores your profile data + secures admin login
- Your admin login uses Firebase Authentication (real email+password, not stored in code)

## FIRESTORE SECURITY RULES (paste in Firebase Console > Firestore Database > Rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{profileId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

## STORAGE SECURITY RULES (paste in Firebase Console > Storage > Rules)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

## STEP-BY-STEP DEPLOYMENT

1. TEST LOCALLY FIRST (required, because Firebase imports need a real server)
   - Install "Live Server" extension in VS Code
   - Right-click admin.html -> "Open with Live Server"
   - Login with your Firebase Auth email + password
   - Fill Profile / Quote / Theme / Links tabs, click Save on each
   - Open index.html the same way (Live Server) to preview your public page

2. UPLOAD TO GITHUB
   - Go to your repo "link-hub" on github.com
   - Upload/replace these 7 files: index.html, style.css, script.js,
     admin.html, admin-style.css, admin.js, firebase-config.js
   - Commit changes

3. ENABLE GITHUB PAGES
   - Repo Settings -> Pages -> Source: Deploy from branch -> main -> / (root) -> Save
   - Wait 1-2 minutes, your live link appears: https://yourusername.github.io/link-hub/

4. USE YOUR LINKS
   - Public page (put this in Instagram bio): https://yourusername.github.io/link-hub/
   - Admin panel (keep private, bookmark only for yourself):
     https://yourusername.github.io/link-hub/admin.html

5. CUSTOM DOMAIN (optional)
   - Point arushipatel.me DNS A-records to GitHub Pages IPs (as set up earlier)
   - Add CNAME file with your domain name in repo root

## NOTES
- PROFILE_SLUG is set to "arushi" in both script.js and admin.js — keep it identical in both files.
- Since login uses Firebase Auth (not a password in code), your GitHub repo can stay PUBLIC safely.
- Changing theme/animation in admin panel instantly changes public page look after refresh.
- WhatsApp stays locked until you manually click "Approve" in the Requests tab for a submitted Gmail.
