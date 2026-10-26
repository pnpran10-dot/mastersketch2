# MasterDrive – rent or buy cars

A web app where customers browse cars in 3D (outside and from the driver's seat), see real photos, then rent by the day or buy. It runs on phones, Mac and PC in any modern browser and can be installed as an app. It comes in 15 languages, and currencies switch automatically.

Open it at `/cars/` on the site, for example `https://mastersketch.pages.dev/cars/`.

## Owner setup (do this first)

1. Open **Owner** (the lock icon) → **Claim ownership**. Enter your name and a passphrase of at least 10 characters.
2. Create a GitHub **fine-grained token** for this repository only, with **Contents: Read and write** permission.
3. In **Publishing**, paste the token and press **Publish**. Your owner account is now locked into `catalog.json`. After that, the claim screen no longer appears on any device, and only your passphrase opens the owner dashboard.

Do step 3 right away. Until you publish, the ownership exists only on your own device.

## Managing the store

- **Upload real photos:** press the camera button on a car, or **Add car**. Photos are resized automatically. The star button picks the cover photo.
- **Give someone admin:** this is for the owner only. Under **Team**, enter their name and a passphrase, then share the passphrase with them privately. Admins can add and edit cars and upload photos, but they can't manage the team. **Remove** takes the access away.
- Edits are saved on your device as a draft until you press **Publish**. Publishing commits the photos to `cars/photos/` and the catalog to `cars/catalog.json`, and the live site updates after it redeploys.
- **Export JSON** and **Import JSON** let you back up the catalog or move it between devices without a token.

## Good to know

- **Payments are a demo.** Checkout records the booking on the customer's device and collects no card details. To take real money, connect a provider such as Stripe or Omise behind a small server.
- **Customer bookings stay on the customer's device.** There is no server yet, so the owner doesn't see orders. That needs a backend, which can be added later.
- The owner check runs in the browser. What really protects the store is that **publishing needs your GitHub token**: nobody can change the live catalog without write access to this repository.
