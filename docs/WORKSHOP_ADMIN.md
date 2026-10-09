# Workshop administration

The site accepts animation JSON files and stores them in Supabase. New submissions are hidden until approved. Approved animations appear automatically in the Workshop, without a GitHub commit.

## First sign-in

1. Open [the admin page](https://hikei1337.github.io/cidookeyboardanimations/admin.html).
2. Enter the owner's configured email and choose a password of at least 8 characters.
3. Click **Create owner account**.
4. Confirm the email using the link in the message, then return to the admin page and sign in.

Only a confirmed email listed in the private owner table receives admin rights. Registering another email does not grant moderation access.

In Supabase **Authentication → URL Configuration**, set Site URL to `https://hikei1337.github.io/cidookeyboardanimations/admin.html` and add that address to Redirect URLs. If the confirmation link sends you to localhost, confirmation still works; return to the admin page manually.

## Review

Download the JSON or open it in the editor to inspect the result. **Approve** publishes it. **Reject** keeps it hidden. No file is executed as code. All submissions must pass the project format, RGB, frame count and file size checks.

## Hosting

GitHub Pages hosts the website. Supabase hosts the database and authentication. `supabase-config.js` contains only the public project URL and publishable key. Database permissions control access; no secret key is shipped to browsers.

The schema is in `supabase/migrations`. Public submissions do not require an account. This first version has size validation and moderation but no server-side IP rate limiting or CAPTCHA.
