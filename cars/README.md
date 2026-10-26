# LocalSold – rent or buy cars

On LocalSold, customers create an account, browse cars in 3D, see real photos, then rent by the day or buy. Their bookings and orders show up straight away in the owner/admin **Orders** inbox, with a sound and an optional desktop notification. It works on phones, Mac and PC, it installs like an app, and it speaks 15 languages. Each person can change its colours.

## Put it online at localsold.pages.dev (one time, about 10 minutes)

1. **Create the site.** In the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, choose this repository.
   - Project name: `localsold`. This gives you `localsold.pages.dev`. If the name is taken, Cloudflare adds a few letters.
   - Production branch: the branch that holds this folder (for example `claude/car-rental-sales-app-wfisse`, or `main` after merging).
   - Framework preset: **None**. Build command: leave it empty.
   - Root directory: `cars`. Build output directory: `/`.
2. **Add the database.** Go to **Workers & Pages** → **KV** → **Create namespace**, named for example `localsold-data`.
   Then in your Pages project → **Settings** → **Bindings** → **Add** → **KV namespace**, set the variable name to `STORE` and pick `localsold-data`.
3. **Set your owner password.** In the project → **Settings** → **Variables and secrets** → **Add**, choose type **Secret**, name it `OWNER_SETUP_CODE`, and enter a long code only you know.
4. **Redeploy.** Go to **Deployments** → **Retry deployment**, or push any change.

## Becoming the owner

1. Open the site and **Create account** with your own email and password.
2. A banner says the store has no owner yet. Press **Claim ownership** and enter your `OWNER_SETUP_CODE`.
3. You're the owner. The code works only once: after someone owns the store, nobody else can claim it.

## Running the store

- **Orders inbox:** the **Admin** tab shows every new rental and purchase.
  - It checks for new orders every 20 seconds, plays a chime and shows a pop-up.
  - Press **Turn on alerts** to also get desktop or phone notifications while the tab is open.
  - Confirm, mark done or cancel each order. The customer sees the new status in **My orders**.
- **Give someone admin:** in **Admin → Team**, the owner taps **Make admin** next to anyone who has an account.
  - Admins handle orders, edit cars and upload photos.
  - Only the owner sees the Team tab.
- **Real photos:** in **Admin → Cars**, tap the camera next to a car and choose or drop photos. They're resized automatically and stored in your Cloudflare database.
- **Colours:** the palette button changes the accent colour (lime, blue, pink and more) and the background (dark, navy, light and more), or you can pick any colour. Each person's choice is saved on their own device.
- **Get the app:** your account menu has a **Get the app** page. It shows a QR code and the install steps for iPhone, Android, Mac and Windows.

## Good to know

- **Payments are a demo.** No card details are collected, and checkout records the order for you to follow up. To take real money, add a payment provider such as Stripe or Omise.
- **Prices are worked out on the server** from your catalog, so nobody can change the price from their browser.
- **Passwords** are stored as salted PBKDF2 hashes, never as plain text.
- **3D models are stand-ins** until you add your own:
  - Sports cars show a Ferrari 458 Italia (by vicent091036, CC BY).
  - Every other car shows the Khronos Car Concept (Eric Chadwick / DGG, CC BY 4.0).
  - Brand logos come from Simple Icons (CC0). The brands are trademarks of their owners.
- **To test it locally:** run `npx wrangler pages dev cars --kv STORE --binding OWNER_SETUP_CODE=test-code`.
